# =============================================================================
# Virtual Network
# =============================================================================
resource "azurerm_virtual_network" "main" {
  name                = "${var.project_name}-${var.environment}-vnet"
  address_space       = var.vnet_address_space
  location            = var.location
  resource_group_name = var.resource_group_name
  tags                = var.tags
}

# =============================================================================
# Subnets
# =============================================================================
resource "azurerm_subnet" "web" {
  name                 = "web-subnet"
  resource_group_name  = var.resource_group_name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = [var.web_subnet_prefix]
}

resource "azurerm_subnet" "app" {
  name                 = "app-subnet"
  resource_group_name  = var.resource_group_name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = [var.app_subnet_prefix]
}

resource "azurerm_subnet" "db" {
  name                 = "db-subnet"
  resource_group_name  = var.resource_group_name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = [var.db_subnet_prefix]
}

resource "azurerm_subnet" "kv" {
  name                 = "kv-subnet"
  resource_group_name  = var.resource_group_name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = [var.kv_subnet_prefix]
}

# Azure Bastion requires subnet named exactly "AzureBastionSubnet"
resource "azurerm_subnet" "bastion" {
  name                 = "AzureBastionSubnet"
  resource_group_name  = var.resource_group_name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = [var.bastion_subnet_prefix]
}

# =============================================================================
# Network Security Groups
# =============================================================================

# --- web-subnet NSG (Application Gateway v2 dedicated) ----------------------
resource "azurerm_network_security_group" "web" {
  name                = "${var.project_name}-${var.environment}-web-nsg"
  location            = var.location
  resource_group_name = var.resource_group_name
  tags                = var.tags
}

# Required: AppGW v2 management health probes
resource "azurerm_network_security_rule" "web_allow_gateway_manager" {
  name                        = "AllowGatewayManager"
  priority                    = 100
  direction                   = "Inbound"
  access                      = "Allow"
  protocol                    = "Tcp"
  source_port_range           = "*"
  destination_port_range      = "65200-65535"
  source_address_prefix       = "GatewayManager"
  destination_address_prefix  = "*"
  resource_group_name         = var.resource_group_name
  network_security_group_name = azurerm_network_security_group.web.name
}

# Allow HTTP/HTTPS from the internet to the Application Gateway
resource "azurerm_network_security_rule" "web_allow_http_https" {
  name                        = "AllowHTTPHTTPS"
  priority                    = 200
  direction                   = "Inbound"
  access                      = "Allow"
  protocol                    = "Tcp"
  source_port_range           = "*"
  destination_port_ranges     = ["80", "443"]
  source_address_prefix       = "Internet"
  destination_address_prefix  = "*"
  resource_group_name         = var.resource_group_name
  network_security_group_name = azurerm_network_security_group.web.name
}

# Allow Azure Load Balancer health probes
resource "azurerm_network_security_rule" "web_allow_azure_lb" {
  name                        = "AllowAzureLoadBalancer"
  priority                    = 300
  direction                   = "Inbound"
  access                      = "Allow"
  protocol                    = "*"
  source_port_range           = "*"
  destination_port_range      = "*"
  source_address_prefix       = "AzureLoadBalancer"
  destination_address_prefix  = "*"
  resource_group_name         = var.resource_group_name
  network_security_group_name = azurerm_network_security_group.web.name
}

# Deny all other inbound (overrides default AllowVnetInBound)
resource "azurerm_network_security_rule" "web_deny_all_inbound" {
  name                        = "DenyAllInbound"
  priority                    = 4096
  direction                   = "Inbound"
  access                      = "Deny"
  protocol                    = "*"
  source_port_range           = "*"
  destination_port_range      = "*"
  source_address_prefix       = "*"
  destination_address_prefix  = "*"
  resource_group_name         = var.resource_group_name
  network_security_group_name = azurerm_network_security_group.web.name
}

# Defense-in-depth: block web tier from reaching db tier directly
resource "azurerm_network_security_rule" "web_deny_to_db_outbound" {
  name                        = "DenyOutboundToDB"
  priority                    = 100
  direction                   = "Outbound"
  access                      = "Deny"
  protocol                    = "*"
  source_port_range           = "*"
  destination_port_range      = "*"
  source_address_prefix       = "*"
  destination_address_prefix  = var.db_subnet_prefix
  resource_group_name         = var.resource_group_name
  network_security_group_name = azurerm_network_security_group.web.name
}

