import { useEffect, useState } from "react"
import { usePagination } from "@/hooks/use-pagination"
import {
  Wrench,
  Loader2,
  Play,
  Terminal,
  Clock,
  User,
  Activity,
  CheckCircle,
  XCircle,
  Code,
  Trash2,
  Sparkles,
  Edit3,
  Shield
} from "lucide-react"
import { adminToolsApi, type AgentToolDetail, type AgentToolRun } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export function AdminToolsPage() {
  const [tools, setTools] = useState<AgentToolDetail[]>([])
  const [runs, setRuns] = useState<AgentToolRun[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Form states
  const [editingName, setEditingName] = useState<string | null>(null) // null means creating
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [paramSchema, setParamSchema] = useState(JSON.stringify({
    type: "object",
    properties: {
      city: { type: "string" }
    },
    required: ["city"]
  }, null, 2))
  const [code, setCode] = useState(`def run(city: str):\n    return f"Hello, the weather in {city} is sunny."\n`)
  const [isActive, setIsActive] = useState(true)
  const [requireApproval, setRequireApproval] = useState(false)
  const [approvalRequiredForRoles, setApprovalRequiredForRoles] = useState<string[]>([])

  const AVAILABLE_ROLES = ["owner", "admin", "member", "viewer"]

  const toggleApprovalRole = (role: string) => {
    setApprovalRequiredForRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    )
  }

  // Testing Sandbox states
  const [testingTool, setTestingTool] = useState<AgentToolDetail | null>(null)
  const [testArguments, setTestArguments] = useState(JSON.stringify({ city: "London" }, null, 2))
  const [testResult, setTestResult] = useState<{
    success: boolean
    output: string | null
    error: string | null
    duration_ms: number
  } | null>(null)
  const [isTesting, setIsTesting] = useState(false)

  // Pagination hook
  const {
    page,
    pageSize,
    total: totalTools,
    totalPages,
    updatePagination,
    prevPage,
    nextPage,
  } = usePagination({ initialPageSize: 10 })

  const loadAllData = async (targetPage = page) => {
    setIsLoading(true)
    setError("")
    try {
      const [toolsData, runsData] = await Promise.all([
        adminToolsApi.list(targetPage, pageSize),
        adminToolsApi.listRuns()
      ])
      setTools(toolsData.tools)
      updatePagination(toolsData.total, toolsData.total_pages)
      setRuns(runsData.runs)
      if (toolsData.tools.length > 0) {
        setTestingTool(toolsData.tools[0])
      }
    } catch (err: any) {
      console.error("Failed to load admin tools:", err)
      setError(err.message || "Failed to load tools registry")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadAllData(page)
  }, [page])

  const handleSubmitTool = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !description.trim() || !code.trim()) {
      setError("Please fill out Name, Description and Python Script.")
      return
    }

    let parsedSchema = {}
    try {
      parsedSchema = JSON.parse(paramSchema)
    } catch (err) {
      setError("Parameter schema is not valid JSON.")
      return
    }

    setIsActionLoading(true)
    setError("")
    setSuccess("")
    try {
      if (editingName) {
        // Update tool
        const updated = await adminToolsApi.update(editingName, {
          description,
          parameter_schema: parsedSchema,
          code,
          is_active: isActive,
          require_approval: requireApproval,
          approval_required_for_roles: approvalRequiredForRoles.length > 0 ? approvalRequiredForRoles : null,
        })
        setTools((prev) => prev.map((t) => t.name === editingName ? { ...t, ...updated } : t))
        setSuccess(`Tool '${editingName}' updated successfully.`)
        // Clear edit state
        setEditingName(null)
      } else {
        // Create tool
        const created = await adminToolsApi.create({
          name: name.trim().toLowerCase().replace(/\s+/g, "_"),
          description,
          parameter_schema: parsedSchema,
          code,
          is_active: isActive,
          require_approval: requireApproval,
          approval_required_for_roles: approvalRequiredForRoles.length > 0 ? approvalRequiredForRoles : null,
        })
        const detailed: AgentToolDetail = { ...created, code }
        setTools((prev) => [...prev, detailed])
        setSuccess(`Tool '${created.name}' registered successfully.`)
      }

      // Reset form variables
      setName("")
      setDescription("")
      setParamSchema(JSON.stringify({ type: "object", properties: {} }, null, 2))
      setCode("def run(**kwargs):\n    pass\n")
      setIsActive(true)
      setRequireApproval(false)
      setApprovalRequiredForRoles([])
    } catch (err: any) {
      console.error("Failed to submit tool configuration:", err)
      setError(err.message || "Failed to configure tool")
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleEditToolClick = (tool: AgentToolDetail) => {
    setEditingName(tool.name)
    setName(tool.name)
    setDescription(tool.description)
    setParamSchema(JSON.stringify(tool.parameter_schema, null, 2))
    setCode(tool.code)
    setIsActive(tool.is_active ?? true)
    setRequireApproval((tool as any).require_approval ?? false)
    setApprovalRequiredForRoles((tool as any).approval_required_for_roles ?? [])
    setError("")
    setSuccess("")
  }

  const handleDeleteTool = async (toolName: string) => {
    if (!confirm(`Are you sure you want to delete tool '${toolName}'? This will detach it from any agent.`)) return
    try {
      await adminToolsApi.delete(toolName)
      setTools((prev) => prev.filter((t) => t.name !== toolName))
      if (testingTool?.name === toolName) {
        setTestingTool(null)
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete tool")
    }
  }

  const handleRunTest = async () => {
    if (!testingTool) return
    let parsedArgs = {}
    try {
      parsedArgs = JSON.parse(testArguments)
    } catch (err) {
      alert("Arguments input is not valid JSON.")
      return
    }

    setIsTesting(true)
    setTestResult(null)
    try {
      const res = await adminToolsApi.test(testingTool.name, parsedArgs)
      setTestResult(res)
      // Reload history logs to capture the test run
      const runsData = await adminToolsApi.listRuns()
      setRuns(runsData.runs)
    } catch (err: any) {
      setTestResult({
        success: false,
        output: null,
        error: err.message || "Network test execution failed",
        duration_ms: 0,
      })
    } finally {
      setIsTesting(false)
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Wrench className="h-7 w-7 text-primary" />
          Tools Workspace
        </h1>
        <p className="mt-2 text-muted-foreground">
          Define agent capabilities, test scripts in a sandbox environment, and review tool invocation performance logs.
        </p>
      </div>

      {success && <div className="rounded-md bg-[rgba(88,132,79,0.14)] px-4 py-2 text-sm text-[var(--positive)]">{success}</div>}
      {error && <div className="rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive">{error}</div>}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        {/* CREATE / EDIT FORM */}
        <Card className="border border-sidebar-border bg-sidebar/5 flex flex-col justify-between">
          <CardHeader className="border-b border-sidebar-border pb-4 bg-sidebar/10">
            <CardTitle className="text-lg flex items-center gap-2">
              <Code className="h-4.5 w-4.5 text-primary" />
              {editingName ? `Edit Tool: ${editingName}` : "Register New Tool"}
            </CardTitle>
            <CardDescription>
              {editingName ? "Modify the dynamic script code or semantic metadata." : "Define custom JSON arguments parameters and execute code blocks."}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmitTool} className="flex-1 flex flex-col justify-between">
            <CardContent className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="tool-name">Tool Name (ID)</Label>
                  <Input
                    id="tool-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. get_weather_data"
                    disabled={editingName !== null}
                    required
                  />
                </div>
                <div className="flex items-center justify-between border border-sidebar-border rounded-md px-3 bg-background">
                  <span className="text-sm font-medium">Active Status</span>
                  <Switch checked={isActive} onCheckedChange={setIsActive} />
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="tool-desc">Semantic Description for LLM</Label>
                <Input
                  id="tool-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Fetches real-time weather information for a specified city name string."
                  required
                />
              </div>

              {/* Approval Gate */}
              <div className="border border-sidebar-border rounded-md p-3 bg-background space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-amber-400" />
                    <span className="text-sm font-medium">Require User Approval</span>
                  </div>
                  <Switch checked={requireApproval} onCheckedChange={setRequireApproval} />
                </div>
                {requireApproval && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Gate applies to all roles by default. Uncheck roles to let them bypass approval.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {AVAILABLE_ROLES.map((role) => (
                        <label
                          key={role}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs cursor-pointer select-none transition-colors ${
                            approvalRequiredForRoles.includes(role) || approvalRequiredForRoles.length === 0
                              ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
                              : "border-sidebar-border text-muted-foreground"
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="hidden"
                            checked={approvalRequiredForRoles.length === 0 || approvalRequiredForRoles.includes(role)}
                            onChange={() => toggleApprovalRole(role)}
                          />
                          <span className="capitalize">{role}</span>
                        </label>
                      ))}
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {approvalRequiredForRoles.length === 0 ? "All roles are gated" : `Gated: ${approvalRequiredForRoles.join(", ")}`}
                    </p>
                  </div>
                )}
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="tool-schema">Arguments JSON Schema</Label>
                <Textarea
                  id="tool-schema"
                  value={paramSchema}
                  onChange={(e) => setParamSchema(e.target.value)}
                  className="h-32 font-mono text-xs resize-none"
                  required
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="tool-code">Python Execution Script (`def run` is required)</Label>
                <Textarea
                  id="tool-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="h-56 font-mono text-xs resize-none bg-sidebar/20 text-foreground"
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="border-t border-sidebar-border p-3 bg-sidebar/20 flex gap-2">
              {editingName && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingName(null)
                    setName("")
                    setDescription("")
                    setParamSchema(JSON.stringify({ type: "object", properties: {} }, null, 2))
                    setCode("def run(**kwargs):\n    pass\n")
                    setIsActive(true)
                  }}
                  className="w-1/3"
                >
                  Cancel Edit
                </Button>
              )}
              <Button type="submit" disabled={isActionLoading} className="flex-1">
                {isActionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                {editingName ? "Update Tool Definition" : "Register Global Tool"}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* REGISTRY LIST & TESTING SANDBOX */}
        <div className="space-y-6">
          <Tabs defaultValue="list" className="w-full">
            <TabsList className="grid grid-cols-2 bg-sidebar/10 p-1 rounded-lg">
              <TabsTrigger value="list">Registered Registry</TabsTrigger>
              <TabsTrigger value="sandbox">Sandbox Tester</TabsTrigger>
            </TabsList>
            
            <TabsContent value="list">
              <Card className="border border-sidebar-border bg-sidebar/5 h-[580px] overflow-hidden flex flex-col">
                <CardHeader className="pb-3 border-b border-sidebar-border">
                  <CardTitle className="text-base flex items-center gap-1.5">
                    <Wrench className="h-4 w-4 text-muted-foreground" />
                    Tools Catalogue ({tools.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
                  {tools.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                      <Wrench className="h-8 w-8 mb-2" />
                      <p className="text-xs">No custom tools defined yet.</p>
                    </div>
                  ) : (
                    tools.map((t) => (
                      <div key={t.name} className="border border-sidebar-border rounded-lg bg-background p-3 flex justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-semibold">{t.name}</span>
                            <span className={`h-2.5 w-2.5 rounded-full ${t.is_active ? "bg-[var(--positive)]" : "bg-destructive"}`} />
                            {(t as any).require_approval && (
                              <span className="inline-flex items-center gap-1 rounded bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-semibold text-amber-400 uppercase tracking-wide">
                                <Shield className="h-2.5 w-2.5" /> Approval
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">{t.description}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button variant="outline" size="icon" onClick={() => handleEditToolClick(t)} className="h-8 w-8">
                            <Edit3 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button variant="outline" size="icon" onClick={() => handleDeleteTool(t.name)} className="h-8 w-8 text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
                <CardFooter className="border-t border-sidebar-border p-3 bg-sidebar/10 flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1 || isLoading}
                    onClick={prevPage}
                    className="h-8 text-xs"
                  >
                    Previous
                  </Button>
                  <span className="text-xs text-muted-foreground font-mono">
                    Page {page} of {totalPages} ({totalTools} total)
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages || isLoading}
                    onClick={nextPage}
                    className="h-8 text-xs"
                  >
                    Next
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="sandbox">
              <Card className="border border-sidebar-border bg-sidebar/5 h-[580px] flex flex-col justify-between overflow-hidden">
                <CardHeader className="pb-3 border-b border-sidebar-border">
                  <CardTitle className="text-base flex items-center gap-1.5">
                    <Terminal className="h-4 w-4 text-muted-foreground" />
                    Execution Playground
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto space-y-4 p-4 scrollbar-thin">
                  <div className="grid gap-2">
                    <Label htmlFor="test-target">Target Tool</Label>
                    <Select
                      value={testingTool?.name || ""}
                      onValueChange={(val: string) => {
                        const matched = tools.find((t) => t.name === val)
                        if (matched) {
                          setTestingTool(matched)
                          // Populate default args matching tool schema if any
                          const defaultArgs: Record<string, any> = {}
                          if (matched.parameter_schema && matched.parameter_schema.properties) {
                            Object.keys(matched.parameter_schema.properties).forEach((k) => {
                              defaultArgs[k] = "test_value"
                            })
                          }
                          setTestArguments(JSON.stringify(defaultArgs, null, 2))
                        }
                      }}
                    >
                      <SelectTrigger id="test-target">
                        <SelectValue placeholder="Choose tool to run" />
                      </SelectTrigger>
                      <SelectContent>
                        {tools.map((t) => (
                          <SelectItem key={t.name} value={t.name}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="test-args">Input Arguments (JSON format)</Label>
                    <Textarea
                      id="test-args"
                      value={testArguments}
                      onChange={(e) => setTestArguments(e.target.value)}
                      className="h-32 font-mono text-xs resize-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label>Execution Sandbox Terminal Output</Label>
                    <div className="rounded-md border border-sidebar-border bg-black text-green-400 p-3 h-52 font-mono text-xs overflow-y-auto leading-relaxed whitespace-pre-wrap select-text">
                      {isTesting ? (
                        <div className="flex items-center gap-2 text-muted-foreground animate-pulse">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Compiling code and executing sandbox turn...</span>
                        </div>
                      ) : testResult ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 border-b border-sidebar-border pb-1.5 mb-1.5">
                            {testResult.success ? (
                              <CheckCircle className="h-4 w-4 text-[var(--positive)]" />
                            ) : (
                              <XCircle className="h-4 w-4 text-destructive" />
                            )}
                            <span className="text-white">
                              {testResult.success ? "Success" : "Failed with exception"}
                            </span>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-muted-foreground">{testResult.duration_ms}ms runtime</span>
                          </div>
                          {testResult.success ? (
                            <span className="text-green-300">{testResult.output}</span>
                          ) : (
                            <span className="text-red-400 font-semibold">{testResult.error}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">// Sandbox terminal idle. Input arguments and click Run Test.</span>
                      )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t border-sidebar-border p-3 bg-sidebar/20">
                  <Button onClick={handleRunTest} disabled={isTesting || !testingTool} className="w-full">
                    {isTesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                    Execute Sandbox Test
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* MONITORING LOG TABLE */}
      <Card className="border border-sidebar-border bg-sidebar/5 overflow-hidden">
        <CardHeader className="border-b border-sidebar-border bg-sidebar/10 pb-4">
          <CardTitle className="text-base flex items-center gap-1.5">
            <Activity className="h-4.5 w-4.5 text-primary" />
            Execution Monitor Logs (Recent 100 Runs)
          </CardTitle>
          <CardDescription>Real-time audit log of tool triggers across all organizations.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 max-h-96 overflow-y-auto scrollbar-thin">
          <Table>
            <TableHeader className="bg-sidebar/20 sticky top-0 z-10">
              <TableRow>
                <TableHead className="w-24">Run ID</TableHead>
                <TableHead className="w-48">Tool Name</TableHead>
                <TableHead className="w-40">Triggered By</TableHead>
                <TableHead className="w-24">Duration</TableHead>
                <TableHead className="w-28">Status</TableHead>
                <TableHead>Arguments / Logs</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground text-xs">
                    No execution history logged.
                  </TableCell>
                </TableRow>
              ) : (
                runs.map((r) => (
                  <TableRow key={r.id} className="hover:bg-sidebar/5 font-mono text-xs">
                    <TableCell className="font-semibold">#{r.id}</TableCell>
                    <TableCell className="font-semibold text-primary">{r.tool_name}</TableCell>
                    <TableCell className="flex items-center gap-1 text-[11px] text-muted-foreground py-3">
                      <User className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate max-w-[120px]">{r.triggered_by}</span>
                    </TableCell>
                    <TableCell className="flex-row items-center text-muted-foreground">
                      <div className="flex items-center gap-1 mt-1.5">
                        <Clock className="h-3 w-3 shrink-0" />
                        <span>{r.duration_ms}ms</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {r.error ? (
                        <span className="inline-flex items-center gap-1 rounded bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive uppercase tracking-wide">
                          <XCircle className="h-3 w-3" /> Error
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-[rgba(88,132,79,0.14)] px-2 py-0.5 text-[10px] font-semibold text-[var(--positive)] uppercase tracking-wide">
                          <CheckCircle className="h-3 w-3" /> Success
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-md select-text">
                      <details className="text-[11px]">
                        <summary className="cursor-pointer select-none text-muted-foreground font-sans hover:underline">
                          args: {JSON.stringify(r.arguments)}
                        </summary>
                        <div className="mt-1.5 space-y-1.5 border border-sidebar-border bg-sidebar/20 p-2 rounded-md leading-relaxed whitespace-pre-wrap max-h-36 overflow-y-auto">
                          {r.error ? (
                            <div className="text-red-400 font-semibold">{r.error}</div>
                          ) : (
                            <div className="text-green-300">{r.output}</div>
                          )}
                        </div>
                      </details>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
