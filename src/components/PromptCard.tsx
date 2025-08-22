import React, { useState } from 'react'
import { ChevronDown, ChevronRight, Star, Edit2, Trash2, Heart } from 'lucide-react'
import { UserPrompt } from '../types/recording'
import { PredefinedPrompt } from '../data/predefinedPrompts'

interface PromptCardProps {
  prompt: PredefinedPrompt | UserPrompt
  isSelected: boolean
  onSelect: (prompt: PredefinedPrompt | UserPrompt) => void
  onEdit?: (prompt: UserPrompt) => void
  onDelete?: (id: string) => void
  onToggleFavorite?: (id: string) => void
}

const PromptCard: React.FC<PromptCardProps> = ({
  prompt,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onToggleFavorite
}) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsExpanded(!isExpanded)
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onEdit && 'userId' in prompt) {
      onEdit(prompt)
    }
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onDelete) {
      onDelete(prompt.id)
    }
  }

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onToggleFavorite && 'userId' in prompt) {
      onToggleFavorite(prompt.id)
    }
  }

  const isUserPrompt = 'userId' in prompt
  const promptText = prompt.prompt
  const promptName = prompt.name
  const shortDescription = isUserPrompt ? `Custom prompt (used ${prompt.usageCount} times)` : prompt.shortDescription

  return (
    <div
      className={`p-4 rounded-lg border-2 text-left transition-all duration-200 cursor-pointer ${
        isSelected
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      }`}
      onClick={() => onSelect(prompt)}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-1">
          <button
            onClick={handleToggleExpand}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="font-medium text-gray-900">{promptName}</div>
              {isUserPrompt && prompt.isFavorite && (
                <Heart className="w-4 h-4 text-red-500 fill-current" />
              )}
            </div>
            
            {isUserPrompt && (
              <div className="flex items-center space-x-1">
                <button
                  onClick={handleToggleFavorite}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  title={prompt.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Star className={`w-4 h-4 ${prompt.isFavorite ? 'text-red-500 fill-current' : ''}`} />
                </button>
                <button
                  onClick={handleEdit}
                  className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                  title="Edit prompt"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  title="Delete prompt"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          
          <div className="text-sm text-gray-600 mt-1">{shortDescription}</div>
          
          {isExpanded && (
            <div className="mt-3 p-3 bg-gray-100 rounded-lg">
              <div className="text-sm text-gray-700 whitespace-pre-wrap max-h-40 overflow-y-auto">
                {promptText}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PromptCard
