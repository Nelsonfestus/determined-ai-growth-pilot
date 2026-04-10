import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload = await req.json()
    const requestData = payload.body || payload
    const { prompt } = requestData

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')

    // If Claude API key is available, call the real AI provider (Anthropic)
    if (anthropicKey) {
      const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307', // fast, cheap, perfect for real-time chat
          max_tokens: 2000,
          messages: [{ role: 'user', content: prompt }],
        }),
      })

      const claudeData = await claudeRes.json()
      
      // If there's an error from Anthropic (like invalid key), return it carefully
      if (claudeData.type === 'error') {
        throw new Error(claudeData.error.message)
      }

      const aiResponse = claudeData.content && claudeData.content[0] ? claudeData.content[0].text : "AI could not process this prompt."
      
      return new Response(JSON.stringify(aiResponse), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    } 
    
    // Fallback Mock Response for Testing / Launch Preview if API key not set yet
    const fallbackResponse = `Here is the AI generated analysis based on your prompt:\n\n* ${prompt.substring(0, 100)}...*\n\nThe API key is not yet configured in the Edge Function secrets. Please set ANTHROPIC_API_KEY to see live responses.`;

    return new Response(JSON.stringify(fallbackResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
