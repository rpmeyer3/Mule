import { useState } from "react";
import {
  resources,
  connections,
  subnets,
  type Resource,
} from "../data/infrastructure";

interface Props {
  onSelectResource: (r: Resource | null) => void;
  selectedId: string | null;
}

const NODE_W = 160;
const NODE_H = 72;

const positions: Record<string, { x: number; y: number }> = {
  internet: { x: 400, y: 20 },
  appgw: { x: 400, y: 140 },
  vmss: { x: 400, y: 290 },
  sql: { x: 220, y: 440 },
  keyvault: { x: 580, y: 440 },
  bastion: { x: 680, y: 200 },
  loganalytics: { x: 100, y: 200 },
};

export default function ArchitectureDiagram({
  onSelectResource,
  selectedId,
}: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const subnetForResource = (id: string) =>
    subnets.find((s) => s.id === resources.find((r) => r.id === id)?.subnet);

  const getCenter = (id: string) => {
    const p = positions[id];
    if (!p) return { cx: 0, cy: 0 };
    return { cx: p.x + NODE_W / 2, cy: p.y + NODE_H / 2 };
  };

  return (
    <svg
      viewBox="0 0 860 560"
      className="architecture-svg"
      role="img"
      aria-label="Azure 3-Tier Architecture Diagram"
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth="8"
          markerHeight="6"
          refX="8"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 8 3, 0 6" fill="#a0aec0" />
        </marker>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* VNet boundary */}
      <rect
        x={60}
        y={100}
        width={740}
        height={420}
        rx={16}
        fill="none"
        stroke="#4a5568"
        strokeWidth={1.5}
        strokeDasharray="8 4"
      />
      <text x={74} y={122} fill="#a0aec0" fontSize={11} fontWeight={600}>
        dunno-yet-prod-vnet &middot; 10.0.0.0/16
      </text>

      {/* Connections */}
      {connections.map((c) => {
        const from = getCenter(c.from);
        const to = getCenter(c.to);
        const isActive =
          hoveredId === c.from ||
          hoveredId === c.to ||
          selectedId === c.from ||
          selectedId === c.to;

        return (
          <g key={`${c.from}-${c.to}`}>
            <line
              x1={from.cx}
              y1={from.cy}
              x2={to.cx}
              y2={to.cy}
              stroke={isActive ? c.color : "#4a5568"}
              strokeWidth={isActive ? 2.5 : 1.5}
              markerEnd="url(#arrowhead)"
              opacity={isActive ? 1 : 0.5}
              className={isActive ? "connection-active" : ""}
            />
            <text
              x={(from.cx + to.cx) / 2}
              y={(from.cy + to.cy) / 2 - 6}
              fill={isActive ? c.color : "#718096"}
              fontSize={10}
              textAnchor="middle"
              opacity={isActive ? 1 : 0.6}
            >
              {c.label}
            </text>
          </g>
        );
      })}

      {/* Internet node */}
      <g>
        <rect
          x={positions.internet.x}
          y={positions.internet.y}
          width={NODE_W}
          height={NODE_H}
          rx={12}
          fill="#2d3748"
          stroke="#718096"
          strokeWidth={1}
        />
        <text
          x={positions.internet.x + NODE_W / 2}
          y={positions.internet.y + 30}
          fill="#e2e8f0"
          fontSize={13}
          textAnchor="middle"
          fontWeight={600}
        >
          🌐 Internet
        </text>
        <text
          x={positions.internet.x + NODE_W / 2}
          y={positions.internet.y + 48}
          fill="#a0aec0"
          fontSize={10}
          textAnchor="middle"
        >
          Incoming traffic
        </text>
      </g>

      {/* Resource nodes */}
      {resources.map((r) => {
        const pos = positions[r.id];
        if (!pos) return null;
        const isHovered = hoveredId === r.id;
        const isSelected = selectedId === r.id;
        const subnet = subnetForResource(r.id);

        return (
          <g
            key={r.id}
            className="resource-node"
            onMouseEnter={() => setHoveredId(r.id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={() =>
              onSelectResource(isSelected ? null : r)
            }
            tabIndex={0}
            role="button"
            aria-label={`View details for ${r.name}`}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelectResource(isSelected ? null : r);
              }
            }}
            style={{ cursor: "pointer" }}
            filter={isSelected ? "url(#glow)" : undefined}
          >
            {/* Subnet badge */}
            {subnet && (
              <rect
                x={pos.x - 4}
                y={pos.y - 4}
                width={NODE_W + 8}
                height={NODE_H + 8}
                rx={14}
                fill="none"
                stroke={subnet.color}
                strokeWidth={isHovered || isSelected ? 2 : 1}
                strokeDasharray={isHovered || isSelected ? "none" : "4 2"}
                opacity={isHovered || isSelected ? 0.9 : 0.3}
              />
            )}
            <rect
              x={pos.x}
              y={pos.y}
              width={NODE_W}
              height={NODE_H}
              rx={10}
              fill={isSelected ? `${r.color}22` : "#1a202c"}
              stroke={isHovered || isSelected ? r.color : "#4a5568"}
              strokeWidth={isHovered || isSelected ? 2 : 1}
            />
            <text
              x={pos.x + NODE_W / 2}
              y={pos.y + 28}
              fill="#e2e8f0"
              fontSize={12}
              textAnchor="middle"
              fontWeight={600}
            >
              {r.icon} {r.name.split("(")[0].trim()}
            </text>
            <text
              x={pos.x + NODE_W / 2}
              y={pos.y + 46}
              fill="#a0aec0"
              fontSize={9}
              textAnchor="middle"
            >
              {subnet ? `${subnet.name} (${subnet.cidr})` : "Platform service"}
            </text>
            {r.name.includes("(") && (
              <text
                x={pos.x + NODE_W / 2}
                y={pos.y + 60}
                fill={r.color}
                fontSize={9}
                textAnchor="middle"
              >
                {r.name.match(/\(([^)]+)\)/)?.[1]}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
