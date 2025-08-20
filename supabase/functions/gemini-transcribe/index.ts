import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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
    console.log('Fetching audio from URL:', audioUrl)
    const audioResponse = await fetch(audioUrl)
    if (!audioResponse.ok) {
      console.error('Failed to fetch audio:', audioResponse.status, audioResponse.statusText)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch audio file' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const audioBuffer = await audioResponse.arrayBuffer()
    console.log('Audio buffer size:', audioBuffer.byteLength)
    
    const audioBytes = new Uint8Array(audioBuffer)
    
    // Convert to base64 efficiently without stack overflow
    console.log('Converting to base64...')
    let base64Audio = ''
    
    // Use a more efficient approach that doesn't spread large arrays
    for (let i = 0; i < audioBytes.length; i++) {
      base64Audio += String.fromCharCode(audioBytes[i])
    }
    base64Audio = btoa(base64Audio)

    // Determine MIME type from URL or default to webm
    const mimeType = audioUrl.includes('.mp3') ? 'audio/mp3' : 
                     audioUrl.includes('.wav') ? 'audio/wav' : 
                     audioUrl.includes('.m4a') ? 'audio/mp4' : 'audio/webm'

    // Call Gemini API
    console.log('Calling Gemini API with mime type:', mimeType)
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`
    
    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Audio,
              }
            },
            {
              text: prompt
            }
          ]
        }
      ]
    }
    
    console.log('Request body size:', JSON.stringify(requestBody).length, 'characters')

    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json()
      console.error('Gemini API Error:', errorData)
      return new Response(
        JSON.stringify({ error: 'Failed to process audio with Gemini API' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
          console.error('Database error:', dbError)
          // Don't fail the request if database save fails
        }
      } catch (dbError) {
        console.error('Database save error:', dbError)
        // Don't fail the request if database save fails
      }
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
