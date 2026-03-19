import { useState, useEffect, useCallback } from "react";
import ArchitectureDiagram from "./components/ArchitectureDiagram";
import ResourceIcon from "./components/ResourceIcon";
import {
  resources,
  trafficSteps,
  nsgRules,
  subnets,
  type Resource,
} from "./data/infrastructure";

/* ================================================================
   CONSTANTS
   ================================================================ */

const SECTION_IDS = ["architecture", "resources", "traffic", "nsg"] as const;

const NAV_LABELS: Record<string, string> = {
  architecture: "Diagram",
  resources: "Resources",
  traffic: "Flow",
  nsg: "NSG",
};

const SUBNET_TABS = ["web", "app", "db", "kv"] as const;
const SUBNET_LABELS: Record<string, string> = {
  web: "Web Subnet",
  app: "App Subnet",
  db: "Database Subnet",
  kv: "Key Vault Subnet",
};

const HERO_TITLE = "Azure 3-Tier Secure Architecture";

/* ================================================================
   HOOKS
   ================================================================ */

function useScrollDirection() {
  const [direction, setDirection] = useState<"up" | "down">("up");
  const [atTop, setAtTop] = useState(true);

  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        setAtTop(y < 10);
        if (Math.abs(y - lastY) > 8) {
          setDirection(y > lastY ? "down" : "up");
        }
        lastY = y;
        ticking = false;
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return { direction, atTop };
}

function useActiveSection(ids: readonly string[]) {
  const [activeId, setActiveId] = useState(ids[0]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-35% 0px -55% 0px" },
    );

    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [ids]);

  return activeId;
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mql.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  return reduced;
}

/* ================================================================
   HERO TITLE (per-character stagger)
   ================================================================ */

function splitTitle(text: string) {
  let idx = 0;
  return text.split(" ").map((word) => {
    const chars = word.split("").map((c) => ({ char: c, index: idx++ }));
    idx++; // account for space
    return { word, chars };
  });
}

const heroWords = splitTitle(HERO_TITLE);

function HeroTitle() {
  return (
    <h1 className="hero-title">
      <span className="sr-only">{HERO_TITLE}</span>
      <span aria-hidden="true" className="hero-title-visual">
        {heroWords.map(({ chars }, wi) => (
          <span key={wi} className="hero-word">
            {chars.map(({ char, index }) => (
              <span
                key={index}
                className="hero-char"
                style={
                  {
                    "--char-delay": `${index * 45 + 200}ms`,
                  } as React.CSSProperties
                }
              >
                {char}
              </span>
            ))}
            {wi < heroWords.length - 1 && (
              <span className="hero-space">&nbsp;</span>
            )}
          </span>
        ))}
      </span>
    </h1>
  );
}

/* ================================================================
   MAIN APP
   ================================================================ */

