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

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    console.log('Lovable API key exists:', !!lovableApiKey);
    if (!lovableApiKey) {
      throw new Error('Lovable API key not configured');
    }

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'improve':
        systemPrompt = 'You are an expert writing assistant. Improve the given text by making it clearer, more engaging, and better structured while maintaining the original meaning and tone. Format your response with proper paragraphs, lists, and structure. Use HTML formatting where appropriate (p, ul, ol, li, strong, em tags).';
        userPrompt = `Please improve this text with proper formatting:\n\n${content}`;
        break;
      case 'summarize':
        systemPrompt = 'You are an expert summarizer. Create concise, informative summaries that capture the key points and essential information. Format your response with clear paragraphs and bullet points using HTML formatting (p, ul, li tags).';
        userPrompt = `Please summarize this text with proper formatting:\n\n${content}`;
        break;
      case 'expand':
        systemPrompt = 'You are a creative writing assistant. Expand the given text with relevant details, examples, and elaboration while maintaining consistency with the original content. Format your response with proper paragraphs, lists, and structure using HTML formatting.';
        userPrompt = `Please expand on this text with more details, examples, and proper formatting:\n\n${content}`;
        break;
      case 'tone':
        systemPrompt = 'You are a writing style expert. Adjust the tone of the given text to be more professional, friendly, or appropriate for the intended audience. Format your response with proper paragraphs and structure using HTML formatting.';
        userPrompt = `Please adjust the tone of this text to be more professional and engaging, with proper formatting:\n\n${content}`;
        break;
      case 'generate':
        systemPrompt = 'You are a creative writing assistant. Generate high-quality, engaging content based on the user\'s prompt. Be informative, well-structured, and helpful. Format your response with proper paragraphs, headings, lists, and structure using HTML formatting (h3, p, ul, ol, li, strong, em tags).';
        userPrompt = prompt;
        break;
      default:
        systemPrompt = 'You are a helpful AI assistant for note-taking and writing. Assist the user with their request in a clear and concise manner. Format your response with proper HTML structure.';
        userPrompt = prompt || content;
    }

    console.log('Sending request to Lovable AI with action:', action);
    console.log('System prompt length:', systemPrompt.length);
    console.log('User prompt length:', userPrompt.length);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
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
      console.error('Lovable AI error:', errorText);
      throw new Error(`Lovable AI error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Lovable AI response received successfully');

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response from Lovable AI');
    }

    let generatedText = data.choices[0].message.content;
    
    // Convert plain text to HTML if it's not already formatted
    if (!generatedText.includes('<p>') && !generatedText.includes('<ul>') && !generatedText.includes('<ol>')) {
      // Split by double newlines for paragraphs
      const paragraphs = generatedText.split('\n\n').filter(p => p.trim());
      
      generatedText = paragraphs.map(paragraph => {
        const trimmed = paragraph.trim();
        
        // Check if it's a numbered list
        if (/^\d+[\.)]\s/.test(trimmed)) {
          const items = trimmed.split(/\n(?=\d+[\.)]\s)/).map(item => {
            const content = item.replace(/^\d+[\.)]\s/, '').trim();
            return `<li>${content}</li>`;
          }).join('');
          return `<ol>${items}</ol>`;
        }
        
        // Check if it's a bulleted list
        if (/^[\*\-\•]\s/.test(trimmed) || trimmed.includes('\n* ') || trimmed.includes('\n- ')) {
          const items = trimmed.split(/\n(?=[\*\-\•]\s)/).map(item => {
            const content = item.replace(/^[\*\-\•]\s/, '').trim();
            return `<li>${content}</li>`;
          }).join('');
          return `<ul>${items}</ul>`;
        }
        
        // Regular paragraph
        return `<p>${trimmed}</p>`;
      }).join('');
    }

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