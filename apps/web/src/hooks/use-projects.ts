import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { projectsApi } from "@/lib/api-client"
import type { ProjectCreateInput, ProjectUpdateInput } from "@skeleton/shared-types"

// ============================================
// Project Hooks
// ============================================

export function useProjects(organizationId: number, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ["projects", organizationId, page, pageSize],
    queryFn: async () => {
      const data = await projectsApi.list(organizationId, page, pageSize)
      return data
    },
    enabled: !!organizationId,
  })
}

export function useProject(projectId: number) {
  return useQuery({
    queryKey: ["project", projectId],
    queryFn: () => projectsApi.get(projectId),
    enabled: !!projectId,
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ProjectCreateInput) => projectsApi.create(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["projects", variables.organization_id],
      })
    },
  })
}

export function useUpdateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: {
      id: number
      data: ProjectUpdateInput
    }) => projectsApi.update(id, data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: ["project", result.id],
      })
      queryClient.invalidateQueries({
        queryKey: ["projects"],
      })
    },
  })
}

export function useDeleteProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => projectsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["projects"],
      })
    },
  })
}
