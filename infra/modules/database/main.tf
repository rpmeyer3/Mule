# =============================================================================
# Azure SQL Server
# =============================================================================
resource "azurerm_mssql_server" "main" {
  name                          = "${var.project_name}-${var.environment}-sqlserver"
  resource_group_name           = var.resource_group_name
  location                      = var.location
  version                       = "12.0"
  administrator_login           = var.sql_administrator_login
  administrator_login_password  = var.sql_administrator_password
  minimum_tls_version           = "1.2"
  public_network_access_enabled = false
  tags                          = var.tags
}

# =============================================================================
# Azure SQL Database (vCore General Purpose, zone-redundant in prod)
# =============================================================================
resource "azurerm_mssql_database" "main" {
  name           = "${var.project_name}-${var.environment}-sqldb"
  server_id      = azurerm_mssql_server.main.id
  sku_name       = var.sql_sku_name
  max_size_gb    = var.sql_max_size_gb
  zone_redundant = var.environment == "prod" ? true : false
  tags           = var.tags

  short_term_retention_policy {
    retention_days = 7
  }

  long_term_retention_policy {
    weekly_retention  = "P4W"
    monthly_retention = "P12M"
  }
}

# =============================================================================
# SQL Server Auditing (sent to Log Analytics)
# =============================================================================
resource "azurerm_mssql_server_extended_auditing_policy" "main" {
  server_id              = azurerm_mssql_server.main.id
  log_monitoring_enabled = true
}

resource "azurerm_monitor_diagnostic_setting" "sql" {
  name                       = "${var.project_name}-${var.environment}-sql-diag"
  target_resource_id         = azurerm_mssql_database.main.id
  log_analytics_workspace_id = var.log_analytics_workspace_id

  enabled_log {
    category = "SQLSecurityAuditEvents"
  }

  enabled_log {
    category = "QueryStoreRuntimeStatistics"
  }
}

# =============================================================================
# Private Endpoint for SQL Server
# =============================================================================
resource "azurerm_private_endpoint" "sql" {
  name                = "${var.project_name}-${var.environment}-sql-pe"
  location            = var.location
  resource_group_name = var.resource_group_name
  subnet_id           = var.db_subnet_id
  tags                = var.tags

  private_service_connection {
    name                           = "${var.project_name}-${var.environment}-sql-psc"
    private_connection_resource_id = azurerm_mssql_server.main.id
    subresource_names              = ["sqlServer"]
    is_manual_connection           = false
  }

  private_dns_zone_group {
    name                 = "sql-dns-zone-group"
    private_dns_zone_ids = [azurerm_private_dns_zone.sql.id]
  }
}

# =============================================================================
# Private DNS Zone (resolves privatelink.database.windows.net)
# =============================================================================
resource "azurerm_private_dns_zone" "sql" {
  name                = "privatelink.database.windows.net"
  resource_group_name = var.resource_group_name
  tags                = var.tags
}

resource "azurerm_private_dns_zone_virtual_network_link" "sql" {
  name                  = "${var.project_name}-${var.environment}-sql-dns-link"
  resource_group_name   = var.resource_group_name
  private_dns_zone_name = azurerm_private_dns_zone.sql.name
  virtual_network_id    = var.vnet_id
  registration_enabled  = false
  tags                  = var.tags
}
