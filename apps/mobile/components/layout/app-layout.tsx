import React, { useState } from 'react';
import { View, Platform, TouchableWithoutFeedback } from 'react-native';
import { Sidebar } from '@/components/layout/sidebar';
import { TopBar } from '@/components/layout/top-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cn } from '@/lib/utils';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(Platform.OS === 'web');

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      <View className="flex-1 flex-row bg-background">
      {/* Sidebar - Desktop (Static) / Mobile (Conditional) */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* Mobile/Small Web Backdrop */}
      {isSidebarOpen && (
        <TouchableWithoutFeedback onPress={() => setIsSidebarOpen(false)}>
          <View className={cn(
            "absolute inset-0 bg-black/50 z-40",
            "md:hidden" // Hide backdrop on desktop if sidebar is relative
          )} />
        </TouchableWithoutFeedback>
      )}

      {/* Main Content Area */}
      <View className="flex-1 flex flex-col h-full overflow-hidden">
        <TopBar onMenuPress={toggleSidebar} />
        {/* Scrollable content zone - constrained width on web */}
        <View className="flex-1 overflow-auto">
          <View className="flex-1 w-full max-w-5xl self-center">
            {children}
          </View>
        </View>
      </View>
      </View>
    </SafeAreaView>
  );
}
