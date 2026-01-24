import { groq } from '@ai-sdk/groq';
import { generateText, streamText } from 'ai';
import dotenv from 'dotenv';
dotenv.config();

// Use the groq provider from AI SDK with the    model name from env
const model = groq(process.env.GROQ_MODEL_NAME || 'llama-3.3-70b-versatile');
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
function cleanCodeBlock(text) {
    if (!text) return "";
    return text
        .replace(/^```html\s*/i, "") // Remove opening ```html
        .replace(/^```\s*/i, "")     // Remove opening ```
        .replace(/```$/i, "")        // Remove closing ```
        .trim();
}

export async function* streamGroqResponse(prompt, documentContext = '') {
    // Helper function for delay (ChatGPT-like typing effect)
    // const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    try {
        // Add instruction to the prompt to prefer plain text
        const instructions = "Provide the response in plain text only. Do not use Markdown formatting like asterisks (**), hashes (##), or bullet points.";

        const fullPrompt = documentContext
            ? `System: ${instructions}\nContext:\n${documentContext}\n\nUser request: ${prompt}`
            : `System: ${instructions}\nUser request: ${prompt}`;

        console.log('Sending to Groq:', fullPrompt.substring(0, 200) + '...');

        // streamText returns an object with textStream - no await needed here
        const { textStream } = streamText({
            model: model,
            prompt: fullPrompt,
        });

        // Stream text chunks with typing effect
        for await (const text of textStream) {
            if (text) {
                yield text;
                // await delay(20); // 20ms delay for smooth typing effect
            }
        }

        console.log('Groq streaming completed successfully');
    } catch (error) {
        console.error('Groq API Error:', error);
        yield `\n\n[Error: ${error.message || 'Failed to get AI response'}]`;
    }
}

export async function getGroqResponse(prompt, documentContext = '') {
    try {
        // const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

        // UPDATE: Instruction to enforce plain text
        const instructions = "Answer in strictly plain text. Do not use Markdown, bolding, or headers.";

        const fullPrompt = documentContext
            ? `System: ${instructions}\nContext:\n${documentContext}\n\nUser request: ${prompt}`
            : `System: ${instructions}\nUser request: ${prompt}`;

        // const result = await model.generateContent(fullPrompt);
        const result = await generateText({
            model: model,
            prompt: fullPrompt,
        });

        // Clean any residual markdown just in case
        return cleanMarkdown(result.text);

    } catch (error) {
        console.error('Groq API Error:', error);
        return `Error: ${error.message || 'Failed to get AI response'}`;
    }
}

export async function formatDocumentWithAI(content) {
    try {
        // const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });

        // Your prompt is good, but models often wrap HTML in ```html blocks anyway.
        const prompt = `Format the following text to be more professional... [YOUR EXISTING PROMPT] ... Return ONLY the formatted HTML content.`;

        const result = await generateText({
            model: model,
            prompt: prompt,
        });
        const rawText = result.text;

        // UPDATE: Clean the code blocks so you don't get '```html' in your rich text editor
        return cleanCodeBlock(rawText);

    } catch (error) {
        console.error('Groq API Error:', error);
        throw error;
    }
}