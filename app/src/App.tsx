import { useState } from "react";
import ArchitectureDiagram from "./components/ArchitectureDiagram";
import {
  resources,
  trafficSteps,
  nsgRules,
  subnets,
  type Resource,
} from "./data/infrastructure";

const SUBNET_TABS = ["web", "app", "db", "kv"] as const;
const SUBNET_LABELS: Record<string, string> = {
  web: "Web",
  app: "App",
  db: "Database",
  kv: "Key Vault",
};

export default function App() {
  const [selected, setSelected] = useState<Resource | null>(null);
  const [activeSubnet, setActiveSubnet] = useState<string>("web");

  const filteredRules = nsgRules.filter((r) => r.subnet === activeSubnet);

  return (
    <>
      <a href="#maincontent" className="skip-link">
        Skip to main content
      </a>

      <header>
        <h1>Azure 3-Tier Secure Architecture</h1>
        <p>threetier &middot; prod &middot; eastus2</p>
        <div className="badge-row" aria-label="Infrastructure highlights">
          <span className="badge badge--blue">Terraform Managed</span>
          <span className="badge badge--green">WAF v2 + OWASP 3.2</span>
          <span className="badge badge--gold">Entra ID Auth</span>
        </div>
      </header>

      <nav aria-label="Page sections">
        <a href="#architecture">Diagram</a>
        <a href="#resources">Resources</a>
        <a href="#traffic">Traffic Flow</a>
        <a href="#nsg">NSG Rules</a>
      </nav>

      <main id="maincontent" tabIndex={-1}>
        {/* Diagram */}
        <section
          className="diagram-section"
          id="architecture"
          aria-label="Architecture diagram"
        >
          <h2>Architecture Overview</h2>
          <div className="diagram-wrap">
            <ArchitectureDiagram
              onSelectResource={setSelected}
              selectedId={selected?.id ?? null}
            />
          </div>
        </section>

        {/* Detail panel */}
        {selected && (
          <section className="detail-panel" aria-label="Resource details">
            <div className="detail-header">
              <h2>
                {selected.icon} {selected.name}
              </h2>
              <button
                onClick={() => setSelected(null)}
                aria-label="Close details"
              >
                ✕
              </button>
            </div>
            <p className="detail-headline">{selected.headline}</p>
            <ul>
              {selected.details.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
            <p className="detail-tf">
              Terraform:{" "}
              <code>
                infra/{selected.terraform}
              </code>
            </p>
          </section>
        )}

        {/* Resource cards */}
        <section id="resources" aria-label="Resource list">
          <h2>Resource Details</h2>
          <div className="cards">
            {resources.map((r) => {
              const subnet = subnets.find((s) => s.id === r.subnet);
              return (
                <button
                  key={r.id}
                  className={`card${selected?.id === r.id ? " card--active" : ""}`}
                  onClick={() =>
                    setSelected(selected?.id === r.id ? null : r)
                  }
                  aria-pressed={selected?.id === r.id}
                >
                  <h3>
                    <span
                      className="icon"
                      style={{ background: `${r.color}33`, color: r.color }}
                    >
                      {r.icon}
                    </span>
                    {r.name}
                  </h3>
                  <p className="card-sub">
                    {subnet ? `${subnet.name} (${subnet.cidr})` : "Platform service"}
                  </p>
                  <p className="card-headline">{r.headline}</p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Traffic flow */}
        <section
          className="flow-section"
          id="traffic"
          aria-label="Traffic flow"
        >
          <h2>Request Traffic Flow</h2>
          <div className="flow-steps" role="list">
            {trafficSteps.map((step, i) => (
              <div className="flow-step" key={step.label} role="listitem">
                {i > 0 && (
                  <span className="flow-arrow" aria-hidden="true">
                    →
                  </span>
                )}
                <div className="flow-box">
                  <strong>{step.label}</strong>
                  <span>{step.detail}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* NSG Rules */}
        <section
          className="nsg-section"
          id="nsg"
          aria-label="Network Security Group rules"
        >
          <h2>NSG Rules by Subnet</h2>

          <div className="tab-bar" role="tablist" aria-label="Select subnet">
            {SUBNET_TABS.map((id) => (
              <button
                key={id}
                className="tab-btn"
                role="tab"
                type="button"
                aria-selected={activeSubnet === id}
                aria-controls={`nsg-${id}`}
                onClick={() => setActiveSubnet(id)}
              >
                {SUBNET_LABELS[id]}
              </button>
            ))}
          </div>

          <div
            className="table-wrap"
            id={`nsg-${activeSubnet}`}
            role="tabpanel"
            aria-labelledby={`tab-${activeSubnet}`}
          >
            <table>
              <thead>
                <tr>
                  <th>Priority</th>
                  <th>Name</th>
                  <th>Dir</th>
                  <th>Access</th>
                  <th>Proto</th>
                  <th>Ports</th>
                  <th>Source</th>
                  <th>Dest</th>
                </tr>
              </thead>
              <tbody>
                {filteredRules.map((rule) => (
                  <tr key={`${rule.subnet}-${rule.name}-${rule.direction}`}>
                    <td>{rule.priority}</td>
                    <td>{rule.name}</td>
                    <td>{rule.direction === "Inbound" ? "In" : "Out"}</td>
                    <td className={rule.access === "Allow" ? "allow" : "deny"}>
                      {rule.access}
                    </td>
                    <td>{rule.protocol}</td>
                    <td>{rule.ports}</td>
                    <td>{rule.source}</td>
                    <td>{rule.destination}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <footer>
        <p>
          Generated from Terraform configuration &middot; Infrastructure
          managed by Terraform &middot; AzureRM Provider 4.x
        </p>
      </footer>
    </>
  );
}