export default function App() {
  const [selected, setSelected] = useState<Resource | null>(null);
  const [activeSubnet, setActiveSubnet] = useState<string>("web");
  const { direction, atTop } = useScrollDirection();
  const activeSection = useActiveSection(SECTION_IDS);
  const reducedMotion = useReducedMotion();

  const filteredRules = nsgRules.filter((r) => r.subnet === activeSubnet);

  // Global IntersectionObserver for .reveal elements
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");

    if (reducedMotion) {
      els.forEach((el) => el.classList.add("revealed"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" },
    );

    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [reducedMotion]);

  // 3D card tilt
  const handleCardMouseMove = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (reducedMotion) return;
      if (!window.matchMedia("(hover: hover)").matches) return;

      const card = e.currentTarget;
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const rx = ((y - cy) / cy) * -3.5;
      const ry = ((x - cx) / cx) * 3.5;
      card.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(8px)`;
    },
    [reducedMotion],
  );

  const handleCardMouseLeave = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.currentTarget.style.transform = "";
    },
    [],
  );

  const navHidden = direction === "down" && !atTop;

  return (
    <>
      <a href="#maincontent" className="skip-link">
        Skip to main content
      </a>

      {/* ── Navigation ── */}
      <nav
        className={`nav${navHidden ? " nav--hidden" : ""}${!atTop ? " nav--scrolled" : ""}`}
        aria-label="Page sections"
      >
        <div className="nav-inner">
          <span className="nav-brand" aria-hidden="true">
            &#x2B21;
          </span>
          {SECTION_IDS.map((id) => (
            <a
              key={id}
              href={`#${id}`}
              className={`nav-link${activeSection === id ? " nav-link--active" : ""}`}
            >
              {NAV_LABELS[id]}
            </a>
          ))}
        </div>
      </nav>

      <main id="maincontent" tabIndex={-1}>
        {/* ── Hero ── */}
        <section className="hero" aria-label="Introduction">
          <div className="hero-bg" aria-hidden="true">
            <div className="hero-grid" />
            <div className="hero-glow" />
          </div>
          <div className="hero-content">
            <HeroTitle />
            <p className="hero-subtitle">
              <span className="hero-env">threetier</span>
              <span className="hero-dot" aria-hidden="true">
                &middot;
              </span>
              <span className="hero-env">prod</span>
              <span className="hero-dot" aria-hidden="true">
                &middot;
              </span>
              <span className="hero-env">eastus2</span>
            </p>
            <div className="hero-badges" aria-label="Infrastructure highlights">
              <span
                className="badge badge--blue"
                style={{ "--badge-delay": "1.4s" } as React.CSSProperties}
              >
                Terraform Managed
              </span>
              <span
                className="badge badge--green"
                style={{ "--badge-delay": "1.6s" } as React.CSSProperties}
              >
                WAF v2 + OWASP 3.2
              </span>
              <span
                className="badge badge--gold"
                style={{ "--badge-delay": "1.8s" } as React.CSSProperties}
              >
                Entra ID Auth
              </span>
            </div>
          </div>
          <div className="scroll-indicator" aria-hidden="true">
            <span className="scroll-indicator-text">Scroll</span>
            <span className="scroll-indicator-track">
              <span className="scroll-indicator-dot" />
            </span>
          </div>
        </section>

        {/* ── Architecture Diagram ── */}
        <section
          className="section diagram-section"
          id="architecture"
          aria-label="Architecture diagram"
        >
          <div className="section-header reveal">
            <h2 className="section-title">Architecture Overview</h2>
            <p className="section-subtitle">
              Interactive diagram of all deployed Azure resources and their
              connections
            </p>
          </div>
          <div className="diagram-container reveal">
            <ArchitectureDiagram
              onSelectResource={setSelected}
              selectedId={selected?.id ?? null}
            />
          </div>
        </section>

        {/* ── Detail Panel ── */}
        {selected && (
          <div
            className="detail-overlay"
            role="region"
            aria-label="Resource details"
          >
            <div className="detail-panel">
              <div className="detail-header">
                <h2>
                  <ResourceIcon
                    name={selected.icon}
                    size={22}
                    color={selected.color}
                  />
                  <span>{selected.name}</span>
                </h2>
                <button
                  onClick={() => setSelected(null)}
                  aria-label="Close details"
                >
                  <span aria-hidden="true">&#x2715;</span>
                </button>
              </div>
              <p className="detail-headline">{selected.headline}</p>
              <ul>
                {selected.details.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
              <p className="detail-tf">
                Terraform: <code>infra/{selected.terraform}</code>
              </p>
            </div>
          </div>
        )}

        {/* ── Resource Cards ── */}
        <section
          className="section"
          id="resources"
          aria-label="Resource list"
        >
          <div className="section-header reveal">
            <h2 className="section-title">Resource Details</h2>
            <p className="section-subtitle">
              {resources.length} deployed resources across the architecture
            </p>
          </div>
          <div className="cards reveal">
            {resources.map((r, i) => {
              const subnet = subnets.find((s) => s.id === r.subnet);
              return (
                <button
                  key={r.id}
                  className={`card${selected?.id === r.id ? " card--active" : ""}`}
                  style={
                    {
                      "--card-delay": `${i * 55}ms`,
                    } as React.CSSProperties
                  }
                  onClick={() =>
                    setSelected(selected?.id === r.id ? null : r)
                  }
                  onMouseMove={handleCardMouseMove}
                  onMouseLeave={handleCardMouseLeave}
                  aria-pressed={selected?.id === r.id}
                >
                  <div
                    className="card-icon"
                    style={
                      { "--icon-color": r.color } as React.CSSProperties
                    }
                  >
                    <ResourceIcon name={r.icon} size={20} color={r.color} />
                  </div>
                  <h3>{r.name}</h3>
                  <p className="card-subnet">
                    {subnet
                      ? `${subnet.name} \u00B7 ${subnet.cidr}`
                      : "Platform service"}
                  </p>
                  <p className="card-headline">{r.headline}</p>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Traffic Flow ── */}
        <section
          className="section flow-section"
          id="traffic"
          aria-label="Traffic flow"
        >
          <div className="section-header reveal">
            <h2 className="section-title">Request Traffic Flow</h2>
            <p className="section-subtitle">
              End-to-end journey of an HTTPS request through the architecture
            </p>
          </div>
          <div className="flow-timeline reveal" role="list">
            {trafficSteps.map((step, i) => (
              <div
                className="flow-step"
                key={step.label}
                role="listitem"
                style={
                  {
                    "--flow-delay": `${i * 140}ms`,
                  } as React.CSSProperties
                }
              >
                {i > 0 && (
                  <div className="flow-connector" aria-hidden="true">
                    <div className="flow-connector-line" />
                  </div>
                )}
                <div className="flow-card">
                  <span className="flow-number">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <strong>{step.label}</strong>
                  <span className="flow-detail">{step.detail}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── NSG Rules ── */}
        <section
          className="section nsg-section"
          id="nsg"
          aria-label="Network Security Group rules"
        >
          <div className="section-header reveal">
            <h2 className="section-title">NSG Rules by Subnet</h2>
            <p className="section-subtitle">
              Network security rules controlling traffic between tiers
            </p>
          </div>

          <div className="nsg-content reveal">
            <div className="tab-bar" role="tablist" aria-label="Select subnet">
              {SUBNET_TABS.map((id) => (
                <button
                  key={id}
                  className="tab-btn"
                  role="tab"
                  type="button"
                  id={`tab-${id}`}
                  aria-selected={activeSubnet === id}
                  aria-controls={`nsg-panel-${id}`}
                  onClick={() => setActiveSubnet(id)}
                >
                  {SUBNET_LABELS[id]}
                </button>
              ))}
            </div>

            <div
              className="table-wrap"
              id={`nsg-panel-${activeSubnet}`}
              role="tabpanel"
              aria-labelledby={`tab-${activeSubnet}`}
            >
              <table>
                <thead>
                  <tr>
                    <th scope="col">Priority</th>
                    <th scope="col">Name</th>
                    <th scope="col">Dir</th>
                    <th scope="col">Access</th>
                    <th scope="col">Proto</th>
                    <th scope="col">Ports</th>
                    <th scope="col">Source</th>
                    <th scope="col">Dest</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRules.map((rule) => (
                    <tr
                      key={`${rule.subnet}-${rule.name}-${rule.direction}`}
                    >
                      <td>{rule.priority}</td>
                      <td>{rule.name}</td>
                      <td>
                        {rule.direction === "Inbound" ? "In" : "Out"}
                      </td>
                      <td
                        className={
                          rule.access === "Allow" ? "allow" : "deny"
                        }
                      >
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
