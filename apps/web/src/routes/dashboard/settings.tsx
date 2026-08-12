import { useEffect, useState } from "react"
import { Crown, Loader2, User, UserPlus, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { organizationsApi, type OrganizationInvitation, type OrganizationMember } from "@/lib/api-client"
import { useAuthStore } from "@/stores/auth-store"
import { useOrgStore } from "@/stores/org-store"

import { AgentUsageMonitor } from "@/components/agent-usage-monitor"

export function SettingsPage() {
  const { user } = useAuthStore()
  const { currentOrg, setCurrentOrg } = useOrgStore()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="mt-2 text-muted-foreground">Manage your account, organization settings, and AI agent usage quotas.</p>
      </div>

      <ProfileSettings user={user} />
      {currentOrg && <OrganizationSettings org={currentOrg} onUpdate={setCurrentOrg} />}
      {currentOrg && <AgentUsageMonitor organizationId={currentOrg.id} />}
      {currentOrg && <TeamMembers orgId={currentOrg.id} />}
    </div>
  )
}

function ProfileSettings({ user }: { user: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Your authenticated user profile.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Email</Label>
          <Input value={user?.email || ""} disabled />
        </div>
        <div className="space-y-2">
          <Label>Display Name</Label>
          <Input value={user?.displayName || ""} disabled />
        </div>
      </CardContent>
    </Card>
  )
}

function OrganizationSettings({
  org,
  onUpdate,
}: {
  org: any
  onUpdate: (org: any) => void
}) {
  const [name, setName] = useState(org.name)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Organization name is required")
      return
    }

    setIsSaving(true)
    setError("")

    try {
      const updated = await organizationsApi.update(org.id, { name: name.trim() })
      onUpdate(updated)
    } catch (err) {
      console.error("Failed to update organization:", err)
      setError("Failed to update organization")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization</CardTitle>
        <CardDescription>Keep the organization layer clean and reusable.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Organization Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Organization
        </Button>
      </CardContent>
    </Card>
  )
}

function TeamMembers({ orgId }: { orgId: number }) {
  const { user } = useAuthStore()
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<"admin" | "member" | "viewer">("member")
  const [isInviting, setIsInviting] = useState(false)
  const [isLoadingMembers, setIsLoadingMembers] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [members, setMembers] = useState<OrganizationMember[]>([])
  const [pendingInvites, setPendingInvites] = useState<OrganizationInvitation[]>([])

  useEffect(() => {
    let isMounted = true

    const loadMembers = async () => {
      setIsLoadingMembers(true)
      try {
        const organization = await organizationsApi.getDetail(orgId)
        if (isMounted) {
          setMembers(organization.members)
          setPendingInvites(organization.invitations.filter((invitation) => invitation.status === "pending"))
        }
      } catch (err) {
        console.error("Failed to load organization members:", err)
        if (isMounted) {
          setError("Failed to load team members")
        }
      } finally {
        if (isMounted) {
          setIsLoadingMembers(false)
        }
      }
    }

    void loadMembers()

    return () => {
      isMounted = false
    }
  }, [orgId])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      setError("Email is required")
      return
    }

    setIsInviting(true)
    setError("")
    setSuccess("")

    try {
      await organizationsApi.inviteMember(orgId, { email: email.trim(), role })
      setSuccess(`Invitation created for ${email}`)
      setEmail("")
      setShowInviteForm(false)
      const organization = await organizationsApi.getDetail(orgId)
      setMembers(organization.members)
      setPendingInvites(organization.invitations.filter((invitation) => invitation.status === "pending"))
    } catch (err: any) {
      console.error("Failed to invite member:", err)
      setError(err.message || "Failed to send invitation")
    } finally {
      setIsInviting(false)
    }
  }

  const getRoleIcon = (memberRole: string) => {
    if (memberRole === "owner") return <Crown className="h-4 w-4 text-[var(--gold)]" />
    if (memberRole === "admin") return <Users className="h-4 w-4 text-[var(--ember)]" />
    return <User className="h-4 w-4 text-muted-foreground" />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Members
          </span>
          {!showInviteForm && (
            <Button size="sm" onClick={() => setShowInviteForm(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Invite Member
            </Button>
          )}
        </CardTitle>
        <CardDescription>Organization membership stays as part of the reusable application skeleton.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {showInviteForm && (
          <form onSubmit={handleInvite} className="space-y-4 border border-[var(--fog)] p-4">
            <h4 className="font-medium">Invite a team member</h4>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input
                  type="email"
                  placeholder="colleague@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isInviting}
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <select value={role} onChange={(e) => setRole(e.target.value as "admin" | "member" | "viewer")} disabled={isInviting}>
                  <option value="admin">Admin</option>
                  <option value="member">Member</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            {success && <p className="text-sm text-[var(--positive)]">{success}</p>}

            <div className="flex gap-2">
              <Button type="submit" disabled={isInviting}>
                {isInviting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Invitation
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowInviteForm(false)
                  setEmail("")
                  setError("")
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}

        <div className="space-y-2">
          {pendingInvites.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Pending invitations</p>
              {pendingInvites.map((invite) => (
                <div key={invite.id} className="flex items-center justify-between border border-[var(--fog)] p-4">
                  <div>
                    <div className="font-medium">{invite.email}</div>
                    <div className="text-sm text-muted-foreground">
                      Invited as {invite.role}
                    </div>
                  </div>
                  <span className="text-xs uppercase tracking-[0.14em] text-[var(--ember)]">Pending</span>
                </div>
              ))}
            </div>
          )}
          {isLoadingMembers && <p className="text-sm text-muted-foreground">Loading team members...</p>}
          {!isLoadingMembers && members.length === 0 && (
            <p className="text-sm text-muted-foreground">No members found for this organization yet.</p>
          )}
          {members.map((member) => (
            <div key={member.id} className="flex items-center justify-between border border-[var(--fog)] p-4">
              <div className="flex items-center gap-3">
                {getRoleIcon(member.role)}
                <div>
                  <div className="font-medium">{member.email}</div>
                  <div className="text-sm text-muted-foreground">{member.role}</div>
                </div>
              </div>
              {member.email === user?.email && <span className="text-xs text-muted-foreground">You</span>}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
