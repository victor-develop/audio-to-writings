# 🎵 Audio Segmentation & Upload Development Plan

## 🎯 **Requirement Overview**

Implement audio file segmentation and merging to work around Supabase's file upload size limit (15MB). The system needs to:

1. **Cut large audio files** into segments under 15MB each
2. **Upload segments** individually to Supabase Storage
3. **Merge segments** during transcription to create a complete audio file
4. **Process merged audio** with Gemini API

## 🔍 **Current Limitations**

### **Supabase Storage Constraints**
- **File size limit**: 15MB per file
- **Current issue**: Large audio recordings (>15MB) cannot be uploaded
- **Impact**: Users with long recordings cannot use the system

### **Audio Processing Constraints**
- **Gemini API**: Requires complete audio file for transcription
- **Segmentation**: Must maintain audio quality and continuity
- **Merging**: Must reconstruct original audio without quality loss

## 🏗️ **Architecture Design**

### **1. Frontend Segmentation**
```
Large Audio File (>15MB)
    ↓
Audio Segmentation Engine
    ↓
Multiple Segments (<15MB each)
    ↓
Individual Upload to Supabase
    ↓
Metadata Storage (segment relationships)
```

### **2. Backend Merging**
```
Transcription Request
    ↓
Segment Retrieval & Validation
    ↓
Audio Segment Merging
    ↓
Temporary Merged File
    ↓
Gemini API Processing
    ↓
Cleanup Temporary Files
```

## 📋 **Phase 1: Audio Segmentation Engine**

### **1.1 Install Audio Processing Libraries**
- [ ] Install `@ffmpeg/ffmpeg` for audio manipulation
- [ ] Install `@ffmpeg/util` for FFmpeg utilities
- [ ] Install `@ffmpeg/core` for FFmpeg core functionality

### **1.2 Create Audio Segmentation Hook**
- [ ] Create `src/hooks/useAudioSegmentation.ts`
- [ ] Implement `segmentAudioFile()` function
- [ ] Add segment size calculation (target: 14MB for safety)
- [ ] Implement quality-preserving segmentation

### **1.3 Audio Segmentation Logic**
```typescript
interface AudioSegment {
  id: string
  index: number
  blob: Blob
  size: number
  startTime: number
  endTime: number
  duration: number
}

interface SegmentationResult {
  segments: AudioSegment[]
  totalSegments: number
  totalDuration: number
  originalSize: number
}
```

### **1.4 Segment Size Calculation**
- **Target size**: 14MB (1MB buffer below 15MB limit)
- **Audio format**: WebM/MP3 with quality preservation
- **Duration estimation**: Based on audio bitrate and format
- **Segment overlap**: Minimal overlap to prevent gaps

## 📋 **Phase 2: Storage & Metadata Management**

### **2.1 Database Schema Updates**
- [ ] Create `audio_segments` table
- [ ] Add segment relationships to `recordings` table
- [ ] Implement RLS policies for segment access

#### **New Migration: `20240101000006_create_audio_segments_table.sql`**
```sql
CREATE TABLE IF NOT EXISTS public.audio_segments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recording_id UUID REFERENCES public.recordings(id) ON DELETE CASCADE NOT NULL,
    segment_index INTEGER NOT NULL,
    storage_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    start_time_ms INTEGER NOT NULL,
    end_time_ms INTEGER NOT NULL,
    duration_ms INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(recording_id, segment_index)
);

CREATE INDEX IF NOT EXISTS idx_audio_segments_recording_id ON public.audio_segments(recording_id);
CREATE INDEX IF NOT EXISTS idx_audio_segments_index ON public.audio_segments(segment_index);
```

### **2.2 Update Recordings Table**
- [ ] Add `is_segmented` boolean field
- [ ] Add `total_segments` integer field
- [ ] Add `total_duration` bigint field

