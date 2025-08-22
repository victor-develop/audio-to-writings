import React, { useState, useEffect } from 'react'
import { X, Save, Star } from 'lucide-react'
import { UserPrompt } from '../types/recording'

interface PromptEditorProps {
  prompt?: UserPrompt | null
  isOpen: boolean
  onClose: () => void
  onSave: (promptData: { name: string; prompt: string; category?: string }) => Promise<boolean>
  onToggleFavorite?: (id: string) => Promise<boolean>
}

const PromptEditor: React.FC<PromptEditorProps> = ({
  prompt,
  isOpen,
  onClose,
  onSave,
  onToggleFavorite
}) => {
  const [name, setName] = useState('')
  const [promptText, setPromptText] = useState('')
  const [category, setCategory] = useState('custom')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (prompt) {
      setName(prompt.name)
      setPromptText(prompt.prompt)
      setCategory(prompt.category)
    } else {
      setName('')
      setPromptText('')
      setCategory('custom')
    }
    setError(null)
  }, [prompt])

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Please enter a name for the prompt')
      return
    }

    if (!promptText.trim()) {
      setError('Please enter the prompt text')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const success = await onSave({
        name: name.trim(),
        prompt: promptText.trim(),
        category
      })

      if (success) {
        onClose()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save prompt')
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleFavorite = async () => {
    if (prompt && onToggleFavorite) {
      await onToggleFavorite(prompt.id)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Star className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">
              {prompt ? 'Edit Prompt' : 'Create New Prompt'}
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            {prompt && onToggleFavorite && (
              <button
                onClick={handleToggleFavorite}
                className={`p-2 rounded-lg transition-colors ${
                  prompt.isFavorite 
                    ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={prompt.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Star className={`w-4 h-4 ${prompt.isFavorite ? 'fill-current' : ''}`} />
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Name Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prompt Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter a name for your prompt"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              <option value="custom">Custom</option>
              <option value="linkedin">LinkedIn</option>
              <option value="business">Business</option>
              <option value="transcription">Transcription</option>
              <option value="meeting">Meeting</option>
              <option value="interview">Interview</option>
              <option value="lecture">Lecture</option>
              <option value="podcast">Podcast</option>
              <option value="analysis">Analysis</option>
              <option value="redbook">Red Book</option>
            </select>
          </div>

          {/* Prompt Text Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prompt Text *
            </label>
            <textarea
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="Enter your custom prompt..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              rows={8}
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !name.trim() || !promptText.trim()}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Prompt</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PromptEditor
