import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'YOUR_API_KEY_HERE');

export async function* streamGeminiResponse(prompt, documentContext = '') {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // Build context-aware prompt
    const fullPrompt = documentContext 
      ? `Context - Current document content:\n${documentContext}\n\n---\n\nUser request: ${prompt}`
      : prompt;
    
    console.log('Sending to Gemini:', fullPrompt.substring(0, 200) + '...');
    
    // Stream the response
    const result = await model.generateContentStream(fullPrompt);
    
    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        yield text;
      }
    }
  } catch (error) {
    console.error('Gemini API Error:', error);
    yield `\n\n[Error: ${error.message || 'Failed to get AI response'}]`;
  }
}

export async function getGeminiResponse(prompt, documentContext = '') {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const fullPrompt = documentContext 
      ? `Context - Current document content:\n${documentContext}\n\n---\n\nUser request: ${prompt}`
      : prompt;
    
    const result = await model.generateContent(fullPrompt);
    return result.response.text();
  } catch (error) {
    console.error('Gemini API Error:', error);
    return `Error: ${error.message || 'Failed to get AI response'}`;
  }
}
