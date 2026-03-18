output "sql_server_id" {
  description = "ID of the Azure SQL Server."
  value       = azurerm_mssql_server.main.id
}

output "sql_server_fqdn" {
  description = "Fully qualified domain name of the SQL Server."
  value       = azurerm_mssql_server.main.fully_qualified_domain_name
  sensitive   = true
}

output "sql_database_name" {
  description = "Name of the SQL Database."
  value       = azurerm_mssql_database.main.name
}

output "sql_database_id" {
  description = "ID of the SQL Database."
  value       = azurerm_mssql_database.main.id
}

output "sql_private_endpoint_ip" {
  description = "Private IP address of the SQL Private Endpoint."
  value       = azurerm_private_endpoint.sql.private_service_connection[0].private_ip_address
}
