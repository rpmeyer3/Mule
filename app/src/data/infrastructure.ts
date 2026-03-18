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
    icon: "🛡",
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
    icon: "🖥",
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
    icon: "🗄",
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
    icon: "🔑",
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
    icon: "🔒",
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
    icon: "📊",
    color: "#f6ad55",
    headline: "Centralized monitoring and diagnostics",
    details: [
      "30-day retention",
      "Collects: SQL audit, NSG flow logs, WAF logs",
      "Diagnostic settings on all resources",
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