# --- app-subnet NSG (VMSS) --------------------------------------------------
resource "azurerm_network_security_group" "app" {
  name                = "${var.project_name}-${var.environment}-app-nsg"
  location            = var.location
  resource_group_name = var.resource_group_name
  tags                = var.tags
}

# Allow traffic only from the web-subnet (Application Gateway backends)
resource "azurerm_network_security_rule" "app_allow_from_web" {
  name                        = "AllowFromWebTier"
  priority                    = 100
  direction                   = "Inbound"
  access                      = "Allow"
  protocol                    = "Tcp"
  source_port_range           = "*"
  destination_port_ranges     = ["80", "443", "8080"]
  source_address_prefix       = var.web_subnet_prefix
  destination_address_prefix  = "*"
  resource_group_name         = var.resource_group_name
  network_security_group_name = azurerm_network_security_group.app.name
}

# Allow Azure Load Balancer for VMSS health probes
resource "azurerm_network_security_rule" "app_allow_azure_lb" {
  name                        = "AllowAzureLoadBalancer"
  priority                    = 200
  direction                   = "Inbound"
  access                      = "Allow"
  protocol                    = "*"
  source_port_range           = "*"
  destination_port_range      = "*"
  source_address_prefix       = "AzureLoadBalancer"
  destination_address_prefix  = "*"
  resource_group_name         = var.resource_group_name
  network_security_group_name = azurerm_network_security_group.app.name
}

# Allow SSH from Azure Bastion (operator access to VMSS instances)
resource "azurerm_network_security_rule" "app_allow_bastion_ssh" {
  name                        = "AllowBastionSSH"
  priority                    = 250
  direction                   = "Inbound"
  access                      = "Allow"
  protocol                    = "Tcp"
  source_port_range           = "*"
  destination_port_range      = "22"
  source_address_prefix       = var.bastion_subnet_prefix
  destination_address_prefix  = "*"
  resource_group_name         = var.resource_group_name
  network_security_group_name = azurerm_network_security_group.app.name
}

# Deny all other inbound
resource "azurerm_network_security_rule" "app_deny_all_inbound" {
  name                        = "DenyAllInbound"
  priority                    = 4096
  direction                   = "Inbound"
  access                      = "Deny"
  protocol                    = "*"
  source_port_range           = "*"
  destination_port_range      = "*"
  source_address_prefix       = "*"
  destination_address_prefix  = "*"
  resource_group_name         = var.resource_group_name
  network_security_group_name = azurerm_network_security_group.app.name
}

# Allow app-tier outbound only to db-subnet on SQL port
resource "azurerm_network_security_rule" "app_allow_to_db_outbound" {
  name                        = "AllowOutboundToDB"
  priority                    = 100
  direction                   = "Outbound"
  access                      = "Allow"
  protocol                    = "Tcp"
  source_port_range           = "*"
  destination_port_range      = "1433"
  source_address_prefix       = "*"
  destination_address_prefix  = var.db_subnet_prefix
  resource_group_name         = var.resource_group_name
  network_security_group_name = azurerm_network_security_group.app.name
}

# Allow outbound to Azure services (for updates, monitoring, Key Vault, etc.)
resource "azurerm_network_security_rule" "app_allow_azure_outbound" {
  name                        = "AllowAzureServicesOutbound"
  priority                    = 200
  direction                   = "Outbound"
  access                      = "Allow"
  protocol                    = "Tcp"
  source_port_range           = "*"
  destination_port_ranges     = ["443"]
  source_address_prefix       = "*"
  destination_address_prefix  = "AzureCloud"
  resource_group_name         = var.resource_group_name
  network_security_group_name = azurerm_network_security_group.app.name
}

# Allow outbound to Key Vault private endpoint subnet
resource "azurerm_network_security_rule" "app_allow_to_kv_outbound" {
  name                        = "AllowOutboundToKV"
  priority                    = 150
  direction                   = "Outbound"
  access                      = "Allow"
  protocol                    = "Tcp"
  source_port_range           = "*"
  destination_port_range      = "443"
  source_address_prefix       = "*"
  destination_address_prefix  = var.kv_subnet_prefix
  resource_group_name         = var.resource_group_name
  network_security_group_name = azurerm_network_security_group.app.name
}

# Deny direct internet outbound (mitigate data exfiltration)
resource "azurerm_network_security_rule" "app_deny_internet_outbound" {
  name                        = "DenyInternetOutbound"
  priority                    = 4096
  direction                   = "Outbound"
  access                      = "Deny"
  protocol                    = "*"
  source_port_range           = "*"
  destination_port_range      = "*"
  source_address_prefix       = "*"
  destination_address_prefix  = "Internet"
  resource_group_name         = var.resource_group_name
  network_security_group_name = azurerm_network_security_group.app.name
}