#### **Migration: `20240101000007_add_segmentation_fields_to_recordings.sql`**
```sql
ALTER TABLE public.recordings 
ADD COLUMN IF NOT EXISTS is_segmented BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS total_segments INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS total_duration BIGINT DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_recordings_is_segmented ON public.recordings(is_segmented);
```

### **2.3 Segment Upload Service**
- [ ] Create `src/services/segmentUploadService.ts`
- [ ] Implement `uploadSegment()` function
- [ ] Add segment metadata storage
- [ ] Handle upload failures and retries

## 📋 **Phase 3: Frontend Integration**

### **3.1 Update RecordingInterface**
- [ ] Modify `autoSaveRecording()` to handle segmentation
- [ ] Add segmentation progress indicator
- [ ] Update recording state management
- [ ] Handle segment upload failures

### **3.2 Segmentation UI Components**
- [ ] Create `src/components/SegmentationProgress.tsx`
- [ ] Add progress bar for segmentation process
- [ ] Show segment count and upload status
- [ ] Display individual segment information

### **3.3 Enhanced Recording Display**
- [ ] Update `RecordingHistory` to show segmented recordings
- [ ] Display segment count and total duration
- [ ] Add segment management options
- [ ] Show upload status for each segment

## 📋 **Phase 4: Backend Merging & Processing**

### **4.1 Edge Function Updates**
- [ ] Modify `gemini-transcribe` function
- [ ] Add segment retrieval logic
- [ ] Implement audio merging functionality
- [ ] Handle temporary file management

### **4.2 Audio Merging Service**
- [ ] Create `src/services/audioMergingService.ts`
- [ ] Implement `mergeAudioSegments()` function
- [ ] Add format conversion if needed
- **4.3 Segment Validation**
- [ ] Verify all segments exist and are accessible
- [ ] Check segment integrity and continuity
- [ ] Validate total duration matches expected

### **4.4 Temporary File Management**
- [ ] Create temporary merged audio files
- [ ] Implement cleanup after processing
- [ ] Handle memory efficiently for large files
- [ ] Add error handling for merge failures

## 📋 **Phase 5: Enhanced Error Handling**

### **5.1 Upload Error Recovery**
- [ ] Handle individual segment upload failures
- [ ] Implement retry mechanisms
- [ ] Partial upload recovery
- [ ] User notification for failed segments

### **5.2 Processing Error Handling**
- [ ] Handle segment retrieval failures
- [ ] Manage merge process errors
- [ ] Graceful degradation for missing segments
- [ ] User guidance for error resolution

### **5.3 Data Consistency**
- [ ] Ensure segment metadata consistency
- [ ] Handle orphaned segments
- [ ] Implement cleanup for failed uploads
- [ ] Validate recording-segment relationships

## 📋 **Phase 6: Performance & Optimization**

### **6.1 Upload Optimization**
- [ ] Implement parallel segment uploads
- [ ] Add upload queuing for large files
- [ ] Optimize segment size calculation
- [ ] Add upload progress tracking

### **6.2 Processing Optimization**
- [ ] Stream audio segments for large files
- [ ] Implement chunked processing
- [ ] Add caching for frequently accessed segments
- [ ] Optimize memory usage during merging

### **6.3 User Experience**
- [ ] Add estimated time calculations
- [ ] Implement background processing
- [ ] Add pause/resume functionality
- [ ] Provide detailed progress information

## 🔧 **Technical Implementation Details**

### **Audio Segmentation Algorithm**
```typescript
const segmentAudioFile = async (
  audioBlob: Blob, 
  targetSizeMB: number = 14
): Promise<SegmentationResult> => {
  // 1. Analyze audio properties (duration, bitrate, format)
  // 2. Calculate optimal segment count and duration
  // 3. Use FFmpeg to cut audio into segments
  // 4. Validate segment sizes and quality
  // 5. Return segmentation metadata
}
```

