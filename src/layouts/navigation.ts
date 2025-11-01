import {
  HomeIcon,
  WrenchScrewdriverIcon,
  CpuChipIcon,
  CircleStackIcon,
  ArrowsRightLeftIcon,
  BuildingStorefrontIcon,
  UserIcon,
  WalletIcon,
  GlobeAltIcon,
  KeyIcon,
  CogIcon,
} from "@heroicons/vue/24/outline";

export interface NavigationEntry {
  label: string;
  icon: unknown;
  to: string;
  activePattern?: string;
  keywords?: string[];
}

export const navigationEntries: NavigationEntry[] = [
  {
    label: "Overview",
    icon: HomeIcon,
    to: "/overview",
    keywords: ["dashboard", "home", "summary"],
  },
  {
    label: "Tasks",
    icon: WrenchScrewdriverIcon,
    to: "/tasks/active",
    activePattern: "^/tasks/.*",
    keywords: [
      "job",
      "task",
      "pc1",
      "pc2",
      "winningpost",
      "windowpost",
      "task type",
    ],
  },
  {
    label: "Machines",
    icon: CpuChipIcon,
    to: "/machines",
    keywords: ["worker", "machine", "node"],
  },
  {
    label: "Sectors",
    icon: CircleStackIcon,
    to: "/sectors",
    keywords: ["sector", "storage sector"],
  },
  {
    label: "Pipeline",
    icon: ArrowsRightLeftIcon,
    to: "/pipeline",
    activePattern: "^/pipeline.*",
    keywords: ["pipeline", "porep", "workflow"],
  },
  {
    label: "Market",
    icon: BuildingStorefrontIcon,
    to: "/market",
    activePattern: "^/market.*",
    keywords: ["deal", "market", "storage market"],
  },
  {
    label: "Actor",
    icon: UserIcon,
    to: "/actor",
    activePattern: "^/actor.*",
    keywords: ["actor", "wallet actor", "miner id"],
  },
  {
    label: "Wallets",
    icon: WalletIcon,
    to: "/wallets",
    keywords: ["wallet", "keys", "balance"],
  },
  {
    label: "IPNI",
    icon: GlobeAltIcon,
    to: "/ipni",
    keywords: ["ipni", "indexer", "retrieval"],
  },
  {
    label: "PDP",
    icon: KeyIcon,
    to: "/pdp",
    keywords: ["pdp", "proof of data possession"],
  },
  {
    label: "Configurations",
    icon: CogIcon,
    to: "/config",
    keywords: ["config", "configuration", "settings", "toml"],
  },
];
