output "vnet_id" {
  description = "ID of the virtual network."
  value       = azurerm_virtual_network.main.id
}

output "web_subnet_id" {
  description = "ID of the web-subnet (Application Gateway)."
  value       = azurerm_subnet.web.id
}

output "app_subnet_id" {
  description = "ID of the app-subnet (VMSS)."
  value       = azurerm_subnet.app.id
}

output "db_subnet_id" {
  description = "ID of the db-subnet (SQL Private Endpoint)."
  value       = azurerm_subnet.db.id
}

output "appgw_public_ip_address" {
  description = "Public IP address of the Application Gateway."
  value       = azurerm_public_ip.appgw.ip_address
}

output "appgw_backend_address_pool_id" {
  description = "Backend address pool ID of the Application Gateway."
  value       = one(azurerm_application_gateway.main.backend_address_pool).id
}
