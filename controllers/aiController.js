/**
 * AI text generation, proxied so the provider key never reaches the browser.
 *
 * Uses the OpenAI-compatible "chat completions" shape, which means you can point
 * it at almost any provider by changing three env vars:
 *   AI_BASE_URL  (default: Groq)
 *   AI_MODEL     (default: Groq's openai/gpt-oss-120b)
 *   AI_API_KEY   (your provider key)
 *
 * Examples:
 *   Groq:       AI_BASE_URL=https://api.groq.com/openai/v1
 *   OpenAI:     AI_BASE_URL=https://api.openai.com/v1        AI_MODEL=gpt-4o-mini
 *   OpenRouter: AI_BASE_URL=https://openrouter.ai/api/v1     AI_MODEL=...
 *   Ollama:     AI_BASE_URL=http://localhost:11434/v1        AI_MODEL=llama3.1
 */
// POST /api/ai  { prompt }  ->  { text }
export const generate = async (req, res, next) => {
  try {
    // Read env at request time (not module load) so it works regardless of when
    // dotenv.config() runs relative to imports.
    const AI_BASE_URL = process.env.AI_BASE_URL || 'https://api.groq.com/openai/v1';
    // llama-3.3-70b-versatile is decommissioned by Groq on 2026-08-16; the
    // recommended replacement is openai/gpt-oss-120b.
    const AI_MODEL = process.env.AI_MODEL || 'openai/gpt-oss-120b';
    const AI_API_KEY = process.env.AI_API_KEY || process.env.GROQ_API_KEY;

    const prompt = (req.body.prompt || '').toString().trim();
    if (!prompt) {
      return res.status(400).json({ message: 'A prompt is required.' });
    }
    if (!AI_API_KEY) {
      return res
        .status(500)
        .json({ message: 'AI is not configured. Set AI_API_KEY in the backend .env.' });
    }

    const response = await fetch(`${AI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      console.error('AI provider error:', errBody);
      return res
        .status(502)
        .json({ message: errBody.error?.message || 'The AI request failed. Try again shortly.' });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content ?? '';
    res.status(200).json({ text });
  } catch (err) {
    next(err);
  }
};
