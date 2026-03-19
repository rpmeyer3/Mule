export interface Subnet {
  id: string;
  name: string;
  cidr: string;
  color: string;
}

export interface Resource {
  id: string;
  name: string;
  type: string;
  subnet: string;
  icon: string;
  color: string;
  headline: string;
  details: string[];
  terraform: string;
}

export interface Connection {
  from: string;
  to: string;
  label: string;
  color: string;
}

export interface TrafficStep {
  label: string;
  detail: string;
}

export interface NsgRule {
  subnet: string;
  name: string;
  priority: number;
  direction: "Inbound" | "Outbound";
  access: "Allow" | "Deny";
  protocol: string;
  ports: string;
  source: string;
  destination: string;
}

export const subnets: Subnet[] = [
  { id: "web", name: "web-subnet", cidr: "10.0.1.0/24", color: "#0078d4" },
  { id: "app", name: "app-subnet", cidr: "10.0.2.0/24", color: "#38b2ac" },
  { id: "db", name: "db-subnet", cidr: "10.0.3.0/24", color: "#b794f4" },
  { id: "kv", name: "kv-subnet", cidr: "10.0.4.0/24", color: "#ecc94b" },
  { id: "bastion", name: "AzureBastionSubnet", cidr: "10.0.5.0/26", color: "#63b3ed" },
];

