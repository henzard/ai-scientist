const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const API_BASE = 'https://api.anthropic.com/v1/messages';
const API_VERSION = '2023-06-01';
const MODEL = 'claude-sonnet-4-6';

function getApiKey(): string {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  }
  return ANTHROPIC_API_KEY;
}

function buildHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'x-api-key': getApiKey(),
    'anthropic-version': API_VERSION,
  };
}

export async function callClaude(system: string, prompt: string, maxTokens = 1000): Promise<string> {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Anthropic API error ${res.status}: ${body}`);
  }

  const data = await res.json() as { error?: { message: string }; content: { text: string }[] };
  if (data.error) throw new Error(data.error.message);
  return data.content[0].text;
}

export async function streamClaude(
  system: string,
  prompt: string,
  maxTokens = 2000
): Promise<ReadableStream<Uint8Array>> {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      stream: true,
      system,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Anthropic API error ${res.status}: ${body}`);
  }

  if (!res.body) {
    throw new Error('Anthropic API returned empty response body');
  }

  return res.body;
}
