import { supabase } from '../lib/supabase'
import { UserPrompt } from '../types/recording'

export interface CreatePromptData {
  name: string
  prompt: string
  category?: string
  userId: string
}

export interface UpdatePromptData {
  id: string
  name?: string
  prompt?: string
  category?: string
  userId: string
}

// Transform database record to our interface
const transformPrompt = (data: any): UserPrompt => ({
  id: data.id,
  userId: data.user_id,
  name: data.name,
  prompt: data.prompt,
  category: data.category,
  isFavorite: data.is_favorite,
  usageCount: data.usage_count,
  createdAt: data.created_at,
  updatedAt: data.updated_at
})

// Transform array of database records
const transformPrompts = (data: any[]): UserPrompt[] => 
  data.map(transformPrompt)

export const promptsApi = {
  getAll: async (userId: string): Promise<UserPrompt[]> => {
    const { data, error } = await supabase
      .from('user_prompts')
      .select('*')
      .eq('user_id', userId)
      .order('is_favorite', { ascending: false })
      .order('updated_at', { ascending: false })
    
    if (error) throw error
    return transformPrompts(data || [])
  },
  
  create: async (promptData: CreatePromptData): Promise<UserPrompt> => {
    const { data, error } = await supabase
      .from('user_prompts')
      .insert({
        user_id: promptData.userId,
        name: promptData.name,
        prompt: promptData.prompt,
        category: promptData.category || 'custom'
      })
      .select()
      .single()
    
    if (error) throw error
    return transformPrompt(data)
  },
  
  update: async ({ id, ...updates }: UpdatePromptData): Promise<UserPrompt> => {
    const { data, error } = await supabase
      .from('user_prompts')
      .update({
        name: updates.name,
        prompt: updates.prompt,
        category: updates.category,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return transformPrompt(data)
  },
  
  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('user_prompts')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },
  
  toggleFavorite: async (id: string, isFavorite: boolean): Promise<UserPrompt> => {
    const { data, error } = await supabase
      .from('user_prompts')
      .update({ is_favorite: isFavorite })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return transformPrompt(data)
  },
  
  incrementUsage: async (id: string, currentUsage: number): Promise<UserPrompt> => {
    const { data, error } = await supabase
      .from('user_prompts')
      .update({ 
        usage_count: currentUsage + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return transformPrompt(data)
  },
}
