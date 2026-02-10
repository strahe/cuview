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
  HardDrive,
  Bell,
  Shield,
  type LucideIcon,
} from "lucide-react";

export interface NavigationEntry {
  label: string;
  icon: LucideIcon;
  to: string;
  activePattern?: string;
  keywords?: string[];
}

export interface NavigationGroup {
  title: string;
  entries: NavigationEntry[];
}

export const navigationGroups: NavigationGroup[] = [
  {
    title: "Core Operations",
    entries: [
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
        to: "/pipeline/porep",
        activePattern: "^/pipeline",
        keywords: ["pipeline", "porep", "workflow"],
      },
      {
        label: "Storage",
        icon: HardDrive,
        to: "/storage",
        keywords: ["storage", "gc", "garbage collection", "disk"],
      },
    ],
  },
  {
    title: "Market",
    entries: [
      {
        label: "Market",
        icon: Store,
        to: "/market/balance",
        activePattern: "^/market",
        keywords: ["deal", "market", "storage market"],
      },
    ],
  },
  {
    title: "System",
    entries: [
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
        label: "Alerts",
        icon: Bell,
        to: "/alerts",
        keywords: ["alert", "notification", "warning", "error"],
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
        label: "Proof Share",
        icon: Shield,
        to: "/proof-share",
        keywords: ["proof", "share", "proving", "windowed post"],
      },
      {
        label: "Configurations",
        icon: Settings,
        to: "/config",
        keywords: ["config", "configuration", "settings", "toml"],
      },
    ],
  },
];

// Flat list for backward compatibility (search, etc.)
export const navigationEntries: NavigationEntry[] =
  navigationGroups.flatMap((g) => g.entries);
