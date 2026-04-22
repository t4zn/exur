import { NextRequest, NextResponse } from 'next/server';

interface FixCodeRequest {
  code: string;
  error: string;
  language: string;
}

interface GroqResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

export async function POST(request: NextRequest) {
  try {
    const { code, error, language }: FixCodeRequest = await request.json();
    
    const apiKey = process.env.GROQ_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GROQ API key not configured' },
        { status: 500 }
      );
    }

    const prompt = `The following ${language} code failed with this error: ${error}

Code:
${code}

Fix the code and return ONLY the corrected code. Do not include any explanations, comments, or markdown formatting like \`\`\`${language}. Return just the raw code that can be directly executed.`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [
          {
            role: 'system',
            content: 'You are a code debugging expert. Fix the provided code and return ONLY the raw corrected code without any explanations, markdown formatting, or code block syntax. Your response should be executable code that can be directly copied into an editor.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      
      // Handle rate limit errors with user-friendly messages
      if (response.status === 429 || response.status === 403 || 
          errorText.toLowerCase().includes('rate limit') || 
          errorText.toLowerCase().includes('quota')) {
        return NextResponse.json(
          { error: 'Too many users are currently using the AI code fix feature. Please try again in a few minutes.' },
          { status: 429 }
        );
      }
      
      return NextResponse.json(
        { error: `AI service temporarily unavailable. Please try again later.` },
        { status: response.status }
      );
    }

    const data: GroqResponse = await response.json();
    let fixedCode = data.choices[0]?.message?.content?.trim();
    
    if (!fixedCode) {
      return NextResponse.json(
        { error: 'AI could not generate a code suggestion. Please try again or check your code manually.' },
        { status: 500 }
      );
    }

    // Clean up markdown formatting
    // Remove code blocks with language identifiers like ```python, ```javascript, etc.
    fixedCode = fixedCode.replace(/^```[\w]*\n?/gm, '');
    fixedCode = fixedCode.replace(/\n?```$/gm, '');
    
    // Remove any remaining backticks at start/end
    fixedCode = fixedCode.replace(/^`+|`+$/g, '');
    
    // Clean up extra whitespace
    fixedCode = fixedCode.trim();

    return NextResponse.json({ fixedCode });
  } catch (error) {
    console.error('Error in fix-code API:', error);
    return NextResponse.json(
      { error: 'AI code fix service is temporarily unavailable. Please try again later.' },
      { status: 500 }
    );
  }
}