# --- db-subnet NSG (SQL Private Endpoint) -----------------------------------
resource "azurerm_network_security_group" "db" {
  name                = "${var.project_name}-${var.environment}-db-nsg"
  location            = var.location
  resource_group_name = var.resource_group_name
  tags                = var.tags
}

# Allow SQL traffic only from the app-subnet
resource "azurerm_network_security_rule" "db_allow_from_app" {
  name                        = "AllowSQLFromAppTier"
  priority                    = 100
  direction                   = "Inbound"
  access                      = "Allow"
  protocol                    = "Tcp"
  source_port_range           = "*"
  destination_port_range      = "1433"
  source_address_prefix       = var.app_subnet_prefix
  destination_address_prefix  = "*"
  resource_group_name         = var.resource_group_name
  network_security_group_name = azurerm_network_security_group.db.name
}

# Deny all other inbound
resource "azurerm_network_security_rule" "db_deny_all_inbound" {
  name                        = "DenyAllInbound"
  priority                    = 4096
  direction                   = "Inbound"
  access                      = "Deny"
  protocol                    = "*"
  source_port_range           = "*"
  destination_port_range      = "*"
  source_address_prefix       = "*"
  destination_address_prefix  = "*"
  resource_group_name         = var.resource_group_name
  network_security_group_name = azurerm_network_security_group.db.name
}

# =============================================================================
# NSG ↔ Subnet Associations
# =============================================================================
resource "azurerm_subnet_network_security_group_association" "web" {
  subnet_id                 = azurerm_subnet.web.id
  network_security_group_id = azurerm_network_security_group.web.id
}

resource "azurerm_subnet_network_security_group_association" "app" {
  subnet_id                 = azurerm_subnet.app.id
  network_security_group_id = azurerm_network_security_group.app.id
}

resource "azurerm_subnet_network_security_group_association" "db" {
  subnet_id                 = azurerm_subnet.db.id
  network_security_group_id = azurerm_network_security_group.db.id
}

# =============================================================================
# Key Vault Subnet NSG
# =============================================================================
resource "azurerm_network_security_group" "kv" {
  name                = "${var.project_name}-${var.environment}-kv-nsg"
  location            = var.location
  resource_group_name = var.resource_group_name
  tags                = var.tags
}

resource "azurerm_network_security_rule" "kv_allow_from_app" {
  name                        = "AllowFromAppTier"
  priority                    = 100
  direction                   = "Inbound"
  access                      = "Allow"
  protocol                    = "Tcp"
  source_port_range           = "*"
  destination_port_range      = "443"
  source_address_prefix       = var.app_subnet_prefix
  destination_address_prefix  = "*"
  resource_group_name         = var.resource_group_name
  network_security_group_name = azurerm_network_security_group.kv.name
}

resource "azurerm_network_security_rule" "kv_allow_from_web" {
  name                        = "AllowFromWebTier"
  priority                    = 110
  direction                   = "Inbound"
  access                      = "Allow"
  protocol                    = "Tcp"
  source_port_range           = "*"
  destination_port_range      = "443"
  source_address_prefix       = var.web_subnet_prefix
  destination_address_prefix  = "*"
  resource_group_name         = var.resource_group_name
  network_security_group_name = azurerm_network_security_group.kv.name
}

resource "azurerm_network_security_rule" "kv_deny_all_inbound" {
  name                        = "DenyAllInbound"
  priority                    = 4096
  direction                   = "Inbound"
  access                      = "Deny"
  protocol                    = "*"
  source_port_range           = "*"
  destination_port_range      = "*"
  source_address_prefix       = "*"
  destination_address_prefix  = "*"
  resource_group_name         = var.resource_group_name
  network_security_group_name = azurerm_network_security_group.kv.name
}

resource "azurerm_subnet_network_security_group_association" "kv" {
  subnet_id                 = azurerm_subnet.kv.id
  network_security_group_id = azurerm_network_security_group.kv.id
}

# =============================================================================
# Application Gateway (WAF v2)
# =============================================================================
resource "azurerm_public_ip" "appgw" {
  name                = "${var.project_name}-${var.environment}-appgw-pip"
  location            = var.location
  resource_group_name = var.resource_group_name
  allocation_method   = "Static"
  sku                 = "Standard"
  tags                = var.tags
}

