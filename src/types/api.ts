// API types for TanStack Query integration

export interface CreateRecordingData {
  title: string
  audioUrl: string
  duration: number
  storagePath?: string
  userId: string
}

export interface UpdateRecordingData {
  id: string
  title?: string
  userId: string
}

export interface CreatePromptData {
  name: string
  prompt: string
  category?: string
  userId: string
}

export interface UpdatePromptData {
  id: string
  name?: string
  prompt?: string
  category?: string
  userId: string
}
