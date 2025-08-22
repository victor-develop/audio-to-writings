import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { UserPrompt, CreateUserPromptData } from '../types/recording'
import { useLoading } from '../contexts/LoadingContext'

export const useUserPrompts = () => {
  const [prompts, setPrompts] = useState<UserPrompt[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { startLoading, stopLoading } = useLoading()

  // Fetch user prompts
  const fetchPrompts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      startLoading()
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No active session')
      }

      const { data, error } = await supabase
        .from('user_prompts')
        .select('*')
        .eq('user_id', session.user.id)
        .order('is_favorite', { ascending: false })
        .order('updated_at', { ascending: false })

      if (error) throw error

      // Transform the data to match our interface
      const transformedPrompts: UserPrompt[] = (data || []).map(prompt => ({
        id: prompt.id,
        userId: prompt.user_id,
        name: prompt.name,
        prompt: prompt.prompt,
        category: prompt.category,
        isFavorite: prompt.is_favorite,
        usageCount: prompt.usage_count,
        createdAt: prompt.created_at,
        updatedAt: prompt.updated_at
      }))

      setPrompts(transformedPrompts)
    } catch (err) {
      console.error('Error fetching prompts:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch prompts')
    } finally {
      setLoading(false)
      stopLoading()
    }
  }, [startLoading, stopLoading])

  // Create a new prompt
  const createPrompt = useCallback(async (promptData: CreateUserPromptData): Promise<UserPrompt | null> => {
    try {
      setError(null)
      startLoading()
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No active session')
      }

      const { data, error } = await supabase
        .from('user_prompts')
        .insert({
          user_id: session.user.id,
          name: promptData.name,
          prompt: promptData.prompt,
          category: promptData.category || 'custom'
        })
        .select()
        .single()

      if (error) throw error

      // Transform the response
      const newPrompt: UserPrompt = {
        id: data.id,
        userId: data.user_id,
        name: data.name,
        prompt: data.prompt,
        category: data.category,
        isFavorite: data.is_favorite,
        usageCount: data.usage_count,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }

      setPrompts(prev => [newPrompt, ...prev])
      return newPrompt
    } catch (err) {
      console.error('Error creating prompt:', err)
      setError(err instanceof Error ? err.message : 'Failed to create prompt')
      return null
    } finally {
      stopLoading()
    }
  }, [startLoading, stopLoading])

  // Update a prompt
  const updatePrompt = useCallback(async (id: string, updates: Partial<CreateUserPromptData>): Promise<boolean> => {
    try {
      setError(null)
      startLoading()
      
      const { error } = await supabase
        .from('user_prompts')
        .update({
          name: updates.name,
          prompt: updates.prompt,
          category: updates.category,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error

      setPrompts(prev => prev.map(prompt => 
        prompt.id === id 
          ? { ...prompt, ...updates, updatedAt: new Date().toISOString() }
          : prompt
      ))

      return true
    } catch (err) {
      console.error('Error updating prompt:', err)
      setError(err instanceof Error ? err.message : 'Failed to update prompt')
      return false
    } finally {
      stopLoading()
    }
  }, [startLoading, stopLoading])

  // Delete a prompt
  const deletePrompt = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null)
      startLoading()
      
      const { error } = await supabase
        .from('user_prompts')
        .delete()
        .eq('id', id)

      if (error) throw error

      setPrompts(prev => prev.filter(prompt => prompt.id !== id))
      return true
    } catch (err) {
      console.error('Error deleting prompt:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete prompt')
      return false
    } finally {
      stopLoading()
    }
  }, [startLoading, stopLoading])

  // Toggle favorite status
  const toggleFavorite = useCallback(async (id: string): Promise<boolean> => {
    try {
      startLoading()
      const prompt = prompts.find(p => p.id === id)
      if (!prompt) return false

      const { error } = await supabase
        .from('user_prompts')
        .update({ is_favorite: !prompt.isFavorite })
        .eq('id', id)

      if (error) throw error

      setPrompts(prev => prev.map(p => 
        p.id === id ? { ...p, isFavorite: !p.isFavorite } : p
      ))

      return true
    } catch (err) {
      console.error('Error toggling favorite:', err)
      setError(err instanceof Error ? err.message : 'Failed to update favorite status')
      return false
    } finally {
      stopLoading()
    }
  }, [prompts, startLoading, stopLoading])

  // Increment usage count
  const incrementUsage = useCallback(async (id: string): Promise<boolean> => {
    try {
      startLoading()
      // First get the current prompt to get the current usage count
      const prompt = prompts.find(p => p.id === id)
      if (!prompt) return false

      const { error } = await supabase
        .from('user_prompts')
        .update({ 
          usage_count: prompt.usageCount + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error

      setPrompts(prev => prev.map(p => 
        p.id === id 
          ? { ...p, usageCount: p.usageCount + 1, updatedAt: new Date().toISOString() }
          : p
      ))

      return true
    } catch (err) {
      console.error('Error incrementing usage:', err)
      return false
    } finally {
      stopLoading()
    }
  }, [prompts, startLoading, stopLoading])

  // Auto-generate name for prompt
  const generatePromptName = useCallback((prompt: string): string => {
    // Extract first meaningful line or first 50 characters
    const lines = prompt.trim().split('\n').filter(line => line.trim().length > 0)
    const firstLine = lines[0] || prompt
    
    // Clean up the text and limit to 50 characters
    let name = firstLine
      .replace(/[#*`]/g, '') // Remove markdown symbols
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim()
    
    if (name.length > 50) {
      name = name.substring(0, 47) + '...'
    }
    
    return name || 'Custom Prompt'
  }, [])

  // Load prompts on mount
  useEffect(() => {
    fetchPrompts()
  }, [fetchPrompts])

  return {
    prompts,
    loading,
    error,
    createPrompt,
    updatePrompt,
    deletePrompt,
    toggleFavorite,
    incrementUsage,
    generatePromptName,
    refreshPrompts: fetchPrompts
  }
}
