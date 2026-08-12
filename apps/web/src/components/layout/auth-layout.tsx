import { ReactNode } from "react"
import { Bot, ShieldCheck, Zap } from "lucide-react"

interface AuthLayoutProps {
  children: ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground flex items-center justify-center">
      {/* Dynamic Background Mesh */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))]" />
      <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute -right-20 -bottom-20 h-96 w-96 rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-12">
        <div className="grid w-full gap-12 lg:grid-cols-[1.1fr_0.9fr] items-center">
          
          {/* Left Brand Panel */}
          <div className="hidden lg:flex flex-col justify-between p-10 rounded-2xl border border-border/80 bg-card/60 backdrop-blur-xl shadow-2xl space-y-8">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-3 border border-border/80 bg-card/80 px-4 py-2 text-sm font-semibold text-foreground rounded-xl shadow-sm">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-base shadow-md">
                  S
                </span>
                <span className="tracking-tight">Skeleton Platform</span>
              </div>

              <div className="space-y-3">
                <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary font-bold">
                  Multi-Tenant SaaS & AI Infrastructure
                </span>
                <h1 className="text-4xl font-extrabold tracking-tight leading-[1.1] text-foreground">
                  Production-grade AI agent runtime & SaaS foundation.
                </h1>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Assemble custom conversational agents with sandboxed Python execution, real-time WebSocket streaming, RBAC tenant isolation, and automated usage monitoring.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3 pt-2">
              <div className="border border-border/60 bg-muted/20 p-4 rounded-xl space-y-1 hover:border-primary/40 transition-colors">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                  <Bot className="h-3.5 w-3.5" /> AI Engine
                </div>
                <div className="text-base font-bold text-foreground">Agent Runtime</div>
                <p className="text-[11px] text-muted-foreground">Sandboxed Tools</p>
              </div>

              <div className="border border-border/60 bg-muted/20 p-4 rounded-xl space-y-1 hover:border-primary/40 transition-colors">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                  <ShieldCheck className="h-3.5 w-3.5" /> Security
                </div>
                <div className="text-base font-bold text-foreground">Tenant RBAC</div>
                <p className="text-[11px] text-muted-foreground">Strict Isolation</p>
              </div>

              <div className="border border-border/60 bg-muted/20 p-4 rounded-xl space-y-1 hover:border-primary/40 transition-colors">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                  <Zap className="h-3.5 w-3.5" /> Telemetry
                </div>
                <div className="text-base font-bold text-foreground">Usage Quotas</div>
                <p className="text-[11px] text-muted-foreground">Token Analytics</p>
              </div>
            </div>
          </div>

          {/* Right Auth Card Form */}
          <div className="flex items-center justify-center w-full">
            <div className="w-full max-w-md">{children}</div>
          </div>

        </div>
      </div>
    </div>
  )
}