export const resources: Resource[] = [
  {
    id: "appgw",
    name: "Application Gateway (WAF v2)",
    type: "Microsoft.Network/applicationGateways",
    subnet: "web",
    icon: "shield",
    color: "#0078d4",
    headline: "Web Application Firewall with TLS termination",
    details: [
      "SKU: WAF_v2 (autoscale 1–3)",
      "OWASP Core Rule Set 3.2 in Prevention mode",
      "HTTP → HTTPS redirect (301)",
      "TLS certificate from Key Vault",
      "Backend pool targets: VMSS on port 443",
    ],
    terraform: "modules/networking/main.tf",
  },
  {
    id: "vmss",
    name: "Linux VMSS",
    type: "Microsoft.Compute/virtualMachineScaleSets",
    subnet: "app",
    icon: "server",
    color: "#38b2ac",
    headline: "Ubuntu 22.04 LTS with managed identity",
    details: [
      "Ubuntu Server 22.04 LTS",
      "Standard_B2s instances",
      "Autoscale: 2 → 5 instances (CPU-based)",
      "SSH public-key auth only",
      "System-assigned Managed Identity",
      "Key Vault Secrets User role",
    ],
    terraform: "modules/compute/main.tf",
  },
  {
    id: "sql",
    name: "Azure SQL (Private Endpoint)",
    type: "Microsoft.Sql/servers",
    subnet: "db",
    icon: "database",
    color: "#b794f4",
    headline: "Managed SQL with Entra ID authentication",
    details: [
      "SQL Server v12.0",
      "vCore General Purpose SKU",
      "Zone-redundant in production",
      "TLS 1.2 minimum",
      "Entra ID (Azure AD) admin",
      "Private endpoint — no public access",
      "Audit logs → Log Analytics",
      "Retention: 7d short-term, 5y long-term",
    ],
    terraform: "modules/database/main.tf",
  },
  {
    id: "keyvault",
    name: "Azure Key Vault",
    type: "Microsoft.KeyVault/vaults",
    subnet: "kv",
    icon: "key-round",
    color: "#ecc94b",
    headline: "RBAC-based secrets and certificate store",
    details: [
      "Premium SKU",
      "RBAC authorization (no vault policy)",
      "Soft-delete: 90 days",
      "Purge protection enabled",
      "Stores: SQL admin password, TLS certificate",
      "Private endpoint access only",
    ],
    terraform: "modules/keyvault/main.tf",
  },
  {
    id: "bastion",
    name: "Azure Bastion",
    type: "Microsoft.Network/bastionHosts",
    subnet: "bastion",
    icon: "lock",
    color: "#63b3ed",
    headline: "Secure RDP/SSH without public IPs",
    details: [
      "Standard SKU",
      "Dedicated AzureBastionSubnet",
      "No public IP on VMs needed",
      "Browser-based SSH to VMSS instances",
    ],
    terraform: "modules/networking/main.tf",
  },
  {
    id: "loganalytics",
    name: "Log Analytics Workspace",
    type: "Microsoft.OperationalInsights/workspaces",
    subnet: "",
    icon: "activity",
    color: "#f6ad55",
    headline: "Centralized monitoring and diagnostics",
    details: [
      "30-day retention",
      "Collects: SQL audit, NSG flow logs, WAF logs",
      "Diagnostic settings on all resources",
    ],
    terraform: "modules/networking/main.tf",
  },
  {
    id: "vnet",
    name: "Virtual Network",
    type: "Microsoft.Network/virtualNetworks",
    subnet: "",
    icon: "network",
    color: "#7c8ca7",
    headline: "Hub VNet with five subnets and NSG isolation",
    details: [
      "Address space: 10.0.0.0/16",
      "5 subnets: web, app, db, kv, bastion",
      "NSG per subnet with deny-all default",
      "Service endpoints for SQL and Key Vault",
    ],
    terraform: "modules/networking/main.tf",
  },
  {
    id: "nsg",
    name: "Network Security Groups",
    type: "Microsoft.Network/networkSecurityGroups",
    subnet: "",
    icon: "shield-check",
    color: "#fc8181",
    headline: "Per-subnet firewall rules with deny-all baseline",
    details: [
      "5 NSGs — one per subnet",
      "Deny-all inbound by default (priority 4096)",
      "Allow only required traffic per tier",
      "GatewayManager tag for AppGw health probes",
    ],
    terraform: "modules/networking/main.tf",
  },
  {
    id: "pip",
    name: "Public IP Addresses",
    type: "Microsoft.Network/publicIPAddresses",
    subnet: "",
    icon: "globe",
    color: "#68d391",
    headline: "Static IPs for Application Gateway and Bastion",
    details: [
      "2 Standard SKU public IPs",
      "Static allocation for stable DNS",
      "AppGw PIP: frontend listener binding",
      "Bastion PIP: browser-based SSH endpoint",
    ],
    terraform: "modules/networking/main.tf",
  },
  {
    id: "wafpolicy",
    name: "WAF Policy",
    type: "Microsoft.Network/ApplicationGatewayWebApplicationFirewallPolicies",
    subnet: "web",
    icon: "scan",
    color: "#e53e3e",
    headline: "OWASP 3.2 Core Rule Set in Prevention mode",
    details: [
      "Managed rule set: OWASP CRS 3.2",
      "Mode: Prevention (blocks malicious requests)",
      "Attached to Application Gateway",
      "Custom rules support available",
    ],
    terraform: "modules/networking/main.tf",
  },
  {
    id: "pe",
    name: "Private Endpoints",
    type: "Microsoft.Network/privateEndpoints",
    subnet: "",
    icon: "unplug",
    color: "#d6bcfa",
    headline: "Private connectivity for SQL and Key Vault",
    details: [
      "SQL PE in db-subnet → sqlServer sub-resource",
      "Key Vault PE in kv-subnet → vault sub-resource",
      "Disables public network access",
      "Linked to Private DNS Zones for resolution",
    ],
    terraform: "modules/database/main.tf",
  },
  {
    id: "privdns",
    name: "Private DNS Zones",
    type: "Microsoft.Network/privateDnsZones",
    subnet: "",
    icon: "at-sign",
    color: "#9f7aea",
    headline: "Internal DNS resolution for private endpoints",
    details: [
      "privatelink.database.windows.net (SQL)",
      "privatelink.vaultcore.azure.net (Key Vault)",
      "VNet-linked for automatic A-record resolution",
      "No public DNS exposure",
    ],
    terraform: "modules/database/main.tf",
  },
  {
    id: "identity",
    name: "Managed Identity (AppGw)",
    type: "Microsoft.ManagedIdentity/userAssignedIdentities",
    subnet: "",
    icon: "fingerprint",
    color: "#fbb6ce",
    headline: "User-assigned identity for certificate access",
    details: [
      "Assigned to Application Gateway",
      "Key Vault Secrets User role",
      "Reads TLS certificate at runtime",
      "No stored credentials needed",
    ],
    terraform: "modules/keyvault/main.tf",
  },
  {
    id: "diag",
    name: "Diagnostic Settings",
    type: "Microsoft.Insights/diagnosticSettings",
    subnet: "",
    icon: "stethoscope",
    color: "#f6e05e",
    headline: "Log and metric routing to Log Analytics",
    details: [
      "AppGw: access logs, WAF logs, performance metrics",
      "VMSS: guest-level metrics and boot diagnostics",
      "SQL: audit logs, query performance insights",
      "All routed to central Log Analytics workspace",
    ],
    terraform: "modules/networking/main.tf",
  },
];