locals {
  appgw_name                      = "${var.project_name}-${var.environment}-appgw"
  frontend_ip_config_name         = "appgw-frontend-ip"
  frontend_port_http_name         = "appgw-frontend-port-http"
  frontend_port_https_name        = "appgw-frontend-port-https"
  backend_pool_name               = "appgw-backend-pool"
  http_setting_name               = "appgw-http-setting"
  https_listener_name             = "appgw-https-listener"
  http_listener_name              = "appgw-http-listener"
  https_routing_rule_name         = "appgw-https-routing-rule"
  http_redirect_routing_rule_name = "appgw-http-redirect-rule"
  redirect_config_name            = "http-to-https-redirect"
  ssl_cert_name                   = "appgw-kv-tls-cert"
  gateway_ip_config_name          = "appgw-gateway-ip"
}

resource "azurerm_application_gateway" "main" {
  name                = local.appgw_name
  location            = var.location
  resource_group_name = var.resource_group_name
  tags                = var.tags

  sku {
    name = "WAF_v2"
    tier = "WAF_v2"
  }

  autoscale_configuration {
    min_capacity = 1
    max_capacity = 3
  }

  # User-Assigned Identity for Key Vault certificate access
  dynamic "identity" {
    for_each = var.appgw_identity_id != "" ? [1] : []
    content {
      type         = "UserAssigned"
      identity_ids = [var.appgw_identity_id]
    }
  }

  gateway_ip_configuration {
    name      = local.gateway_ip_config_name
    subnet_id = azurerm_subnet.web.id
  }

  frontend_ip_configuration {
    name                 = local.frontend_ip_config_name
    public_ip_address_id = azurerm_public_ip.appgw.id
  }

  frontend_port {
    name = local.frontend_port_http_name
    port = 80
  }

  frontend_port {
    name = local.frontend_port_https_name
    port = 443
  }

  backend_address_pool {
    name = local.backend_pool_name
  }

  # TLS termination at AppGW — backend stays on HTTP/80
  backend_http_settings {
    name                  = local.http_setting_name
    cookie_based_affinity = "Disabled"
    port                  = 80
    protocol              = "Http"
    request_timeout       = 30
  }

  # TLS certificate from Key Vault (when configured)
  dynamic "ssl_certificate" {
    for_each = var.tls_certificate_secret_id != "" ? [1] : []
    content {
      name                = local.ssl_cert_name
      key_vault_secret_id = var.tls_certificate_secret_id
    }
  }

  # HTTPS listener (primary — when cert is available)
  dynamic "http_listener" {
    for_each = var.tls_certificate_secret_id != "" ? [1] : []
    content {
      name                           = local.https_listener_name
      frontend_ip_configuration_name = local.frontend_ip_config_name
      frontend_port_name             = local.frontend_port_https_name
      protocol                       = "Https"
      ssl_certificate_name           = local.ssl_cert_name
    }
  }

  # HTTP listener (redirects to HTTPS when cert is available, serves traffic otherwise)
  http_listener {
    name                           = local.http_listener_name
    frontend_ip_configuration_name = local.frontend_ip_config_name
    frontend_port_name             = local.frontend_port_http_name
    protocol                       = "Http"
  }

  # HTTPS routing rule (when cert is available)
  dynamic "request_routing_rule" {
    for_each = var.tls_certificate_secret_id != "" ? [1] : []
    content {
      name                       = local.https_routing_rule_name
      priority                   = 1
      rule_type                  = "Basic"
      http_listener_name         = local.https_listener_name
      backend_address_pool_name  = local.backend_pool_name
      backend_http_settings_name = local.http_setting_name
    }
  }

  # HTTP → HTTPS redirect (when cert is available)
  dynamic "redirect_configuration" {
    for_each = var.tls_certificate_secret_id != "" ? [1] : []
    content {
      name                 = local.redirect_config_name
      redirect_type        = "Permanent"
      target_listener_name = local.https_listener_name
      include_path         = true
      include_query_string = true
    }
  }

  dynamic "request_routing_rule" {
    for_each = var.tls_certificate_secret_id != "" ? [1] : []
    content {
      name                        = local.http_redirect_routing_rule_name
      priority                    = 2
      rule_type                   = "Basic"
      http_listener_name          = local.http_listener_name
      redirect_configuration_name = local.redirect_config_name
    }
  }

  # Fallback: direct HTTP routing when no TLS cert is configured
  dynamic "request_routing_rule" {
    for_each = var.tls_certificate_secret_id == "" ? [1] : []
    content {
      name                       = "appgw-http-fallback-rule"
      priority                   = 1
      rule_type                  = "Basic"
      http_listener_name         = local.http_listener_name
      backend_address_pool_name  = local.backend_pool_name
      backend_http_settings_name = local.http_setting_name
    }
  }

  firewall_policy_id = azurerm_web_application_firewall_policy.main.id
}

