output "vmss_id" {
  description = "ID of the Linux Virtual Machine Scale Set."
  value       = azurerm_linux_virtual_machine_scale_set.app.id
}

output "vmss_identity_principal_id" {
  description = "Principal ID of the VMSS System Assigned Managed Identity."
  value       = azurerm_linux_virtual_machine_scale_set.app.identity[0].principal_id
}

output "vmss_identity_tenant_id" {
  description = "Tenant ID of the VMSS System Assigned Managed Identity."
  value       = azurerm_linux_virtual_machine_scale_set.app.identity[0].tenant_id
}
