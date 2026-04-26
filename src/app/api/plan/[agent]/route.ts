import { NextRequest } from 'next/server';
import { streamClaude } from '@/lib/anthropic';
import { PLAN_AGENTS } from '@/lib/agents';
import { getSemanticCorrections } from '@/lib/feedbackStore';

const MAX_HYPOTHESIS_LENGTH = 2000;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ agent: string }> }
) {
  const { agent } = await params;

  let body: { hypothesis?: unknown; domain?: unknown };
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON body', { status: 400 });
  }

  const { hypothesis } = body;

  if (typeof hypothesis !== 'string' || !hypothesis.trim()) {
    return new Response('hypothesis must be a non-empty string', { status: 400 });
  }
  if (hypothesis.length > MAX_HYPOTHESIS_LENGTH) {
    return new Response('hypothesis too long', { status: 400 });
  }

  const agentDef = PLAN_AGENTS.find(a => a.id === agent);
  if (!agentDef) return new Response('Unknown agent', { status: 404 });

  // Semantic "second brain" retrieval: find corrections from ANY prior experiment
  // whose hypothesis is semantically similar to the current one (Jaccard similarity
  // on scientific keywords). This allows cross-domain learning — e.g. a pH
  // correction submitted for a biosensor plan will surface for any similar
  // antibody-based assay, regardless of exact domain label.
  const corrections = getSemanticCorrections(hypothesis, agentDef.id);
  const systemPrompt = corrections.length > 0
    ? `${agentDef.system}\n\n---\nSCIENTIST CORRECTIONS FROM PREVIOUS PLANS — apply these improvements without being asked:\n${corrections.map((c, i) => `${i + 1}. ${c}`).join('\n')}`
    : agentDef.system;

  let upstream: ReadableStream<Uint8Array>;
  try {
    upstream = await streamClaude(systemPrompt, agentDef.getPrompt(hypothesis));
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Upstream error';
    return new Response(msg, { status: 502 });
  }

  // Parse Anthropic SSE stream and re-emit only text deltas as our own SSE.
  const stream = new ReadableStream({
    async start(controller) {
      const reader = upstream.getReader();
      const dec = new TextDecoder();
      let buf = '';

      const emit = (text: string) => {
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ text })}\n\n`));
      };

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
                emit(ev.delta.text);
              }
            } catch {
              // Ignore malformed SSE events — Anthropic occasionally sends non-JSON lines
            }
          }
        }
      } finally {
        // Always close the stream, even on error, so the client doesn't hang
        controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
