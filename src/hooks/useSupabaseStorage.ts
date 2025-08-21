import { useState } from 'react'
import { supabase } from '../lib/supabase'

interface UploadResult {
  url: string | null
  error: string | null
  storagePath: string | null
}

export const useSupabaseStorage = () => {
  const [isUploading, setIsUploading] = useState(false)

  const uploadAudioFile = async (
    audioBlob: Blob,
    _fileName: string, // Not used anymore, we generate safe names
    userId: string
  ): Promise<UploadResult> => {
    try {
      setIsUploading(true)
      
      // Generate safe filename using datetime format
      const now = new Date()
      const dateStr = now.getFullYear().toString() + 
                     (now.getMonth() + 1).toString().padStart(2, '0') + 
                     now.getDate().toString().padStart(2, '0')
      const timeStr = now.getHours().toString().padStart(2, '0') + 
                     now.getMinutes().toString().padStart(2, '0') + 
                     now.getSeconds().toString().padStart(2, '0')
      
      const fileExt = audioBlob.type.split('/')[1] || 'webm'
      const safeFileName = `recording_${dateStr}_${timeStr}.${fileExt}`
      const storagePath = `${userId}/${safeFileName}`
      
      // Upload to Supabase Storage with safe filename
      const { error } = await supabase.storage
        .from('audio-recordings')
        .upload(storagePath, audioBlob, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Upload error:', error)
        return { url: null, error: error.message, storagePath: null }
      }

      // Get a signed URL for secure access (expires in 1 hour)
      const { data: urlData, error: urlError } = await supabase.storage
        .from('audio-recordings')
        .createSignedUrl(storagePath, 3600) // 1 hour expiry

      if (urlError) {
        console.error('Signed URL error:', urlError)
        return { url: null, error: `Failed to create access URL: ${urlError.message}`, storagePath: null }
      }

      return { url: urlData.signedUrl, error: null, storagePath }
    } catch (err) {
      console.error('Upload error:', err)
      return { url: null, error: 'Failed to upload audio file', storagePath: null }
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

  const getSignedUrl = async (filePath: string, expiresIn: number = 3600): Promise<string | null> => {
    try {
      const { data, error } = await supabase.storage
        .from('audio-recordings')
        .createSignedUrl(filePath, expiresIn)

      if (error) {
        console.error('Signed URL error:', error)
        return null
      }

      return data.signedUrl
    } catch (err) {
      console.error('Signed URL error:', err)
      return null
    }
  }

  // Note: Supabase Storage doesn't support renaming files directly
  // We would need to download, re-upload with new name, and delete old file
  // For now, we'll just use the safe filename and allow display names to be different

  return {
    uploadAudioFile,
    deleteAudioFile,
    getSignedUrl,
    isUploading
  }
}
