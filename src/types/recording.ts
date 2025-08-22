export interface Recording {
  id: string
  title: string // Display name/alias (can be any UTF-8 characters)
  audioUrl: string
  duration: number
  createdAt: Date | string
  storagePath?: string // Internal storage path (safe filename)
  userId?: string // User ID for the recording owner
}

export interface RecordingFormData {
  title: string
}

export interface RecordingHistoryProps {
  recordings: Recording[]
  onPlay: (recording: Recording) => void
  onDelete: (id: string) => void
  onDownload: (recording: Recording) => void
  onTranscribe: (recording: Recording) => void
  onRename: (id: string, newTitle: string) => void
}

export interface AudioPlayerProps {
  audioUrl: string
  onClose: () => void
}

export interface UserPrompt {
  id: string
  userId: string
  name: string
  prompt: string
  category: string
  isFavorite: boolean
  usageCount: number
  createdAt: string
  updatedAt: string
}

export interface CreateUserPromptData {
  name: string
  prompt: string
  category?: string
}
