import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Mic, Square, Pause, Play, Loader2 } from 'lucide-react'
import { useAudioRecorder } from '../hooks/useAudioRecorder'
import { useSupabaseStorage } from '../hooks/useSupabaseStorage'
import { useRecordings, useCreateRecording, useUpdateRecording, useDeleteRecording } from '../hooks/queries/useRecordingsQueries'
import { useAuth } from '../contexts/AuthContext'
import { Recording } from '../types/recording'

import RecordingHistory from './RecordingHistory'
import AudioPlayer from './AudioPlayer'
import TranscriptionModal from './TranscriptionModal'

const RecordingInterface: React.FC = () => {
  const { user } = useAuth()
  const {
    isRecording,
    isPaused,
    duration,
    audioBlob,
    audioUrl,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
    formatDuration
  } = useAudioRecorder()

  const { uploadAudioFile, getSignedUrl } = useSupabaseStorage()
  
  // TanStack Query hooks
  const {
    data: recordings = [],
    isLoading: recordingsLoading,
    error: recordingsError
  } = useRecordings(user?.id || '')
  
  const createRecordingMutation = useCreateRecording()
  const updateRecordingMutation = useUpdateRecording()
  const deleteRecordingMutation = useDeleteRecording()

  const [isAutoSaving, setIsAutoSaving] = useState(false)
  const [hasAutoSaved, setHasAutoSaved] = useState(false)
  const [playingRecording, setPlayingRecording] = useState<Recording | null>(null)
  const [transcribingRecording, setTranscribingRecording] = useState<Recording | null>(null)

  // Generate default filename based on current date/time
  const generateDefaultFilename = useCallback(() => {
    const now = new Date()
    const dateStr = now.toLocaleDateString('zh-CN', { 
      month: '2-digit', 
      day: '2-digit' 
    }).replace(/\//g, '月') + '日'
    const timeStr = now.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
    return `录音 ${dateStr} ${timeStr}`
  }, [])

  // Clean up recordings with invalid URLs (blob URLs, localhost, etc.)
  const cleanupInvalidRecordings = useCallback(async () => {
    const validRecordings = recordings.filter(recording => {
      const isValidUrl = recording.audioUrl && 
        !recording.audioUrl.startsWith('blob:') && 
        !recording.audioUrl.includes('localhost') && 
        !recording.audioUrl.includes('127.0.0.1') &&
        (recording.audioUrl.startsWith('http') || recording.audioUrl.startsWith('https'))
      
      if (!isValidUrl) {
        console.log('Found recording with invalid URL:', recording.title, recording.audioUrl)
      }
      
      return isValidUrl
    })
    
    // Delete invalid recordings from Supabase
    const invalidRecordings = recordings.filter(recording => !validRecordings.includes(recording))
    for (const recording of invalidRecordings) {
      await deleteRecordingMutation.mutateAsync(recording.id)
      console.log('Deleted invalid recording:', recording.title)
    }
    
    if (invalidRecordings.length > 0) {
      console.log(`Cleaned up ${invalidRecordings.length} recordings with invalid URLs`)
    }
  }, [recordings, deleteRecordingMutation])

  // Auto-save function that triggers after recording stops
  const autoSaveRecording = useCallback(async () => {
    if (audioBlob && user && !hasAutoSaved && !isAutoSaving) {
      setIsAutoSaving(true)
      setHasAutoSaved(true)
      
      try {
        const defaultTitle = generateDefaultFilename()
        
        // Upload to Supabase Storage - NO FALLBACKS
        const result = await uploadAudioFile(audioBlob, defaultTitle, user.id)
        const { url, error } = result
        
        if (error) {
          console.error('Failed to upload audio:', error)
          throw new Error(`Failed to upload audio: ${error}`)
        }
        
        if (!url) {
          throw new Error('No URL returned from upload')
        }
        
        // Only save if we have a valid Supabase URL
        const newRecordingData = {
          title: defaultTitle, // Auto-generated title
          audioUrl: url,
          duration,
          createdAt: new Date().toISOString(),
          storagePath: result.storagePath || undefined, // Internal storage path
          userId: user.id
        }
        
        console.log('Auto-saving new recording:', newRecordingData)
        console.log('Storage path used:', result.storagePath)
        
        // Save to Supabase database
        const savedRecording = await createRecordingMutation.mutateAsync(newRecordingData)
        if (savedRecording) {
          console.log('Recording saved to Supabase:', savedRecording)
        }
        
        resetRecording()
        setHasAutoSaved(false) // Reset for next recording
        
      } catch (err) {
        console.error('Error auto-saving recording:', err)
        alert(`Failed to save recording: ${err instanceof Error ? err.message : 'Unknown error'}`)
        // Reset the flag so user can try again
        setHasAutoSaved(false)
      } finally {
        setIsAutoSaving(false)
      }
    }
  }, [audioBlob, user, hasAutoSaved, isAutoSaving, generateDefaultFilename, uploadAudioFile, duration, createRecordingMutation, resetRecording])

  // Clean up invalid recordings only on component mount
  useEffect(() => {
    cleanupInvalidRecordings()
  }, [cleanupInvalidRecordings])

  // Auto-save when recording stops and we have audio
  useEffect(() => {
    if (audioBlob && !isRecording && !isPaused && user) {
      autoSaveRecording()
    }
  }, [audioBlob, isRecording, isPaused, user, autoSaveRecording])

  // Log recordings for debugging (but don't trigger cleanup)
  useEffect(() => {
    console.log('Current recordings:', recordings)
    const invalidRecordings = recordings.filter(r => r.audioUrl && r.audioUrl.startsWith('blob:'))
    if (invalidRecordings.length > 0) {
      console.warn('Found recordings with blob URLs:', invalidRecordings)
    }
  }, [recordings])

  // Add global debug functions to window object
  useEffect(() => {
    // @ts-ignore
    window.showDebugControls = () => {
      const debugElement = document.getElementById('debug-controls')
      if (debugElement) {
        debugElement.classList.remove('hidden')
        console.log('Debug controls shown. Use hideDebugControls() to hide them.')
      }
    }
    
    // @ts-ignore
    window.hideDebugControls = () => {
      const debugElement = document.getElementById('debug-controls')
      if (debugElement) {
        debugElement.classList.add('hidden')
        console.log('Debug controls hidden.')
      }
    }
    
    // @ts-ignore
    window.getRecordingStats = () => {
      const stats = {
        total: recordings.length,
        valid: recordings.filter(r => r.audioUrl && r.audioUrl.startsWith('http')).length,
        invalid: recordings.filter(r => r.audioUrl && r.audioUrl.startsWith('blob:')).length,
        recordings: recordings.map(r => ({ title: r.title, url: r.audioUrl, valid: r.audioUrl && r.audioUrl.startsWith('http') }))
      }
      console.table(stats.recordings)
      console.log('Recording Stats:', stats)
      return stats
    }
    
    console.log('Debug functions available: showDebugControls(), hideDebugControls(), getRecordingStats()')
  }, [recordings])

  // Force clear all recordings (for debugging)
  const forceClearAllRecordings = useCallback(async () => {
    if (confirm('This will delete ALL recordings. Are you sure?')) {
      // Delete all recordings from Supabase
      for (const recording of recordings) {
        await deleteRecordingMutation.mutateAsync(recording.id)
      }
      console.log('All recordings cleared from Supabase')
    }
  }, [recordings, deleteRecordingMutation])

  // Clear only invalid recordings
  const clearInvalidRecordings = useCallback(() => {
    const initialCount = recordings.length
    console.log(`Manual cleanup triggered. Initial count: ${initialCount}`)
    cleanupInvalidRecordings()
  }, [cleanupInvalidRecordings])



  const handleStartRecording = useCallback(() => {
    setHasAutoSaved(false) // Reset for new recording
    startRecording()
  }, [startRecording])

  const handleDeleteRecording = async (id: string) => {
    await deleteRecordingMutation.mutateAsync(id)
    console.log(`Deleted recording ${id}`)
  }

  const handleRenameRecording = async (id: string, newTitle: string) => {
    await updateRecordingMutation.mutateAsync({ id, title: newTitle, userId: user?.id || '' })
    console.log(`Renamed recording ${id} to: ${newTitle}`)
  }

  // Refresh expired signed URLs
  const refreshExpiredUrl = async (recording: Recording) => {
    if (recording.storagePath) {
      const newUrl = await getSignedUrl(recording.storagePath, 3600)
      if (newUrl) {
        // Update the recording in Supabase with the new URL
        await updateRecordingMutation.mutateAsync({ 
          id: recording.id, 
          title: recording.title, 
          userId: user?.id || '' 
        })
        console.log(`Refreshed URL for recording: ${recording.title}`)
        return newUrl
      }
    }
    return null
  }

  const handlePlayRecording = async (recording: Recording) => {
    // Check if URL might be expired and refresh if needed
    if (recording.storagePath) {
      try {
        const refreshedUrl = await refreshExpiredUrl(recording)
        if (refreshedUrl) {
          // Create a new recording object with the refreshed URL
          const refreshedRecording = { ...recording, audioUrl: refreshedUrl }
          setPlayingRecording(refreshedRecording)
          return
        }
      } catch (error) {
        console.error('Failed to refresh URL for playback:', error)
        // Fall back to original recording if refresh fails
      }
    }
    
    // Use original recording if no refresh needed or refresh failed
    setPlayingRecording(recording)
  }

  const handleTranscribeRecording = (recording: Recording) => {
    setTranscribingRecording(recording)
  }

  const handleDownloadRecording = async (recording: Recording) => {
    // Only handle Supabase storage recordings - no blob fallbacks
    if (recording.audioUrl && recording.audioUrl.startsWith('http')) {
      try {
        // Check if URL might be expired and refresh if needed
        let downloadUrl = recording.audioUrl
        if (recording.storagePath) {
          const refreshedUrl = await refreshExpiredUrl(recording)
          if (refreshedUrl) {
            downloadUrl = refreshedUrl
          }
        }

        const response = await fetch(downloadUrl)
        if (!response.ok) {
          throw new Error(`Failed to fetch audio: ${response.status}`)
        }
        
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${recording.title}.webm`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } catch (error) {
        console.error('Failed to download recording:', error)
        alert(`Failed to download recording: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    } else {
      alert('This recording cannot be downloaded. Please re-record and save.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-3">出口成章 AI</h1>
          <p className="text-xl text-primary-600 font-semibold mb-2">把你的每一次表达，都沉淀为穿越时间的内容。</p>
          <p className="text-gray-600">点击录音，即刻将灵感转化为文章、笔记与专业洞察。</p>
        </motion.div>



        {/* Debug Controls - Hidden by default, use console command to show */}
        <motion.div
          id="debug-controls"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-6 hidden"
        >
          <div className="text-center">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">🔧 Debug Controls</h3>
            <p className="text-sm text-yellow-700 mb-3">
              Current recordings: {recordings.length} | 
              Invalid URLs: {recordings.filter(r => r.audioUrl && r.audioUrl.startsWith('blob:')).length} |
              Valid URLs: {recordings.filter(r => r.audioUrl && r.audioUrl.startsWith('http')).length}
            </p>
            {recordings.length > 0 && (
              <div className="text-xs text-yellow-600 mb-3">
                Latest: {recordings[0]?.title} ({recordings[0]?.audioUrl?.startsWith('http') ? 'Valid' : 'Invalid'})
              </div>
            )}
            <div className="flex justify-center space-x-3">
              <button
                onClick={clearInvalidRecordings}
                className="px-4 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 text-sm font-medium rounded-lg transition-colors duration-200"
              >
                Clear Invalid Recordings
              </button>
              <button
                onClick={forceClearAllRecordings}
                className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 text-sm font-medium rounded-lg transition-colors duration-200"
              >
                Clear ALL Recordings
              </button>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recording Controls */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="card"
          >
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Voice Capture</h2>
            
            {/* Duration Display */}
            <div className="text-center mb-6">
              <div className="text-4xl font-mono font-bold text-primary-600">
                {formatDuration(duration)}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {isRecording ? 'Capturing voice...' : isPaused ? 'Paused' : 'Ready to capture voice'}
              </div>
            </div>

            {/* Recording Buttons */}
            <div className="flex justify-center space-x-4 mb-6">
              {!isRecording && !audioUrl && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleStartRecording}
                  className="w-16 h-16 bg-primary-600 hover:bg-primary-700 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Mic className="w-8 h-8" />
                </motion.button>
              )}

              {isRecording && !isPaused && (
                <>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={pauseRecording}
                    className="w-16 h-16 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Pause className="w-8 h-8" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={stopRecording}
                    className="w-16 h-16 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Square className="w-8 h-8" />
                  </motion.button>
                </>
              )}

              {isPaused && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={resumeRecording}
                  className="w-16 h-16 bg-green-600 hover:bg-green-700 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Play className="w-8 h-8" />
                </motion.button>
              )}
            </div>

            {/* Auto-saving Status */}
            {audioUrl && isAutoSaving && (
              <div className="flex justify-center">
                <div className="flex items-center space-x-3 bg-blue-50 text-blue-700 px-6 py-3 rounded-lg">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Loader2 className="w-5 h-5" />
                  </motion.div>
                  <span className="font-medium">Saving recording...</span>
                </div>
              </div>
            )}

          </motion.div>

          {/* Recording History */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="card"
          >
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Your Voice Library</h2>
            
            {/* Loading State */}
            {recordingsLoading && (
              <div className="text-center text-gray-500 py-8">
                <Loader2 className="w-12 h-12 mx-auto mb-4 text-gray-300 animate-spin" />
                <p>Loading your voice library...</p>
              </div>
            )}
            
            {/* Error State */}
            {recordingsError && !recordingsLoading && (
              <div className="text-center text-red-500 py-8">
                <div className="w-12 h-12 mx-auto mb-4 text-red-300">⚠️</div>
                <p>Failed to load recordings</p>
                <p className="text-sm">{recordingsError?.message || recordingsError?.toString() || 'Unknown error'}</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="mt-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                >
                  Retry
                </button>
              </div>
            )}
            
            {/* Empty State */}
            {!recordingsLoading && !recordingsError && recordings.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <Mic className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No voice content yet</p>
                <p className="text-sm">Start capturing your voice to see your library here</p>
              </div>
            )}
            
            {/* Recordings List */}
            {!recordingsLoading && !recordingsError && recordings.length > 0 && (
              <RecordingHistory
                recordings={recordings}
                onPlay={handlePlayRecording}
                onDelete={handleDeleteRecording}
                onDownload={handleDownloadRecording}
                onTranscribe={handleTranscribeRecording}
                onRename={handleRenameRecording}
              />
            )}
          </motion.div>
        </div>



        {/* Audio Player Modal */}
        {playingRecording && (
          <AudioPlayer
            audioUrl={playingRecording.audioUrl}
            onClose={() => setPlayingRecording(null)}
          />
        )}

        {/* Transcription Modal */}
        {transcribingRecording && (
          <TranscriptionModal
            recording={transcribingRecording}
            onClose={() => setTranscribingRecording(null)}
          />
        )}
      </div>
    </div>
  )
}

export default RecordingInterface
