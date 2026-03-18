locals {
  common_tags = {
    environment = var.environment
    project     = var.project_name
    managed_by  = "terraform"
  }
}

# -----------------------------------------------------------------------------
# Resource Group
# -----------------------------------------------------------------------------
resource "azurerm_resource_group" "main" {
  name     = var.resource_group_name
  location = var.location
  tags     = local.common_tags
}

# -----------------------------------------------------------------------------
# Log Analytics Workspace (central observability)
# -----------------------------------------------------------------------------
resource "azurerm_log_analytics_workspace" "main" {
  name                = "${var.project_name}-${var.environment}-law"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = "PerGB2018"
  retention_in_days   = 30
  tags                = local.common_tags
}

# -----------------------------------------------------------------------------
# Networking Module  (VNet, Subnets, NSGs, Application Gateway, Bastion)
# -----------------------------------------------------------------------------
module "networking" {
  source = "./modules/networking"

  resource_group_name        = azurerm_resource_group.main.name
  location                   = azurerm_resource_group.main.location
  project_name               = var.project_name
  environment                = var.environment
  tags                       = local.common_tags
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id

  # HTTPS / TLS (from Key Vault)
  appgw_identity_id         = module.keyvault.appgw_identity_id
  tls_certificate_secret_id = module.keyvault.tls_certificate_secret_id
}

# -----------------------------------------------------------------------------
# Compute Module  (Linux VMSS with autoscaling and Managed Identity)
# -----------------------------------------------------------------------------
module "compute" {
  source = "./modules/compute"

  resource_group_name        = azurerm_resource_group.main.name
  location                   = azurerm_resource_group.main.location
  project_name               = var.project_name
  environment                = var.environment
  tags                       = local.common_tags
  app_subnet_id              = module.networking.app_subnet_id
  appgw_backend_pool_id      = module.networking.appgw_backend_address_pool_id
  admin_username             = var.admin_username
  admin_ssh_public_key       = var.admin_ssh_public_key
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
}

# -----------------------------------------------------------------------------
# Key Vault Module  (Secrets, TLS cert, Private Endpoint)
# -----------------------------------------------------------------------------
module "keyvault" {
  source = "./modules/keyvault"

  resource_group_name        = azurerm_resource_group.main.name
  location                   = azurerm_resource_group.main.location
  project_name               = var.project_name
  environment                = var.environment
  tags                       = local.common_tags
  kv_subnet_id               = module.networking.kv_subnet_id
  vnet_id                    = module.networking.vnet_id
  sql_administrator_password = var.sql_administrator_password
  vmss_identity_principal_id = module.compute.vmss_identity_principal_id
}

# -----------------------------------------------------------------------------
# Database Module  (Azure SQL with Private Endpoint + Entra ID auth)
# -----------------------------------------------------------------------------
module "database" {
  source = "./modules/database"

  resource_group_name        = azurerm_resource_group.main.name
  location                   = azurerm_resource_group.main.location
  project_name               = var.project_name
  environment                = var.environment
  tags                       = local.common_tags
  db_subnet_id               = module.networking.db_subnet_id
  vnet_id                    = module.networking.vnet_id
  sql_administrator_login    = var.sql_administrator_login
  sql_administrator_password = var.sql_administrator_password
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id

  # Entra ID authentication
  entra_admin_object_id    = var.entra_admin_object_id
  entra_admin_tenant_id    = var.entra_admin_tenant_id
  entra_admin_display_name = var.entra_admin_display_name
  entra_auth_only          = var.entra_auth_only
}
