import { Link, Outlet, useLocation } from "react-router-dom"
import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

const labels: Record<string, { parent?: string; current: string }> = {
  "/dashboard": { current: "Command Center" },
  "/dashboard/admin": { parent: "Operations", current: "Super Admin" },
  "/dashboard/projects": { parent: "Build Your Application", current: "Workspaces" },
  "/dashboard/settings": { parent: "Build Your Application", current: "Settings" },
}

export function DashboardLayout() {
  const location = useLocation()
  const breadcrumb = location.pathname.startsWith("/dashboard/projects/")
    ? { parent: "Workspaces", current: "Project Detail" }
    : labels[location.pathname] || { parent: "Build Your Application", current: "Dashboard" }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-transparent md:bg-background">
        {/* <header className="flex h-16 shrink-0 items-center gap-2 border-b border-[var(--fog)] bg-[rgba(10,8,4,0.84)] transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumb.parent && (
                  <>
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink asChild>
                        <Link to="/dashboard">{breadcrumb.parent}</Link>
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:block" />
                  </>
                )}
                <BreadcrumbItem>
                  <BreadcrumbPage>{breadcrumb.current}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header> */}
        <SidebarHeader>
                  <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumb.parent && (
                  <>
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink asChild>
                        <Link to="/dashboard">{breadcrumb.parent}</Link>
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:block" />
                  </>
                )}
                <BreadcrumbItem>
                  <BreadcrumbPage>{breadcrumb.current}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>


        </SidebarHeader>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-4 md:p-6">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
