import { useState } from "react"
import { Link } from "react-router-dom"
import {
  Cloud, Database, Shield, Bot, Sparkles, Cpu, Layers, Zap, Terminal,
  CheckCircle2, FolderKanban, Globe, HardDrive, RefreshCw,
  FileCode, Lock, Server, Layers3, Activity, Code2, Settings
} from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { useOrgStore } from "@/stores/org-store"

export function DashboardHome() {
  const { currentOrg } = useOrgStore()
  const [activeTab, setActiveTab] = useState("architecture")

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-card via-card/80 to-background p-8 shadow-2xl">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
        
        <div className="relative z-10 max-w-4xl space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary text-xs font-mono py-1 px-3">
              <Sparkles className="mr-1.5 h-3.5 w-3.5 inline text-primary" />
              PRODUCTION-GRADE SAAS & AI SKELETON
            </Badge>
            <Badge variant="secondary" className="text-xs font-mono">
              v1.0.0 Multi-Cloud Ready
            </Badge>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-[1.08]">
            Multi-Tenant Platform Skeleton <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-cyan-400 to-violet-400">
              Cloud-Agnostic, Type-Safe & AI-Powered
            </span>
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-3xl">
            A production-ready foundation designed to rapidly build high-performance multi-tenant SaaS applications and AI products. Features built-in tenant data isolation, multi-cloud database & storage connectivity (GCP, AWS, Local), real-time WebSocket AI Agent orchestration, and automated end-to-end type safety.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/25 gap-2">
              <Link to="/dashboard/agents">
                <Bot className="h-5 w-5" />
                Launch Agent Builder
              </Link>
            </Button>
            
            <Button asChild variant="outline" size="lg" className="gap-2 border-border/80 hover:bg-muted font-medium">
              <Link to="/dashboard/projects">
                <FolderKanban className="h-5 w-5 text-primary" />
                Manage Workspaces
              </Link>
            </Button>

            <Button asChild variant="ghost" size="lg" className="gap-2 text-muted-foreground hover:text-foreground">
              <Link to="/dashboard/settings">
                <Settings className="h-4 w-4" />
                Settings & Usage
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* System Status & Infrastructure Metrics */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={Cloud}
          label="Infrastructure Provider"
          value="Multi-Cloud"
          hint="GCP Cloud SQL, AWS RDS/Aurora, or Local PostgreSQL"
          statusColor="emerald"
        />
        <MetricCard
          icon={HardDrive}
          label="Object Storage Driver"
          value="Abstracted"
          hint="GCS, AWS S3, or Local Disk storage abstraction"
          statusColor="cyan"
        />
        <MetricCard
          icon={Cpu}
          label="AI Agent Subsystem"
          value="OpenRouter / OpenAI"
          hint="Real-time WebSocket streaming & python tool execution"
          statusColor="violet"
        />
        <MetricCard
          icon={Shield}
          label="Tenant Security & RBAC"
          value="Enforced"
          hint={`Org: ${currentOrg?.name || "Active"} · Firebase Auth + Organization RBAC`}
          statusColor="amber"
        />
      </section>

      {/* Interactive Platform Capabilities Showcase */}
      <Card className="border-border shadow-xl">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <Layers className="h-6 w-6 text-primary" />
                Platform Architecture & Capabilities
              </CardTitle>
              <CardDescription className="mt-1 text-sm">
                Explore the built-in services, cloud adapters, and developer conventions included in this skeleton.
              </CardDescription>
            </div>

            <Badge variant="outline" className="w-fit font-mono text-xs border-emerald-500/40 text-emerald-400 bg-emerald-500/10">
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
              0 Type & Build Errors
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto p-1 bg-muted/50 rounded-xl">
              <TabsTrigger value="architecture" className="text-xs py-2.5 gap-2">
                <Server className="h-4 w-4" />
                Multi-Cloud Architecture
              </TabsTrigger>
              <TabsTrigger value="crud" className="text-xs py-2.5 gap-2">
                <Code2 className="h-4 w-4" />
                8-Step CRUD Pattern
              </TabsTrigger>
              <TabsTrigger value="ai" className="text-xs py-2.5 gap-2">
                <Bot className="h-4 w-4" />
                AI Agent Subsystem
              </TabsTrigger>
              <TabsTrigger value="pagination" className="text-xs py-2.5 gap-2">
                <Layers3 className="h-4 w-4" />
                Centralized Pagination
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: Multi-Cloud */}
            <TabsContent value="architecture" className="pt-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <FeatureCard
                  icon={Database}
                  title="Database Provider Agnostic"
                  description="Powered by Async PostgreSQL (SQLAlchemy 2.0 + asyncpg). Seamlessly connects to GCP Cloud SQL, AWS RDS/Aurora, Supabase, Neon, or local PostgreSQL with Alembic DDL migrations."
                  tag="DATABASE_URL"
                />
                <FeatureCard
                  icon={HardDrive}
                  title="Multi-Backend Storage"
                  description="Configurable object storage abstraction via STORAGE_PROVIDER. Supports Google Cloud Storage (GCS), Amazon AWS S3, or local disk storage with zero code changes."
                  tag="STORAGE_PROVIDER"
                />
                <FeatureCard
                  icon={Lock}
                  title="Tenant Isolation & RBAC"
                  description="Strict multi-tenant security with organization_id foreign keys (ondelete CASCADE) on every domain model, Firebase ID token verification, and role-based permissions (Owner, Admin, Member, Viewer)."
                  tag="RBAC"
                />
              </div>
            </TabsContent>

            {/* Tab 2: 8-Step CRUD Pattern */}
            <TabsContent value="crud" className="pt-6 space-y-4">
              <div className="rounded-xl border border-border/80 bg-muted/20 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                    <Terminal className="h-5 w-5 text-primary" />
                    Standardized 8-Step Module Architecture (`apps/api/modules/[module_name]/`)
                  </h3>
                  <Badge variant="secondary" className="font-mono text-xs">Standard Pattern</Badge>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs font-mono">
                  <StepBadge step="1" title="models.py" desc="SQLAlchemy 2.0 with organization_id FK" />
                  <StepBadge step="2" title="schemas.py" desc="Pydantic V2 validation (Create/Update/List)" />
                  <StepBadge step="3" title="repository.py" desc="AsyncSession SQL queries with pagination" />
                  <StepBadge step="4" title="service.py" desc="Business logic & permission checks" />
                  <StepBadge step="5" title="router.py" desc="FastAPI routes & PaginationParams" />
                  <StepBadge step="6" title="main.py" desc="Register FastAPI app router" />
                  <StepBadge step="7" title="env.py" desc="Register in Alembic & upgrade head" />
                  <StepBadge step="8" title="pnpm typegen" desc="Sync shared TypeScript interfaces" />
                </div>
              </div>
            </TabsContent>

            {/* Tab 3: AI Agent Subsystem */}
            <TabsContent value="ai" className="pt-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <FeatureCard
                  icon={Bot}
                  title="Multi-LLM Integration"
                  description="Supports OpenRouter (Gemini 3.1, Claude 3.5, Llama) or direct OpenAI integration (GPT-4o). Easily customizable system prompts, temperature, and models per agent."
                  tag="LLM_PROVIDER"
                />
                <FeatureCard
                  icon={Zap}
                  title="WebSocket Streaming Chat"
                  description="Real-time stateful chat engine (/api/agents/{id}/chat/ws) streaming text_delta, tool_started, and tool_completed events directly to Web and Mobile clients."
                  tag="WebSocket"
                />
                <FeatureCard
                  icon={FileCode}
                  title="Python Tool Sandbox & Fallbacks"
                  description="Execute custom sandboxed Python scripts with ui_mode placement (inline, collapsible, both) and a 3-Level Automatic Fallback Renderer (Cards, Grids, Monospaced Blocks)."
                  tag="Sandboxed Python"
                />
              </div>
            </TabsContent>

            {/* Tab 4: Centralized Pagination */}
            <TabsContent value="pagination" className="pt-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <FeatureCard
                  icon={Server}
                  title="FastAPI PaginationParams"
                  description="Centralized backend dependency (PaginationParams) and response builder (build_paginated_response) calculating total_pages, offset, limit, and has_more."
                  tag="apps/api/core/pagination.py"
                />
                <FeatureCard
                  icon={Globe}
                  title="Web usePagination Hook"
                  description="Client-side React hook (@/hooks/use-pagination) managing active pages, total counts, reactive page navigation, and query invalidation."
                  tag="apps/web/src/hooks"
                />
                <FeatureCard
                  icon={Activity}
                  title="Mobile Infinite Scroll"
                  description="React Native hook (@/hooks/use-paginated-list) with FlatList infinite scrolling (handleEndReached), pull-to-refresh, and smooth loading state toggles."
                  tag="apps/mobile/hooks"
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Developer Blueprint & Guidance Accordion */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <FileCode className="h-5 w-5 text-primary" />
            Developer Extension Blueprint
          </CardTitle>
          <CardDescription>
            Follow these conventions to extend this skeleton with new features, database tables, or AI agents.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="migrations">
              <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                <span className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-primary" />
                  How to create and run database migrations (Alembic)
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-xs text-muted-foreground leading-relaxed space-y-2 pt-2">
                <p>1. Register your model in <code>apps/api/migrations/env.py</code>.</p>
                <p>2. Generate revision: <code>.venv/bin/python -m alembic -c apps/api/migrations/alembic.ini revision --autogenerate -m "add_table"</code></p>
                <p>3. Apply DDL migration: <code>.venv/bin/python -m alembic -c apps/api/migrations/alembic.ini upgrade head</code></p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="typegen">
              <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                <span className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-cyan-400" />
                  How to synchronize TypeScript types across Web & Mobile
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-xs text-muted-foreground leading-relaxed space-y-2 pt-2">
                <p>After creating or modifying FastAPI Pydantic schemas, run from root:</p>
                <code className="block bg-muted p-2 rounded text-foreground font-mono">pnpm typegen && pnpm typecheck</code>
                <p>This automatically syncs TypeScript definitions in <code>packages/shared-types</code> for both Web and Mobile apps.</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="agents">
              <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                <span className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-violet-400" />
                  How to build conversational AI agents and register tools
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-xs text-muted-foreground leading-relaxed space-y-2 pt-2">
                <p>1. Navigate to <strong>Agent Builder</strong> (<code>/dashboard/agents</code>) to configure system prompts and select LLM profiles.</p>
                <p>2. Super Admins can register Python tool scripts in the SuperAdmin portal (port 3001).</p>
                <p>3. Attach tools to agents with UI placement modes (<code>inline</code>, <code>collapsible</code>, or <code>both</code>).</p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
  hint,
  statusColor = "primary",
}: {
  icon: any
  label: string
  value: string
  hint: string
  statusColor?: string
}) {
  const colorMap: Record<string, string> = {
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    cyan: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    violet: "text-violet-400 bg-violet-500/10 border-violet-500/20",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  }

  return (
    <Card className="relative overflow-hidden border-border transition-all hover:border-primary/50 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
          <div className={`p-2 rounded-lg border ${colorMap[statusColor] || "text-primary bg-primary/10 border-primary/20"}`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-xl font-bold text-foreground">{value}</div>
        <p className="mt-1 text-xs text-muted-foreground leading-normal">{hint}</p>
      </CardContent>
    </Card>
  )
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  tag,
}: {
  icon: any
  title: string
  description: string
  tag: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-3 transition-all hover:border-primary/50 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <Badge variant="outline" className="font-mono text-[10px] text-muted-foreground">
          {tag}
        </Badge>
      </div>
      <h4 className="font-bold text-sm text-foreground">{title}</h4>
      <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
    </div>
  )
}

function StepBadge({ step, title, desc }: { step: string; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-2 p-2.5 rounded-lg border border-border/60 bg-background/50">
      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">
        {step}
      </div>
      <div className="min-w-0">
        <div className="font-bold text-foreground truncate">{title}</div>
        <div className="text-[10px] text-muted-foreground truncate">{desc}</div>
      </div>
    </div>
  )
}
