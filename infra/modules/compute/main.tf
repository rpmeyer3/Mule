# =============================================================================
# Linux Virtual Machine Scale Set
# =============================================================================
resource "azurerm_linux_virtual_machine_scale_set" "app" {
  name                            = "${var.project_name}-${var.environment}-vmss"
  location                        = var.location
  resource_group_name             = var.resource_group_name
  sku                             = var.vmss_sku
  instances                       = var.vmss_instance_count
  admin_username                  = var.admin_username
  disable_password_authentication = true
  upgrade_mode                    = "Automatic"
  tags                            = var.tags

  admin_ssh_key {
    username   = var.admin_username
    public_key = var.admin_ssh_public_key
  }

  identity {
    type = "SystemAssigned"
  }

  source_image_reference {
    publisher = "Canonical"
    offer     = "0001-com-ubuntu-server-jammy"
    sku       = "22_04-lts-gen2"
    version   = "latest"
  }

  os_disk {
    caching              = "ReadWrite"
    storage_account_type = "Premium_LRS"
  }

  network_interface {
    name    = "${var.project_name}-${var.environment}-vmss-nic"
    primary = true

    ip_configuration {
      name                                         = "internal"
      primary                                      = true
      subnet_id                                    = var.app_subnet_id
      application_gateway_backend_address_pool_ids = [var.appgw_backend_pool_id]
    }
  }

  # Managed boot diagnostics (no storage account needed)
  boot_diagnostics {}
}

# =============================================================================
# VMSS Diagnostic Settings
# =============================================================================
resource "azurerm_monitor_diagnostic_setting" "vmss" {
  name                       = "${var.project_name}-${var.environment}-vmss-diag"
  target_resource_id         = azurerm_linux_virtual_machine_scale_set.app.id
  log_analytics_workspace_id = var.log_analytics_workspace_id

  enabled_metric {
    category = "AllMetrics"
  }
}

# =============================================================================
# Autoscale Settings
# =============================================================================
resource "azurerm_monitor_autoscale_setting" "vmss" {
  name                = "${var.project_name}-${var.environment}-autoscale"
  location            = var.location
  resource_group_name = var.resource_group_name
  target_resource_id  = azurerm_linux_virtual_machine_scale_set.app.id
  tags                = var.tags

  profile {
    name = "default"

    capacity {
      default = var.vmss_instance_count
      minimum = var.vmss_min_instances
      maximum = var.vmss_max_instances
    }

    # Scale out when average CPU > 75% over 5 minutes
    rule {
      metric_trigger {
        metric_name        = "Percentage CPU"
        metric_resource_id = azurerm_linux_virtual_machine_scale_set.app.id
        time_grain         = "PT1M"
        statistic          = "Average"
        time_window        = "PT5M"
        time_aggregation   = "Average"
        operator           = "GreaterThan"
        threshold          = 75
      }

      scale_action {
        direction = "Increase"
        type      = "ChangeCount"
        value     = "1"
        cooldown  = "PT5M"
      }
    }

    # Scale in when average CPU < 25% over 5 minutes
    rule {
      metric_trigger {
        metric_name        = "Percentage CPU"
        metric_resource_id = azurerm_linux_virtual_machine_scale_set.app.id
        time_grain         = "PT1M"
        statistic          = "Average"
        time_window        = "PT5M"
        time_aggregation   = "Average"
        operator           = "LessThan"
        threshold          = 25
      }

      scale_action {
        direction = "Decrease"
        type      = "ChangeCount"
        value     = "1"
        cooldown  = "PT5M"
      }
    }
  }
}
