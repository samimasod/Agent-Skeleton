import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import {
  Bot,
  Save,
  Loader2,
  ChevronLeft,
  Settings
} from "lucide-react"
import { agentsApi, llmApi, type Agent, type LLMModel, type AgentTool } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AgentChatView } from "@/components/agent-chat-view"

export function AgentBuilderPage() {
  const { id } = useParams<{ id: string }>()
  const agentId = parseInt(id || "", 10)

  // State configurations
  const [agent, setAgent] = useState<Agent | null>(null)
  const [models, setModels] = useState<LLMModel[]>([])
  const [availableTools, setAvailableTools] = useState<AgentTool[]>([])
  
  // Settings forms
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [systemPrompt, setSystemPrompt] = useState("")
  const [selectedModel, setSelectedModel] = useState("")
  const [summaryModelId, setSummaryModelId] = useState("openai/gpt-4o-mini")
  const [toolPruningTurns, setToolPruningTurns] = useState(3)
  const [summarizationThreshold, setSummarizationThreshold] = useState(10)
  const [temperature, setTemperature] = useState(0.7)
  const [selectedTools, setSelectedTools] = useState<string[]>([])
  
  // UI states
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [error, setError] = useState("")

  const loadAgentConfig = async () => {
    setIsLoading(true)
    setError("")
    try {
      const [agentData, modelsData, toolsData] = await Promise.all([
        agentsApi.get(agentId),
        llmApi.models(),
        agentsApi.listAvailableTools(),
      ])

      setAgent(agentData)
      setName(agentData.name)
      setDescription(agentData.description || "")
      setSystemPrompt(agentData.system_prompt)
      setSelectedModel(agentData.model_id)
      setSummaryModelId(agentData.summary_model_id || "openai/gpt-4o-mini")
      setToolPruningTurns(agentData.tool_pruning_turns ?? 3)
      setSummarizationThreshold(agentData.summarization_threshold ?? 10)
      setTemperature(agentData.temperature ?? 0.7)
      setSelectedTools((agentData.tools || []).map((t: AgentTool) => t.name))
      
      setModels(modelsData)
      setAvailableTools(toolsData)
    } catch (err: any) {
      console.error("Failed to load agent configuration:", err)
      setError(err.message || "Failed to load configuration")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadAgentConfig()
  }, [agentId])

  // Handle saving the agent setup
  const handleSaveSettings = async () => {
    setIsSaving(true)
    setSaveSuccess(false)
    setError("")
    try {
      const updated = await agentsApi.update(agentId, {
        name,
        description: description || undefined,
        system_prompt: systemPrompt,
        model_id: selectedModel,
        summary_model_id: summaryModelId,
        tool_pruning_turns: toolPruningTurns,
        summarization_threshold: summarizationThreshold,
        temperature,
        tool_names: selectedTools,
      })
      setAgent(updated)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || "Failed to save settings")
    } finally {
      setIsSaving(false)
    }
  }

  // Handle selecting tools
  const handleToolToggle = (toolName: string, checked: boolean) => {
    if (checked) {
      setSelectedTools((prev) => [...prev, toolName])
    } else {
      setSelectedTools((prev) => prev.filter((t) => t !== toolName))
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button asChild variant="outline" size="icon" className="h-8 w-8">
          <Link to="/dashboard/agents">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            {agent?.name}
          </h1>
          <p className="text-xs text-muted-foreground">ID: {agentId} • {agent?.model_id}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.3fr] h-[calc(100vh-140px)]">
        {/* LEFT COLUMN: SETTINGS */}
        <Card className="flex flex-col h-full overflow-hidden border border-sidebar-border">
          <CardHeader className="pb-3 border-b border-sidebar-border bg-sidebar/30">
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="h-4 w-4 text-muted-foreground" />
              Agent Settings
            </CardTitle>
            <CardDescription>Adjust model weights, persona prompt, and capabilities.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto space-y-4 py-4 scrollbar-thin">
            {error && <div className="rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive">{error}</div>}
            
            <div className="grid gap-2">
              <Label htmlFor="agent-name">Agent Name</Label>
              <Input id="agent-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="agent-desc">Description</Label>
              <Input id="agent-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="system-prompt">System Persona & Instructions</Label>
              <Textarea
                id="system-prompt"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="h-44 text-xs font-mono resize-none leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="llm-model">Execution LLM Model</Label>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger id="llm-model" className="text-xs">
                    <SelectValue placeholder="Select primary LLM model" />
                  </SelectTrigger>
                  <SelectContent>
                    {models.map((m) => (
                      <SelectItem key={m.model_id} value={m.model_id} className="text-xs font-mono">
                        {m.display_name || m.model_id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="summary-model">Summary Model</Label>
                <Select value={summaryModelId} onValueChange={setSummaryModelId}>
                  <SelectTrigger id="summary-model" className="text-xs">
                    <SelectValue placeholder="Select summary model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai/gpt-4o-mini" className="text-xs font-mono">
                      OpenAI GPT-4o Mini
                    </SelectItem>
                    <SelectItem value="google/gemini-2.0-flash-lite-001" className="text-xs font-mono">
                      Gemini 2.0 Flash Lite
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4 pt-2 border-t border-sidebar-border">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <Label>Temperature (Creativity): {temperature}</Label>
                  <span className="text-muted-foreground font-mono text-[10px]">0.0 = Precise | 1.0 = Creative</span>
                </div>
                <Slider
                  value={[temperature]}
                  min={0}
                  max={1}
                  step={0.05}
                  onValueChange={([v]) => setTemperature(v)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1">
                  <Label htmlFor="pruning-turns" className="text-xs">Tool Pruning Turns</Label>
                  <Input
                    id="pruning-turns"
                    type="number"
                    value={toolPruningTurns}
                    onChange={(e) => setToolPruningTurns(parseInt(e.target.value, 10) || 1)}
                    className="text-xs font-mono"
                  />
                  <p className="text-[10px] text-muted-foreground">Keep detailed tool outputs for last N turns.</p>
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="summarization-threshold" className="text-xs">Summarize Threshold</Label>
                  <Input
                    id="summarization-threshold"
                    type="number"
                    value={summarizationThreshold}
                    onChange={(e) => setSummarizationThreshold(parseInt(e.target.value, 10) || 5)}
                    className="text-xs font-mono"
                  />
                  <p className="text-[10px] text-muted-foreground">Trigger auto-summary after N history turns.</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-sidebar-border">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Attach Custom Capabilities (Tools)</Label>
              {availableTools.map((tool) => {
                const isSelected = selectedTools.includes(tool.name)
                return (
                  <div
                    key={tool.name}
                    className={`flex items-start space-x-3 p-2.5 rounded-lg border text-xs transition-colors ${
                      isSelected ? "border-primary/40 bg-primary/5" : "border-sidebar-border bg-sidebar/5"
                    }`}
                  >
                    <Checkbox
                      id={`tool-${tool.name}`}
                      checked={isSelected}
                      onCheckedChange={(ch) => handleToolToggle(tool.name, !!ch)}
                      className="mt-0.5"
                    />
                    <div className="grid gap-0.5 leading-none cursor-pointer" onClick={() => handleToolToggle(tool.name, !isSelected)}>
                      <label htmlFor={`tool-${tool.name}`} className="font-mono text-xs font-semibold cursor-pointer text-foreground">
                        {tool.name}
                      </label>
                      <p className="text-[11px] text-muted-foreground line-clamp-2">{tool.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
          <div className="p-3 border-t border-sidebar-border bg-sidebar/20 flex items-center justify-between">
            {saveSuccess ? (
              <span className="text-xs text-[var(--positive)] font-semibold flex items-center gap-1">
                ✓ Saved successfully
              </span>
            ) : <span />}
            <Button onClick={handleSaveSettings} disabled={isSaving} size="sm" className="ml-auto">
              {isSaving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}
              Save Configuration
            </Button>
          </div>
        </Card>

        {/* RIGHT COLUMN: REUSABLE AGENT CHAT VIEW */}
        <AgentChatView
          agentId={agentId}
          agentName={agent?.name}
          className="h-full border-sidebar-border"
        />
      </div>
    </div>
  )
}
