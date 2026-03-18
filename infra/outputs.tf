output "resource_group_name" {
  description = "Name of the resource group."
  value       = azurerm_resource_group.main.name
}

output "vnet_id" {
  description = "ID of the virtual network."
  value       = module.networking.vnet_id
}

output "appgw_public_ip" {
  description = "Public IP address of the Application Gateway."
  value       = module.networking.appgw_public_ip_address
}

output "vmss_identity_principal_id" {
  description = "Principal ID of the VMSS System Assigned Managed Identity."
  value       = module.compute.vmss_identity_principal_id
}

output "sql_server_fqdn" {
  description = "Fully qualified domain name of the SQL Server (private)."
  value       = module.database.sql_server_fqdn
  sensitive   = true
}

output "sql_database_name" {
  description = "Name of the SQL Database."
  value       = module.database.sql_database_name
}

output "log_analytics_workspace_id" {
  description = "ID of the Log Analytics workspace."
  value       = azurerm_log_analytics_workspace.main.id
}
