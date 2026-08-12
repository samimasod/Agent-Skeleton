import React, { useState } from "react"
import { View, ActivityIndicator, ScrollView } from "react-native"
import { Text } from "@/components/ui/text"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { organizationsApi, type OrganizationInvitation } from "@/lib/api-client"
import { useOrg } from "@/providers/org-provider"
import { Mail, Check, LogOut, Plus } from "lucide-react-native"
import { useAuth } from "@/providers/auth-provider"
import { useTheme } from "@/providers/theme-provider"

export function PendingInvitations({ invitations }: { invitations: OrganizationInvitation[] }) {
  const [isAccepting, setIsAccepting] = useState<number | null>(null)
  const [error, setError] = useState("")
  const { refreshOrgs, setNeedsSetup } = useOrg()
  const { signOut } = useAuth()
  const { colors } = useTheme()

  const handleAccept = async (invitationId: number) => {
    setIsAccepting(invitationId)
    setError("")

    try {
      await organizationsApi.acceptInvitation(invitationId)
      await refreshOrgs()
    } catch (err: any) {
      console.error("Failed to accept invitation:", err)
      setError(err.message || "Failed to accept invitation")
    } finally {
      setIsAccepting(null)
    }
  }

  return (
    <View className="flex-1 bg-background justify-center p-6">
      <Card className="w-full">
        <CardHeader className="items-center">
          <View className="w-16 h-16 rounded-2xl bg-primary/10 items-center justify-center mb-4">
            <Mail size={32} color={colors.primary} />
          </View>
          <CardTitle>Pending Invitations</CardTitle>
          <CardDescription className="text-center">
            You've been invited to join these organizations.
          </CardDescription>
        </CardHeader>
        <CardContent className="gap-6">
          <ScrollView className="max-h-48">
            <View className="gap-3">
              {invitations.map((invite) => (
                <View key={invite.id} className="p-4 border border-border rounded-xl flex-row items-center justify-between">
                  <View className="flex-1 mr-4">
                    <Text className="font-bold text-foreground">{invite.organization?.name || "Organization"}</Text>
                    <Text className="text-xs text-muted-foreground">Role: {invite.role}</Text>
                  </View>
                  <Button
                    size="sm"
                    onPress={() => handleAccept(invite.id)}
                    disabled={isAccepting !== null}
                  >
                    {isAccepting === invite.id ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Check size={14} color="#fff" />
                    )}
                  </Button>
                </View>
              ))}
            </View>
          </ScrollView>

          {error ? <Text className="text-destructive text-sm text-center">{error}</Text> : null}

          <View className="gap-2">
            <Button variant="outline" onPress={() => setNeedsSetup(true)} disabled={isAccepting !== null}>
              <Plus size={18} color={colors.foreground} />
              <Text className="ml-2">Create New Organization</Text>
            </Button>

            <Button variant="ghost" onPress={signOut} disabled={isAccepting !== null}>
              <LogOut size={18} color={colors.mutedForeground} />
              <Text className="ml-2 text-muted-foreground">Sign Out</Text>
            </Button>
          </View>
        </CardContent>
      </Card>
    </View>
  )
}
