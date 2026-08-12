import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Bot, Plus, Loader2, Sparkles, Trash2, ArrowRight } from "lucide-react"
import { useOrgStore } from "@/stores/org-store"
import { agentsApi, llmApi, type Agent, type LLMModel } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"

export function AgentsPage() {
  const { currentOrg } = useOrgStore()
  const [agents, setAgents] = useState<Agent[]>([])
  const [models, setModels] = useState<LLMModel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  
  // Form fields
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [systemPrompt, setSystemPrompt] = useState("")
  const [selectedModel, setSelectedModel] = useState("")
  const [temperature, setTemperature] = useState(0.7)
  const [error, setError] = useState("")

  const loadData = async () => {
    if (!currentOrg) return
    setIsLoading(true)
    setError("")
    try {
      const [agentsData, modelsData] = await Promise.all([
        agentsApi.list(currentOrg.id),
        llmApi.models()
      ])
      setAgents(agentsData.agents)
      setModels(modelsData)
      if (modelsData.length > 0) {
        setSelectedModel(modelsData[0].model_id)
      }
    } catch (err: any) {
      console.error("Failed to load agent/model data:", err)
      setError(err.message || "Failed to load agents configuration")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [currentOrg])

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentOrg) return
    if (!name.trim() || !systemPrompt.trim() || !selectedModel) {
      setError("Please fill out name, model, and system prompt.")
      return
    }

    setIsSubmitting(true)
    setError("")
    try {
      const newAgent = await agentsApi.create({
        name,
        description: description || undefined,
        system_prompt: systemPrompt,
        model_id: selectedModel,
        temperature,
        organization_id: currentOrg.id,
        tool_names: [], // default to no tools, tools can be attached inside agent-builder config
      })
      setAgents((prev) => [...prev, newAgent])
      setDialogOpen(false)
      // Reset form
      setName("")
      setDescription("")
      setSystemPrompt("")
      if (models.length > 0) setSelectedModel(models[0].model_id)
      setTemperature(0.7)
    } catch (err: any) {
      console.error("Failed to create agent:", err)
      setError(err.message || "Failed to create agent")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteAgent = async (id: number) => {
    if (!confirm("Are you sure you want to delete this agent? All chat histories will be lost.")) return
    try {
      await agentsApi.delete(id)
      setAgents((prev) => prev.filter((a) => a.id !== id))
    } catch (err: any) {
      console.error("Failed to delete agent:", err)
      alert(err.message || "Failed to delete agent")
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
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agent Builder</h1>
          <p className="mt-2 text-muted-foreground">
            Create and customize conversational intelligence agents scoped to {currentOrg?.name}.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Build Agent
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>New Conversational Agent</DialogTitle>
              <DialogDescription>
                Configure the LLM persona, model constraints, and behavior rules.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateAgent} className="space-y-4 py-2">
              {error && <div className="rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive">{error}</div>}
              
              <div className="grid gap-2">
                <Label htmlFor="name">Agent Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sales Helper" required />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Helps clients choose the right subscription model" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="model">LLM Model</Label>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger id="model">
                      <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map((m) => (
                        <SelectItem key={m.model_id} value={m.model_id}>
                          {m.display_name} ({m.provider})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label className="flex justify-between">
                    <span>Temperature</span>
                    <span className="font-mono text-xs">{temperature}</span>
                  </Label>
                  <div className="py-2.5">
                    <Slider value={[temperature]} onValueChange={(val) => setTemperature(val[0])} min={0.0} max={1.0} step={0.1} />
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="prompt">System Prompt / Instructions</Label>
                <Textarea
                  id="prompt"
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="You are an AI assistant specialized in... You must always..."
                  className="h-32 resize-none"
                  required
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  Assemble Agent
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {agents.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
            <Bot className="h-8 w-8" />
          </div>
          <CardTitle className="text-xl">Assemble your first agent</CardTitle>
          <CardDescription className="max-w-sm mt-2">
            Agents help automate tasks, answer client questions, and can call custom tools dynamically.
          </CardDescription>
          <Button onClick={() => setDialogOpen(true)} className="mt-6">
            <Plus className="mr-2 h-4 w-4" /> Build Agent
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <Card key={agent.id} className="flex flex-col justify-between overflow-hidden border border-sidebar-border hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <Bot className="h-4 w-4 text-primary" />
                      {agent.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 min-h-[2.5rem]">
                      {agent.description || "No description provided."}
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteAgent(agent.id)} className="text-muted-foreground hover:text-destructive h-8 w-8">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pb-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Model:</span>
                  <Badge variant="secondary" className="max-w-[160px] truncate">{agent.model_id.split("/").pop()}</Badge>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Temperature:</span>
                  <span className="font-mono">{agent.temperature}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Attached Tools:</span>
                  <span className="font-semibold">{(agent.tools || []).length}</span>
                </div>
              </CardContent>
              <CardFooter className="bg-sidebar p-3 border-t border-sidebar-border flex justify-end gap-2">
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link to={`/dashboard/agents/${agent.id}`}>
                    Configure & Sandbox
                    <ArrowRight className="ml-2 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
