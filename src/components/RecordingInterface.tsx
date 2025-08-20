import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Mic, Square, Pause, Play, RotateCcw, Save } from 'lucide-react'
import { useAudioRecorder } from '../hooks/useAudioRecorder'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useSupabaseStorage } from '../hooks/useSupabaseStorage'
import { useAuth } from '../contexts/AuthContext'
import { Recording } from '../types/recording'
import RecordingForm from './RecordingForm'
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

  const { uploadAudioFile, isUploading } = useSupabaseStorage()
  const [recordings, setRecordings] = useLocalStorage<Recording[]>('recordings', [])
  const [showForm, setShowForm] = useState(false)
  const [playingRecording, setPlayingRecording] = useState<Recording | null>(null)
  const [transcribingRecording, setTranscribingRecording] = useState<Recording | null>(null)

  // Clean up recordings with invalid URLs (blob URLs, localhost, etc.)
  const cleanupInvalidRecordings = useCallback(() => {
    setRecordings(prev => {
      const validRecordings = prev.filter(recording => {
        const isValidUrl = recording.audioUrl && 
          !recording.audioUrl.startsWith('blob:') && 
          !recording.audioUrl.includes('localhost') && 
          !recording.audioUrl.includes('127.0.0.1') &&
          (recording.audioUrl.startsWith('http') || recording.audioUrl.startsWith('https'))
        
        if (!isValidUrl) {
          console.log('Removing recording with invalid URL:', recording.title, recording.audioUrl)
        }
        
        return isValidUrl
      })
      
      // Only update if we actually need to remove recordings
      if (validRecordings.length !== prev.length) {
        console.log(`Cleaned up ${prev.length - validRecordings.length} recordings with invalid URLs`)
        return validRecordings
      }
      
      // Return the same array reference if no changes needed
      return prev
    })
  }, [setRecordings])

  // Clean up invalid recordings only on component mount
  useEffect(() => {
    cleanupInvalidRecordings()
  }, [cleanupInvalidRecordings])

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
  const forceClearAllRecordings = useCallback(() => {
    if (confirm('This will delete ALL recordings. Are you sure?')) {
      setRecordings([])
      console.log('All recordings cleared')
    }
  }, [setRecordings])

  // Clear only invalid recordings
  const clearInvalidRecordings = useCallback(() => {
    const initialCount = recordings.length
    console.log(`Manual cleanup triggered. Initial count: ${initialCount}`)
    cleanupInvalidRecordings()
  }, [cleanupInvalidRecordings])

  const handleSaveRecording = async (title: string) => {
    if (audioBlob && user) {
      try {
        // Upload to Supabase Storage - NO FALLBACKS
        const result = await uploadAudioFile(audioBlob, title, user.id)
        const { url, error } = result
        
        if (error) {
          console.error('Failed to upload audio:', error)
          throw new Error(`Failed to upload audio: ${error}`)
        }
        
        if (!url) {
          throw new Error('No URL returned from upload')
        }
        
        // Only save if we have a valid Supabase URL
        const newRecording: Recording = {
          id: Date.now().toString(),
          title, // User-friendly display alias (can be Chinese)
          audioUrl: url,
          duration,
          createdAt: new Date().toISOString(),
          storagePath: result.storagePath || undefined // Internal storage path
        }
        
        console.log('Saving new recording:', newRecording)
        console.log('Storage path used:', result.storagePath)
        setRecordings(prev => {
          const updated = [newRecording, ...prev]
          console.log('Updated recordings array:', updated)
          return updated
        })
        setShowForm(false)
        resetRecording()
        
      } catch (err) {
        console.error('Error saving recording:', err)
        alert(`Failed to save recording: ${err instanceof Error ? err.message : 'Unknown error'}`)
        // Don't save anything - user must try again
      }
    }
  }

  const handleDeleteRecording = (id: string) => {
    setRecordings(prev => prev.filter(recording => recording.id !== id))
  }

  const handleRenameRecording = (id: string, newTitle: string) => {
    setRecordings(prev => prev.map(recording => 
      recording.id === id 
        ? { ...recording, title: newTitle }
        : recording
    ))
    console.log(`Renamed recording ${id} to: ${newTitle}`)
  }

  const handlePlayRecording = (recording: Recording) => {
    setPlayingRecording(recording)
  }

  const handleTranscribeRecording = (recording: Recording) => {
    setTranscribingRecording(recording)
  }

  const handleDownloadRecording = async (recording: Recording) => {
    // Only handle Supabase storage recordings - no blob fallbacks
    if (recording.audioUrl && recording.audioUrl.startsWith('http')) {
      try {
        const response = await fetch(recording.audioUrl)
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
                  onClick={startRecording}
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

            {/* Action Buttons */}
            {audioUrl && (
              <div className="flex justify-center space-x-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowForm(true)}
                  className="btn-primary flex items-center space-x-2"
                  disabled={isUploading}
                >
                  <Save className="w-4 h-4" />
                  <span>{isUploading ? 'Uploading...' : 'Save & Process'}</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={resetRecording}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>New Voice</span>
                </motion.button>
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
            {recordings.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Mic className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No voice content yet</p>
                <p className="text-sm">Start capturing your voice to see your library here</p>
              </div>
            ) : (
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

        {/* Recording Form Modal */}
        {showForm && (
          <RecordingForm
            onSubmit={handleSaveRecording}
            onCancel={() => setShowForm(false)}
          />
        )}

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
