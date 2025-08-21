import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Gemini File API base URL
const GEMINI_FILE_API_BASE = 'https://generativelanguage.googleapis.com/v1beta'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Add request ID for tracking
  const requestId = crypto.randomUUID()
  console.log(`[${requestId}] Starting request processing`)

  try {
    // Validate request method
    if (req.method !== 'POST') {
      console.log(`[${requestId}] Invalid method: ${req.method}`)
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create a Supabase client with the Auth context of the function
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the user from the JWT token
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse and validate request body
    let parsedBody
    try {
      parsedBody = await req.json()
      console.log(`[${requestId}] Request body parsed successfully`)
    } catch (parseError) {
      console.error(`[${requestId}] Failed to parse request body:`, parseError)
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { audioUrl, prompt, recordingId } = parsedBody

    if (!audioUrl) {
      console.log(`[${requestId}] Missing audioUrl`)
      return new Response(
        JSON.stringify({ error: 'Audio URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!prompt) {
      console.log(`[${requestId}] Missing prompt`)
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[${requestId}] Processing audio URL: ${audioUrl}`)
    console.log(`[${requestId}] Prompt length: ${prompt.length} characters`)

    // Get Gemini API key
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Gemini API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch the audio file from the URL
    console.log(`[${requestId}] Fetching audio from URL: ${audioUrl}`)
    
    // Check if this is a blob URL or local URL that Edge Functions cannot access
    if (audioUrl.startsWith('blob:') || audioUrl.includes('localhost') || audioUrl.includes('127.0.0.1')) {
      console.error(`[${requestId}] Cannot access blob or local URLs from Edge Function: ${audioUrl}`)
      return new Response(
        JSON.stringify({ 
          error: 'Cannot access blob or local URLs from Edge Function. Please ensure the audio file is uploaded to Supabase Storage.',
          details: 'Edge Functions can only access signed URLs from Supabase Storage'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Check if this is a Supabase Storage URL (should be accessible)
    const isSupabaseStorage = audioUrl.includes('supabase.co') && audioUrl.includes('storage')
    console.log(`[${requestId}] Is Supabase Storage URL: ${isSupabaseStorage}`)
    
    let audioResponse
    try {
      // For signed URLs from Supabase Storage, we don't need auth headers
      // The signature in the URL provides the authentication
      const fetchHeaders: Record<string, string> = {
        'User-Agent': 'AudioPen-Pro-EdgeFunction/1.0'
      }
      
      // If this is a Supabase Storage signed URL, it should work without additional auth
      console.log(`[${requestId}] Fetching with headers:`, fetchHeaders)
      
      audioResponse = await fetch(audioUrl, {
        method: 'GET',
        headers: fetchHeaders
      })
    } catch (fetchError) {
      console.error(`[${requestId}] Fetch error:`, fetchError)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch audio file',
          details: fetchError.message
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    if (!audioResponse.ok) {
      console.error(`[${requestId}] Failed to fetch audio:`, audioResponse.status, audioResponse.statusText)
      
      // Handle specific error cases for storage access
      let errorMessage = 'Failed to fetch audio file'
      let statusCode = 400
      
      if (audioResponse.status === 403) {
        errorMessage = 'Access denied to audio file. The signed URL may have expired or be invalid.'
        statusCode = 403
      } else if (audioResponse.status === 404) {
        errorMessage = 'Audio file not found. The file may have been deleted or the URL is incorrect.'
        statusCode = 404
      } else if (audioResponse.status === 401) {
        errorMessage = 'Unauthorized access to audio file. Please ensure you have permission to access this file.'
        statusCode = 401
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          details: `HTTP ${audioResponse.status}: ${audioResponse.statusText}`,
          suggestion: audioResponse.status === 403 ? 'Try refreshing the page to get a new signed URL' : undefined
        }),
        { status: statusCode, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const audioBuffer = await audioResponse.arrayBuffer()
    console.log(`[${requestId}] Audio buffer size:`, audioBuffer.byteLength)
    
    const audioBytes = new Uint8Array(audioBuffer)
    
    // Determine MIME type from URL or default to webm
    const mimeType = audioUrl.includes('.mp3') ? 'audio/mp3' : 
                     audioUrl.includes('.wav') ? 'audio/wav' : 
                     audioUrl.includes('.m4a') ? 'audio/mp4' : 'audio/webm'

    console.log(`[${requestId}] Using MIME type: ${mimeType}`)

    // Step 1: Upload file to Gemini File API using resumable upload
    console.log(`[${requestId}] Starting file upload to Gemini File API...`)
    
    let fileUri: string
    try {
      // Initial resumable request to get upload URL
      const uploadStartUrl = `${GEMINI_FILE_API_BASE}/files`
      console.log(`[${requestId}] Starting upload request to:`, uploadStartUrl)
      console.log(`[${requestId}] Upload metadata:`, {
        contentLength: audioBuffer.byteLength,
        mimeType: mimeType,
        displayName: `audio_${Date.now()}`
      })
      
      const uploadStartResponse = await fetch(uploadStartUrl, {
        method: 'POST',
        headers: {
          'x-goog-api-key': GEMINI_API_KEY,
          'X-Goog-Upload-Protocol': 'resumable',
          'X-Goog-Upload-Command': 'start',
          'X-Goog-Upload-Header-Content-Length': audioBuffer.byteLength.toString(),
          'X-Goog-Upload-Header-Content-Type': mimeType,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          file: {
            display_name: `audio_${Date.now()}`
          }
        })
      })

      console.log(`[${requestId}] Upload start response status:`, uploadStartResponse.status, uploadStartResponse.statusText)
      console.log(`[${requestId}] Upload start response headers:`, Object.fromEntries(uploadStartResponse.headers.entries()))

      if (!uploadStartResponse.ok) {
        let errorData
        try {
          const responseText = await uploadStartResponse.text()
          console.error(`[${requestId}] Upload start failed response text:`, responseText)
          if (responseText) {
            errorData = JSON.parse(responseText)
          }
        } catch (parseError) {
          console.error(`[${requestId}] Could not parse upload start error response:`, parseError)
        }
        console.error(`[${requestId}] File upload start failed:`, errorData || 'No error details')
        throw new Error(`File upload start failed: ${uploadStartResponse.status} ${uploadStartResponse.statusText}`)
      }

      // Extract upload URL from response headers
      const uploadUrl = uploadStartResponse.headers.get('x-goog-upload-url')
      if (!uploadUrl) {
        console.error(`[${requestId}] Available headers:`, Array.from(uploadStartResponse.headers.keys()))
        throw new Error('No upload URL received from Gemini File API')
      }

      console.log(`[${requestId}] Got upload URL:`, uploadUrl)

      // Upload the actual file bytes
      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Content-Length': audioBuffer.byteLength.toString(),
          'X-Goog-Upload-Offset': '0',
          'X-Goog-Upload-Command': 'upload, finalize'
        },
        body: audioBytes
      })

      console.log(`[${requestId}] Upload response status:`, uploadResponse.status, uploadResponse.statusText)
      console.log(`[${requestId}] Upload response headers:`, Object.fromEntries(uploadResponse.headers.entries()))

      if (!uploadResponse.ok) {
        let errorData
        try {
          const responseText = await uploadResponse.text()
          console.error(`[${requestId}] Upload failed response text:`, responseText)
          if (responseText) {
            errorData = JSON.parse(responseText)
          }
        } catch (parseError) {
          console.error(`[${requestId}] Could not parse upload error response:`, parseError)
        }
        console.error(`[${requestId}] File upload failed:`, errorData || 'No error details')
        throw new Error(`File upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`)
      }

      // Check if response has content before trying to parse JSON
      const responseText = await uploadResponse.text()
      console.log(`[${requestId}] Upload response text:`, responseText)
      
      let fileInfo
      if (responseText && responseText.trim()) {
        try {
          fileInfo = JSON.parse(responseText)
        } catch (parseError) {
          console.error(`[${requestId}] Failed to parse upload response JSON:`, parseError)
          throw new Error(`Invalid upload response format: ${responseText}`)
        }
      } else {
        // If no response body, try to construct the file URI from the upload URL
        // The file ID is typically in the upload URL path
        const urlParts = uploadUrl.split('/')
        const fileId = urlParts[urlParts.length - 1]
        if (fileId) {
          fileInfo = {
            file: {
              uri: `${GEMINI_FILE_API_BASE}/files/${fileId}`
            }
          }
          console.log(`[${requestId}] Constructed file URI from upload URL:`, fileInfo.file.uri)
        } else {
          throw new Error('No file info received and could not construct file URI')
        }
      }
      
      fileUri = fileInfo.file.uri
      console.log(`[${requestId}] File uploaded successfully. URI:`, fileUri)
      
    } catch (uploadError) {
      console.error(`[${requestId}] File upload error:`, uploadError)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to upload audio file to Gemini File API',
          details: uploadError.message
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Step 2: Generate content using the uploaded file
    console.log(`[${requestId}] Calling Gemini API with file URI:`, fileUri)
    
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`
    
    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              file_data: {
                mime_type: mimeType,
                file_uri: fileUri
              }
            },
            {
              text: prompt
            }
          ]
        }
      ]
    }
    
    console.log(`[${requestId}] Request body size:`, JSON.stringify(requestBody).length, 'characters')

    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json()
      console.error(`[${requestId}] Gemini API Error:`, errorData)
      
      // Handle specific Gemini API error cases
      let errorMessage = 'Failed to process audio with Gemini API'
      let statusCode = 500
      
      if (errorData.error) {
        const geminiError = errorData.error
        
        if (geminiError.code === 503 && geminiError.status === 'UNAVAILABLE') {
          errorMessage = 'Gemini API is currently overloaded. Please try again in 1 minute.'
          statusCode = 503
        } else if (geminiError.code === 429) {
          errorMessage = 'Rate limit exceeded. Please wait a moment before trying again.'
          statusCode = 429
        } else if (geminiError.code === 400) {
          errorMessage = 'Invalid request to Gemini API. Please check your audio file and try again.'
          statusCode = 400
        } else if (geminiError.code === 401) {
          errorMessage = 'Gemini API authentication failed. Please check your API key.'
          statusCode = 401
        } else if (geminiError.code === 403) {
          errorMessage = 'Access denied to Gemini API. Please check your API permissions.'
          statusCode = 403
        } else if (geminiError.message) {
          errorMessage = `Gemini API Error: ${geminiError.message}`
          statusCode = geminiError.code || 500
        }
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          details: errorData,
          retryAfter: statusCode === 503 ? 60 : undefined // Suggest 1 minute retry for overload
        }),
        { status: statusCode, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const geminiData = await geminiResponse.json()
    
    if (!geminiData.candidates || geminiData.candidates.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No transcription result returned from Gemini' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const transcription = geminiData.candidates[0].content.parts[0].text

    // Save transcription to database if recordingId is provided
    if (recordingId) {
      try {
        const { error: dbError } = await supabaseClient
          .from('transcriptions')
          .insert({
            recording_id: recordingId,
            user_id: user.id,
            prompt: prompt,
            transcription: transcription,
            created_at: new Date().toISOString()
          })

        if (dbError) {
          console.error(`[${requestId}] Database error:`, dbError)
          // Don't fail the request if database save fails
        }
      } catch (dbError) {
        console.error(`[${requestId}] Database save error:`, dbError)
        // Don't fail the request if database save fails
      }
    }

    // Clean up: Delete the uploaded file (optional, as files auto-delete after 48 hours)
    try {
      const fileId = fileUri.split('/').pop()
      if (fileId) {
        const deleteUrl = `${GEMINI_FILE_API_BASE}/files/${fileId}?key=${GEMINI_API_KEY}`
        await fetch(deleteUrl, { method: 'DELETE' })
        console.log(`[${requestId}] Cleaned up uploaded file:`, fileId)
      }
    } catch (cleanupError) {
      console.error(`[${requestId}] File cleanup error:`, cleanupError)
      // Don't fail the request if cleanup fails
    }

    return new Response(
      JSON.stringify({ 
        transcription,
        audioUrl,
        prompt,
        userId: user.id,
        recordingId,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error(`[${requestId}] Error:`, error)
    
    // Clean up any resources if needed
    try {
      // Force garbage collection if available
      if (typeof globalThis.gc === 'function') {
        globalThis.gc()
      }
    } catch (cleanupError) {
      console.error(`[${requestId}] Cleanup error:`, cleanupError)
    }
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        requestId: requestId,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } finally {
    console.log(`[${requestId}] Request processing completed`)
  }
})
