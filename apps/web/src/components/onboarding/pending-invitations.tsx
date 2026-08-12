import { useState } from "react"
import { Building2, Loader2, MailCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { organizationsApi, type Organization, type OrganizationInvitation } from "@/lib/api-client"
import { useOrgStore } from "@/stores/org-store"

export function PendingInvitations({
  invitations,
}: {
  invitations: OrganizationInvitation[]
}) {
  const { setCurrentOrg, setOrganizations } = useOrgStore()
  const [acceptingId, setAcceptingId] = useState<number | null>(null)
  const [error, setError] = useState("")

  const handleAccept = async (invitationId: number) => {
    setAcceptingId(invitationId)
    setError("")

    try {
      const organization = await organizationsApi.acceptInvitation(invitationId)
      setCurrentOrg(organization)
      setOrganizations([organization as Organization])
    } catch (err: any) {
      console.error("Failed to accept invitation:", err)
      setError(err.message || "Failed to accept invitation")
    } finally {
      setAcceptingId(null)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(204,143,74,0.16)] text-[var(--ember)]">
            <MailCheck className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl">You have pending team invitations</CardTitle>
          <CardDescription>
            Join an existing Skeleton organization instead of creating a new workspace.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {invitations.map((invitation) => (
            <div
              key={invitation.id}
              className="flex items-center justify-between gap-4 border border-[var(--fog)] bg-[rgba(20,16,9,0.92)] p-4"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 font-medium">
                  <Building2 className="h-4 w-4 text-[var(--ember)]" />
                  <span>{invitation.organization?.name || `Organization #${invitation.organization_id}`}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Role: <span className="capitalize">{invitation.role}</span>
                </p>
              </div>
              <Button
                onClick={() => handleAccept(invitation.id)}
                disabled={acceptingId === invitation.id}
              >
                {acceptingId === invitation.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Accept Invite
              </Button>
            </div>
          ))}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>
    </div>
  )
}
