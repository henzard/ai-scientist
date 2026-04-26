import { NextRequest } from 'next/server';
import { streamClaude } from '@/lib/anthropic';
import { PLAN_AGENTS } from '@/lib/agents';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ agent: string }> }
) {
  const { agent } = await params;
  const { hypothesis } = await req.json();
  const agentDef = PLAN_AGENTS.find(a => a.id === agent);
  if (!agentDef) return new Response('Unknown agent', { status: 404 });

  const upstream = await streamClaude(agentDef.system, agentDef.getPrompt(hypothesis));

  const stream = new ReadableStream({
    async start(controller) {
      const reader = upstream.getReader();
      const dec = new TextDecoder();
      let buf = '';

      const send = (text: string) => {
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ text })}\n\n`));
      };

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
            const ev = JSON.parse(payload);
            if (ev.type === 'content_block_delta' && ev.delta?.type === 'text_delta') {
              send(ev.delta.text);
            }
          } catch {}
        }
      }
      controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
      controller.close();
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
