import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { Recording } from '../types/recording'
import { useLoading } from '../contexts/LoadingContext'

export const useSupabaseRecordings = () => {
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { startLoading, stopLoading } = useLoading()

  // Fetch user recordings
  const fetchRecordings = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      startLoading()
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No active session')
      }

      const { data, error } = await supabase
        .from('recordings')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Transform the data to match our interface
      const transformedRecordings: Recording[] = (data || []).map(recording => ({
        id: recording.id,
        title: recording.title,
        audioUrl: recording.audio_url,
        duration: recording.duration,
        createdAt: recording.created_at,
        storagePath: recording.storage_path || undefined
      }))

      setRecordings(transformedRecordings)
    } catch (err) {
      console.error('Error fetching recordings:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch recordings')
    } finally {
      setLoading(false)
      stopLoading()
    }
  }, [startLoading, stopLoading])

  // Create a new recording
  const createRecording = useCallback(async (recordingData: Omit<Recording, 'id'>): Promise<Recording | null> => {
    try {
      setError(null)
      startLoading()
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No active session')
      }

      const { data, error } = await supabase
        .from('recordings')
        .insert({
          user_id: session.user.id,
          title: recordingData.title,
          audio_url: recordingData.audioUrl,
          duration: recordingData.duration,
          storage_path: recordingData.storagePath
        })
        .select()
        .single()

      if (error) throw error

      // Transform the response
      const newRecording: Recording = {
        id: data.id,
        title: data.title,
        audioUrl: data.audio_url,
        duration: data.duration,
        createdAt: data.created_at,
        storagePath: data.storage_path || undefined
      }

      setRecordings(prev => [newRecording, ...prev])
      return newRecording
    } catch (err) {
      console.error('Error creating recording:', err)
      setError(err instanceof Error ? err.message : 'Failed to create recording')
      return null
    } finally {
      stopLoading()
    }
  }, [startLoading, stopLoading])

  // Update a recording
  const updateRecording = useCallback(async (id: string, updates: Partial<Pick<Recording, 'title'>>): Promise<boolean> => {
    try {
      setError(null)
      startLoading()
      
      const { error } = await supabase
        .from('recordings')
        .update({
          title: updates.title,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error

      setRecordings(prev => prev.map(recording => 
        recording.id === id 
          ? { ...recording, ...updates }
          : recording
      ))

      return true
    } catch (err) {
      console.error('Error updating recording:', err)
      setError(err instanceof Error ? err.message : 'Failed to update recording')
      return false
    } finally {
      stopLoading()
    }
  }, [startLoading, stopLoading])

  // Delete a recording
  const deleteRecording = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null)
      startLoading()
      
      const { error } = await supabase
        .from('recordings')
        .delete()
        .eq('id', id)

      if (error) throw error

      setRecordings(prev => prev.filter(recording => recording.id !== id))
      return true
    } catch (err) {
      console.error('Error deleting recording:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete recording')
      return false
    } finally {
      stopLoading()
    }
  }, [startLoading, stopLoading])

  // Load recordings on mount
  useEffect(() => {
    fetchRecordings()
  }, [fetchRecordings])

  return {
    recordings,
    loading,
    error,
    createRecording,
    updateRecording,
    deleteRecording,
    refreshRecordings: fetchRecordings
  }
}
