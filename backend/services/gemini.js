import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'AIzaSyCnw9kn9eXlDS2TZZbFOQRRe4BcuIZ5bOg');

export async function* streamGeminiResponse(prompt, documentContext = '') {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

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
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

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

export async function formatDocumentWithAI(content) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
    const prompt = `Format the following text to be more professional, readable, and well-structured using HTML tags suitable for a rich text editor. 
    
    Specific Instructions:
    1. Use <h1>, <h2>, <h3> for headers to clearly distinguish sections.
    2. Ensure proper spacing between sections using <br> or <p> tags.
    3. Use <ul> or <ol> for lists.
    4. Use <strong> or <em> for emphasis where appropriate.
    5. Ensure text is properly aligned and paragraphs are distinct.
    6. If there are multiple topics, separate them clearly with headers and spacing.
    7. Do not change the meaning of the text, just improve the structure and flow.
    8. Return ONLY the formatted HTML content, no markdown code blocks or explanations.
    
    Content:
    ${content}`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw error;
  }
}
