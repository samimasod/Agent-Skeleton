import { useState } from "react"
import { Link } from "react-router-dom"
import { AgentChatView } from "@/components/agent-chat-view"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sparkles, ArrowRight, Zap } from "lucide-react"

export function PublicDemoPage() {
  const [promptsUsed] = useState(0)
  const maxFreePrompts = 5

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Header */}
      <header className="border-b border-border/40 bg-card/60 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold flex items-center gap-2">
              Public AI Playground <Badge variant="secondary" className="text-[10px]">Unauthenticated Demo</Badge>
            </h1>
            <p className="text-xs text-muted-foreground">Test the agent runtime, stateful WebSocket streaming, and generative tool rendering.</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-lg border border-border/40 font-mono">
            <Zap className="h-3.5 w-3.5 text-primary" /> Free Demo Quota: {promptsUsed}/{maxFreePrompts} Prompts
          </div>
          <Link to="/signup">
            <Button size="sm" className="gap-2 font-semibold">
              Create Free Account <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Chat Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 flex flex-col">
        <div className="flex-1 bg-card/40 border border-border/60 rounded-2xl overflow-hidden shadow-xl flex flex-col">
          <AgentChatView agentId={1} />
        </div>
      </main>
    </div>
  )
}
