import React, { useRef, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Play, Pause, Volume2, VolumeX } from 'lucide-react'
import { AudioPlayerProps } from '../types/recording'

const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioUrl, onClose }) => {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleLoadedMetadata = () => {
      // Validate duration before setting it
      const duration = audio.duration
      if (isFinite(duration) && !isNaN(duration) && duration > 0) {
        setDuration(duration)
      } else {
        console.warn('Invalid audio duration:', duration)
        setDuration(0)
      }
    }

    const handleTimeUpdate = () => {
      const currentTime = audio.currentTime
      if (isFinite(currentTime) && !isNaN(currentTime) && currentTime >= 0) {
        setCurrentTime(currentTime)
      }
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }

    const handleError = (event: Event) => {
      console.error('Audio error:', event)
      setDuration(0)
      setCurrentTime(0)
      setHasError(true)
      setErrorMessage('Failed to load audio file. The URL may have expired.')
    }

    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
    }
  }, [])

  const togglePlayPause = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    if (!audio) return

    const newTime = parseFloat(e.target.value)
    if (isFinite(newTime) && !isNaN(newTime) && newTime >= 0) {
      audio.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    if (isFinite(newVolume) && !isNaN(newVolume) && newVolume >= 0 && newVolume <= 1) {
      setVolume(newVolume)
      if (audioRef.current) {
        audioRef.current.volume = newVolume
      }
      setIsMuted(newVolume === 0)
    }
  }

  const toggleMute = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isMuted) {
      audio.volume = volume
      setIsMuted(false)
    } else {
      audio.volume = 0
      setIsMuted(true)
    }
  }

  const formatTime = (time: number) => {
    // Handle invalid time values
    if (!isFinite(time) || isNaN(time) || time < 0) {
      return '0:00'
    }
    
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Audio Player</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Error Display */}
          {hasError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2 text-red-800">
                <span className="text-sm font-medium">⚠️ Audio Error</span>
              </div>
              <p className="text-sm text-red-700 mt-1">{errorMessage}</p>
              <p className="text-xs text-red-600 mt-1">
                This usually means the audio URL has expired. Try closing and reopening the player.
              </p>
              <button
                onClick={() => {
                  setHasError(false)
                  setErrorMessage('')
                  // Force audio to reload
                  if (audioRef.current) {
                    audioRef.current.load()
                  }
                }}
                className="mt-2 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 text-xs rounded transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          <audio 
            ref={audioRef} 
            src={audioUrl} 
            preload="metadata"
            onError={(e) => {
              console.error('Audio failed to load:', e)
              setDuration(0)
              setHasError(true)
              setErrorMessage('Failed to load audio file. The URL may have expired.')
            }}
          />

          {/* Play/Pause Button */}
          <div className="flex justify-center mb-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={togglePlayPause}
              className="w-16 h-16 bg-primary-600 hover:bg-primary-700 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
            </motion.button>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-500 mb-2">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>

          {/* Volume Control */}
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleMute}
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>

          <style>{`
            .slider::-webkit-slider-thumb {
              appearance: none;
              height: 16px;
              width: 16px;
              border-radius: 50%;
              background: #0ea5e9;
              cursor: pointer;
            }
            .slider::-moz-range-thumb {
              height: 16px;
              width: 16px;
              border-radius: 50%;
              background: #0ea5e9;
              cursor: pointer;
              border: none;
            }
          `}</style>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default AudioPlayer