### **Segment Upload Process**
```typescript
const uploadSegments = async (
  segments: AudioSegment[], 
  recordingId: string
): Promise<UploadResult> => {
  // 1. Upload segments in parallel (with concurrency limit)
  // 2. Store segment metadata in database
  // 3. Update recording with segmentation info
  // 4. Handle failures and retries
}
```

### **Audio Merging Process**
```typescript
const mergeAudioSegments = async (
  segmentPaths: string[], 
  recordingId: string
): Promise<string> => {
  // 1. Download all segments from storage
  // 2. Use FFmpeg to concatenate segments
  // 3. Create temporary merged file
  // 4. Return path to merged file
}
```

## 🧪 **Testing Strategy**

### **6.1 Unit Tests**
- [ ] Audio segmentation accuracy
- [ ] Segment size calculations
- [ ] Upload service functionality
- [ ] Merging service reliability

### **6.2 Integration Tests**
- [ ] End-to-end segmentation workflow
- [ ] Storage and retrieval processes
- [ ] Transcription with segmented files
- [ ] Error handling scenarios

### **6.3 Performance Tests**
- [ ] Large file processing times
- [ ] Memory usage during operations
- [ ] Upload/download speeds
- [ ] Concurrent processing limits

## 📊 **Expected Benefits**

### **1. File Size Support**
- ✅ **Unlimited audio length** - No more 15MB restrictions
- ✅ **Better quality** - Maintain original audio quality
- ✅ **Flexible recording** - Users can record as long as needed

### **2. System Reliability**
- ✅ **Robust uploads** - Individual segment failures don't break entire recording
- ✅ **Better error handling** - Granular error reporting and recovery
- ✅ **Data consistency** - Proper metadata management

### **3. User Experience**
- ✅ **Progress tracking** - Users see detailed upload progress
- ✅ **Background processing** - No blocking during long operations
- ✅ **Error recovery** - Clear guidance when issues occur

## 🚦 **Development Timeline**

### **Week 1: Foundation**
- [ ] Install audio processing libraries
- [ ] Create database migrations
- [ ] Implement basic segmentation logic

### **Week 2: Core Services**
- [ ] Build segment upload service
- [ ] Implement audio merging service
- [ ] Add metadata management

### **Week 3: Frontend Integration**
- [ ] Update RecordingInterface
- [ ] Add segmentation UI components
- [ ] Implement progress tracking

### **Week 4: Backend Processing**
- [ ] Modify Edge Functions
- [ ] Add segment retrieval logic
- [ ] Implement audio merging

### **Week 5: Testing & Polish**
- [ ] Comprehensive testing
- [ ] Performance optimization
- [ ] Error handling refinement

## 🎯 **Success Criteria**

1. **✅ Large files supported** - Audio files >15MB can be uploaded
2. **✅ Quality preserved** - No audio quality loss during segmentation
3. **✅ Reliable processing** - Transcription works with segmented files
4. **✅ User experience** - Clear progress and error handling
5. **✅ Performance** - Reasonable processing times for large files

## 🔮 **Future Enhancements**

### **Advanced Features**
- **Adaptive segmentation** - Dynamic segment sizes based on audio complexity
- **Compression options** - User-selectable quality vs. size tradeoffs
- **Cloud processing** - Move heavy processing to background services
- **Batch operations** - Process multiple recordings simultaneously

### **Integration Opportunities**
- **Real-time streaming** - Process audio as it's being recorded
- **Advanced analytics** - Audio quality metrics and insights
- **Multi-format support** - Additional audio format compatibility
- **Cloud storage options** - Integration with other storage providers

---

**Status:** 🚧 **Planning Phase**
**Priority:** 🚀 **High - Enables large file support**
**Complexity:** 🔴 **High - Requires audio processing expertise**
**Estimated Effort:** ⏱️ **4-5 weeks**
**Team Requirements:** 👥 **Frontend + Backend + Audio Processing**
