import { useEffect, useRef, useState } from "react"
import {
  BrainIcon,
  CheckCircle,
  Search,
  Wrench,
  User,
  Bot,
  Play,
  Loader2,
  Plus,
  MessageSquare
} from "lucide-react"
import { agentsApi, type AgentSession } from "@/lib/api-client"
import { getIdToken } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ChainOfThought,
  ChainOfThoughtHeader,
  ChainOfThoughtContent,
  ChainOfThoughtStep,
} from "@/components/ai-elements/chain-of-thought"
import { GenerativeToolUi, toolDisplayLabels } from "@/components/ai-elements/tools"
import { ToolApprovalCard } from "@/components/ai-elements/tool-approval-card"
import { SpeechInput } from "@/components/ai-elements/speech-input"
import { MessageResponse } from "@/components/ai-elements/message"

function parseThinkingContent(content: string) {
  if (!content) return { thinking: null, body: "" }
  
  const thinkTagRegex = /<think>([\s\S]*?)<\/think>([\s\S]*)$/
  const matchTag = content.match(thinkTagRegex)
  if (matchTag) {
    return {
      thinking: matchTag[1].trim(),
      body: matchTag[2].trim()
    }
  }

  const thinkingMarkdownRegex = /^\*\(thinking:\s*([\s\S]*?)\)\*\s*\n*([\s\S]*)$/
  const matchMd = content.match(thinkingMarkdownRegex)
  if (matchMd) {
    return {
      thinking: matchMd[1].trim(),
      body: matchMd[2].trim()
    }
  }

  return { thinking: null, body: content }
}

export interface AgentChatViewProps {
  /** The ID of the agent to chat with */
  agentId: number
  /** Optional agent display name */
  agentName?: string
  /** Optional initial session ID. If omitted, the latest session or a new session is loaded. */
  initialSessionId?: string | null
  /** Optional custom class for the outer wrapper */
  className?: string
  /** Whether to display the session selector dropdown and "New Chat" button (default: true) */
  showSessionSelector?: boolean
  /** Whether to show a top header with the agent name & connection indicator (default: true) */
  showHeader?: boolean
  /** Callback fired whenever the active session ID changes */
  onSessionChange?: (sessionId: string) => void
}

/**
 * Reusable Agent Chat View component.
 *
 * Provides full stateful chat, streaming text deltas, Chain-of-Thought tool step rendering,
 * Human-in-the-Loop tool approval cards, client-side speech input, and session history management.
 *
 * Usage:
 * ```tsx
 * <AgentChatView agentId={42} agentName="Customer Support Agent" />
 * ```
 */
