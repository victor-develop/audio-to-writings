import { supabase } from '../lib/supabase'
import { Recording } from '../types/recording'

export interface CreateRecordingData {
  title: string
  audioUrl: string
  duration: number
  storagePath?: string
  userId: string
}

export interface UpdateRecordingData {
  id: string
  title?: string
  userId: string
}

// Transform database record to our interface
const transformRecording = (data: any): Recording => ({
  id: data.id,
  title: data.title,
  audioUrl: data.audio_url,
  duration: data.duration,
  createdAt: data.created_at,
  storagePath: data.storage_path || undefined
})

// Transform array of database records
const transformRecordings = (data: any[]): Recording[] => 
  data.map(transformRecording)

export const recordingsApi = {
  getAll: async (userId: string): Promise<Recording[]> => {
    const { data, error } = await supabase
      .from('recordings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return transformRecordings(data || [])
  },
  
  create: async (recordingData: CreateRecordingData): Promise<Recording> => {
    const { data, error } = await supabase
      .from('recordings')
      .insert({
        user_id: recordingData.userId,
        title: recordingData.title,
        audio_url: recordingData.audioUrl,
        duration: recordingData.duration,
        storage_path: recordingData.storagePath
      })
      .select()
      .single()
    
    if (error) throw error
    return transformRecording(data)
  },
  
  update: async ({ id, ...updates }: UpdateRecordingData): Promise<Recording> => {
    const { data, error } = await supabase
      .from('recordings')
      .update({
        title: updates.title,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return transformRecording(data)
  },
  
  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('recordings')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },
}
