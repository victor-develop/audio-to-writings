export interface Recording {
  id: string
  title: string // Display name/alias (can be any UTF-8 characters)
  audioUrl: string
  duration: number
  createdAt: Date | string
  storagePath?: string // Internal storage path (safe filename)
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
