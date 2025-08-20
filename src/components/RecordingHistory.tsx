import React from 'react'
import { motion } from 'framer-motion'
import { Play, Trash2, Download, Clock, Calendar, Sparkles } from 'lucide-react'
import { RecordingHistoryProps } from '../types/recording'

const RecordingHistory: React.FC<RecordingHistoryProps> = ({
  recordings,
  onPlay,
  onDelete,
  onDownload,
  onTranscribe
}) => {
  const formatDate = (date: Date | string) => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date
      
      // Check if date is valid
      if (isNaN(dateObj.getTime())) {
        return 'Invalid date'
      }
      
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(dateObj)
    } catch (error) {
      console.error('Date formatting error:', error)
      return 'Invalid date'
    }
  }

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const hasValidUrl = (recording: any) => {
    return recording.audioUrl && 
      !recording.audioUrl.startsWith('blob:') && 
      !recording.audioUrl.includes('localhost') && 
      !recording.audioUrl.includes('127.0.0.1') &&
      (recording.audioUrl.startsWith('http') || recording.audioUrl.startsWith('https'))
  }

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {recordings.map((recording, index) => {
        const isValidUrl = hasValidUrl(recording)
        
        return (
          <motion.div
            key={recording.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`rounded-lg p-4 transition-colors duration-200 ${
              isValidUrl 
                ? 'bg-gray-50 hover:bg-gray-100' 
                : 'bg-red-50 border border-red-200'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="font-medium text-gray-900 truncate">
                    {recording.title}
                  </h4>
                  {!isValidUrl && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Invalid URL
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{formatDuration(recording.duration)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(recording.createdAt)}</span>
                  </div>
                </div>
                {!isValidUrl && (
                  <div className="mt-2 text-xs text-red-600">
                    This recording cannot be transcribed. Please re-record and save.
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onPlay(recording)}
                  className="p-2 text-primary-600 hover:bg-primary-100 rounded-lg transition-colors duration-200"
                  title="Play voice"
                >
                  <Play className="w-4 h-4" />
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onTranscribe(recording)}
                  disabled={!isValidUrl}
                  className={`p-2 rounded-lg transition-colors duration-200 ${
                    isValidUrl
                      ? 'text-purple-600 hover:bg-purple-100'
                      : 'text-gray-400 cursor-not-allowed'
                  }`}
                  title={isValidUrl ? 'AI Writing Assistant' : 'Cannot transcribe - invalid audio URL'}
                >
                  <Sparkles className="w-4 h-4" />
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onDownload(recording)}
                  className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors duration-200"
                  title="Download voice"
                >
                  <Download className="w-4 h-4" />
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onDelete(recording.id)}
                  className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors duration-200"
                  title="Delete voice"
                >
                  <Trash2 className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

export default RecordingHistory
