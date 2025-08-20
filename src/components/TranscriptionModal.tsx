import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Sparkles, 
  Loader2, 
  Copy, 
  Check, 
  Download,
  Linkedin,
  FileText,
  Mic,
  Users,
  BookOpen,
  Headphones,
  PenTool,
  Settings
} from 'lucide-react'
import { predefinedPrompts, PredefinedPrompt } from '../data/predefinedPrompts'
import { supabase } from '../lib/supabase'
import { Recording } from '../types/recording'

interface TranscriptionModalProps {
  recording: Recording
  onClose: () => void
}

interface TranscriptionResult {
  transcription: string
  prompt: string
  timestamp: string
}

const TranscriptionModal: React.FC<TranscriptionModalProps> = ({ recording, onClose }) => {
  const [selectedPrompt, setSelectedPrompt] = useState<PredefinedPrompt>(predefinedPrompts[0])
  const [customPrompt, setCustomPrompt] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [transcriptionResult, setTranscriptionResult] = useState<TranscriptionResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Function to get the appropriate icon for each prompt type
  const getPromptIcon = (promptId: string) => {
    switch (promptId) {
      case 'linkedin-storyteller':
        return <Linkedin className="w-5 h-5 text-blue-600" />
      case 'business-article-writer':
        return <FileText className="w-5 h-5 text-green-600" />
      case 'basic-transcription':
        return <Mic className="w-5 h-5 text-gray-600" />
      case 'meeting-minutes':
        return <Users className="w-5 h-5 text-purple-600" />
      case 'interview-transcript':
        return <BookOpen className="w-5 h-5 text-indigo-600" />
      case 'lecture-notes':
        return <PenTool className="w-5 h-5 text-orange-600" />
      case 'podcast-summary':
        return <Headphones className="w-5 h-5 text-pink-600" />
      case 'custom-prompt':
        return <Settings className="w-5 h-5 text-gray-600" />
      default:
        return <Sparkles className="w-5 h-5 text-purple-600" />
    }
  }

  const handleTranscribe = async () => {
    if (!recording.audioUrl) {
      setError('No audio URL available')
      return
    }

    const promptToUse = selectedPrompt.id === 'custom-prompt' ? customPrompt : selectedPrompt.prompt
    
    if (!promptToUse.trim()) {
      setError('Please enter a prompt')
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No active session')
      }

      const response = await fetch(`${(import.meta as any).env.VITE_SUPABASE_URL}/functions/v1/gemini-transcribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          audioUrl: recording.audioUrl,
          prompt: promptToUse,
          recordingId: recording.id
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to transcribe audio')
      }

      const result = await response.json()
      setTranscriptionResult({
        transcription: result.transcription,
        prompt: promptToUse,
        timestamp: result.timestamp
      })
    } catch (err) {
      console.error('Transcription error:', err)
      setError(err instanceof Error ? err.message : 'Failed to transcribe audio')
    } finally {
      setIsProcessing(false)
    }
  }

  const copyToClipboard = async () => {
    if (transcriptionResult) {
      try {
        await navigator.clipboard.writeText(transcriptionResult.transcription)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error('Failed to copy:', err)
      }
    }
  }

  const downloadTranscription = () => {
    if (transcriptionResult) {
      const blob = new Blob([transcriptionResult.transcription], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${recording.title}_transcription.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
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
          className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">AI Writing Assistant</h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Recording Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-gray-900 mb-2">Voice: {recording.title}</h4>
            <p className="text-sm text-gray-600">
              Duration: {Math.floor(recording.duration / 1000)}s | 
              Created: {new Date(recording.createdAt).toLocaleDateString()}
            </p>
          </div>

          {!transcriptionResult ? (
            /* Prompt Selection and Processing */
            <div className="space-y-6">
              {/* Prompt Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Writing Style
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {predefinedPrompts.map((prompt) => (
                    <button
                      key={prompt.id}
                      onClick={() => setSelectedPrompt(prompt)}
                      className={`p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                        selectedPrompt.id === prompt.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {getPromptIcon(prompt.id)}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{prompt.name}</div>
                          <div className="text-sm text-gray-600 mt-1">{prompt.shortDescription}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Prompt Input */}
              {selectedPrompt.id === 'custom-prompt' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Prompt
                  </label>
                  <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="Enter your custom prompt for the AI writing..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    rows={4}
                  />
                </div>
              )}

              {/* Selected Prompt Preview */}
              {selectedPrompt.id !== 'custom-prompt' && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h5 className="font-medium text-blue-900 mb-2">Selected Prompt:</h5>
                  <p className="text-sm text-blue-800 whitespace-pre-line">{selectedPrompt.prompt}</p>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              {/* Transcribe Button */}
              <button
                onClick={handleTranscribe}
                disabled={isProcessing || (selectedPrompt.id === 'custom-prompt' && !customPrompt.trim())}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 hover:shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none flex items-center justify-center space-x-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Creating your content...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Start AI Writing</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            /* Transcription Result */
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h5 className="font-medium text-green-900 mb-2">Transcription Complete!</h5>
                <p className="text-sm text-green-800">
                  Generated at: {new Date(transcriptionResult.timestamp).toLocaleString()}
                </p>
              </div>

              {/* Prompt Used */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 mb-2">Prompt Used:</h5>
                <p className="text-sm text-gray-700">{transcriptionResult.prompt}</p>
              </div>

              {/* Transcription Text */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-medium text-gray-900">Transcription Result</h5>
                  <div className="flex space-x-2">
                    <button
                      onClick={copyToClipboard}
                      className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                      <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>
                    <button
                      onClick={downloadTranscription}
                      className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors duration-200"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                    {transcriptionResult.transcription}
                  </pre>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setTranscriptionResult(null)
                    setError(null)
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  Transcribe Another
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default TranscriptionModal
