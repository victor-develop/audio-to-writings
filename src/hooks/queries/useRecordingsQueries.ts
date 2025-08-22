import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { recordingsApi } from '../../services/recordingsApi'
import { queryKeys } from '../../lib/queryKeys'
import { Recording } from '../../types/recording'
import { useLoading } from '../../contexts/LoadingContext'

export const useRecordings = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.recordings.list(userId),
    queryFn: () => recordingsApi.getAll(userId),
    enabled: !!userId,
  })
}

export const useCreateRecording = () => {
  const queryClient = useQueryClient()
  const { startLoading, stopLoading } = useLoading()
  
  return useMutation({
    mutationFn: recordingsApi.create,
    onMutate: () => startLoading(),
    onSuccess: (newRecording) => {
      // Optimistic update
      queryClient.setQueryData(
        queryKeys.recordings.list(newRecording.userId || ''),
        (old: Recording[] = []) => [newRecording, ...old]
      )
      stopLoading()
    },
    onError: () => stopLoading(),
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({
        queryKey: queryKeys.recordings.lists()
      })
    },
  })
}

export const useUpdateRecording = () => {
  const queryClient = useQueryClient()
  const { startLoading, stopLoading } = useLoading()
  
  return useMutation({
    mutationFn: recordingsApi.update,
    onMutate: async ({ id, ...updates }) => {
      startLoading()
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.recordings.lists()
      })
      
      // Snapshot previous value
      const previousRecordings = queryClient.getQueryData(
        queryKeys.recordings.list(updates.userId!)
      )
      
      // Optimistically update
      queryClient.setQueryData(
        queryKeys.recordings.list(updates.userId!),
        (old: Recording[] = []) =>
          old.map(recording =>
            recording.id === id ? { ...recording, ...updates } : recording
          )
      )
      
      return { previousRecordings }
    },
    onError: (_err, variables, context) => {
      // Rollback on error
      if (context?.previousRecordings) {
        queryClient.setQueryData(
          queryKeys.recordings.list(variables.userId!),
          context.previousRecordings
        )
      }
      stopLoading()
    },
    onSuccess: () => stopLoading(),
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.recordings.lists()
      })
    },
  })
}

export const useDeleteRecording = () => {
  const queryClient = useQueryClient()
  const { startLoading, stopLoading } = useLoading()
  
  return useMutation({
    mutationFn: recordingsApi.delete,
    onMutate: async (id) => {
      startLoading()
      await queryClient.cancelQueries({
        queryKey: queryKeys.recordings.lists()
      })
      
      // Get all queries that might contain this recording
      const queries = queryClient.getQueriesData({
        queryKey: queryKeys.recordings.lists()
      })
      
      // Optimistically remove from all lists
      queries.forEach(([queryKey, data]) => {
        if (Array.isArray(data)) {
          queryClient.setQueryData(
            queryKey,
            data.filter((recording: Recording) => recording.id !== id)
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
        queryKey: queryKeys.recordings.lists()
      })
    },
  })
}
