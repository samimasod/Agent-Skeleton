import React, { useEffect, useState } from 'react';
import { View, ScrollView, ActivityIndicator, TouchableOpacity, TextInput } from 'react-native';
import { useAuth } from '@/hooks/use-auth';
import { useOrg } from '@/providers/org-provider';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  LogOut, 
  User, 
  Building2, 
  Users, 
  UserPlus, 
  Crown, 
  Shield, 
  Moon, 
  Sun,
  ChevronRight,
  Check,
  X
} from 'lucide-react-native';
import { organizationsApi, type OrganizationMember, type OrganizationInvitation } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { useTheme } from '@/providers/theme-provider';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const { currentOrg, setCurrentOrg } = useOrg();
  const { colors, isDark, toggleTheme } = useTheme();

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="px-4 py-6 gap-8 pb-20">
        
        <View>
          <Text className="text-3xl font-bold text-foreground">Settings</Text>
          <Text className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Manage your account and organization skeleton.
          </Text>
        </View>

        {/* Profile Section */}
        <ProfileSettings user={user} isDark={isDark} toggleTheme={toggleTheme} />

        {/* Organization Section */}
        {currentOrg && (
          <OrganizationSettings org={currentOrg} onUpdate={setCurrentOrg} />
        )}

        {/* Team Members Section */}
        {currentOrg && (
          <TeamMembers orgId={currentOrg.id} currentUserEmail={user?.email || ""} />
        )}

        {/* Account Actions */}
        <View className="gap-3">
          <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-2">Account</Text>
          <Button 
            variant="outline" 
            className="flex-row items-center gap-3 border-destructive/20 active:bg-destructive/10"
            onPress={signOut}
          >
            <LogOut size={20} color={colors.destructive} />
            <Text className="text-destructive font-bold">Sign Out</Text>
          </Button>
        </View>

        <View className="items-center py-4">
          <Text className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">Skeleton Mobile • v1.0.0</Text>
        </View>

      </View>
    </ScrollView>
  );
}

type ProfileSettingsProps = {
  user: ReturnType<typeof useAuth>['user'];
  isDark: boolean;
  toggleTheme: () => void;
};

function ProfileSettings({ user, isDark, toggleTheme }: ProfileSettingsProps) {
  const { colors } = useTheme();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Your authenticated user profile.</CardDescription>
      </CardHeader>
      <CardContent className="gap-4">
        <View className="gap-1.5">
          <Text className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Email</Text>
          <View className="p-3 bg-secondary/50 rounded-lg border border-border">
            <Text className="text-sm text-muted-foreground">{user?.email}</Text>
          </View>
        </View>

        <View className="flex-row items-center justify-between pt-2">
          <View className="flex-row items-center gap-3">
            {isDark ? <Moon size={18} color={colors.foreground} /> : <Sun size={18} color={colors.foreground} />}
            <Text className="text-sm font-medium text-foreground">Dark Mode</Text>
          </View>
          <TouchableOpacity 
            onPress={toggleTheme}
            className={cn(
              "w-12 h-6 rounded-full px-1 justify-center",
              isDark ? "bg-primary" : "bg-muted"
            )}
          >
            <View className={cn(
              "w-4 h-4 rounded-full bg-white",
              isDark ? "self-end" : "self-start"
            )} />
          </TouchableOpacity>
        </View>
      </CardContent>
    </Card>
  )
}

function OrganizationSettings({ org, onUpdate }: { org: any, onUpdate: (org: any) => void }) {
  const [name, setName] = useState(org.name);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!name.trim()) return;
    setIsSaving(true);
    setError("");
    try {
      const updated = await organizationsApi.update(org.id, { name: name.trim() });
      onUpdate(updated);
    } catch (err: any) {
      setError(err.message || "Failed to update");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization</CardTitle>
        <CardDescription>Configure your organization skeleton.</CardDescription>
      </CardHeader>
      <CardContent className="gap-4">
        <View className="gap-1.5">
          <Text className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Name</Text>
          <Input value={name} onChangeText={setName} />
        </View>
        {error ? <Text className="text-destructive text-xs">{error}</Text> : null}
        <Button size="sm" onPress={handleSave} disabled={isSaving || name === org.name}>
          {isSaving ? <ActivityIndicator size="small" /> : <Check size={16} color="#fff" />}
          <Text className="ml-2 text-white font-bold">Update Organization</Text>
        </Button>
      </CardContent>
    </Card>
  )
}

