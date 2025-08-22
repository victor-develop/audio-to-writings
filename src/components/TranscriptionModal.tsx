import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Sparkles, 
  Loader2, 
  Copy, 
  Check, 
  Download,
  Plus
} from 'lucide-react'
import { predefinedPrompts, PredefinedPrompt } from '../data/predefinedPrompts'
import { supabase } from '../lib/supabase'
import { Recording, UserPrompt } from '../types/recording'
import { useUserPrompts } from '../hooks/useUserPrompts'
import PromptCard from './PromptCard'
import PromptEditor from './PromptEditor'

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
  const [selectedPrompt, setSelectedPrompt] = useState<PredefinedPrompt | UserPrompt>(predefinedPrompts[0])
  const [customPrompt, setCustomPrompt] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [transcriptionResult, setTranscriptionResult] = useState<TranscriptionResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [retryAfter, setRetryAfter] = useState<number | null>(null)
  const [canRetry, setCanRetry] = useState(false)
  const [showPromptEditor, setShowPromptEditor] = useState(false)
  const [editingPrompt, setEditingPrompt] = useState<UserPrompt | null>(null)
  
  // Custom prompts hook
  const { 
    prompts: userPrompts, 
    createPrompt, 
    updatePrompt, 
    deletePrompt, 
    toggleFavorite,
    incrementUsage,
    generatePromptName 
  } = useUserPrompts()



  // Handle custom prompt creation
  const handleCreateCustomPrompt = async () => {
    if (!customPrompt.trim()) {
      setError('Please enter a custom prompt')
      return
    }

    const promptName = generatePromptName(customPrompt)
    const newPrompt = await createPrompt({
      name: promptName,
      prompt: customPrompt.trim()
    })

    if (newPrompt) {
      setSelectedPrompt(newPrompt)
      setCustomPrompt('')
      setShowPromptEditor(false)
    }
  }

  // Handle prompt editing
  const handleEditPrompt = (prompt: UserPrompt) => {
    setEditingPrompt(prompt)
    setShowPromptEditor(true)
  }

  // Handle prompt saving (create or update)
  const handleSavePrompt = async (promptData: { name: string; prompt: string; category?: string }) => {
    if (editingPrompt) {
      // Update existing prompt
      const success = await updatePrompt(editingPrompt.id, promptData)
      if (success) {
        setEditingPrompt(null)
        return true
      }
    } else {
      // Create new prompt
      const newPrompt = await createPrompt(promptData)
      if (newPrompt) {
        setSelectedPrompt(newPrompt)
        return true
      }
    }
    return false
  }

  // Handle prompt deletion
  const handleDeletePrompt = async (id: string) => {
    const success = await deletePrompt(id)
    if (success && selectedPrompt && 'userId' in selectedPrompt && selectedPrompt.id === id) {
      setSelectedPrompt(predefinedPrompts[0])
    }
    return success
  }

  // Handle favorite toggle
  const handleToggleFavorite = async (id: string) => {
    return await toggleFavorite(id)
  }

  const handleTranscribe = async () => {
    if (!recording.audioUrl) {
      setError('No audio URL available')
      return
    }

    // Validate that the audio URL is accessible by Edge Functions
    if (recording.audioUrl.startsWith('blob:') || 
        recording.audioUrl.includes('localhost') || 
        recording.audioUrl.includes('127.0.0.1') ||
        !recording.audioUrl.startsWith('http')) {
      setError('This recording has an invalid audio URL that cannot be processed. Please re-record and save the audio file.')
      return
    }

    let promptToUse = ''
    
    if ('userId' in selectedPrompt) {
      // User prompt
      promptToUse = selectedPrompt.prompt
      // Increment usage count
      await incrementUsage(selectedPrompt.id)
    } else if (selectedPrompt.id === 'custom-prompt') {
      // Custom prompt input
      promptToUse = customPrompt
    } else {
      // Predefined prompt
      promptToUse = selectedPrompt.prompt
    }
    
    if (!promptToUse.trim()) {
      setError('Please enter a prompt')
      return
    }

    setIsProcessing(true)
    setError(null)
    setRetryAfter(null)
    setCanRetry(false)

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
        
        // Handle specific error cases
        if (response.status === 503 && errorData.retryAfter) {
          setRetryAfter(errorData.retryAfter)
          setCanRetry(true)
          throw new Error(errorData.error || 'Gemini API is overloaded. Please try again later.')
        } else if (response.status === 429) {
          setCanRetry(true)
          throw new Error(errorData.error || 'Rate limit exceeded. Please wait before trying again.')
        } else if (response.status === 403) {
          // Likely expired signed URL
          setCanRetry(true)
          throw new Error(errorData.error || 'Audio access expired. Please try again - the system will refresh the access URL.')
        } else {
          throw new Error(errorData.error || 'Failed to transcribe audio')
        }
      }

      const result = await response.json()
      setTranscriptionResult({
        transcription: result.transcription,
        prompt: promptToUse,
        timestamp: result.timestamp
      })
      setRetryCount(0) // Reset retry count on success
    } catch (err) {
      console.error('Transcription error:', err)
      setError(err instanceof Error ? err.message : 'Failed to transcribe audio')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRetry = async () => {
    if (retryAfter && retryAfter > 0) {
      // Wait for the suggested retry time
      setError(`Please wait ${retryAfter} seconds before retrying...`)
      setTimeout(() => {
        setError(null)
        setRetryAfter(null)
        setCanRetry(true)
      }, retryAfter * 1000)
      return
    }
    
    setRetryCount(prev => prev + 1)
    setError(null)
    setRetryAfter(null)
    setCanRetry(false)
    await handleTranscribe()
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
              <h3 className="text-xl font-semibold text-gray-900">出口成章 AI 写作助手</h3>
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
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Select Writing Style
                  </label>
                  <button
                    onClick={() => setShowPromptEditor(true)}
                    className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors duration-200"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create New</span>
                  </button>
                </div>
                
                {/* Predefined Prompts */}
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Built-in Prompts</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {predefinedPrompts.map((prompt) => (
                      <PromptCard
                        key={prompt.id}
                        prompt={prompt}
                        isSelected={selectedPrompt.id === prompt.id && !('userId' in selectedPrompt)}
                        onSelect={setSelectedPrompt}
                      />
                    ))}
                  </div>
                </div>

                {/* User Custom Prompts */}
                {userPrompts.length > 0 && (
                  <div className="mb-4">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Your Custom Prompts</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {userPrompts.map((prompt) => (
                        <PromptCard
                          key={prompt.id}
                          prompt={prompt}
                          isSelected={selectedPrompt.id === prompt.id && 'userId' in selectedPrompt}
                          onSelect={setSelectedPrompt}
                          onEdit={handleEditPrompt}
                          onDelete={handleDeletePrompt}
                          onToggleFavorite={handleToggleFavorite}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Custom Prompt Input */}
              {selectedPrompt.id === 'custom-prompt' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Custom Prompt
                    </label>
                    <button
                      onClick={handleCreateCustomPrompt}
                      disabled={!customPrompt.trim()}
                      className="px-3 py-1 text-sm bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Save as Custom Prompt
                    </button>
                  </div>
                  <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="Enter your custom prompt for the AI writing..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    rows={4}
                  />
                </div>
              )}



              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center">
                        <span className="text-red-600 text-xs">!</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-red-800 text-sm">{error}</p>
                      {canRetry && (
                        <div className="mt-3 flex items-center space-x-3">
                          <button
                            onClick={handleRetry}
                            disabled={isProcessing || (retryAfter !== null && retryAfter > 0)}
                            className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 text-sm font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {retryAfter && retryAfter > 0 
                              ? `Wait ${retryAfter}s` 
                              : `Retry (${retryCount + 1})`
                            }
                          </button>
                          {retryCount > 0 && (
                            <span className="text-xs text-red-600">
                              Retry attempt {retryCount}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
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
                    setRetryCount(0)
                    setRetryAfter(null)
                    setCanRetry(false)
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

          {/* Prompt Editor Modal */}
          <PromptEditor
            prompt={editingPrompt}
            isOpen={showPromptEditor}
            onClose={() => {
              setShowPromptEditor(false)
              setEditingPrompt(null)
            }}
            onSave={handleSavePrompt}
            onToggleFavorite={editingPrompt ? handleToggleFavorite : undefined}
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default TranscriptionModal