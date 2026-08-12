import { Link, useLocation } from "react-router-dom"
import { FolderKanban, LayoutDashboard, Settings, Bot } from "lucide-react"
import { useAuthStore } from "@/stores/auth-store"
import { useOrgStore } from "@/stores/org-store"
import { logout } from "@/lib/firebase"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

const navigation = [
  { title: "Command Center", url: "/dashboard", icon: LayoutDashboard },
  { title: "Workspaces", url: "/dashboard/projects", icon: FolderKanban },
  { title: "Agent Builder", url: "/dashboard/agents", icon: Bot },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation()
  const { user } = useAuthStore()
  const { currentOrg, reset: resetOrg } = useOrgStore()

  const handleLogout = async () => {
    await logout()
    resetOrg()
  }

  return (
    <Sidebar collapsible="icon" variant="inset" {...props}>
      <SidebarHeader className="border-b border-sidebar-border p-0">
        <div className="flex items-center gap-3 px-4 py-4">
          <img src="/logo.svg" alt="Logo" className="h-9 w-9 rounded-xl shadow-md shrink-0" />
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <div className="truncate font-medium text-sidebar-foreground">Skeleton</div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-sidebar-foreground/60">
              Platform skeleton
            </div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => {
                const isActive =
                  item.url === "/dashboard"
                    ? location.pathname === "/dashboard"
                    : location.pathname.startsWith(item.url)

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                      <Link to={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        {currentOrg && (
          <div className="px-2 pb-2 text-[11px] text-sidebar-foreground/55 group-data-[collapsible=icon]:hidden">
            {currentOrg.name}
          </div>
        )}
        <NavUser
          user={{
            name: user?.displayName || user?.email || "User",
            email: user?.email || "",
            avatar: user?.photoURL || "",
          }}
          onLogout={handleLogout}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
