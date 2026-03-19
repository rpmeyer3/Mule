import { useState } from "react";
import { resources, subnets, type Resource } from "../data/infrastructure";
import ResourceIcon from "./ResourceIcon";

/* ================================================================
   TYPES
   ================================================================ */

interface Props {
  onSelectResource: (r: Resource | null) => void;
  selectedId: string | null;
}

/* ================================================================
   LAYOUT DATA — positions, bands, routes
   ================================================================ */

const NODE_W = 180;
const NODE_H = 70;
const INET_W = 180;
const INET_H = 44;

const POS: Record<string, { x: number; y: number; w?: number; h?: number }> = {
  internet: { x: 390, y: 10, w: INET_W, h: INET_H },
  loganalytics: { x: 48, y: 102 },
  appgw: { x: 362, y: 102 },
  bastion: { x: 712, y: 102 },
  vmss: { x: 362, y: 228 },
  sql: { x: 152, y: 358 },
  keyvault: { x: 572, y: 358 },
};

const BANDS = [
  {
    id: "web",
    label: "web-subnet",
    cidr: "10.0.1.0/24",
    color: "#0078d4",
    x: 350,
    y: 84,
    w: 204,
    h: 98,
  },
  {
    id: "app",
    label: "app-subnet",
    cidr: "10.0.2.0/24",
    color: "#38b2ac",
    x: 350,
    y: 210,
    w: 204,
    h: 98,
  },
  {
    id: "db",
    label: "db-subnet",
    cidr: "10.0.3.0/24",
    color: "#b794f4",
    x: 140,
    y: 340,
    w: 204,
    h: 98,
  },
  {
    id: "kv",
    label: "kv-subnet",
    cidr: "10.0.4.0/24",
    color: "#ecc94b",
    x: 560,
    y: 340,
    w: 204,
    h: 98,
  },
  {
    id: "bastion",
    label: "AzureBastionSubnet",
    cidr: "10.0.5.0/26",
    color: "#63b3ed",
    x: 700,
    y: 84,
    w: 204,
    h: 98,
  },
];

const ROUTES = [
  {
    id: "c1",
    from: "internet",
    to: "appgw",
    label: "HTTPS (443)",
    color: "#0078d4",
    primary: true,
    d: "M480,54 L452,102",
    lx: 468,
    ly: 78,
  },
  {
    id: "c2",
    from: "appgw",
    to: "vmss",
    label: "HTTPS (443)",
    color: "#38b2ac",
    primary: true,
    d: "M452,172 L452,228",
    lx: 470,
    ly: 200,
  },
  {
    id: "c3",
    from: "vmss",
    to: "sql",
    label: "TDS (1433)",
    color: "#b794f4",
    primary: true,
    d: "M420,298 C420,330 242,330 242,358",
    lx: 340,
    ly: 322,
  },
  {
    id: "c4",
    from: "appgw",
    to: "keyvault",
    label: "TLS cert",
    color: "#ecc94b",
    primary: false,
    d: "M542,145 C620,145 662,280 662,358",
    lx: 610,
    ly: 245,
  },
  {
    id: "c5",
    from: "vmss",
    to: "keyvault",
    label: "Secrets",
    color: "#ecc94b",
    primary: false,
    d: "M490,298 C490,328 662,328 662,358",
    lx: 582,
    ly: 320,
  },
  {
    id: "c6",
    from: "bastion",
    to: "vmss",
    label: "SSH (22)",
    color: "#63b3ed",
    primary: false,
    d: "M712,145 C650,145 580,263 542,263",
    lx: 640,
    ly: 200,
  },
  {
    id: "c7",
    from: "appgw",
    to: "loganalytics",
    label: "WAF logs",
    color: "#f6ad55",
    primary: false,
    d: "M362,137 L228,137",
    lx: 295,
    ly: 128,
  },
  {
    id: "c8",
    from: "vmss",
    to: "loganalytics",
    label: "Diagnostics",
    color: "#f6ad55",
    primary: false,
    d: "M362,250 C280,250 138,210 138,172",
    lx: 250,
    ly: 222,
  },
  {
    id: "c9",
    from: "sql",
    to: "loganalytics",
    label: "SQL audit",
    color: "#f6ad55",
    primary: false,
    d: "M230,358 C230,280 138,220 138,172",
    lx: 172,
    ly: 270,
  },
];

const ROUTE_COLORS = [...new Set(ROUTES.map((r) => r.color))];

/* ================================================================
   DIAGRAM NODE
   ================================================================ */

interface NodeProps {
  x: number;
  y: number;
  w: number;
  h: number;
  name: string;
  subtitle: string;
  detail?: string;
  color: string;
  iconName?: string;
  active: boolean;
  dimmed: boolean;
  selected: boolean;
  rx?: number;
  showAccent?: boolean;
  onHover: (hovered: boolean) => void;
  onClick: () => void;
}

