import { NextRequest } from 'next/server';
import { streamClaude } from '@/lib/anthropic';
import { NoveltyLevel } from '@/lib/types';

const SYSTEM = `You are a scientific novelty advisor helping researchers identify unexplored angles and reformulate hypotheses to be more original.

When given a hypothesis and its literature context, you:
1. Identify what IS well-established vs. what remains unexplored in this space
2. Suggest concrete, specific reformulations that could be genuinely novel

Each suggested reformulation must:
- Be a complete, specific scientific hypothesis (intervention + measurable outcome + threshold + mechanism)
- Change at least one concrete parameter from the original (organism, concentration, method, timepoint, material, or mechanism)
- Be realistic to execute in a standard lab

Format your 3 suggested reformulations each on their own line starting with exactly "> " — the UI will render these as clickable suggestions.`;

function buildPrompt(hypothesis: string, novelty: NoveltyLevel, signalText: string, userMessage: string): string {
  const noveltyLabel = {
    exact_match: 'EXACT MATCH — this specific experiment has been published',
    similar_exists: 'SIMILAR WORK EXISTS — closely related experiments have been published',
    not_found: 'appears novel',
  }[novelty];

  return `The scientist proposed this hypothesis:
"${hypothesis}"

Literature assessment: ${noveltyLabel}
Context: ${signalText}

The scientist asks: "${userMessage}"

Respond with:
- A brief analysis (2–3 sentences) of what remains unexplored or how to differentiate
- Exactly 3 reformulated hypotheses, each on its own line starting with "> "
  Example format:
  > [Complete reformed hypothesis with specific parameters]

Keep each reformulation to 1–2 sentences. Be scientifically precise.`;
}

export async function POST(req: NextRequest) {
  let body: { hypothesis?: unknown; novelty?: unknown; signalText?: unknown; message?: unknown };
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const { hypothesis, novelty, signalText, message } = body;
  if (typeof hypothesis !== 'string' || typeof message !== 'string') {
    return new Response('hypothesis and message are required strings', { status: 400 });
  }

  const upstream = await streamClaude(
    SYSTEM,
    buildPrompt(
      hypothesis,
      (novelty as NoveltyLevel) ?? 'similar_exists',
      typeof signalText === 'string' ? signalText : '',
      message
    ),
    800
  );

  const stream = new ReadableStream({
    async start(controller) {
      const reader = upstream.getReader();
      const dec = new TextDecoder();
      let buf = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          const lines = buf.split('\n');
          buf = lines.pop() ?? '';
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const payload = line.slice(6).trim();
            if (payload === '[DONE]') continue;
            try {
              const ev = JSON.parse(payload) as { type: string; delta?: { type: string; text: string } };
              if (ev.type === 'content_block_delta' && ev.delta?.type === 'text_delta') {
                controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ text: ev.delta.text })}\n\n`));
              }
            } catch { /* ignore malformed events */ }
          }
        }
      } finally {
        controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
  });
}
