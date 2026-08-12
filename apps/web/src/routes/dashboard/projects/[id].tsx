import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Globe, Loader2, Save, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { projectsApi, type Project } from "@/lib/api-client"

export function ProjectDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const projectId = Number(id)

  const [project, setProject] = useState<Project | null>(null)
  const [name, setName] = useState("")
  const [baseUrl, setBaseUrl] = useState("")
  const [description, setDescription] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    async function fetchProject() {
      if (!projectId) {
        setError("Invalid project ID")
        setIsLoading(false)
        return
      }

      try {
        const data = await projectsApi.get(projectId)
        setProject(data)
        setName(data.name)
        setBaseUrl(data.base_url)
        setDescription(data.description || "")
      } catch (err) {
        console.error("Failed to fetch project:", err)
        setError("Project not found")
      } finally {
        setIsLoading(false)
      }
    }

    fetchProject()
  }, [projectId])

  const handleSave = async () => {
    if (!project) return

    setIsSaving(true)
    setError("")

    try {
      const updated = await projectsApi.update(project.id, {
        name: name.trim(),
        base_url: baseUrl.trim(),
        description: description.trim() || undefined,
      })
      setProject(updated)
    } catch (err) {
      console.error("Failed to update project:", err)
      setError("Failed to update project")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!project) return

    setIsDeleting(true)
    setError("")

    try {
      await projectsApi.delete(project.id)
      navigate("/dashboard/projects")
    } catch (err) {
      console.error("Failed to delete project:", err)
      setError("Failed to delete project")
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate("/dashboard/projects")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Workspaces
        </Button>
        <Card className="py-12">
          <CardContent className="text-center">
            <h3 className="text-lg font-medium">{error || "Project not found"}</h3>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/projects")}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          Workspaces
        </Button>
        <h1 className="mt-2 text-3xl font-bold">{project.name}</h1>
        <div className="mt-2 flex items-center gap-2 text-muted-foreground">
          <Globe className="h-4 w-4" />
          <a href={project.base_url} target="_blank" rel="noreferrer" className="hover:text-foreground">
            {project.base_url}
          </a>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Workspace Configuration</CardTitle>
          <CardDescription>
            Manage tenant workspace scope, environment parameters, and metadata for your organization.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="project-name">Project Name</Label>
              <Input id="project-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-url">Base URL</Label>
              <Input id="project-url" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="project-description">Description</Label>
            <textarea
              id="project-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-28 w-full"
              placeholder="What this workspace is for and what AI workflows should operate on."
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Project
            </Button>
            <Button variant="outline" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Delete Project
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
