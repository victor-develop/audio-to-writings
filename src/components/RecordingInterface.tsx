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
    setRecordings(prev => prev.filter(recording => {
      const isValidUrl = recording.audioUrl && 
        !recording.audioUrl.startsWith('blob:') && 
        !recording.audioUrl.includes('localhost') && 
        !recording.audioUrl.includes('127.0.0.1') &&
        (recording.audioUrl.startsWith('http') || recording.audioUrl.startsWith('https'))
      
      if (!isValidUrl) {
        console.log('Removing recording with invalid URL:', recording.title, recording.audioUrl)
      }
      
      return isValidUrl
    }))
  }, [setRecordings])

  // Clean up invalid recordings on component mount
  useEffect(() => {
    cleanupInvalidRecordings()
  }, [cleanupInvalidRecordings])

  const handleSaveRecording = async (title: string) => {
    if (audioBlob && user) {
      try {
        // Upload to Supabase Storage
        const { url, error } = await uploadAudioFile(audioBlob, title, user.id)
        
        if (error) {
          console.error('Failed to upload audio:', error)
          // Don't fallback to local storage - blob URLs won't work with Edge Functions
          throw new Error(`Failed to upload audio: ${error}`)
        } else if (url) {
          // Save with Supabase URL
          const newRecording: Recording = {
            id: Date.now().toString(),
            title,
            audioUrl: url,
            duration,
            createdAt: new Date().toISOString(),
            audioBlob: undefined // Don't store blob in memory for cloud recordings
          }
          setRecordings(prev => [newRecording, ...prev])
          setShowForm(false)
          resetRecording()
        }
      } catch (err) {
        console.error('Error saving recording:', err)
        // Show error to user instead of falling back to local storage
        alert(`Failed to save recording: ${err instanceof Error ? err.message : 'Unknown error'}`)
        // Don't save the recording - it won't work with transcription anyway
      }
    }
  }

  const handleDeleteRecording = (id: string) => {
    setRecordings(prev => prev.filter(recording => recording.id !== id))
  }

  const handlePlayRecording = (recording: Recording) => {
    setPlayingRecording(recording)
  }

  const handleTranscribeRecording = (recording: Recording) => {
    setTranscribingRecording(recording)
  }

  const handleDownloadRecording = async (recording: Recording) => {
    if (recording.audioBlob) {
      // Local recording - download directly
      const url = URL.createObjectURL(recording.audioBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${recording.title}.webm`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } else if (recording.audioUrl && recording.audioUrl.startsWith('http')) {
      // Cloud recording - fetch and download
      try {
        const response = await fetch(recording.audioUrl)
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
        console.error('Failed to download cloud recording:', error)
      }
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

        {/* Promotional Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-primary-500 to-accent-500 rounded-2xl p-6 mb-8 text-white shadow-lg"
        >
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-2">🎉 产品推广期特别优惠</h3>
            <p className="text-lg opacity-90 mb-3">体验AI驱动的语音转文字革命</p>
            <div className="flex flex-wrap justify-center gap-4 text-sm opacity-80">
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 bg-white rounded-full"></span>
                <span>专业级语音识别</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 bg-white rounded-full"></span>
                <span>多场景写作模板</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 bg-white rounded-full"></span>
                <span>云端存储同步</span>
              </span>
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