export const connections: Connection[] = [
  { from: "internet", to: "appgw", label: "HTTPS (443)", color: "#0078d4" },
  { from: "appgw", to: "vmss", label: "HTTPS (443)", color: "#38b2ac" },
  { from: "vmss", to: "sql", label: "TDS (1433)", color: "#b794f4" },
  { from: "appgw", to: "keyvault", label: "TLS cert", color: "#ecc94b" },
  { from: "vmss", to: "keyvault", label: "Secrets", color: "#ecc94b" },
  { from: "bastion", to: "vmss", label: "SSH (22)", color: "#63b3ed" },
];

export const trafficSteps: TrafficStep[] = [
  { label: "Client", detail: "HTTPS request" },
  { label: "WAF v2", detail: "TLS termination + OWASP inspection" },
  { label: "VMSS", detail: "Application processing" },
  { label: "Private Endpoint", detail: "Internal network only" },
  { label: "Azure SQL", detail: "Entra ID auth + TLS 1.2" },
];

export const nsgRules: NsgRule[] = [
  { subnet: "web", name: "AllowGatewayManager", priority: 100, direction: "Inbound", access: "Allow", protocol: "TCP", ports: "65200-65535", source: "GatewayManager", destination: "*" },
  { subnet: "web", name: "AllowHTTPHTTPS", priority: 200, direction: "Inbound", access: "Allow", protocol: "TCP", ports: "80, 443", source: "Internet", destination: "*" },
  { subnet: "web", name: "DenyAllInbound", priority: 4096, direction: "Inbound", access: "Deny", protocol: "*", ports: "*", source: "*", destination: "*" },
  { subnet: "app", name: "AllowAppGwHTTPS", priority: 100, direction: "Inbound", access: "Allow", protocol: "TCP", ports: "443", source: "10.0.1.0/24", destination: "*" },
  { subnet: "app", name: "AllowBastionSSH", priority: 200, direction: "Inbound", access: "Allow", protocol: "TCP", ports: "22", source: "10.0.5.0/26", destination: "*" },
  { subnet: "app", name: "DenyAllInbound", priority: 4096, direction: "Inbound", access: "Deny", protocol: "*", ports: "*", source: "*", destination: "*" },
  { subnet: "db", name: "AllowAppSQL", priority: 100, direction: "Inbound", access: "Allow", protocol: "TCP", ports: "1433", source: "10.0.2.0/24", destination: "*" },
  { subnet: "db", name: "DenyAllInbound", priority: 4096, direction: "Inbound", access: "Deny", protocol: "*", ports: "*", source: "*", destination: "*" },
  { subnet: "kv", name: "AllowAppKV", priority: 100, direction: "Inbound", access: "Allow", protocol: "TCP", ports: "443", source: "10.0.2.0/24", destination: "*" },
  { subnet: "kv", name: "AllowWebKV", priority: 200, direction: "Inbound", access: "Allow", protocol: "TCP", ports: "443", source: "10.0.1.0/24", destination: "*" },
  { subnet: "kv", name: "DenyAllInbound", priority: 4096, direction: "Inbound", access: "Deny", protocol: "*", ports: "*", source: "*", destination: "*" },
];
