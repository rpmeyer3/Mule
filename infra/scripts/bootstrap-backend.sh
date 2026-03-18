#!/usr/bin/env bash
# =============================================================================
# Bootstrap script for Terraform remote backend on Azure Storage.
#
# Run this ONCE before `terraform init` to create:
#   - Resource Group
#   - Storage Account (encrypted, no public blob access)
#   - Blob Container for state files
#
# Prerequisites: Azure CLI authenticated (`az login`)
# Usage:  bash scripts/bootstrap-backend.sh
# =============================================================================
set -euo pipefail

# ---------- Configuration (edit these) ----------
LOCATION="${TF_BACKEND_LOCATION:-eastus2}"
RG_NAME="${TF_BACKEND_RG:-rg-threetier-tfstate}"
SA_NAME="${TF_BACKEND_SA:-threetierstate$(openssl rand -hex 4)}"
CONTAINER_NAME="${TF_BACKEND_CONTAINER:-tfstate}"
# ------------------------------------------------

echo "==> Creating resource group: ${RG_NAME}"
az group create \
  --name "${RG_NAME}" \
  --location "${LOCATION}" \
  --output none

echo "==> Creating storage account: ${SA_NAME}"
az storage account create \
  --resource-group "${RG_NAME}" \
  --name "${SA_NAME}" \
  --sku Standard_LRS \
  --kind StorageV2 \
  --min-tls-version TLS1_2 \
  --allow-blob-public-access false \
  --https-only true \
  --encryption-services blob \
  --output none

echo "==> Enabling blob versioning for state recovery"
az storage account blob-service-properties update \
  --resource-group "${RG_NAME}" \
  --account-name "${SA_NAME}" \
  --enable-versioning true \
  --output none

echo "==> Creating blob container: ${CONTAINER_NAME}"
az storage container create \
  --name "${CONTAINER_NAME}" \
  --account-name "${SA_NAME}" \
  --auth-mode login \
  --output none

echo ""
echo "=========================================="
echo " Backend bootstrap complete!"
echo "=========================================="
echo " Resource Group:   ${RG_NAME}"
echo " Storage Account:  ${SA_NAME}"
echo " Container:        ${CONTAINER_NAME}"
echo ""
echo " Add this to providers.tf backend block:"
echo ""
echo "   backend \"azurerm\" {"
echo "     resource_group_name  = \"${RG_NAME}\""
echo "     storage_account_name = \"${SA_NAME}\""
echo "     container_name       = \"${CONTAINER_NAME}\""
echo "     key                  = \"threetier.prod.tfstate\""
echo "   }"
echo ""
echo " Then run: terraform init -migrate-state"
echo "=========================================="
