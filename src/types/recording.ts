export interface Recording {
  id: string
  title: string
  audioUrl: string
  duration: number
  createdAt: Date | string
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
}

export interface AudioPlayerProps {
  audioUrl: string
  onClose: () => void
}
