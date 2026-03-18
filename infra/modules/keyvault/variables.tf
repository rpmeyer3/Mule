variable "resource_group_name" {
  type        = string
  description = "Name of the resource group."
}

variable "location" {
  type        = string
  description = "Azure region."
}

variable "project_name" {
  type        = string
  description = "Project name prefix."
}

variable "environment" {
  type        = string
  description = "Deployment environment."
}

variable "tags" {
  type        = map(string)
  description = "Common resource tags."
}

variable "kv_subnet_id" {
  type        = string
  description = "Subnet ID for the Key Vault private endpoint."
}

variable "vnet_id" {
  type        = string
  description = "VNet ID for Private DNS Zone linking."
}

variable "sql_administrator_password" {
  type        = string
  description = "SQL admin password to store in Key Vault."
  sensitive   = true
}

variable "vmss_identity_principal_id" {
  type        = string
  description = "Principal ID of the VMSS System Assigned Managed Identity."
}

variable "deployer_ip_ranges" {
  type        = list(string)
  description = "CIDR ranges allowed to reach Key Vault data plane (CI runner, deployer IPs)."
  default     = []
}
