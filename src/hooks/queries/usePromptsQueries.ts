import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { promptsApi } from '../../services/promptsApi'
import { queryKeys } from '../../lib/queryKeys'
import { UserPrompt } from '../../types/recording'
import { useLoading } from '../../contexts/LoadingContext'

export const usePrompts = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.prompts.list(userId),
    queryFn: () => promptsApi.getAll(userId),
    enabled: !!userId,
  })
}

export const useCreatePrompt = () => {
  const queryClient = useQueryClient()
  const { startLoading, stopLoading } = useLoading()
  
  return useMutation({
    mutationFn: promptsApi.create,
    onMutate: () => startLoading(),
    onSuccess: (newPrompt) => {
      // Optimistic update
      queryClient.setQueryData(
        queryKeys.prompts.list(newPrompt.userId),
        (old: UserPrompt[] = []) => [newPrompt, ...old]
      )
      stopLoading()
    },
    onError: () => stopLoading(),
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({
        queryKey: queryKeys.prompts.lists()
      })
    },
  })
}

export const useUpdatePrompt = () => {
  const queryClient = useQueryClient()
  const { startLoading, stopLoading } = useLoading()
  
  return useMutation({
    mutationFn: promptsApi.update,
    onMutate: async ({ id, ...updates }) => {
      startLoading()
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.prompts.lists()
      })
      
      // Snapshot previous value
      const previousPrompts = queryClient.getQueryData(
        queryKeys.prompts.list(updates.userId!)
      )
      
      // Optimistically update
      queryClient.setQueryData(
        queryKeys.prompts.list(updates.userId!),
        (old: UserPrompt[] = []) =>
          old.map(prompt =>
            prompt.id === id ? { ...prompt, ...updates } : prompt
          )
      )
      
      return { previousPrompts }
    },
    onError: (_err, variables, context) => {
      // Rollback on error
      if (context?.previousPrompts) {
        queryClient.setQueryData(
          queryKeys.prompts.list(variables.userId!),
          context.previousPrompts
        )
      }
      stopLoading()
    },
    onSuccess: () => stopLoading(),
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.prompts.lists()
      })
    },
  })
}

export const useDeletePrompt = () => {
  const queryClient = useQueryClient()
  const { startLoading, stopLoading } = useLoading()
  
  return useMutation({
    mutationFn: promptsApi.delete,
    onMutate: async (id) => {
      startLoading()
      await queryClient.cancelQueries({
        queryKey: queryKeys.prompts.lists()
      })
      
      // Get all queries that might contain this prompt
      const queries = queryClient.getQueriesData({
        queryKey: queryKeys.prompts.lists()
      })
      
      // Optimistically remove from all lists
      queries.forEach(([queryKey, data]) => {
        if (Array.isArray(data)) {
          queryClient.setQueryData(
            queryKey,
            data.filter((prompt: UserPrompt) => prompt.id !== id)
          )
        }
      })
      
      return { queries }
    },
    onError: (_err, _id, context) => {
      // Rollback on error
      context?.queries.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data)
      })
      stopLoading()
    },
    onSuccess: () => stopLoading(),
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.prompts.lists()
      })
    },
  })
}

export const useTogglePromptFavorite = () => {
  const queryClient = useQueryClient()
  const { startLoading, stopLoading } = useLoading()
  
  return useMutation({
    mutationFn: ({ id, isFavorite }: { id: string; isFavorite: boolean }) =>
      promptsApi.toggleFavorite(id, isFavorite),
    onMutate: async ({ id, isFavorite }) => {
      startLoading()
      await queryClient.cancelQueries({
        queryKey: queryKeys.prompts.lists()
      })
      
      // Get all queries that might contain this prompt
      const queries = queryClient.getQueriesData({
        queryKey: queryKeys.prompts.lists()
      })
      
      // Optimistically update favorite status
      queries.forEach(([queryKey, data]) => {
        if (Array.isArray(data)) {
          queryClient.setQueryData(
            queryKey,
            data.map((prompt: UserPrompt) =>
              prompt.id === id ? { ...prompt, isFavorite } : prompt
            )
          )
        }
      })
      
      return { queries }
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      context?.queries.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data)
      })
      stopLoading()
    },
    onSuccess: () => stopLoading(),
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.prompts.lists()
      })
    },
  })
}

export const useIncrementPromptUsage = () => {
  const queryClient = useQueryClient()
  const { startLoading, stopLoading } = useLoading()
  
  return useMutation({
    mutationFn: ({ id, currentUsage }: { id: string; currentUsage: number }) =>
      promptsApi.incrementUsage(id, currentUsage),
    onMutate: async ({ id, currentUsage }) => {
      startLoading()
      await queryClient.cancelQueries({
        queryKey: queryKeys.prompts.lists()
      })
      
      // Get all queries that might contain this prompt
      const queries = queryClient.getQueriesData({
        queryKey: queryKeys.prompts.lists()
      })
      
      // Optimistically update usage count
      queries.forEach(([queryKey, data]) => {
        if (Array.isArray(data)) {
          queryClient.setQueryData(
            queryKey,
            data.map((prompt: UserPrompt) =>
              prompt.id === id ? { ...prompt, usageCount: currentUsage + 1 } : prompt
            )
          )
        }
      })
      
      return { queries }
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      context?.queries.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data)
      })
      stopLoading()
    },
    onSuccess: () => stopLoading(),
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.prompts.lists()
      })
    },
  })
}