export function AgentChatView({
  agentId,
  agentName,
  initialSessionId,
  className = "",
  showSessionSelector = true,
  showHeader = true,
  onSessionChange,
}: AgentChatViewProps) {
  const [sessions, setSessions] = useState<AgentSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(initialSessionId || null)
  const [messages, setMessages] = useState<any[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [wsConnected, setWsConnected] = useState(false)
  const [isLoadingSessions, setIsLoadingSessions] = useState(false)

  // Streaming tool runs map: tool_call_id -> run metrics
  const [streamingTools, setStreamingTools] = useState<Record<string, {
    toolName: string
    arguments: Record<string, any>
    output?: string
    error?: string
    status: "running" | "approval-requested" | "approval-responded" | "output-denied" | "success" | "error"
    approved?: boolean
  }>>({})

  const wsRef = useRef<WebSocket | null>(null)
  const chatEndRef = useRef<HTMLDivElement | null>(null)

  // Message pagination states
  const [messagesPage, setMessagesPage] = useState(1)
  const [hasMoreMessages, setHasMoreMessages] = useState(false)
  const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false)

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, streamingTools])

  // Load available sessions for this agent
  useEffect(() => {
    let isMounted = true
    const loadSessions = async () => {
      setIsLoadingSessions(true)
      try {
        const sessionsData = await agentsApi.listSessions(agentId)
        if (!isMounted) return
        setSessions(sessionsData.sessions)

        if (!activeSessionId && sessionsData.sessions.length > 0) {
          const defaultSessId = sessionsData.sessions[0].id
          setActiveSessionId(defaultSessId)
          onSessionChange?.(defaultSessId)
        }
      } catch (err) {
        console.error("Failed to load agent sessions:", err)
      } finally {
        if (isMounted) setIsLoadingSessions(false)
      }
    }
    void loadSessions()
    return () => { isMounted = false }
  }, [agentId])

  // Load older messages for infinite scroll
  const handleLoadOlderMessages = async () => {
    if (!activeSessionId || !hasMoreMessages || isLoadingOlderMessages) return
    setIsLoadingOlderMessages(true)
    try {
      const nextPage = messagesPage + 1
      const thread = await agentsApi.getSessionMessages(activeSessionId, nextPage, 20)
      setMessages((prev) => [...(thread.messages || []), ...prev])
      setMessagesPage(nextPage)
      setHasMoreMessages(thread.has_more ?? false)
    } catch (err) {
      console.error("Failed to load older messages:", err)
    } finally {
      setIsLoadingOlderMessages(false)
    }
  }

  // Manage WebSocket connection lifecycle
  useEffect(() => {
    if (!activeSessionId) {
      setMessages([])
      setWsConnected(false)
      return
    }

    let active = true
    let ws: WebSocket | null = null

    const connectWs = async () => {
      try {
        const token = await getIdToken()
        if (!active) return

        // Fetch session history first
        try {
          const thread = await agentsApi.getSessionMessages(activeSessionId, 1, 20)
          if (!active) return
          setMessages(thread.messages || [])
          setMessagesPage(1)
          setHasMoreMessages(thread.has_more ?? false)
        } catch (historyErr) {
          console.log("No historical messages found for new session:", activeSessionId)
          if (!active) return
          setMessages([])
          setHasMoreMessages(false)
        }

        // Establish WS URL
        const API_URL = (import.meta as any).env?.VITE_API_URL || ""
        const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:"
        const wsHost = API_URL ? API_URL.replace(/^https?:\/\//, "") : window.location.host
        
        ws = new WebSocket(
          `${wsProtocol}//${wsHost}/api/agents/${agentId}/chat/ws?token=${token}&session_id=${activeSessionId}`
        )
        wsRef.current = ws

        ws.onopen = () => {
          if (active) setWsConnected(true)
        }

        ws.onclose = () => {
          if (active) setWsConnected(false)
        }

        ws.onerror = (e) => {
          console.error("Agent WS Error:", e)
        }

        ws.onmessage = (event) => {
          if (!active) return
          const payload = JSON.parse(event.data)

          switch (payload.type) {
            case "session_created":
              break
            case "text_delta":
              setMessages((prev) => {
                const list = [...prev]
                const last = list[list.length - 1]
                if (last && last.role === "assistant") {
                  list[list.length - 1] = {
                    ...last,
                    content: (last.content || "") + payload.text,
                  }
                  return list
                } else {
                  return [
                    ...prev,
                    {
                      id: Date.now(),
                      role: "assistant",
                      content: payload.text,
                      created_at: new Date().toISOString(),
                    },
                  ]
                }
              })
              break
            case "tool_started":
              setStreamingTools((prev) => ({
                ...prev,
                [payload.tool_call_id]: {
                  toolName: payload.tool_name,
                  arguments: payload.arguments,
                  status: "running",
                },
              }))
              break
            case "tool_approval_requested":
              setStreamingTools((prev) => ({
                ...prev,
                [payload.tool_call_id]: {
                  toolName: payload.tool_name,
                  arguments: payload.arguments,
                  status: "approval-requested",
                },
              }))
              break
            case "tool_denied":
              setStreamingTools((prev) => ({
                ...prev,
                [payload.tool_call_id]: {
                  ...(prev[payload.tool_call_id] || { toolName: payload.tool_name, arguments: {} }),
                  status: "output-denied",
                  approved: false,
                },
              }))
              break
            case "tool_completed":
              setStreamingTools((prev) => ({
                ...prev,
                [payload.tool_call_id]: {
                  ...prev[payload.tool_call_id],
                  output: payload.output,
                  error: payload.error || undefined,
                  status: payload.error ? "error" : "success",
                  approved: prev[payload.tool_call_id]?.status === "approval-responded" ? true : undefined,
                },
              }))
              setMessages((prev) => [
                ...prev,
                {
                  id: Date.now(),
                  role: "tool",
                  content: payload.output || payload.error,
                  tool_call_id: payload.tool_call_id,
                  name: payload.tool_name,
                  created_at: new Date().toISOString(),
                }
              ])
              break
            case "message_completed":
              setStreamingTools({})
              break
            case "error":
              setMessages((prev) => [
                ...prev,
                {
                  id: Date.now(),
                  role: "system",
                  content: `Error: ${payload.message}`,
                  created_at: new Date().toISOString(),
                }
              ])
              setStreamingTools({})
              break
          }
        }
      } catch (err) {
        console.error("Failed to connect agent websocket:", err)
      }
    }

    void connectWs()

    return () => {
      active = false
      if (ws) ws.close()
    }
  }, [activeSessionId, agentId])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputMessage.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return

    const userText = inputMessage
    setInputMessage("")

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        role: "user",
        content: userText,
        created_at: new Date().toISOString(),
      }
    ])

    wsRef.current.send(JSON.stringify({
      type: "message",
      content: userText,
    }))
  }

  const sendApproval = (toolCallId: string, approved: boolean) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return
    setStreamingTools((prev) => ({
      ...prev,
      [toolCallId]: {
        ...prev[toolCallId],
        status: approved ? "approval-responded" : "output-denied",
        approved,
      },
    }))
    wsRef.current.send(JSON.stringify({
      type: "tool_approval",
      tool_call_id: toolCallId,
      approved,
    }))
  }

  const handleCreateNewSession = async () => {
    const newId = `sess_${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`
    
    const newSessionObj: AgentSession = {
      id: newId,
      agent_id: agentId,
      user_uid: "",
      created_at: new Date().toISOString(),
      agent_name: agentName || "Agent",
    }
    
    setSessions((prev) => [newSessionObj, ...prev])
    setActiveSessionId(newId)
    onSessionChange?.(newId)
  }

  return (
    <div className={`flex flex-col border border-sidebar-border rounded-xl bg-background overflow-hidden ${className}`}>
      {/* Top Header */}
      {showHeader && (
        <div className="border-b border-sidebar-border bg-sidebar/10 px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
              <BrainIcon className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm leading-none flex items-center gap-2">
                {agentName || `Agent #${agentId}`}
                <span className={`h-2 w-2 rounded-full ${wsConnected ? "bg-[var(--positive)] animate-pulse" : "bg-muted"}`} />
              </h3>
              <span className="text-[10px] text-muted-foreground">
                {wsConnected ? "Real-time streaming connected" : "Connecting session..."}
              </span>
            </div>
          </div>

          {/* Session Selector */}
          {showSessionSelector && (
            <div className="flex items-center gap-2">
              <Select
                value={activeSessionId || ""}
                onValueChange={(val) => {
                  setActiveSessionId(val)
                  onSessionChange?.(val)
                }}
                disabled={isLoadingSessions}
              >
                <SelectTrigger className="h-8 text-xs font-mono w-48">
                  <MessageSquare className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                  <SelectValue placeholder="Choose Session" />
                </SelectTrigger>
                <SelectContent>
                  {sessions.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="font-mono text-xs">
                      {s.id.length > 20 ? `${s.id.substring(0, 18)}...` : s.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline" onClick={handleCreateNewSession} className="h-8 text-xs gap-1">
                <Plus className="h-3.5 w-3.5" /> New Session
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[350px]">
        {hasMoreMessages && (
          <div className="flex justify-center pt-1 pb-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadOlderMessages}
              disabled={isLoadingOlderMessages}
              className="text-xs h-7"
            >
              {isLoadingOlderMessages ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
              Load Previous History
            </Button>
          </div>
        )}

        {messages.length === 0 && Object.keys(streamingTools).length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center opacity-60">
            <Bot className="h-10 w-10 text-muted-foreground mb-2 stroke-1" />
            <p className="text-sm font-medium">Session initialized</p>
            <p className="text-xs text-muted-foreground max-w-sm mt-1">
              Send a text query or use speech input to chat with the agent in real time.
            </p>
          </div>
        ) : (
          messages.map((m, idx) => {
            if (m.role === "tool") {
              if (!m.content) return null
              return (
                <div key={m.id || idx} className="flex gap-3 text-sm my-1 pl-10">
                  <GenerativeToolUi name={m.name || "tool"} content={m.content} />
                </div>
              )
            }
            const isUser = m.role === "user"

            if (m.role === "assistant") {
              const { thinking, body } = parseThinkingContent(m.content || "")
              return (
                <div key={m.id || idx} className="flex gap-3 text-sm">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-sidebar-border bg-sidebar/20 text-primary mt-0.5">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="flex-1 space-y-2 max-w-[88%]">
                    {thinking && (
                      <ChainOfThought defaultOpen={false} className="border border-sidebar-border rounded-xl bg-sidebar/5 p-3">
                        <ChainOfThoughtHeader className="text-xs font-semibold text-muted-foreground">
                          Reasoning Process
                        </ChainOfThoughtHeader>
                        <ChainOfThoughtContent className="text-xs text-muted-foreground/90 leading-relaxed font-mono whitespace-pre-wrap pt-2 select-text">
                          {thinking}
                        </ChainOfThoughtContent>
                      </ChainOfThought>
                    )}
                    {body && (
                      <div className="rounded-xl border border-sidebar-border bg-sidebar/5 p-3.5 text-foreground leading-relaxed select-text overflow-hidden">
                        <MessageResponse>{body}</MessageResponse>
                      </div>
                    )}
                  </div>
                </div>
              )
            }

            return (
              <div key={m.id || idx} className={`flex gap-3 text-sm ${isUser ? "justify-end" : ""}`}>
                {!isUser && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-sidebar-border bg-sidebar/20 text-primary mt-0.5">
                    <Bot className="h-4 w-4" />
                  </div>
                )}
                <div className={`rounded-xl p-3 max-w-[85%] select-text ${
                  isUser
                    ? "bg-primary text-primary-foreground font-medium"
                    : "border border-sidebar-border bg-sidebar/5 text-foreground"
                }`}>
                  {m.content}
                </div>
                {isUser && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-sidebar-border bg-primary/20 text-primary mt-0.5">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            )
          })
        )}

        {/* ACTIVE STREAMING tool calls in ChainOfThought */}
        {Object.keys(streamingTools).length > 0 && (
          <div className="w-full max-w-[85%] my-2">
            <ChainOfThought defaultOpen={true} className="border border-sidebar-border rounded-xl bg-sidebar/5 p-3">
              <ChainOfThoughtHeader className="text-xs font-semibold text-foreground">
                Active Execution Steps
              </ChainOfThoughtHeader>
              <ChainOfThoughtContent>
                {Object.entries(streamingTools).map(([id, t]) => {
                  const labels = toolDisplayLabels[t.toolName] || {
                    running: `Running Tool: ${t.toolName}`,
                    completed: `Executed Tool: ${t.toolName}`
                  }
                  const isDone = t.status === "success"
                  const isErr = t.status === "error"

                  return (
                    <ChainOfThoughtStep
                      key={id}
                      icon={isDone ? CheckCircle : isErr ? Wrench : Search}
                      label={
                        <span className={`font-semibold text-xs ${isErr ? "text-destructive" : "text-foreground"}`}>
                          {isDone ? labels.completed : isErr ? `Failed: ${t.toolName}` : labels.running}
                        </span>
                      }
                      status={isDone ? "complete" : isErr ? "pending" : "active"}
                    >
                      <div className="mt-1 space-y-1 text-xs text-muted-foreground">
                        {Object.entries(t.arguments).map(([key, val]) => (
                          <div key={key} className="flex gap-1.5">
                            <span className="font-semibold text-foreground capitalize">{key}:</span>
                            <span>{typeof val === "object" ? JSON.stringify(val) : String(val)}</span>
                          </div>
                        ))}
                      </div>
                      {t.output && (
                        <div className="mt-3">
                          <GenerativeToolUi name={t.toolName} content={t.output} />
                        </div>
                      )}
                      {t.error && (
                        <div className="mt-2 p-2 border border-destructive/20 bg-destructive/10 rounded-md text-[11px] font-mono text-destructive w-full">
                          Error: {t.error}
                        </div>
                      )}
                    </ChainOfThoughtStep>
                  )
                })}
              </ChainOfThoughtContent>
            </ChainOfThought>

            {/* Standalone Inline Generative UI Cards */}
            {Object.entries(streamingTools)
              .filter(([, t]) => Boolean(t.output))
              .map(([id, t]) => (
                <div key={`inline-${id}`} className="mt-3">
                  <GenerativeToolUi name={t.toolName} content={t.output!} />
                </div>
              ))
            }
          </div>
        )}

        {/* Approval Gate Cards */}
        {Object.entries(streamingTools)
          .filter(([, t]) => t.status === "approval-requested" || t.status === "approval-responded" || t.status === "output-denied")
          .map(([id, t]) => (
            <div key={`approval-${id}`} className="w-full max-w-[85%]">
              <ToolApprovalCard
                toolName={t.toolName}
                arguments={t.arguments}
                status={t.status as "approval-requested" | "approval-responded" | "output-denied"}
                approved={t.approved}
                onApprove={() => sendApproval(id, true)}
                onReject={() => sendApproval(id, false)}
              />
            </div>
          ))
        }

        <div ref={chatEndRef} />
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSendMessage} className="p-3 border-t border-sidebar-border bg-sidebar/10 flex gap-2">
        <Input
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder={wsConnected ? "Write a query or speak..." : "Connecting to session..."}
          disabled={!wsConnected}
          className="flex-1"
        />
        <SpeechInput
          type="button"
          onTranscriptionChange={(text) =>
            setInputMessage((prev) => (prev ? `${prev} ${text}` : text))
          }
          disabled={!wsConnected}
          size="icon"
          variant="outline"
        />
        <Button type="submit" size="icon" disabled={!wsConnected || !inputMessage.trim()}>
          <Play className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}