function DiagramNode({
  x,
  y,
  w,
  h,
  name,
  subtitle,
  detail,
  color,
  iconName,
  active,
  dimmed,
  selected,
  rx = 10,
  showAccent = true,
  onHover,
  onClick,
}: NodeProps) {
  const compact = h <= 50;
  const hasIcon = !!iconName;
  const iconAreaW = hasIcon ? 18 : 0;
  const nameY = y + (compact ? 20 : detail ? 24 : 30);
  const subY = y + (compact ? 36 : detail ? 42 : 48);

  return (
    <g
      className="resource-node"
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      onClick={onClick}
      tabIndex={0}
      role="button"
      aria-label={`View details for ${name}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      style={{ cursor: "pointer" }}
      filter={selected ? "url(#glow-lg)" : active ? "url(#glow)" : undefined}
      opacity={dimmed ? 0.25 : 1}
    >
      {/* Node background */}
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={rx}
        fill={selected ? `url(#node-grad-selected-${color.slice(1)})` : "url(#node-grad-default)"}
        stroke={active ? color : "#2a3444"}
        strokeWidth={active ? 1.5 : 0.75}
      />

      {/* Top accent line */}
      {showAccent && (
        <line
          x1={x + 14}
          y1={y + 0.5}
          x2={x + w - 14}
          y2={y + 0.5}
          stroke={color}
          strokeWidth={active ? 2 : 1.5}
          strokeLinecap="round"
          opacity={active ? 0.9 : 0.3}
        />
      )}

      {/* Icon */}
      {hasIcon && (
        <foreignObject
          x={x + w / 2 - name.length * 3.2 - iconAreaW / 2}
          y={nameY - 13}
          width={18}
          height={18}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 18,
              height: 18,
            }}
          >
            <ResourceIcon name={iconName} size={14} color={color} />
          </div>
        </foreignObject>
      )}

      {/* Name */}
      <text
        x={x + w / 2 + (hasIcon ? 6 : 0)}
        y={nameY}
        fill={active ? "#f0f4f8" : "#d0d8e4"}
        fontSize={compact ? 13 : 12}
        textAnchor="middle"
        fontWeight={600}
        fontFamily="Inter, -apple-system, sans-serif"
      >
        {name}
      </text>

      {/* Subtitle */}
      <text
        x={x + w / 2}
        y={subY}
        fill="#4a5a6e"
        fontSize={9}
        textAnchor="middle"
        fontFamily="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
      >
        {subtitle}
      </text>

      {/* Detail line */}
      {detail && (
        <text
          x={x + w / 2}
          y={y + 58}
          fill={color}
          fontSize={9}
          textAnchor="middle"
          fontWeight={600}
          fontFamily="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
        >
          {detail}
        </text>
      )}
    </g>
  );
}

/* ================================================================
   MAIN COMPONENT
   ================================================================ */

