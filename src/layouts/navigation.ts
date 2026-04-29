import {
  BellRing,
  Cpu,
  Database,
  Globe,
  HardDrive,
  Home,
  KeyRound,
  type LucideIcon,
  RefreshCw,
  Settings,
  Shield,
  Store,
  User,
  Wallet,
  Workflow,
  Wrench,
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
    title: "Cluster",
    entries: [
      {
        label: "Overview",
        icon: Home,
        to: "/overview",
        keywords: ["dashboard", "home", "summary"],
      },
      {
        label: "Alerts",
        icon: BellRing,
        to: "/alerts",
        keywords: ["alert", "alerts", "alarm", "warning", "risk", "incident"],
      },
      {
        label: "Machines",
        icon: Cpu,
        to: "/machines",
        activePattern: "^/machines",
        keywords: ["worker", "machine", "node"],
      },
      {
        label: "Tasks",
        icon: Wrench,
        to: "/tasks/active",
        activePattern: "^/tasks",
        keywords: ["job", "task", "pc1", "pc2", "winningpost", "windowpost"],
      },
      {
        label: "Actors",
        icon: User,
        to: "/actor",
        activePattern: "^/actor",
        keywords: ["actor", "provider", "storage provider", "miner id"],
      },
    ],
  },
  {
    title: "Sealing",
    entries: [
      {
        label: "Sectors",
        icon: Database,
        to: "/sectors",
        keywords: ["sector", "storage sector"],
      },
      {
        label: "PoRep",
        icon: Workflow,
        to: "/pipeline/porep",
        activePattern: "^/pipeline/porep",
        keywords: ["pipeline", "porep", "proof of replication", "sealing"],
      },
      {
        label: "Snap",
        icon: RefreshCw,
        to: "/pipeline/snap",
        activePattern: "^/pipeline/snap",
        keywords: ["pipeline", "snap", "upgrade", "snap deals"],
      },
    ],
  },
  {
    title: "Storage",
    entries: [
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
        label: "Storage Market",
        icon: Store,
        to: "/market/balance",
        activePattern: "^/market",
        keywords: ["deal", "market", "storage market"],
      },
      {
        label: "IPNI",
        icon: Globe,
        to: "/ipni/providers",
        activePattern: "^/ipni",
        keywords: ["ipni", "indexer", "retrieval"],
      },
      {
        label: "PDP",
        icon: KeyRound,
        to: "/pdp",
        keywords: ["pdp", "proof of data possession"],
      },
      {
        label: "Snark Market",
        icon: Shield,
        to: "/proof-share",
        keywords: ["proofshare", "proof", "proving", "windowed post", "snark"],
      },
      {
        label: "Wallets",
        icon: Wallet,
        to: "/wallets",
        keywords: ["wallet", "keys", "balance"],
      },
    ],
  },
  {
    title: "Admin",
    entries: [
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
export const navigationEntries: NavigationEntry[] = navigationGroups.flatMap(
  (g) => g.entries,
);
