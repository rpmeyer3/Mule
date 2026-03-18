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
# Networking Module  (VNet, Subnets, NSGs, Application Gateway)
# -----------------------------------------------------------------------------
module "networking" {
  source = "./modules/networking"

  resource_group_name        = azurerm_resource_group.main.name
  location                   = azurerm_resource_group.main.location
  project_name               = var.project_name
  environment                = var.environment
  tags                       = local.common_tags
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
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
# Database Module  (Azure SQL with Private Endpoint)
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
}
