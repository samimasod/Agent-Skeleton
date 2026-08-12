import { getIdToken } from "@/lib/firebase"

export interface AgentWsCallbacks {
  onSessionCreated?: (sessionId: string, history: any[]) => void
  onTextDelta?: (text: string) => void
  onToolStarted?: (toolCallId: string, toolName: string, args: Record<string, any>) => void
  onToolCompleted?: (toolCallId: string, toolName: string, output: string, error?: string) => void
  onMessageCompleted?: () => void
  onError?: (message: string) => void
  onClose?: () => void
  onOpen?: () => void
}

export class AgentChatWebSocket {
  private ws: WebSocket | null = null
  private active = true

  constructor(
    private agentId: number,
    private callbacks: AgentWsCallbacks,
    private sessionId?: string
  ) {}

  async connect() {
    this.active = true
    try {
      const token = await getIdToken()
      if (!this.active) return

      const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000"
      const wsProtocol = API_URL.startsWith("https:") ? "wss:" : "ws:"
      const wsHost = API_URL.replace(/^https?:\/\//, "")
      
      const queryParams = `token=${token}${this.sessionId ? `&session_id=${this.sessionId}` : ""}`
      const wsUrl = `${wsProtocol}//${wsHost}/api/agents/${this.agentId}/chat/ws?${queryParams}`

      this.ws = new WebSocket(wsUrl)

      this.ws.onopen = () => {
        if (this.active && this.callbacks.onOpen) this.callbacks.onOpen()
      }

      this.ws.onclose = () => {
        if (this.active && this.callbacks.onClose) this.callbacks.onClose()
      }

      this.ws.onerror = (e) => {
        console.error("Mobile Agent WS Error:", e)
        if (this.active && this.callbacks.onError) {
          this.callbacks.onError("WebSocket connection error occurred.")
        }
      }

      this.ws.onmessage = (event) => {
        if (!this.active) return
        try {
          const payload = JSON.parse(event.data)
          switch (payload.type) {
            case "session_created":
              if (this.callbacks.onSessionCreated) {
                this.callbacks.onSessionCreated(payload.session_id, payload.history)
              }
              break
            case "text_delta":
              if (this.callbacks.onTextDelta) {
                this.callbacks.onTextDelta(payload.text)
              }
              break
            case "tool_started":
              if (this.callbacks.onToolStarted) {
                this.callbacks.onToolStarted(payload.tool_call_id, payload.tool_name, payload.arguments)
              }
              break
            case "tool_completed":
              if (this.callbacks.onToolCompleted) {
                this.callbacks.onToolCompleted(payload.tool_call_id, payload.tool_name, payload.output, payload.error || undefined)
              }
              break
            case "message_completed":
              if (this.callbacks.onMessageCompleted) {
                this.callbacks.onMessageCompleted()
              }
              break
            case "error":
              if (this.callbacks.onError) {
                this.callbacks.onError(payload.message)
              }
              break
          }
        } catch (err) {
          console.error("Mobile Agent WS parse error:", err)
        }
      }
    } catch (err: any) {
      console.error("Failed to construct Mobile Agent WS connection:", err)
      if (this.active && this.callbacks.onError) {
        this.callbacks.onError(err.message || "Failed to establish chat session.")
      }
    }
  }

  sendMessage(content: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: "message",
          content,
        })
      )
      return true
    }
    return false
  }

  disconnect() {
    this.active = false
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }
}
