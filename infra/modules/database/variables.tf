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

variable "db_subnet_id" {
  type        = string
  description = "ID of the db-subnet for the SQL private endpoint."
}

variable "vnet_id" {
  type        = string
  description = "ID of the virtual network for Private DNS Zone linking."
}

variable "sql_administrator_login" {
  type        = string
  description = "SQL Server administrator login name."
}

variable "sql_administrator_password" {
  type        = string
  description = "SQL Server administrator password."
  sensitive   = true
}

variable "log_analytics_workspace_id" {
  type        = string
  description = "Log Analytics workspace ID for auditing."
}

variable "sql_sku_name" {
  type        = string
  description = "SKU name for the SQL Database (vCore model recommended)."
  default     = "GP_Gen5_2"
}

variable "sql_max_size_gb" {
  type        = number
  description = "Maximum size of the SQL Database in GB."
  default     = 32
}
