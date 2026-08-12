import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  RefreshControl,
  Alert,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { useOrg } from '@/providers/org-provider';
import { projectsApi, type Project } from '@/lib/api-client';
import { FolderKanban, Plus, X, Trash2, FolderOpen } from 'lucide-react-native';
import { useTheme } from '@/providers/theme-provider';

import { usePaginatedList } from '@/hooks/use-paginated-list';

export default function ProjectsScreen() {
  const { currentOrg } = useOrg();
  const { colors } = useTheme();

  const fetcher = React.useCallback(
    async (p: number, ps: number) => {
      if (!currentOrg) return { items: [] };
      const res = await projectsApi.list(currentOrg.id, p, ps);
      return { items: res.projects, has_more: res.has_more };
    },
    [currentOrg]
  );

  const {
    data: projects,
    setData: setProjects,
    isLoading,
    isLoadingMore,
    isRefreshing,
    error,
    setError,
    refresh: handleRefresh,
    handleEndReached,
    load,
  } = usePaginatedList<Project>(fetcher, 10);

  useEffect(() => {
    void load(1);
  }, [currentOrg]);

  // Create Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateProject = async () => {
    if (!newProjectName.trim() || !currentOrg) return;
    setIsSubmitting(true);
    setError('');
    try {
      const created = await projectsApi.create({
        organization_id: currentOrg.id,
        name: newProjectName.trim(),
        description: newProjectDesc.trim() || undefined,
        base_url: '',
      });

      setProjects((prev) => [created, ...prev]);
      setModalVisible(false);
      setNewProjectName('');
      setNewProjectDesc('');
    } catch (err: any) {
      console.error('Failed to create project on mobile:', err);
      Alert.alert('Creation Failed', err.message || 'Failed to create workspace.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProject = (projectId: number, projectName: string) => {
    Alert.alert(
      'Delete Workspace',
      `Are you sure you want to delete workspace "${projectName}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await projectsApi.delete(projectId);
              setProjects((prev) => prev.filter((p) => p.id !== projectId));
            } catch (err: any) {
              Alert.alert('Delete Failed', err.message || 'Failed to delete workspace.');
            }
          },
        },
      ]
    );
  };

  if (isLoading && !isRefreshing) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background relative">
      <FlatList
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        data={projects}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.3}
        ListHeaderComponent={
          <View className="mb-6">
            <Text className="text-2xl font-bold text-foreground">Workspaces</Text>
            <Text className="text-sm text-muted-foreground mt-1">
              Manage projects and isolated project areas for {currentOrg?.name}.
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
            <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center mb-4">
              <FolderKanban size={24} color={colors.primary} />
            </View>
            <Text className="text-base font-bold text-foreground">No Workspaces Found</Text>
            <Text className="text-xs text-muted-foreground text-center mt-1 mb-4">
              Create your first isolated workspace for team projects.
            </Text>
            <TouchableOpacity
              onPress={() => setModalVisible(true)}
              className="flex-row items-center gap-2 bg-primary px-4 py-2.5 rounded-xl active:opacity-80"
            >
              <Plus size={16} color={colors.primaryForeground} />
              <Text className="text-sm font-semibold text-primary-foreground">Create Workspace</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item: project }) => (
          <View className="p-4 mb-3 bg-card border border-border rounded-2xl flex-row items-center justify-between">
            <View className="flex-1 flex-row items-center gap-3 pr-2">
              <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center">
                <FolderOpen size={20} color={colors.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-foreground" numberOfLines={1}>
                  {project.name}
                </Text>
                <Text className="text-xs text-muted-foreground mt-0.5" numberOfLines={2}>
                  {project.description || 'No description provided.'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => handleDeleteProject(project.id, project.name)}
              className="p-2 rounded-lg bg-destructive/10 active:opacity-75"
            >
              <Trash2 size={16} color={colors.destructive} />
            </TouchableOpacity>
          </View>
        )}
        ListFooterComponent={
          isLoadingMore ? (
            <View className="py-4 items-center justify-center">
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : null
        }
      />

      {/* Floating Action Button */}
      {projects.length > 0 && (
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
          className="absolute bottom-6 right-6 flex-row items-center gap-2 bg-primary px-5 py-3.5 rounded-full shadow-lg"
          style={{
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 6,
          }}
        >
          <Plus size={18} color={colors.primaryForeground} />
          <Text className="text-sm font-bold text-primary-foreground">New Workspace</Text>
        </TouchableOpacity>
      )}

      {/* Create Workspace Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-card border-t border-border rounded-t-3xl p-6 gap-4">
            <View className="flex-row items-center justify-between pb-2 border-b border-border">
              <Text className="text-lg font-bold text-foreground">Create New Workspace</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            <View className="gap-1.5">
              <Text className="text-xs font-semibold text-foreground">Workspace Name</Text>
              <TextInput
                value={newProjectName}
                onChangeText={setNewProjectName}
                placeholder="e.g. Mobile Redesign"
                placeholderTextColor={colors.mutedForeground}
                className="bg-muted px-4 py-3 rounded-xl border border-border text-sm text-foreground"
              />
            </View>

            <View className="gap-1.5">
              <Text className="text-xs font-semibold text-foreground">Description (Optional)</Text>
              <TextInput
                value={newProjectDesc}
                onChangeText={setNewProjectDesc}
                placeholder="Describe workspace scope or purpose..."
                placeholderTextColor={colors.mutedForeground}
                multiline
                numberOfLines={3}
                className="bg-muted px-4 py-3 rounded-xl border border-border text-sm text-foreground min-h-[80px]"
              />
            </View>

            <View className="flex-row justify-end gap-3 pt-2">
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                className="px-4 py-3 rounded-xl bg-muted border border-border"
              >
                <Text className="text-sm font-semibold text-foreground">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreateProject}
                disabled={isSubmitting || !newProjectName.trim()}
                className={`px-5 py-3 rounded-xl bg-primary flex-row items-center gap-2 ${
                  isSubmitting || !newProjectName.trim() ? 'opacity-50' : ''
                }`}
              >
                {isSubmitting ? <ActivityIndicator size="small" color={colors.primaryForeground} /> : null}
                <Text className="text-sm font-bold text-primary-foreground">Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
