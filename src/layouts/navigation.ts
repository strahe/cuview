import {
  Home,
  Wrench,
  Cpu,
  Database,
  ArrowRightLeft,
  Store,
  User,
  Wallet,
  Globe,
  KeyRound,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavigationEntry {
  label: string;
  icon: LucideIcon;
  to: string;
  activePattern?: string;
  keywords?: string[];
}

export const navigationEntries: NavigationEntry[] = [
  {
    label: "Overview",
    icon: Home,
    to: "/overview",
    keywords: ["dashboard", "home", "summary"],
  },
  {
    label: "Tasks",
    icon: Wrench,
    to: "/tasks/active",
    activePattern: "^/tasks",
    keywords: ["job", "task", "pc1", "pc2", "winningpost", "windowpost"],
  },
  {
    label: "Machines",
    icon: Cpu,
    to: "/machines",
    activePattern: "^/machines",
    keywords: ["worker", "machine", "node"],
  },
  {
    label: "Sectors",
    icon: Database,
    to: "/sectors",
    keywords: ["sector", "storage sector"],
  },
  {
    label: "Pipeline",
    icon: ArrowRightLeft,
    to: "/pipeline",
    activePattern: "^/pipeline",
    keywords: ["pipeline", "porep", "workflow"],
  },
  {
    label: "Market",
    icon: Store,
    to: "/market",
    activePattern: "^/market",
    keywords: ["deal", "market", "storage market"],
  },
  {
    label: "Actor",
    icon: User,
    to: "/actor",
    activePattern: "^/actor",
    keywords: ["actor", "wallet actor", "miner id"],
  },
  {
    label: "Wallets",
    icon: Wallet,
    to: "/wallets",
    keywords: ["wallet", "keys", "balance"],
  },
  {
    label: "IPNI",
    icon: Globe,
    to: "/ipni",
    keywords: ["ipni", "indexer", "retrieval"],
  },
  {
    label: "PDP",
    icon: KeyRound,
    to: "/pdp",
    keywords: ["pdp", "proof of data possession"],
  },
  {
    label: "Configurations",
    icon: Settings,
    to: "/config",
    keywords: ["config", "configuration", "settings", "toml"],
  },
];
