import { Shield, CheckCircle2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ToolApprovalCardProps {
  toolName: string
  arguments: Record<string, unknown>
  status: "approval-requested" | "approval-responded" | "output-denied"
  approved?: boolean
  onApprove: () => void
  onReject: () => void
  className?: string
}

/**
 * Human-in-the-Loop approval card rendered inline in the chat stream.
 *
 * Shown when an agent tool has require_approval=True and the current user's
 * role is in the gated roles list. The user must explicitly approve or reject
 * before the tool executes. No extra LLM roundtrip occurs regardless of outcome.
 */
export function ToolApprovalCard({
  toolName,
  arguments: toolArgs,
  status,
  approved,
  onApprove,
  onReject,
  className,
}: ToolApprovalCardProps) {
  const isPending = status === "approval-requested"
  const isApproved = status === "approval-responded" && approved === true
  const isDenied = status === "output-denied" || (status === "approval-responded" && approved === false)

  return (
    <div
      className={cn(
        "my-3 rounded-xl border text-xs font-sans overflow-hidden",
        isPending && "border-amber-500/30 bg-amber-500/5",
        isApproved && "border-emerald-500/30 bg-emerald-500/5",
        isDenied && "border-red-500/20 bg-red-500/5",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-inherit">
        <Shield className={cn(
          "h-3.5 w-3.5 shrink-0",
          isPending && "text-amber-400",
          isApproved && "text-emerald-400",
          isDenied && "text-red-400",
        )} />
        <span className="font-semibold text-foreground">
          {isPending && "Approval Required"}
          {isApproved && "Approved"}
          {isDenied && "Rejected"}
        </span>
        <code className="ml-auto font-mono text-[10px] text-muted-foreground bg-black/20 px-2 py-0.5 rounded">
          {toolName}
        </code>
      </div>

      {/* Arguments Preview */}
      {Object.keys(toolArgs).length > 0 && (
        <div className="px-4 py-3 space-y-1.5">
          <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-2">
            Parameters
          </div>
          {Object.entries(toolArgs).map(([key, val]) => (
            <div key={key} className="flex items-start gap-3">
              <span className="text-muted-foreground shrink-0 w-28 truncate">{key}</span>
              <span className="font-mono text-foreground/90 break-all">
                {typeof val === "string" ? val : JSON.stringify(val)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Action Buttons — only shown while pending */}
      {isPending && (
        <div className="flex gap-2 px-4 py-3 border-t border-inherit bg-black/10">
          <Button
            size="sm"
            onClick={onApprove}
            className="h-8 flex-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white border-0"
          >
            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onReject}
            className="h-8 flex-1 text-xs font-semibold border-red-500/40 text-red-400 hover:bg-red-500/10 hover:text-red-300"
          >
            <XCircle className="h-3.5 w-3.5 mr-1.5" />
            Reject
          </Button>
        </div>
      )}

      {/* Outcome Receipt */}
      {(isApproved || isDenied) && (
        <div className={cn(
          "px-4 py-2.5 flex items-center gap-2 text-[11px] font-medium",
          isApproved && "text-emerald-400",
          isDenied && "text-red-400",
        )}>
          {isApproved ? (
            <><CheckCircle2 className="h-3.5 w-3.5" /> Action approved — executing tool...</>
          ) : (
            <><XCircle className="h-3.5 w-3.5" /> Action rejected — not executed.</>
          )}
        </div>
      )}
    </div>
  )
}
