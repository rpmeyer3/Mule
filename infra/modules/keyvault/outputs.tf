output "key_vault_id" {
  description = "ID of the Key Vault."
  value       = azurerm_key_vault.main.id
}

output "key_vault_uri" {
  description = "URI of the Key Vault."
  value       = azurerm_key_vault.main.vault_uri
}

output "appgw_identity_id" {
  description = "ID of the User-Assigned Managed Identity for Application Gateway."
  value       = azurerm_user_assigned_identity.appgw.id
}

output "appgw_identity_principal_id" {
  description = "Principal ID of the AppGW User-Assigned Managed Identity."
  value       = azurerm_user_assigned_identity.appgw.principal_id
}

output "tls_certificate_secret_id" {
  description = "Key Vault secret ID for the TLS certificate (used by AppGW ssl_certificate)."
  value       = azurerm_key_vault_certificate.appgw_tls.versionless_secret_id
}

output "sql_password_secret_id" {
  description = "Key Vault secret ID for the SQL admin password."
  value       = azurerm_key_vault_secret.sql_password.id
  sensitive   = true
}
