import { groq } from '@ai-sdk/groq';
import { generateText } from 'ai';

// Initialize Groq model for fast completions
const model = groq(process.env.GROQ_MODEL_NAME || 'llama-3.3-70b-versatile');

// Get AI text completion
export const getCompletion = async (req, res) => {
    try {
        const { text } = req.body;

        if (!text || text.trim().length < 5) {
            return res.json({ success: true, completion: '' });
        }

        // Get the last ~150 characters for context
        const context = text.slice(-150);

        const prompt = `You are an autocomplete assistant. Complete the following text naturally with 5-15 words. Only provide the completion, no explanations, no quotes, no punctuation at the start. The completion should flow naturally from the existing text.

Text to complete: "${context}"

Completion:`;

        const result = await generateText({
            model: model,
            prompt: prompt,
            maxTokens: 30, // Keep it short for speed
        });

        // Clean up the completion
        let completion = result.text.trim();

        // Remove any leading quotes or punctuation
        completion = completion.replace(/^["'\-:,\s]+/, '');

        // Limit to first sentence or ~15 words
        const words = completion.split(' ').slice(0, 15);
        completion = words.join(' ');

        res.json({ success: true, completion });
    } catch (error) {
        console.error('Autocomplete error:', error);
        res.json({ success: true, completion: '' }); // Return empty on error, don't break UX
    }
};
