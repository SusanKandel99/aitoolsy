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
    const { content, difficulty } = await req.json();
    
    if (!content) {
      throw new Error('Content is required');
    }

    const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!openRouterApiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    let systemPrompt = '';
    let userPrompt = '';

    switch (difficulty) {
      case 'easy':
        systemPrompt = 'You are an expert educator. Generate 5 simple flashcard questions from the given content. Focus on basic facts, definitions, and key concepts. Each question should test fundamental understanding.';
        break;
      case 'medium':
        systemPrompt = 'You are an expert educator. Generate 5 intermediate flashcard questions from the given content. Focus on connections between concepts, applications, and explanations. Require some analysis and understanding.';
        break;
      case 'hard':
        systemPrompt = 'You are an expert educator. Generate 5 challenging flashcard questions from the given content. Focus on critical thinking, synthesis, evaluation, and complex applications. Require deep understanding and analysis.';
        break;
      default:
        systemPrompt = 'You are an expert educator. Generate 5 flashcard questions from the given content with mixed difficulty levels.';
    }

    userPrompt = `Generate flashcard questions from this content. Return ONLY a valid JSON array with this exact format:
[
  {
    "question": "Question text here?",
    "answer": "Answer text here"
  }
]

Content to analyze:
${content}`;

    console.log('Generating flashcards with difficulty:', difficulty);

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://aitoolsy.app',
        'X-Title': 'AIToolsy Flashcard Generator'
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
    
    // Parse the JSON response
    let flashcards;
    try {
      // Extract JSON from the response if it's wrapped in markdown or other text
      const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
      const jsonStr = jsonMatch ? jsonMatch[0] : generatedText;
      flashcards = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse flashcards JSON:', parseError);
      throw new Error('Failed to parse generated flashcards');
    }

    return new Response(JSON.stringify({ 
      flashcards,
      usage: data.usage 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-flashcards function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'An unexpected error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});