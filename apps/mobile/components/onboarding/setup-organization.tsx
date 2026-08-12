import React, { useState } from "react"
import { View, ActivityIndicator } from "react-native"
import { Text } from "@/components/ui/text"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { organizationsApi } from "@/lib/api-client"
import { useOrg } from "@/providers/org-provider"
import { Building2, Plus, LogOut } from "lucide-react-native"
import { useAuth } from "@/providers/auth-provider"
import { useTheme } from "@/providers/theme-provider"

export function SetupOrganization() {
  const [name, setName] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState("")
  const { refreshOrgs } = useOrg()
  const { signOut } = useAuth()
  const { colors } = useTheme()

  const handleCreate = async () => {
    if (!name.trim()) {
      setError("Organization name is required")
      return
    }

    setIsCreating(true)
    setError("")

    try {
      await organizationsApi.create({ name: name.trim() })
      await refreshOrgs()
    } catch (err: any) {
      console.error("Failed to create organization:", err)
      setError(err.message || "Failed to create organization")
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <View className="flex-1 bg-background justify-center p-6">
      <Card className="w-full">
        <CardHeader className="items-center">
          <View className="w-16 h-16 rounded-2xl bg-primary/10 items-center justify-center mb-4">
            <Building2 size={32} color={colors.primary} />
          </View>
          <CardTitle>Setup Organization</CardTitle>
          <CardDescription className="text-center">
            You don't belong to an organization yet. Create one to get started.
          </CardDescription>
        </CardHeader>
        <CardContent className="gap-6">
          <View className="gap-2">
            <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Organization Name
            </Text>
            <Input
              value={name}
              onChangeText={setName}
              placeholder="e.g. Acme Corp"
              editable={!isCreating}
            />
          </View>

          {error ? <Text className="text-destructive text-sm text-center">{error}</Text> : null}

          <Button onPress={handleCreate} disabled={isCreating}>
            {isCreating ? <ActivityIndicator color="#fff" size="small" /> : <Plus size={18} color="#fff" />}
            <Text className="ml-2 text-white font-bold">Create Organization</Text>
          </Button>

          <Button variant="ghost" onPress={signOut}>
            <LogOut size={18} color={colors.mutedForeground} />
            <Text className="ml-2 text-muted-foreground">Sign Out</Text>
          </Button>
        </CardContent>
      </Card>
    </View>
  )
}
