import '../global.css';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { useAuth, AuthProvider } from '@/providers/auth-provider';
import { useOrg, OrgProvider } from '@/providers/org-provider';
import { AppLayout } from '@/components/layout/app-layout';
import { SetupOrganization } from '@/components/onboarding/setup-organization';
import { PendingInvitations } from '@/components/onboarding/pending-invitations';
import { ThemeProvider } from '@/providers/theme-provider';
import { View, ActivityIndicator } from 'react-native';

function RootLayoutContent() {
  const { user, loading: authLoading } = useAuth();
  const { currentOrg, isLoading: orgLoading, needsSetup, pendingInvitations } = useOrg();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup && currentOrg) {
      router.replace('/');
    }
  }, [user, currentOrg, authLoading, segments, router]);

  if (authLoading || (user && orgLoading)) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="hsl(var(--primary))" />
      </View>
    );
  }

  const inAuthGroup = segments[0] === '(auth)';

  if (!user) {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
      </Stack>
    );
  }

  // Onboarding Guards
  if (!currentOrg) {
    if (needsSetup) {
      return <SetupOrganization />;
    }
    if (pendingInvitations.length > 0) {
      return <PendingInvitations invitations={pendingInvitations} />;
    }
  }

  if (inAuthGroup) {
    return null;
  }

  // For everything else, wrap in the AppLayout
  return (
    <AppLayout>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="projects" />
        <Stack.Screen name="agents" />
        <Stack.Screen name="agent-chat" />
        <Stack.Screen name="settings" />
      </Stack>
    </AppLayout>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <OrgProvider>
          <RootLayoutContent />
        </OrgProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
