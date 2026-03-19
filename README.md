<div align="center">

# Azure 3-Tier Secure Architecture

**Production-grade infrastructure on Azure, defined entirely in Terraform.**

[![Terraform](https://img.shields.io/badge/Terraform-%235835CC?style=for-the-badge&logo=terraform&logoColor=white)](https://www.terraform.io/)
[![Azure](https://img.shields.io/badge/Microsoft_Azure-0078D4?style=for-the-badge&logo=microsoftazure&logoColor=white)](https://azure.microsoft.com/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

A fully modular, security-hardened, three-tier web application stack on Azure — with an interactive architecture explorer built in React + TypeScript.

[Explore the Architecture →](https://github.com/xsol05/dunno-yet)&nbsp;&nbsp;·&nbsp;&nbsp;[View Terraform Code →](infra/)&nbsp;&nbsp;·&nbsp;&nbsp;[Interactive App →](app/)

</div>

---

## Architecture

```mermaid
graph TD
    Internet((Internet)):::external -->|HTTPS 443| AppGw

    subgraph VNet["Azure Virtual Network — 10.0.0.0/16"]
        subgraph web["web-subnet · 10.0.1.0/24"]
            AppGw[Application Gateway\nWAF v2 · OWASP 3.2]:::web
        end

        subgraph app["app-subnet · 10.0.2.0/24"]
            VMSS[Linux VMSS\nUbuntu 22.04 · Autoscale 2–5]:::app
        end

        subgraph db["db-subnet · 10.0.3.0/24"]
            SQL[(Azure SQL\nPrivate Endpoint)]:::db
        end

        subgraph kv["kv-subnet · 10.0.4.0/24"]
            KV[Key Vault\nPrivate Endpoint]:::kv
        end

        subgraph bastion["AzureBastionSubnet · 10.0.5.0/26"]
            Bastion[Azure Bastion]:::bastion
        end

        LogAnalytics[Log Analytics\nWorkspace]:::monitor
    end

    AppGw -->|HTTPS 443| VMSS
    VMSS -->|TDS 1433| SQL
    VMSS -->|Secrets| KV
    AppGw -->|TLS cert| KV
    Bastion -->|SSH 22| VMSS
    AppGw -.->|WAF logs| LogAnalytics
    VMSS -.->|Diagnostics| LogAnalytics
    SQL -.->|Audit logs| LogAnalytics

    classDef external fill:#1a1a2e,stroke:#7c8ca7,color:#e2e8f0
    classDef web fill:#0078d4,stroke:#005a9e,color:#fff
    classDef app fill:#38b2ac,stroke:#2c7a7b,color:#fff
    classDef db fill:#805ad5,stroke:#6b46c1,color:#fff
    classDef kv fill:#d69e2e,stroke:#b7791f,color:#fff
    classDef bastion fill:#4299e1,stroke:#3182ce,color:#fff
    classDef monitor fill:#dd6b20,stroke:#c05621,color:#fff
```

## Highlights

| Layer | What's Deployed | Key Config |
|:------|:----------------|:-----------|
| **Web** | Application Gateway (WAF v2) | OWASP CRS 3.2 · Prevention mode · TLS from Key Vault |
| **App** | Linux VMSS (Ubuntu 22.04) | Autoscale 2–5 · Managed Identity · SSH-only |
| **Data** | Azure SQL (Private Endpoint) | Entra ID auth · TLS 1.2 · Audit logging |
| **Secrets** | Azure Key Vault (Premium) | RBAC-only · Purge protection · Private EP |
| **Network** | VNet + 5 NSGs | Deny-all baseline · Per-subnet rules |
| **Monitoring** | Log Analytics Workspace | WAF, SQL audit, NSG flow, diagnostics |
| **Access** | Azure Bastion (Standard) | Browser-based SSH · No public IPs on VMs |

## Tech Stack

<div align="center">

### Infrastructure

![Terraform](https://img.shields.io/badge/Terraform-7B42BC?style=flat-square&logo=terraform&logoColor=white)
![AzureRM](https://img.shields.io/badge/AzureRM_Provider-4.x-0078D4?style=flat-square&logo=microsoftazure&logoColor=white)
![AzureAD](https://img.shields.io/badge/AzureAD_Provider-3.x-0078D4?style=flat-square&logo=microsoftazure&logoColor=white)
![Bash](https://img.shields.io/badge/Bash-4EAA25?style=flat-square&logo=gnubash&logoColor=white)

### Interactive Explorer App

![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite&logoColor=white)
![Lucide](https://img.shields.io/badge/Lucide_Icons-F56565?style=flat-square&logo=lucide&logoColor=white)

</div>

## Project Structure

```
├── infra/                      # Terraform root module
│   ├── main.tf                 # Orchestrates all modules
│   ├── variables.tf            # Input variables
│   ├── outputs.tf              # Stack outputs
│   ├── providers.tf            # Provider versions & backend
│   ├── terraform.tfvars.example
│   ├── modules/
│   │   ├── networking/         # VNet, Subnets, NSGs, AppGw, Bastion
│   │   ├── compute/            # Linux VMSS, Autoscale, Managed Identity
│   │   ├── database/           # Azure SQL, Private Endpoint, Entra ID
│   │   └── keyvault/           # Key Vault, TLS cert, Private Endpoint
│   └── scripts/
│       └── bootstrap-backend.sh  # One-time remote state setup
│
├── app/                        # React architecture explorer
│   ├── src/
│   │   ├── App.tsx             # Main app with scroll-driven animations
│   │   ├── components/         # SVG diagram, icons
│   │   └── data/               # Infrastructure data model
│   └── ...
│
└── docs/                       # Static documentation site
```

## Getting Started

### Prerequisites

- [Terraform](https://developer.hashicorp.com/terraform/install) >= 1.5
- [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli) (authenticated via `az login`)
- [Node.js](https://nodejs.org/) >= 18 (for the explorer app)

### Deploy Infrastructure

```bash
# 1. Bootstrap remote state (one-time)
cd infra
bash scripts/bootstrap-backend.sh

# 2. Configure variables
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values

# 3. Deploy
terraform init
terraform plan -out=tfplan
terraform apply tfplan
```

### Run the Explorer App

```bash
cd app
npm install
npm run dev
```

> [!TIP]
> The interactive explorer visualizes every resource, connection, traffic flow, and NSG rule defined
> in the Terraform modules — no Azure subscription required to explore the architecture.

## Security Posture

This architecture follows Azure security best practices:

- **Zero public endpoints** on data-tier resources (SQL + Key Vault via Private Endpoints)
- **WAF in Prevention mode** with OWASP Core Rule Set 3.2
- **Deny-all NSG baseline** — only explicitly required traffic is allowed
- **Entra ID authentication** for Azure SQL (password auth can be fully disabled)
- **Managed Identities** — no credentials stored in code or config
- **Key Vault with RBAC** — no legacy vault access policies
- **TLS 1.2 minimum** enforced across all services
- **Audit logging** to centralized Log Analytics workspace

## Design Decisions

| Decision | Rationale |
|:---------|:----------|
| Modular Terraform | Each tier is independently testable and reusable |
| AzureRM 4.x | Latest provider with improved resource support |
| WAF v2 over Front Door | Simpler for single-region; upgrade path exists |
| VMSS over App Service | Full OS control; custom binary support |
| Private Endpoints | Eliminates public attack surface for data tier |
| Bastion over Jump Box | Managed service; no VM to patch |

---

<div align="center">

**Built with Terraform** · **Secured by design** · **Visualized in React**

</div>
