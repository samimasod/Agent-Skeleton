import React, { useEffect, useRef } from 'react';
import { Animated, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Settings, 
  X,
  Building2,
  Bot,
  FolderKanban,
} from 'lucide-react-native';
import { Link, usePathname } from 'expo-router';
import { useAuth } from '@/hooks/use-auth';
import { useOrg } from '@/providers/org-provider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useTheme } from '@/providers/theme-provider';

const MENU_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' as const },
  { icon: FolderKanban, label: 'Workspaces', href: '/projects' as const },
  { icon: Bot, label: 'Agent Builder', href: '/agents' as const },
  { icon: Settings, label: 'Settings', href: '/settings' as const },
];

const DRAWER_WIDTH = 288;

export function Sidebar({ isOpen, setIsOpen }: { isOpen: boolean; setIsOpen: (val: boolean) => void }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { currentOrg } = useOrg();
  const { colors } = useTheme();
  const drawerX = useRef(new Animated.Value(isOpen ? 0 : -DRAWER_WIDTH)).current;
  
  // Desktop is always expanded in this layout, mobile is a drawer
  const isWeb = Platform.OS === 'web';

  useEffect(() => {
    if (isWeb) return;

    Animated.timing(drawerX, {
      toValue: isOpen ? 0 : -DRAWER_WIDTH,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [drawerX, isOpen, isWeb]);

  const content = (
    <View className="flex-1 bg-card border-r border-border h-full">
      {/* Header */}
      <View className="p-6 border-b border-border flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <View className="w-8 h-8 rounded-lg bg-primary items-center justify-center">
            <Text className="text-primary-foreground font-bold">T</Text>
          </View>
          <View>
            <Text className="text-lg font-bold text-foreground">Skeleton</Text>
            <Text className="text-[10px] text-muted-foreground uppercase tracking-widest">Platform</Text>
          </View>
        </View>
        {!isWeb && (
          <TouchableOpacity onPress={() => setIsOpen(false)}>
            <X size={20} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>

      {/* Nav Items */}
      <ScrollView className="flex-1 px-3 py-6">
        <View className="gap-1">
          {MENU_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} asChild>
                <TouchableOpacity 
                  onPress={() => !isWeb && setIsOpen(false)}
                  className={cn(
                    "flex-row items-center gap-3 px-4 py-3 rounded-xl",
                    isActive ? "bg-primary/10" : "hover:bg-muted"
                  )}
                >
                  <item.icon size={20} color={isActive ? colors.primary : colors.mutedForeground} />
                  <Text className={cn(
                    "font-medium",
                    isActive ? "text-primary" : "text-foreground"
                  )}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              </Link>
            );
          })}
        </View>
      </ScrollView>

      {/* Footer */}
      <View className="p-4 border-t border-border gap-4">
        {currentOrg && (
          <View className="flex-row items-center gap-2 px-2">
            <Building2 size={12} color={colors.mutedForeground} />
            <Text className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest truncate flex-1">
              {currentOrg.name}
            </Text>
          </View>
        )}
        <TouchableOpacity 
          className="flex-row items-center gap-3 p-2 rounded-xl bg-secondary/50"
          onPress={() => !isWeb && setIsOpen(false)}
        >
          <Avatar className="w-10 h-10 border border-border">
            <AvatarImage source={{ uri: user?.photoURL || '' }} />
            <AvatarFallback>
              <Text className="text-xs font-bold">{user?.email?.charAt(0).toUpperCase()}</Text>
            </AvatarFallback>
          </Avatar>
          <View className="flex-1">
            <Text className="text-sm font-bold text-foreground" numberOfLines={1}>{user?.email}</Text>
            <Text className="text-[10px] text-muted-foreground truncate">Free Plan</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (!isWeb) {
    return (
      <Animated.View
        pointerEvents={isOpen ? 'auto' : 'none'}
        style={[
          styles.nativeDrawer,
          {
            transform: [{ translateX: drawerX }],
          },
        ]}
      >
        {content}
      </Animated.View>
    );
  }

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <View className={cn(
        "hidden md:flex h-full border-r border-border",
        isOpen ? "w-64" : "w-0 overflow-hidden"
      )}>
        {content}
      </View>

      {/* Mobile/Small-Web Drawer Sidebar */}
      <View className={cn(
        "absolute left-0 top-0 bottom-0 z-50 w-72 bg-card shadow-2xl md:hidden",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {content}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  nativeDrawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: DRAWER_WIDTH,
    zIndex: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.24,
    shadowRadius: 24,
    elevation: 18,
  },
});
