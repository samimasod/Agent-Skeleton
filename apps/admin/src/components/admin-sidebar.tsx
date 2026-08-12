import {
  LayoutDashboard,
  Users,
  TrendingUp,
  Share2,
  Server,
  Bot,
  Wrench,
  Building2,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react"
import { Button } from "@/components/ui/button"

export type AdminTabKey =
  | "overview"
  | "tenant-usage"
  | "users"
  | "marketing"
  | "social"
  | "cloud"
  | "agent"
  | "agent-builder"
  | "tools-workspace"
  | "governance"

interface AdminSidebarProps {
  activeTab: AdminTabKey
  onSelectTab: (tab: AdminTabKey) => void
  isCollapsed: boolean
  onToggleCollapse: () => void
  onLogout: () => void
  authEnabled: boolean
}

export function AdminSidebar({
  activeTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  onLogout,
  authEnabled,
}: AdminSidebarProps) {
  const menuItems = [
    { key: "overview" as AdminTabKey, label: "Overview", icon: LayoutDashboard },
    { key: "tenant-usage" as AdminTabKey, label: "Tenant & User Usage Analytics", icon: Building2 },
    { key: "agent-builder" as AdminTabKey, label: "Agent Builder & Playground", icon: Bot },
    { key: "tools-workspace" as AdminTabKey, label: "Tools & Sandbox Workspace", icon: Wrench },
    { key: "agent" as AdminTabKey, label: "Agent Performance Telemetry", icon: Bot },
    { key: "users" as AdminTabKey, label: "Users & Retention", icon: Users },
    { key: "marketing" as AdminTabKey, label: "Marketing & Leads", icon: TrendingUp },
    { key: "social" as AdminTabKey, label: "Social Media", icon: Share2 },
    { key: "cloud" as AdminTabKey, label: "Cloud Infrastructure", icon: Server },
    { key: "governance" as AdminTabKey, label: "Tenant Directory", icon: Building2 },
  ]

  return (
    <aside
      className={`relative flex flex-col border-r border-border bg-card/95 backdrop-blur-xl transition-all duration-300 z-40 select-none ${
        isCollapsed ? "w-16" : "w-60"
      }`}
    >
      {/* Brand Header */}
      <div className="flex h-14 items-center justify-between px-4 border-b border-border/50">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <img src="/logo.svg" alt="Logo" className="h-8 w-8 rounded-lg shrink-0 shadow-md" />
          {!isCollapsed && (
            <span className="font-extrabold text-sm tracking-tight text-foreground truncate">
              Skeleton Admin
            </span>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 space-y-1 p-2.5 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.key

          return (
            <button
              key={item.key}
              onClick={() => onSelectTab(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </button>
          )
        })}
      </nav>

      {/* Footer / Auth Info */}
      {authEnabled && (
        <div className="p-2.5 border-t border-border/50">
          <Button
            variant="outline"
            size="sm"
            onClick={onLogout}
            className={`w-full text-xs font-mono gap-2 text-muted-foreground hover:text-destructive ${
              isCollapsed ? "px-0 justify-center" : ""
            }`}
            title="Lock SuperAdmin Portal"
          >
            <LogOut className="h-3.5 w-3.5" />
            {!isCollapsed && "Lock Portal"}
          </Button>
        </div>
      )}
    </aside>
  )
}