export default function ArchitectureDiagram({
  onSelectResource,
  selectedId,
}: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const anyHighlighted = hoveredId !== null || selectedId !== null;

  const isRouteActive = (r: (typeof ROUTES)[number]) =>
    hoveredId === r.from ||
    hoveredId === r.to ||
    selectedId === r.from ||
    selectedId === r.to;

  const connectedIds = new Set<string>();
  if (anyHighlighted) {
    ROUTES.forEach((r) => {
      if (isRouteActive(r)) {
        connectedIds.add(r.from);
        connectedIds.add(r.to);
      }
    });
  }

  const subnetFor = (id: string) =>
    subnets.find((s) => s.id === resources.find((r) => r.id === id)?.subnet);

  const nodeState = (id: string) => {
    const isHovered = hoveredId === id;
    const isSelected = selectedId === id;
    const active = isHovered || isSelected;
    const dimmed = anyHighlighted && !active && !connectedIds.has(id);
    return { active, dimmed, isSelected };
  };

  return (
    <svg
      viewBox="0 0 960 480"
      className="architecture-svg"
      role="img"
      aria-label="Azure 3-Tier Architecture Diagram showing Internet traffic flowing through Application Gateway, VMSS, Azure SQL, Key Vault, and Bastion within a Virtual Network"
    >
      <defs>
        {/* Arrow markers per color */}
        {ROUTE_COLORS.map((c) => (
          <marker
            key={c}
            id={`arr-${c.slice(1)}`}
            viewBox="0 0 10 8"
            refX="10"
            refY="4"
            markerWidth={6}
            markerHeight={5}
            markerUnits="userSpaceOnUse"
            orient="auto"
          >
            <path d="M0,0 L10,4 L0,8 z" fill={c} />
          </marker>
        ))}
        <marker
          id="arr-muted"
          viewBox="0 0 10 8"
          refX="10"
          refY="4"
          markerWidth={6}
          markerHeight={5}
          markerUnits="userSpaceOnUse"
          orient="auto"
        >
          <path d="M0,0 L10,4 L0,8 z" fill="#3a4456" />
        </marker>

        {/* Glow filters */}
        <filter id="glow" x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="glow-lg" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Node background gradients */}
        <linearGradient
          id="node-grad-default"
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop offset="0%" stopColor="#141a24" />
          <stop offset="100%" stopColor="#0e1218" />
        </linearGradient>

        {/* Per-color selected gradients */}
        {ROUTE_COLORS.map((c) => (
          <linearGradient
            key={c}
            id={`node-grad-selected-${c.slice(1)}`}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop offset="0%" stopColor={c} stopOpacity="0.1" />
            <stop offset="100%" stopColor={c} stopOpacity="0.03" />
          </linearGradient>
        ))}
      </defs>

      {/* Background */}
      <rect x={0} y={0} width={960} height={480} fill="transparent" />

      {/* VNet boundary */}
      <rect
        x={28}
        y={68}
        width={896}
        height={400}
        rx={16}
        fill="none"
        stroke="#222e40"
        strokeWidth={1}
        strokeDasharray="8 4"
        opacity={0.7}
      />
      <text
        x={44}
        y={86}
        fill="#3e5068"
        fontSize={10}
        fontWeight={600}
        fontFamily="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
      >
        dunno-yet-prod-vnet &middot; 10.0.0.0/16
      </text>

      {/* Subnet bands */}
      {BANDS.map((b) => (
        <g key={b.id}>
          <rect
            x={b.x}
            y={b.y}
            width={b.w}
            height={b.h}
            rx={10}
            fill={`${b.color}06`}
            stroke={b.color}
            strokeWidth={0.75}
            strokeDasharray="4 3"
            opacity={0.4}
          />
          <text
            x={b.x + 8}
            y={b.y + 14}
            fill={b.color}
            fontSize={8.5}
            fontWeight={600}
            opacity={0.55}
            fontFamily="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
          >
            {b.label} &middot; {b.cidr}
          </text>
        </g>
      ))}

      {/* Connection paths (rendered behind nodes) */}
      {ROUTES.map((route) => {
        const active = isRouteActive(route);
        const dimmed = anyHighlighted && !active;
        const labelW = route.label.length * 6 + 12;

        return (
          <g key={route.id}>
            <path
              d={route.d}
              fill="none"
              stroke={active ? route.color : dimmed ? "#1a2030" : "#3a4456"}
              strokeWidth={active ? 2 : route.primary ? 1.5 : 1}
              strokeLinecap="round"
              markerEnd={
                active
                  ? `url(#arr-${route.color.slice(1)})`
                  : dimmed
                    ? undefined
                    : "url(#arr-muted)"
              }
              opacity={
                active ? 1 : dimmed ? 0.15 : route.primary ? 0.5 : 0.3
              }
              className={
                route.primary
                  ? "connection-primary"
                  : "connection-secondary"
              }
              filter={active ? "url(#glow)" : undefined}
            />
            {/* Label background */}
            <rect
              x={route.lx - labelW / 2}
              y={route.ly - 10}
              width={labelW}
              height={16}
              rx={4}
              fill="#0a0e14"
              opacity={dimmed ? 0.3 : 0.85}
            />
            {/* Label text */}
            <text
              x={route.lx}
              y={route.ly}
              fill={
                active ? route.color : dimmed ? "#2a3444" : "#4a5a6e"
              }
              fontSize={9.5}
              textAnchor="middle"
              fontWeight={active ? 600 : 400}
              fontFamily="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
            >
              {route.label}
            </text>
          </g>
        );
      })}

      {/* Internet node */}
      {(() => {
        const s = nodeState("internet");
        return (
          <DiagramNode
            x={POS.internet.x}
            y={POS.internet.y}
            w={INET_W}
            h={INET_H}
            name="Internet"
            subtitle="Incoming traffic"
            iconName="cloud"
            color="#4a90d9"
            rx={22}
            showAccent={false}
            active={s.active}
            dimmed={s.dimmed}
            selected={false}
            onHover={(h) => setHoveredId(h ? "internet" : null)}
            onClick={() => {}}
          />
        );
      })()}

      {/* Resource nodes */}
      {resources.map((r) => {
        const pos = POS[r.id];
        if (!pos) return null;
        const s = nodeState(r.id);
        const subnet = subnetFor(r.id);
        const displayName = r.name.split("(")[0].trim();
        const detail = r.name.match(/\(([^)]+)\)/)?.[1];

        return (
          <DiagramNode
            key={r.id}
            x={pos.x}
            y={pos.y}
            w={pos.w ?? NODE_W}
            h={pos.h ?? NODE_H}
            name={displayName}
            subtitle={
              subnet
                ? `${subnet.name} (${subnet.cidr})`
                : "Platform service"
            }
            detail={detail}
            iconName={r.icon}
            color={r.color}
            active={s.active}
            dimmed={s.dimmed}
            selected={s.isSelected}
            onHover={(h) => setHoveredId(h ? r.id : null)}
            onClick={() => onSelectResource(s.isSelected ? null : r)}
          />
        );
      })}
    </svg>
  );
}
