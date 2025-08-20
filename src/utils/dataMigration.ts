import { Recording } from '../types/recording'

export function migrateRecordingData(recordings: any[]): Recording[] {
  return recordings.map((recording: any) => {
    try {
      // Ensure createdAt is a valid ISO string
      let createdAt: string
      if (typeof recording.createdAt === 'string') {
        // Check if it's already a valid ISO string
        const date = new Date(recording.createdAt)
        if (isNaN(date.getTime())) {
          // Invalid date string, use current time
          createdAt = new Date().toISOString()
        } else {
          createdAt = recording.createdAt
        }
      } else if (recording.createdAt instanceof Date) {
        // Date object, convert to ISO string
        createdAt = recording.createdAt.toISOString()
      } else {
        // Invalid date, use current time
        createdAt = new Date().toISOString()
      }

      return {
        id: recording.id || Date.now().toString(),
        title: recording.title || 'Untitled Recording',
        audioUrl: recording.audioUrl || '',
        duration: typeof recording.duration === 'number' ? recording.duration : 0,
        createdAt,
        audioBlob: recording.audioBlob
      }
    } catch (error) {
      console.error('Error migrating recording:', error, recording)
      // Return a safe default recording
      return {
        id: Date.now().toString(),
        title: 'Recovered Recording',
        audioUrl: '',
        duration: 0,
        createdAt: new Date().toISOString(),
        audioBlob: undefined
      }
    }
  })
}

export function validateRecording(recording: any): recording is Recording {
  return (
    recording &&
    typeof recording.id === 'string' &&
    typeof recording.title === 'string' &&
    typeof recording.audioUrl === 'string' &&
    typeof recording.duration === 'number' &&
    (typeof recording.createdAt === 'string' || recording.createdAt instanceof Date)
  )
}
