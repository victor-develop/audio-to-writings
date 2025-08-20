import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Mic, Square, Pause, Play, RotateCcw, Save } from 'lucide-react'
import { useAudioRecorder } from '../hooks/useAudioRecorder'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { Recording } from '../types/recording'
import RecordingForm from './RecordingForm'
import RecordingHistory from './RecordingHistory'
import AudioPlayer from './AudioPlayer'

const RecordingInterface: React.FC = () => {
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

  const [recordings, setRecordings] = useLocalStorage<Recording[]>('recordings', [])
  const [showForm, setShowForm] = useState(false)
  const [playingRecording, setPlayingRecording] = useState<Recording | null>(null)

  const handleSaveRecording = (title: string) => {
    if (audioBlob && audioUrl) {
      const newRecording: Recording = {
        id: Date.now().toString(),
        title,
        audioUrl,
        duration,
        createdAt: new Date(),
        audioBlob
      }
      
      setRecordings(prev => [newRecording, ...prev])
      setShowForm(false)
      resetRecording()
    }
  }

  const handleDeleteRecording = (id: string) => {
    setRecordings(prev => prev.filter(recording => recording.id !== id))
  }

  const handlePlayRecording = (recording: Recording) => {
    setPlayingRecording(recording)
  }

  const handleDownloadRecording = (recording: Recording) => {
    if (recording.audioBlob) {
      const url = URL.createObjectURL(recording.audioBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${recording.title}.webm`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Voice Recorder</h1>
          <p className="text-gray-600">Capture high-quality audio recordings with ease</p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recording Controls */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="card"
          >
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Recording Controls</h2>
            
            {/* Duration Display */}
            <div className="text-center mb-6">
              <div className="text-4xl font-mono font-bold text-primary-600">
                {formatDuration(duration)}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {isRecording ? 'Recording...' : isPaused ? 'Paused' : 'Ready to record'}
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
                >
                  <Save className="w-4 h-4" />
                  <span>Save Recording</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={resetRecording}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>New Recording</span>
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
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Recording History</h2>
            {recordings.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Mic className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No recordings yet</p>
                <p className="text-sm">Start recording to see your history here</p>
              </div>
            ) : (
              <RecordingHistory
                recordings={recordings}
                onPlay={handlePlayRecording}
                onDelete={handleDeleteRecording}
                onDownload={handleDownloadRecording}
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
      </div>
    </div>
  )
}

export default RecordingInterface
