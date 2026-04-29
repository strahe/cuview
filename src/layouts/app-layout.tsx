import { Link } from "@tanstack/react-router";
import { Bell, BellRing, Moon, Search, Settings, Sun } from "lucide-react";
import { type ReactNode, useCallback, useState } from "react";
import { SettingsDialog } from "@/components/settings-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  type ConnectionStatus,
  useConnectionStatus,
} from "@/contexts/curio-api-context";
import { useLayout } from "@/contexts/layout-context";
import { useCurioRpc } from "@/hooks/use-curio-query";
import { cn } from "@/lib/utils";
import { CollapsibleSidebar } from "./collapsible-sidebar";

function ConnectionStatusBadge({ status }: { status: ConnectionStatus }) {
  const colorMap: Record<ConnectionStatus, string> = {
    connected: "bg-success",
    connecting: "bg-warning",
    disconnected: "bg-destructive",
    reconnecting: "bg-warning",
  };

  const labelMap: Record<ConnectionStatus, string> = {
    connected: "Connected",
    connecting: "Connecting...",
    disconnected: "Disconnected",
    reconnecting: "Reconnecting...",
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      <div className={cn("size-2 rounded-full", colorMap[status])} />
      <span className="text-muted-foreground">{labelMap[status]}</span>
    </div>
  );
}

function normalizeCurioVersion(version: string) {
  const trimmed = version.trim();

  if (!trimmed) {
    return "";
  }

  return trimmed.startsWith("v") ? trimmed : `v${trimmed}`;
}

function getCurioVersionSummary(version: string) {
  const normalized = normalizeCurioVersion(version);
  const buildMetadataIndex = normalized.indexOf("+");

  return buildMetadataIndex === -1
    ? normalized
    : normalized.slice(0, buildMetadataIndex);
}

function VersionLabel({ version }: { version: string }) {
  const fullVersion = normalizeCurioVersion(version);

  if (!fullVersion) {
    return null;
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="xs"
            className="hidden max-w-32 cursor-help truncate px-0 text-muted-foreground hover:bg-transparent hover:text-muted-foreground sm:inline-flex"
            aria-label={`Curio version ${fullVersion}`}
          />
        }
      >
        {getCurioVersionSummary(fullVersion)}
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        align="start"
        className="max-w-[min(42rem,calc(100vw-2rem))] break-all font-mono"
      >
        {fullVersion}
      </TooltipContent>
    </Tooltip>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  const layout = useLayout();
  const connectionStatus = useConnectionStatus();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const { data: version } = useCurioRpc<string>("Version", [], {
    refetchInterval: 300_000,
  });
  const { data: alertCount } = useCurioRpc<number>("AlertPendingCount", [], {
    refetchInterval: 30_000,
  });
  const hasActiveAlerts = (alertCount ?? 0) > 0;

  const openSearch = useCallback(() => {
    // Trigger ⌘K which AppQuickSearch listens for
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", metaKey: true }),
    );
  }, []);

  return (
    <SidebarProvider
      open={!layout.sidebarCollapsed}
      onOpenChange={(open) => layout.setSidebarCollapsed(!open)}
    >
      <CollapsibleSidebar />
      <SidebarInset>
        <div className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-sm">
          <div className="flex min-h-12 items-center gap-3 px-4 py-2 sm:px-6">
            <div className="flex min-w-0 items-center gap-2">
              <SidebarTrigger />
              <ConnectionStatusBadge status={connectionStatus} />
              {version && <VersionLabel version={version} />}
              <Link
                to="/alerts"
                className={cn(
                  buttonVariants({
                    variant: hasActiveAlerts ? "destructive" : "ghost",
                    size: "sm",
                  }),
                  hasActiveAlerts ? "ml-1" : "ml-1 text-muted-foreground",
                )}
              >
                {hasActiveAlerts ? (
                  <BellRing data-icon="inline-start" />
                ) : (
                  <Bell data-icon="inline-start" />
                )}
                {hasActiveAlerts ? alertCount : ""}
              </Link>
            </div>

            <div className="mx-auto hidden w-full max-w-md flex-1 sm:block">
              <Button
                variant="outline"
                size="lg"
                onClick={openSearch}
                className="w-full min-w-0 justify-between text-muted-foreground"
              >
                <span className="flex items-center gap-2">
                  <Search data-icon="inline-start" />
                  <span className="truncate">
                    Search pages, actors, or task types
                  </span>
                </span>
                <kbd className="pointer-events-none hidden rounded border border-border bg-card px-1.5 py-0.5 text-xs md:inline-flex">
                  ⌘K
                </kbd>
              </Button>
            </div>

            <div className="ml-auto flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={openSearch}
                title="Search"
                aria-label="Search"
                className="sm:hidden"
              >
                <Search />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={layout.toggleTheme}
                title={
                  layout.isDark ? "Switch to light mode" : "Switch to dark mode"
                }
                aria-label={
                  layout.isDark ? "Switch to light mode" : "Switch to dark mode"
                }
              >
                {layout.isDark ? <Sun /> : <Moon />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSettingsOpen(true)}
                title="Settings"
                aria-label="Settings"
              >
                <Settings />
              </Button>
            </div>
          </div>
        </div>

        <div className="relative min-w-0 flex-1">{children}</div>
      </SidebarInset>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </SidebarProvider>
  );
}
