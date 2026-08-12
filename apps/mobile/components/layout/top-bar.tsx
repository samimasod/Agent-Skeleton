import React from 'react';
import { View, TouchableOpacity, Platform } from 'react-native';
import { Text } from '@/components/ui/text';
import { Menu, Search, Bell, Building2 } from 'lucide-react-native';
import { useAuth } from '@/hooks/use-auth';
import { useOrg } from '@/providers/org-provider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTheme } from '@/providers/theme-provider';

export function TopBar({ onMenuPress }: { onMenuPress: () => void }) {
  const { user } = useAuth();
  const { currentOrg } = useOrg();
  const { colors } = useTheme();
  const isWeb = Platform.OS === 'web';

  return (
    <View className="h-16 border-b border-border bg-card px-4 flex-row items-center justify-between">
      <View className="flex-row items-center gap-4">
        <TouchableOpacity onPress={onMenuPress} className="p-2 -ml-2">
          <Menu size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View>
          <Text className="text-sm font-bold text-foreground">
            {currentOrg?.name || 'Skeleton'}
          </Text>
          {currentOrg && (
            <View className="flex-row items-center gap-1">
              <Building2 size={8} color={colors.mutedForeground} />
              <Text className="text-[8px] text-muted-foreground uppercase tracking-widest">Active Workspace</Text>
            </View>
          )}
        </View>
      </View>

      <View className="flex-row items-center gap-2">
        <TouchableOpacity className="p-2">
          <Search size={20} color={colors.mutedForeground} />
        </TouchableOpacity>
        <TouchableOpacity className="p-2">
          <Bell size={20} color={colors.mutedForeground} />
        </TouchableOpacity>
        {isWeb && (
          <Avatar className="w-8 h-8 ml-2 border border-border">
            <AvatarImage source={{ uri: user?.photoURL || '' }} />
            <AvatarFallback>
              <Text className="text-[10px] font-bold">{user?.email?.charAt(0).toUpperCase()}</Text>
            </AvatarFallback>
          </Avatar>
        )}
      </View>
    </View>
  );
}
