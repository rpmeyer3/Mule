import {
  Shield,
  Server,
  Database,
  KeyRound,
  Lock,
  Activity,
  Network,
  ShieldCheck,
  Globe,
  Scan,
  Unplug,
  AtSign,
  Fingerprint,
  Stethoscope,
  Cloud,
  type LucideProps,
} from "lucide-react";
import type { ComponentType } from "react";

const iconMap: Record<string, ComponentType<LucideProps>> = {
  shield: Shield,
  server: Server,
  database: Database,
  "key-round": KeyRound,
  lock: Lock,
  activity: Activity,
  network: Network,
  "shield-check": ShieldCheck,
  globe: Globe,
  scan: Scan,
  unplug: Unplug,
  "at-sign": AtSign,
  fingerprint: Fingerprint,
  stethoscope: Stethoscope,
  cloud: Cloud,
};

interface Props {
  name: string;
  size?: number;
  color?: string;
  className?: string;
}

export default function ResourceIcon({ name, size = 18, color, className }: Props) {
  const Icon = iconMap[name];
  if (!Icon) return null;
  return <Icon size={size} color={color} className={className} strokeWidth={1.75} />;
}