function TeamMembers({ orgId, currentUserEmail }: { orgId: number, currentUserEmail: string }) {
  const { colors } = useTheme();
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [pendingInvites, setPendingInvites] = useState<OrganizationInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member" | "viewer">("member");
  const [isInviting, setIsInviting] = useState(false);
  const [error, setError] = useState("");

  const loadData = async () => {
    setIsLoading(true);
    setError("");
    try {
      const detail = await organizationsApi.getDetail(orgId);
      setMembers(detail.members);
      setPendingInvites(detail.invitations.filter(i => i.status === "pending"));
    } catch (err: any) {
      setError(err.message || "Failed to load members");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [orgId]);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setIsInviting(true);
    setError("");
    try {
      await organizationsApi.inviteMember(orgId, { email: inviteEmail.trim(), role: inviteRole });
      setInviteEmail("");
      setShowInvite(true);
      await loadData();
      setShowInvite(false);
    } catch (err: any) {
      setError(err.message || "Failed to invite");
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <View>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>Manage organization access.</CardDescription>
        </View>
        <Button variant="ghost" size="icon" onPress={() => setShowInvite(!showInvite)}>
          {showInvite ? <X size={20} color={colors.mutedForeground} /> : <UserPlus size={20} color={colors.primary} />}
        </Button>
      </CardHeader>
      <CardContent className="gap-4">
        
        {error && !showInvite ? <Text className="text-destructive text-xs">{error}</Text> : null}

        {showInvite && (
          <View className="p-4 bg-secondary/30 rounded-xl border border-border gap-3 mb-2">
            <Text className="text-xs font-bold uppercase tracking-widest text-foreground">Invite Colleague</Text>
            <Input 
              placeholder="email@example.com" 
              value={inviteEmail} 
              onChangeText={setInviteEmail} 
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {error ? <Text className="text-destructive text-xs">{error}</Text> : null}
            <Button size="sm" onPress={handleInvite} disabled={isInviting || !inviteEmail.trim()}>
              <Text className="text-white font-bold">Send Invitation</Text>
            </Button>
          </View>
        )}

        {isLoading ? (
          <ActivityIndicator className="py-4" />
        ) : (
          <View className="gap-3">
            {/* Pending */}
            {pendingInvites.length > 0 && (
              <View className="gap-2">
                <Text className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Pending Invitations</Text>
                {pendingInvites.map(invite => (
                  <View key={invite.id} className="p-3 bg-secondary/20 border border-border/50 rounded-lg flex-row justify-between items-center">
                    <Text className="text-sm text-muted-foreground font-medium">{invite.email}</Text>
                    <View className="bg-secondary px-2 py-0.5 rounded">
                      <Text className="text-[8px] uppercase font-bold text-muted-foreground">Pending</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Members */}
            <View className="gap-2">
              <Text className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Members</Text>
              {members.map(member => (
                <View key={member.id} className="p-4 border border-border rounded-xl flex-row items-center gap-3">
                  <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center">
                    {member.role === 'owner' ? <Crown size={14} color={colors.primary} /> : <User size={14} color={colors.primary} />}
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-foreground">
                      {member.email} {member.email === currentUserEmail && <Text className="text-primary font-normal">(You)</Text>}
                    </Text>
                    <Text className="text-[10px] text-muted-foreground uppercase tracking-wider">{member.role}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </CardContent>
    </Card>
  )
}
