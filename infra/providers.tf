terraform {
  required_version = ">= 1.5.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
    azuread = {
      source  = "hashicorp/azuread"
      version = "~> 3.0"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
  }

  # Uncomment after running: bash scripts/bootstrap-backend.sh
  # Then run: terraform init -migrate-state
  #
  # backend "azurerm" {
  #   resource_group_name  = "rg-threetier-tfstate"
  #   storage_account_name = "REPLACE_WITH_OUTPUT"
  #   container_name       = "tfstate"
  #   key                  = "threetier.prod.tfstate"
  # }
}

provider "azurerm" {}

provider "azuread" {}
