data "azurerm_client_config" "current" {}

# =============================================================================
# User-Assigned Managed Identity for Application Gateway (KV cert access)
# =============================================================================
resource "azurerm_user_assigned_identity" "appgw" {
  name                = "${var.project_name}-${var.environment}-appgw-identity"
  location            = var.location
  resource_group_name = var.resource_group_name
  tags                = var.tags
}

# =============================================================================
# Key Vault
# =============================================================================
resource "azurerm_key_vault" "main" {
  name                          = "${var.project_name}-${var.environment}-kv"
  location                      = var.location
  resource_group_name           = var.resource_group_name
  tenant_id                     = data.azurerm_client_config.current.tenant_id
  sku_name                      = "standard"
  purge_protection_enabled      = true
  soft_delete_retention_days    = 90
  public_network_access_enabled = false
  enable_rbac_authorization     = true
  tags                          = var.tags
}

# =============================================================================
# RBAC: Deployer gets Key Vault Administrator (to manage secrets/certs)
# =============================================================================
resource "azurerm_role_assignment" "kv_deployer_admin" {
  scope                = azurerm_key_vault.main.id
  role_definition_name = "Key Vault Administrator"
  principal_id         = data.azurerm_client_config.current.object_id
}

# =============================================================================
# RBAC: AppGW identity gets Key Vault Secrets User (read certs)
# =============================================================================
resource "azurerm_role_assignment" "kv_appgw_secrets_user" {
  scope                = azurerm_key_vault.main.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = azurerm_user_assigned_identity.appgw.principal_id
}

# =============================================================================
# RBAC: VMSS identity gets Key Vault Secrets User (read app secrets)
# =============================================================================
resource "azurerm_role_assignment" "kv_vmss_secrets_user" {
  scope                = azurerm_key_vault.main.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = var.vmss_identity_principal_id
}

# =============================================================================
# Store SQL admin password in Key Vault
# =============================================================================
resource "azurerm_key_vault_secret" "sql_password" {
  name         = "sql-admin-password"
  value        = var.sql_administrator_password
  key_vault_id = azurerm_key_vault.main.id

  depends_on = [azurerm_role_assignment.kv_deployer_admin]
}

# =============================================================================
# Self-signed TLS certificate for Application Gateway
# =============================================================================
resource "azurerm_key_vault_certificate" "appgw_tls" {
  name         = "appgw-tls-cert"
  key_vault_id = azurerm_key_vault.main.id

  certificate_policy {
    issuer_parameters {
      name = "Self"
    }

    key_properties {
      exportable = true
      key_size   = 2048
      key_type   = "RSA"
      reuse_key  = true
    }

    lifetime_action {
      action {
        action_type = "AutoRenew"
      }
      trigger {
        days_before_expiry = 30
      }
    }

    secret_properties {
      content_type = "application/x-pkcs12"
    }

    x509_certificate_properties {
      key_usage = [
        "cRLSign",
        "dataEncipherment",
        "digitalSignature",
        "keyAgreement",
        "keyCertSign",
        "keyEncipherment",
      ]
      subject            = "CN=${var.project_name}-${var.environment}.local"
      validity_in_months = 12

      subject_alternative_names {
        dns_names = ["${var.project_name}-${var.environment}.local"]
      }
    }
  }

  depends_on = [azurerm_role_assignment.kv_deployer_admin]
}

# =============================================================================
# Private Endpoint for Key Vault
# =============================================================================
resource "azurerm_private_endpoint" "kv" {
  name                = "${var.project_name}-${var.environment}-kv-pe"
  location            = var.location
  resource_group_name = var.resource_group_name
  subnet_id           = var.kv_subnet_id
  tags                = var.tags

  private_service_connection {
    name                           = "${var.project_name}-${var.environment}-kv-psc"
    private_connection_resource_id = azurerm_key_vault.main.id
    subresource_names              = ["vault"]
    is_manual_connection           = false
  }

  private_dns_zone_group {
    name                 = "kv-dns-zone-group"
    private_dns_zone_ids = [azurerm_private_dns_zone.kv.id]
  }
}

# =============================================================================
# Private DNS Zone for Key Vault
# =============================================================================
resource "azurerm_private_dns_zone" "kv" {
  name                = "privatelink.vaultcore.azure.net"
  resource_group_name = var.resource_group_name
  tags                = var.tags
}

resource "azurerm_private_dns_zone_virtual_network_link" "kv" {
  name                  = "${var.project_name}-${var.environment}-kv-dns-link"
  resource_group_name   = var.resource_group_name
  private_dns_zone_name = azurerm_private_dns_zone.kv.name
  virtual_network_id    = var.vnet_id
  registration_enabled  = false
  tags                  = var.tags
}
