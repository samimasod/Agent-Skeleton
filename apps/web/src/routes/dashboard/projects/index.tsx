import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { ExternalLink, FolderKanban, Loader2, MoreVertical, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { projectsApi, type Project } from "@/lib/api-client"
import { useOrgStore } from "@/stores/org-store"

export function ProjectsPage() {
  const { currentOrg } = useOrgStore()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState("")

  const [formName, setFormName] = useState("")
  const [formUrl, setFormUrl] = useState("")
  const [formDescription, setFormDescription] = useState("")

  useEffect(() => {
    async function fetchProjects() {
      if (!currentOrg) {
        setIsLoading(false)
        return
      }

      try {
        const response = await projectsApi.list(currentOrg.id)
        setProjects(response.projects)
      } catch (err) {
        console.error("Failed to fetch workspaces:", err)
        setError("Failed to load workspaces")
      } finally {
        setIsLoading(false)
      }
    }

    fetchProjects()
  }, [currentOrg])

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentOrg) return
    if (!formName.trim() || !formUrl.trim()) {
      setError("Workspace name and source URL are required")
      return
    }

    setIsCreating(true)
    setError("")

    try {
      const project = await projectsApi.create({
        organization_id: currentOrg.id,
        name: formName.trim(),
        base_url: formUrl.trim(),
        description: formDescription.trim() || undefined,
      })
      setProjects((prev) => [...prev, project])
      setShowCreateForm(false)
      setFormName("")
      setFormUrl("")
      setFormDescription("")
    } catch (err) {
      console.error("Failed to create workspace:", err)
      setError("Failed to create workspace. Please try again.")
    } finally {
      setIsCreating(false)
    }
  }

  if (!currentOrg) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Please set up an organization first</p>
      </div>
    )
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
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Application Workspaces</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Create and isolate project workspaces scoped to your active organization. Workspaces provide tenant boundary controls for scoping domain data, file storage, and AI agents.
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Workspace
        </Button>
      </div>

      {error && <div className="rounded-md bg-destructive/10 px-4 py-2 text-destructive">{error}</div>}

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create Tenant Workspace</CardTitle>
            <CardDescription>
              Set up a new isolated project workspace for your team, client, or environment.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Workspace Name *</Label>
                  <Input
                    id="name"
                    placeholder="EU Consumer Electronics"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    disabled={isCreating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="base_url">Source URL *</Label>
                  <Input
                    id="base_url"
                    placeholder="https://catalog.example.com"
                    value={formUrl}
                    onChange={(e) => setFormUrl(e.target.value)}
                    disabled={isCreating}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Scope Notes</Label>
                <Input
                  id="description"
                  placeholder="Importer of record, regions, product family, evidence quality, or analyst notes"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  disabled={isCreating}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isCreating}>
                  {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Workspace
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false)
                    setFormName("")
                    setFormUrl("")
                    setFormDescription("")
                    setError("")
                  }}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {projects.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id} className="transition-shadow hover:border-[#7A4418]">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <CardDescription className="mt-1 flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" />
                      {project.base_url}
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-primary">
                  <FolderKanban className="h-3.5 w-3.5" />
                  Tenant workspace
                </div>
                {project.description && <p className="mb-4 text-sm text-muted-foreground">{project.description}</p>}
                <div className="mb-4 text-xs text-muted-foreground">
                  Created {new Date(project.created_at).toLocaleDateString()}
                </div>
                <Button asChild variant="outline" className="w-full">
                  <Link to={`/dashboard/projects/${project.id}`}>Open Workspace</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {projects.length === 0 && !showCreateForm && (
        <Card className="py-12">
          <CardContent className="text-center">
            <h3 className="text-lg font-medium">No workspaces yet</h3>
            <p className="mt-2 text-muted-foreground">
              Create your first project workspace to begin organizing AI agent workflows.
            </p>
            <Button className="mt-4" onClick={() => setShowCreateForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Workspace
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
