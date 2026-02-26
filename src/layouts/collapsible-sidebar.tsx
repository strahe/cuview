import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { type NavigationEntry, navigationGroups } from "./navigation";

interface CollapsibleSidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export function CollapsibleSidebar({
  isCollapsed = false,
  onToggle,
}: CollapsibleSidebarProps) {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const isActive = (entry: NavigationEntry) => {
    if (entry.activePattern) {
      return new RegExp(entry.activePattern).test(currentPath);
    }
    return currentPath === entry.to || currentPath.startsWith(`${entry.to}/`);
  };

  return (
    <aside
      className={cn(
        "bg-sidebar border-r border-sidebar-border flex h-screen flex-col transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-sidebar-border px-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary text-primary-foreground grid size-8 shrink-0 place-items-center rounded-lg text-sm font-bold">
            C
          </div>
          {!isCollapsed && (
            <span className="text-sidebar-foreground text-lg font-semibold">
              Cuview
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2">
        {navigationGroups.map((group, groupIdx) => (
          <div key={group.title}>
            {groupIdx > 0 && (
              <div className="border-t border-sidebar-border my-2" />
            )}
            {!isCollapsed && (
              <div className="text-sidebar-foreground/0.5 px-3 pt-2 pb-1 text-xs font-semibold uppercase tracking-wider">
                {group.title}
              </div>
            )}
            <ul className="space-y-1">
              {group.entries.map((entry) => {
                const Icon = entry.icon;
                const active = isActive(entry);
                return (
                  <li key={entry.to}>
                    <Link
                      to={entry.to}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        isCollapsed && "justify-center px-2",
                      )}
                      title={isCollapsed ? entry.label : undefined}
                    >
                      <Icon className="size-5 shrink-0" />
                      {!isCollapsed && <span>{entry.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Collapse toggle */}
      {onToggle && (
        <div className="border-t border-sidebar-border p-2">
          <button
            onClick={onToggle}
            className="text-sidebar-foreground hover:bg-sidebar-accent flex w-full items-center justify-center rounded-md p-2 transition-colors"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="size-4" />
            ) : (
              <ChevronLeft className="size-4" />
            )}
          </button>
        </div>
      )}
    </aside>
  );
}
