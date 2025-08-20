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

  try {
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

    const { audioUrl, prompt } = await req.json()

    if (!audioUrl) {
      return new Response(
        JSON.stringify({ error: 'Audio URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Here you would integrate with your preferred AI service for transcription
    // For example, OpenAI Whisper API, Google Speech-to-Text, etc.
    
    // This is a placeholder response - replace with actual AI transcription
    const transcription = await mockTranscription(audioUrl, prompt)

    return new Response(
      JSON.stringify({ 
        transcription,
        audioUrl,
        userId: user.id,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

// Mock transcription function - replace with actual AI service
async function mockTranscription(audioUrl: string, prompt?: string): Promise<string> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  const mockTranscriptions = [
    "This is a sample transcription of the audio recording. The user spoke clearly about various topics including technology, business, and personal development.",
    "In this recording, the speaker discusses the importance of effective communication in professional settings and provides practical tips for improvement.",
    "The audio contains a detailed explanation of project management methodologies, with specific examples and case studies from real-world applications."
  ]
  
  const randomIndex = Math.floor(Math.random() * mockTranscriptions.length)
  let transcription = mockTranscriptions[randomIndex]
  
  if (prompt) {
    transcription += `\n\nAdditional context based on prompt: ${prompt}`
  }
  
  return transcription
}
