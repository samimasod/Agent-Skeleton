import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { organizationsApi } from "@/lib/api-client"
import { useOrgStore } from "@/stores/org-store"
import { Loader2 } from "lucide-react"

export function SetupOrganization() {
  const navigate = useNavigate()
  const { setCurrentOrg, setOrganizations } = useOrgStore()
  const [name, setName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError("Organization name is required")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const org = await organizationsApi.create({ name: name.trim() })
      setCurrentOrg(org)
      setOrganizations([org])
      navigate("/dashboard")
    } catch (err) {
      console.error("Failed to create organization:", err)
      setError("Failed to create organization. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome to Skeleton</CardTitle>
          <CardDescription>
            Set up your organization workspace to configure team members and AI agent workflows.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="org-name">Organization Name</Label>
              <Input
                id="org-name"
                placeholder="e.g. Acme Corp"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Enter your company or organization name
              </p>
            </div>
            
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Team Workspace
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
