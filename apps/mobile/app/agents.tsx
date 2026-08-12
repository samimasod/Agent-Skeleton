import React, { useEffect, useState } from 'react';
import { View, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Text } from '@/components/ui/text';
import { useOrg } from '@/providers/org-provider';
import { agentsApi, type Agent } from '@/lib/api-client';
import { useRouter } from 'expo-router';
import { Bot, MessageSquare, ChevronRight } from 'lucide-react-native';
import { useTheme } from '@/providers/theme-provider';

import { usePaginatedList } from '@/hooks/use-paginated-list';

export default function AgentsScreen() {
  const { currentOrg } = useOrg();
  const router = useRouter();
  const { colors } = useTheme();

  const fetcher = React.useCallback(
    async (p: number, ps: number) => {
      if (!currentOrg) return { items: [] };
      const res = await agentsApi.list(currentOrg.id, p, ps);
      return { items: res.agents, has_more: res.has_more };
    },
    [currentOrg]
  );

  const {
    data: agents,
    isLoading,
    isLoadingMore,
    isRefreshing,
    error,
    refresh: handleRefresh,
    handleEndReached,
    load,
  } = usePaginatedList<Agent>(fetcher, 10);

  useEffect(() => {
    void load(1);
  }, [currentOrg]);

  if (isLoading && !isRefreshing) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      className="flex-1 bg-background"
      contentContainerStyle={{ padding: 20 }}
      data={agents}
      keyExtractor={(item) => item.id.toString()}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.3}
      ListHeaderComponent={
        <View className="mb-6">
          <Text className="text-2xl font-bold text-foreground">Agent Builder</Text>
          <Text className="text-sm text-muted-foreground mt-1">
            Chat with conversational AI models customized for {currentOrg?.name}.
          </Text>
          {error ? (
            <View className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 mt-4">
              <Text className="text-sm text-destructive">{error}</Text>
            </View>
          ) : null}
        </View>
      }
      ListEmptyComponent={
        <View className="items-center justify-center p-8 border border-dashed border-border rounded-2xl bg-card">
          <Bot size={32} color={colors.mutedForeground} />
          <Text className="text-base font-semibold text-foreground mt-2">No Agents Available</Text>
          <Text className="text-xs text-muted-foreground text-center mt-1">
            Build your first AI Agent on the Web Dashboard to unlock assistant playground capabilities on mobile.
          </Text>
        </View>
      }
      renderItem={({ item: agent }) => (
        <TouchableOpacity
          key={agent.id}
          onPress={() => router.push({ pathname: '/agent-chat', params: { agentId: agent.id } })}
          activeOpacity={0.7}
          className="p-4 mb-3 bg-card border border-border rounded-2xl flex-row items-center justify-between"
        >
          <View className="flex-1 flex-row items-center gap-3 pr-2">
            <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
              <Bot size={20} color={colors.primary} />
            </View>
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Text className="text-base font-bold text-foreground" numberOfLines={1}>
                  {agent.name}
                </Text>
                <View className="px-2 py-0.5 rounded-full bg-muted">
                  <Text className="text-[10px] font-mono text-muted-foreground">{agent.model_id}</Text>
                </View>
              </View>
              <Text className="text-xs text-muted-foreground mt-1" numberOfLines={2}>
                {agent.description || 'No description provided.'}
              </Text>
            </View>
          </View>
          <ChevronRight size={18} color={colors.mutedForeground} />
        </TouchableOpacity>
      )}
      ListFooterComponent={
        isLoadingMore ? (
          <View className="py-4 items-center justify-center">
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : null
      }
    />
  );
}
