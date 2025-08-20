import { useState } from 'react'
import { supabase } from '../lib/supabase'

interface UploadResult {
  url: string | null
  error: string | null
}

export const useSupabaseStorage = () => {
  const [isUploading, setIsUploading] = useState(false)

  const uploadAudioFile = async (
    audioBlob: Blob,
    fileName: string,
    userId: string
  ): Promise<UploadResult> => {
    try {
      setIsUploading(true)
      
      // Create a unique filename
      const timestamp = Date.now()
      const fileExt = audioBlob.type.split('/')[1] || 'webm'
      const fileNameWithExt = `${fileName}_${timestamp}.${fileExt}`
      
      // Upload to Supabase Storage
      const { error } = await supabase.storage
        .from('audio-recordings')
        .upload(`${userId}/${fileNameWithExt}`, audioBlob, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Upload error:', error)
        return { url: null, error: error.message }
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('audio-recordings')
        .getPublicUrl(`${userId}/${fileNameWithExt}`)

      return { url: urlData.publicUrl, error: null }
    } catch (err) {
      console.error('Upload error:', err)
      return { url: null, error: 'Failed to upload audio file' }
    } finally {
      setIsUploading(false)
    }
  }

  const deleteAudioFile = async (filePath: string): Promise<boolean> => {
    try {
      const { error } = await supabase.storage
        .from('audio-recordings')
        .remove([filePath])

      if (error) {
        console.error('Delete error:', error)
        return false
      }

      return true
    } catch (err) {
      console.error('Delete error:', err)
      return false
    }
  }

  return {
    uploadAudioFile,
    deleteAudioFile,
    isUploading
  }
}
