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

variable "app_subnet_id" {
  type        = string
  description = "ID of the app-subnet for VMSS placement."
}

variable "appgw_backend_pool_id" {
  type        = string
  description = "Application Gateway backend address pool ID."
}

variable "admin_username" {
  type        = string
  description = "Admin username for VMSS instances."
}

variable "admin_ssh_public_key" {
  type        = string
  description = "SSH public key for VMSS admin authentication."
}

variable "log_analytics_workspace_id" {
  type        = string
  description = "Log Analytics workspace ID for diagnostics."
}

variable "vmss_sku" {
  type        = string
  description = "VM size for the scale set instances."
  default     = "Standard_B2s"
}

variable "vmss_instance_count" {
  type        = number
  description = "Default number of VMSS instances."
  default     = 2
}

variable "vmss_min_instances" {
  type        = number
  description = "Minimum number of VMSS instances for autoscaling."
  default     = 2
}

variable "vmss_max_instances" {
  type        = number
  description = "Maximum number of VMSS instances for autoscaling."
  default     = 10
}
