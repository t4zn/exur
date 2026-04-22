interface FixCodeResponse {
  fixedCode?: string;
  error?: string;
}

export async function fixCodeWithAI(code: string, error: string, language: string): Promise<string> {
  try {
    const response = await fetch('/api/fix-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        error,
        language,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      // Pass through user-friendly error messages from the API
      throw new Error(errorData.error || `Service temporarily unavailable. Please try again later.`);
    }

    const data: FixCodeResponse = await response.json();
    
    if (!data.fixedCode) {
      throw new Error('AI service could not generate a code suggestion. Please try again.');
    }

    return data.fixedCode;
  } catch (error) {
    console.error('Error calling fix-code API:', error);
    throw error;
  }
}