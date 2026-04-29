import { Link, useRouterState } from "@tanstack/react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { type NavigationEntry, navigationGroups } from "./navigation";

export function CollapsibleSidebar() {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const { isMobile, setOpenMobile } = useSidebar();

  const isActive = (entry: NavigationEntry) => {
    if (entry.activePattern) {
      return new RegExp(entry.activePattern).test(currentPath);
    }
    return currentPath === entry.to || currentPath.startsWith(`${entry.to}/`);
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip="Cuview"
              render={
                <Link
                  to="/overview"
                  onClick={() => {
                    if (isMobile) setOpenMobile(false);
                  }}
                />
              }
            >
              <div className="grid aspect-square size-8 shrink-0 place-items-center rounded-lg bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground">
                C
              </div>
              <div className="grid min-w-0 flex-1 text-left leading-tight">
                <span className="truncate font-semibold">Cuview</span>
                <span className="truncate text-xs text-sidebar-foreground/70">
                  Operations
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {navigationGroups.map((group, groupIdx) => (
          <SidebarGroup key={group.title}>
            {groupIdx > 0 && <SidebarSeparator />}
            <SidebarGroupLabel className="pointer-events-none">
              {group.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.entries.map((entry) => {
                  const Icon = entry.icon;
                  const active = isActive(entry);
                  return (
                    <SidebarMenuItem key={entry.to}>
                      <SidebarMenuButton
                        isActive={active}
                        tooltip={entry.label}
                        render={
                          <Link
                            to={entry.to}
                            onClick={() => {
                              if (isMobile) setOpenMobile(false);
                            }}
                          />
                        }
                      >
                        <Icon />
                        <span>{entry.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