# =============================================================================
# WAF Policy (standalone — required for AzureRM 4.x)
# =============================================================================
resource "azurerm_web_application_firewall_policy" "main" {
  name                = "${local.appgw_name}-waf-policy"
  location            = var.location
  resource_group_name = var.resource_group_name
  tags                = var.tags

  policy_settings {
    enabled                     = true
    mode                        = "Prevention"
    request_body_check          = true
    max_request_body_size_in_kb = 128
    file_upload_limit_in_mb     = 100
  }

  managed_rules {
    managed_rule_set {
      type    = "OWASP"
      version = "3.2"
    }
  }
}

# =============================================================================
# Diagnostic Settings
# =============================================================================
resource "azurerm_monitor_diagnostic_setting" "appgw" {
  name                       = "${local.appgw_name}-diag"
  target_resource_id         = azurerm_application_gateway.main.id
  log_analytics_workspace_id = var.log_analytics_workspace_id

  enabled_log {
    category = "ApplicationGatewayAccessLog"
  }

  enabled_log {
    category = "ApplicationGatewayFirewallLog"
  }
}

# ──────────────────────────────────────────────
# Azure Bastion
# ──────────────────────────────────────────────

resource "azurerm_public_ip" "bastion" {
  name                = "${var.project_name}-${var.environment}-bastion-pip"
  location            = var.location
  resource_group_name = var.resource_group_name
  allocation_method   = "Static"
  sku                 = "Standard"
  tags                = var.tags
}

resource "azurerm_network_security_group" "bastion" {
  name                = "${var.project_name}-${var.environment}-bastion-nsg"
  location            = var.location
  resource_group_name = var.resource_group_name
  tags                = var.tags

  # ── Inbound ──

  security_rule {
    name                       = "AllowHttpsInbound"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "443"
    source_address_prefix      = "Internet"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "AllowGatewayManagerInbound"
    priority                   = 110
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "443"
    source_address_prefix      = "GatewayManager"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "AllowAzureLoadBalancerInbound"
    priority                   = 120
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "443"
    source_address_prefix      = "AzureLoadBalancer"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "AllowBastionHostCommunicationInbound"
    priority                   = 130
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_ranges    = ["8080", "5701"]
    source_address_prefix      = "VirtualNetwork"
    destination_address_prefix = "VirtualNetwork"
  }

  security_rule {
    name                       = "DenyAllInbound"
    priority                   = 4096
    direction                  = "Inbound"
    access                     = "Deny"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_range     = "*"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  # ── Outbound ──

  security_rule {
    name                       = "AllowSshRdpOutbound"
    priority                   = 100
    direction                  = "Outbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_ranges    = ["22", "3389"]
    source_address_prefix      = "*"
    destination_address_prefix = "VirtualNetwork"
  }

  security_rule {
    name                       = "AllowAzureCloudOutbound"
    priority                   = 110
    direction                  = "Outbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "443"
    source_address_prefix      = "*"
    destination_address_prefix = "AzureCloud"
  }

  security_rule {
    name                       = "AllowBastionHostCommunicationOutbound"
    priority                   = 120
    direction                  = "Outbound"
    access                     = "Allow"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_ranges    = ["8080", "5701"]
    source_address_prefix      = "VirtualNetwork"
    destination_address_prefix = "VirtualNetwork"
  }

  security_rule {
    name                       = "AllowHttpOutbound"
    priority                   = 130
    direction                  = "Outbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "80"
    source_address_prefix      = "*"
    destination_address_prefix = "Internet"
  }

  security_rule {
    name                       = "DenyAllOutbound"
    priority                   = 4096
    direction                  = "Outbound"
    access                     = "Deny"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_range     = "*"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }
}

resource "azurerm_subnet_network_security_group_association" "bastion" {
  subnet_id                 = azurerm_subnet.bastion.id
  network_security_group_id = azurerm_network_security_group.bastion.id
}

resource "azurerm_bastion_host" "main" {
  name                = "${var.project_name}-${var.environment}-bastion"
  location            = var.location
  resource_group_name = var.resource_group_name
  sku                 = "Standard"
  tags                = var.tags

  ip_configuration {
    name                 = "bastion-ip-config"
    subnet_id            = azurerm_subnet.bastion.id
    public_ip_address_id = azurerm_public_ip.bastion.id
  }
}
