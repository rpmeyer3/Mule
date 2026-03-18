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

variable "log_analytics_workspace_id" {
  type        = string
  description = "Log Analytics workspace ID for diagnostic settings."
}

variable "vnet_address_space" {
  type        = list(string)
  description = "Address space for the virtual network."
  default     = ["10.0.0.0/16"]
}

variable "web_subnet_prefix" {
  type        = string
  description = "CIDR prefix for the web-subnet (Application Gateway)."
  default     = "10.0.1.0/24"
}

variable "app_subnet_prefix" {
  type        = string
  description = "CIDR prefix for the app-subnet (VMSS)."
  default     = "10.0.2.0/24"
}

variable "db_subnet_prefix" {
  type        = string
  description = "CIDR prefix for the db-subnet (SQL Private Endpoint)."
  default     = "10.0.3.0/24"
}

variable "kv_subnet_prefix" {
  type        = string
  description = "CIDR prefix for the kv-subnet (Key Vault Private Endpoint)."
  default     = "10.0.4.0/24"
}

variable "bastion_subnet_prefix" {
  type        = string
  description = "CIDR prefix for AzureBastionSubnet (min /26)."
  default     = "10.0.5.0/26"
}

variable "appgw_identity_id" {
  type        = string
  description = "User-Assigned Managed Identity ID for AppGW KV cert access."
  default     = ""
}

variable "tls_certificate_secret_id" {
  type        = string
  description = "Key Vault secret ID for the TLS certificate."
  default     = ""
}
