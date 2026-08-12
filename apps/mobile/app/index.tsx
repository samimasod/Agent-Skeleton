import { View, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FolderKanban, Shield, Users } from 'lucide-react-native';
import { useTheme } from '@/providers/theme-provider';

const features = [
  {
    title: "Multi-tenant Architecture",
    description: "Built-in organization management, member invitations, and role-based access control.",
  },
  {
    title: "Isolated Workspaces",
    description: "Create projects or workspaces that are scoped to specific organizations and teams.",
  },
  {
    title: "Unified Platform",
    description: "Seamlessly switch between organizations and manage your data in one place.",
  },
]

export default function Dashboard() {
  const router = useRouter();
  return (
    <ScrollView className="flex-1 bg-background">
      <View className="px-6 py-8 gap-8">
        
        {/* Main Banner */}
        <Card className="bg-primary/5 border-primary/10">
          <CardContent className="p-6">
            <Text className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">Application Skeleton</Text>
            <Text className="mt-4 text-3xl font-bold text-foreground leading-tight">
              Mobile companion for your multi-tenant foundation.
            </Text>
            <Text className="mt-4 text-sm text-muted-foreground leading-relaxed">
              This mobile app provides access to your workspaces, organization settings, and profile from anywhere.
            </Text>
          </CardContent>
        </Card>

        {/* Platform Direction */}
        <View className="gap-4">
          <Text className="text-xl font-bold text-foreground">Core Features</Text>
          {features.map((feature) => (
            <Card key={feature.title} className="border-border/50">
              <CardContent className="p-4">
                <Text className="font-semibold text-foreground">{feature.title}</Text>
                <Text className="mt-1 text-sm text-muted-foreground leading-relaxed">{feature.description}</Text>
              </CardContent>
            </Card>
          ))}
        </View>

        {/* Metrics Grid */}
        <View className="flex-row flex-wrap gap-4">
          <TouchableOpacity 
            className="flex-1 min-w-[150px]" 
            onPress={() => router.push('/projects')}
            activeOpacity={0.8}
          >
            <MetricCard 
              icon={FolderKanban} 
              label="Workspaces" 
              value="Manage" 
              hint="Isolated project areas" 
            />
          </TouchableOpacity>
          <MetricCard 
            icon={Users} 
            label="Organizations" 
            value="Active" 
            hint="Team management ready" 
            className="flex-1 min-w-[150px]"
          />
          <MetricCard 
            icon={Shield} 
            label="Security" 
            value="Secure" 
            hint="Built-in RBAC and Auth" 
            className="flex-1 min-w-[150px]"
          />
        </View>

        {/* Roadmap */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>Building your mobile application.</CardDescription>
          </CardHeader>
          <CardContent className="gap-4">
            <Text className="text-sm text-muted-foreground leading-relaxed">
              Define your mobile screens in the{' '}
              <Text className="font-mono text-foreground">app</Text>
              {' '}directory and connect them to your backend API.
            </Text>
            <Text className="text-sm text-muted-foreground leading-relaxed">
              Use the provided UI components and hooks for a consistent and fast development experience.
            </Text>
          </CardContent>
        </Card>

      </View>
    </ScrollView>
  );
}

function MetricCard({ icon: Icon, label, value, hint, className }: any) {
  const { colors } = useTheme();

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <View className="flex-row items-center justify-between">
          <Text className="text-xs font-medium text-muted-foreground">{label}</Text>
          <View className="bg-secondary p-1.5 rounded">
            <Icon size={14} color={colors.foreground} />
          </View>
        </View>
      </CardHeader>
      <CardContent>
        <Text className="text-2xl font-bold text-foreground">{value}</Text>
        <Text className="mt-1 text-[10px] text-muted-foreground leading-tight">{hint}</Text>
      </CardContent>
    </Card>
  )
}
