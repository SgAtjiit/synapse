import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

// Load environment variables (needed because ES modules import before server.js calls dotenv.config())
dotenv.config();

const api = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(api);

// Helper function to remove Markdown symbols (*, #, **, etc.)
function cleanMarkdown(text) {
  if (!text) return "";
  return text
    .replace(/\*\*/g, "")   // Remove bold (**text**)
    .replace(/\*/g, "")     // Remove bullets (*)
    .replace(/#/g, "")      // Remove headers (#)
    .replace(/`/g, "")      // Remove code ticks (`)
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links, keep text
    .trim();                // Remove extra whitespace
}

// Helper specifically for your HTML function to remove ```html wrappers
function cleanCodeBlock(text) {
  if (!text) return "";
  return text
    .replace(/^```html\s*/i, "") // Remove opening ```html
    .replace(/^```\s*/i, "")     // Remove opening ```
    .replace(/```$/i, "")        // Remove closing ```
    .trim();
}

export async function* streamGeminiResponse(prompt, documentContext = '') {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

    // UPDATE: Add instruction to the prompt to prefer plain text
    const instructions = "Provide the response in plain text only. Do not use Markdown formatting like asterisks (**), hashes (##), or bullet points.";

    const fullPrompt = documentContext
      ? `System: ${instructions}\nContext:\n${documentContext}\n\nUser request: ${prompt}`
      : `System: ${instructions}\nUser request: ${prompt}`;

    console.log('Sending to Gemini:', fullPrompt.substring(0, 200) + '...');

    const result = await model.generateContentStream(fullPrompt);

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        // OPTION A: Clean it as it streams (might act weird if a ** is split across chunks)
        // yield cleanMarkdown(text); 

        // OPTION B: Just yield raw text, but rely on the Prompt Instruction above
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

    // UPDATE: Instruction to enforce plain text
    const instructions = "Answer in strictly plain text. Do not use Markdown, bolding, or headers.";

    const fullPrompt = documentContext
      ? `System: ${instructions}\nContext:\n${documentContext}\n\nUser request: ${prompt}`
      : `System: ${instructions}\nUser request: ${prompt}`;

    const result = await model.generateContent(fullPrompt);

    // Clean any residual markdown just in case
    return cleanMarkdown(result.response.text());

  } catch (error) {
    console.error('Gemini API Error:', error);
    return `Error: ${error.message || 'Failed to get AI response'}`;
  }
}

export async function formatDocumentWithAI(content) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });

    // Your prompt is good, but models often wrap HTML in ```html blocks anyway.
    const prompt = `Format the following text to be more professional... [YOUR EXISTING PROMPT] ... Return ONLY the formatted HTML content.`;

    const result = await model.generateContent(prompt);
    const rawText = result.response.text();

    // UPDATE: Clean the code blocks so you don't get '```html' in your rich text editor
    return cleanCodeBlock(rawText);

  } catch (error) {
    console.error('Gemini API Error:', error);
    throw error;
  }
}