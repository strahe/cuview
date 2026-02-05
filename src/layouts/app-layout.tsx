import { useState, useCallback, type ReactNode } from "react";
import { CollapsibleSidebar } from "./collapsible-sidebar";
import { useLayout } from "@/contexts/layout-context";
import {
  useConnectionStatus,
  type ConnectionStatus,
} from "@/contexts/curio-api-context";
import { useCurioRpc } from "@/hooks/use-curio-query";
import {
  Menu,
  ChevronLeft,
  Search,
  Sun,
  Moon,
  Settings,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";

function ConnectionStatusBadge({ status }: { status: ConnectionStatus }) {
  const colorMap: Record<ConnectionStatus, string> = {
    connected: "bg-[hsl(var(--success))]",
    connecting: "bg-[hsl(var(--warning))]",
    disconnected: "bg-[hsl(var(--destructive))]",
    reconnecting: "bg-[hsl(var(--warning))]",
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
      <span className="text-[hsl(var(--muted-foreground))]">
        {labelMap[status]}
      </span>
    </div>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  const layout = useLayout();
  const connectionStatus = useConnectionStatus();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: version } = useCurioRpc<string>("Version", [], { refetchInterval: 300_000 });
  const { data: alertCount } = useCurioRpc<number>("AlertPendingCount", [], { refetchInterval: 30_000 });

  const openSearch = useCallback(() => {
    // Trigger ⌘K which AppQuickSearch listens for
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", metaKey: true }),
    );
  }, []);

  return (
    <div className="flex min-h-screen bg-[hsl(var(--background))]">
      {/* Desktop Sidebar */}
      <div className="fixed top-0 left-0 z-30 hidden lg:block">
        <CollapsibleSidebar
          isCollapsed={layout.sidebarCollapsed}
          onToggle={layout.toggleSidebar}
        />
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-50 w-64">
            <CollapsibleSidebar />
          </div>
        </div>
      )}

      {/* Mobile Top Bar */}
      <div className="w-full lg:hidden">
        <div className="border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-md p-2 hover:bg-[hsl(var(--accent))]"
            >
              <Menu className="size-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] grid size-7 place-items-center rounded-lg text-xs font-bold">
                C
              </div>
              <span className="font-semibold">Cuview</span>
            </div>
            <div className="w-9" />
          </div>
        </div>
        <main className="flex-1">{children}</main>
      </div>

      {/* Desktop Main Content */}
      <main
        className="hidden min-h-screen flex-1 transition-all duration-300 lg:block"
        style={{
          marginLeft: layout.sidebarCollapsed ? "4rem" : "16rem",
        }}
      >
        {/* Top Bar */}
        <div className="sticky top-0 z-20 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]/95 backdrop-blur-sm">
          <div className="flex items-center justify-between px-6 py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={layout.toggleSidebar}
                className="rounded-md p-1.5 hover:bg-[hsl(var(--accent))]"
                title={
                  layout.sidebarCollapsed
                    ? "Expand sidebar"
                    : "Collapse sidebar"
                }
              >
                {layout.sidebarCollapsed ? (
                  <Menu className="size-5" />
                ) : (
                  <ChevronLeft className="size-5" />
                )}
              </button>
              <ConnectionStatusBadge status={connectionStatus} />
              {version && (
                <span className="text-xs text-[hsl(var(--muted-foreground))]">v{version}</span>
              )}
              {alertCount != null && alertCount > 0 && (
                <a href="/alerts" className="flex items-center gap-1 rounded-md bg-[hsl(var(--destructive)/0.1)] px-2 py-0.5 text-xs text-[hsl(var(--destructive))]">
                  <Bell className="size-3" />
                  {alertCount}
                </a>
              )}
            </div>

            {/* Search */}
            <div className="mx-8 max-w-md flex-1">
              <button
                onClick={openSearch}
                className="border-[hsl(var(--input))] bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] flex h-9 w-full items-center justify-between rounded-lg border px-3 text-left text-sm transition hover:border-[hsl(var(--ring))]"
              >
                <span className="flex items-center gap-2">
                  <Search className="size-4 opacity-50" />
                  <span className="truncate">
                    Search pages, actors, or task types
                  </span>
                </span>
                <kbd className="border-[hsl(var(--border))] bg-[hsl(var(--card))] pointer-events-none hidden rounded border px-1.5 py-0.5 text-xs sm:inline-flex">
                  ⌘K
                </kbd>
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <button
                onClick={layout.toggleTheme}
                className="rounded-md p-2 hover:bg-[hsl(var(--accent))]"
                title={
                  layout.isDark
                    ? "Switch to light mode"
                    : "Switch to dark mode"
                }
              >
                {layout.isDark ? (
                  <Sun className="size-5" />
                ) : (
                  <Moon className="size-5" />
                )}
              </button>
              <button
                className="rounded-md p-2 hover:bg-[hsl(var(--accent))]"
                title="Settings"
              >
                <Settings className="size-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="relative">{children}</div>
      </main>
    </div>
  );
}
