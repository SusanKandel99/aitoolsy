import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, action, content } = await req.json();
    
    if (!prompt && !content) {
      throw new Error('Either prompt or content is required');
    }

    const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!openRouterApiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'improve':
        systemPrompt = 'You are an expert writing assistant. Improve the given text by making it clearer, more engaging, and better structured while maintaining the original meaning and tone.';
        userPrompt = `Please improve this text:\n\n${content}`;
        break;
      case 'summarize':
        systemPrompt = 'You are an expert summarizer. Create concise, informative summaries that capture the key points and essential information.';
        userPrompt = `Please summarize this text:\n\n${content}`;
        break;
      case 'expand':
        systemPrompt = 'You are a creative writing assistant. Expand the given text with relevant details, examples, and elaboration while maintaining consistency with the original content.';
        userPrompt = `Please expand on this text with more details and examples:\n\n${content}`;
        break;
      case 'tone':
        systemPrompt = 'You are a writing style expert. Adjust the tone of the given text to be more professional, friendly, or appropriate for the intended audience.';
        userPrompt = `Please adjust the tone of this text to be more professional and engaging:\n\n${content}`;
        break;
      case 'generate':
        systemPrompt = 'You are a creative writing assistant. Generate high-quality, engaging content based on the user\'s prompt. Be informative, well-structured, and helpful.';
        userPrompt = prompt;
        break;
      default:
        systemPrompt = 'You are a helpful AI assistant for note-taking and writing. Assist the user with their request in a clear and concise manner.';
        userPrompt = prompt || content;
    }

    console.log('Sending request to OpenRouter with action:', action);

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://aitoolsy.app',
        'X-Title': 'AIToolsy Note Editor'
      },
      body: JSON.stringify({
        model: 'google/gemini-flash-1.5',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        top_p: 0.9,
        frequency_penalty: 0.1,
        presence_penalty: 0.1
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', errorText);
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('OpenRouter response received successfully');

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response from OpenRouter API');
    }

    const generatedText = data.choices[0].message.content;

    return new Response(JSON.stringify({ 
      result: generatedText,
      usage: data.usage 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in AI assist function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'An unexpected error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});