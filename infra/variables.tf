variable "resource_group_name" {
  type        = string
  description = "Name of the resource group."
}

variable "location" {
  type        = string
  description = "Azure region for all resources."
  default     = "eastus2"
}

variable "project_name" {
  type        = string
  description = "Project name used as a prefix for resource naming."
  default     = "threetier"
}

variable "environment" {
  type        = string
  description = "Deployment environment (dev, staging, prod)."
  default     = "prod"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "admin_username" {
  type        = string
  description = "Admin username for the Linux VMSS instances."
  default     = "azureadmin"
}

variable "admin_ssh_public_key" {
  type        = string
  description = "SSH public key for VMSS admin authentication."
  sensitive   = true
}

variable "sql_administrator_login" {
  type        = string
  description = "SQL Server administrator login name."
  default     = "sqladmin"
}

variable "sql_administrator_password" {
  type        = string
  description = "SQL Server administrator password. Use Key Vault in production."
  sensitive   = true
}

variable "entra_admin_object_id" {
  type        = string
  description = "Object ID of the Entra ID principal for SQL Server admin."
}

variable "entra_admin_tenant_id" {
  type        = string
  description = "Azure AD tenant ID for the SQL Entra administrator."
}

variable "entra_admin_display_name" {
  type        = string
  description = "Display name of the Entra ID SQL administrator."
  default     = "SQL Entra Admin"
}

variable "entra_auth_only" {
  type        = bool
  description = "When true, disables SQL password auth and enforces Entra ID only."
  default     = false
}
