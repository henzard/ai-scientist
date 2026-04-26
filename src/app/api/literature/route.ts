import { NextRequest, NextResponse } from 'next/server';
import { callClaude } from '@/lib/anthropic';

const MAX_HYPOTHESIS_LENGTH = 2000;

export async function POST(req: NextRequest) {
  let body: { hypothesis?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const hypothesis = body.hypothesis;
  if (typeof hypothesis !== 'string' || !hypothesis.trim()) {
    return NextResponse.json({ error: 'hypothesis must be a non-empty string' }, { status: 400 });
  }
  if (hypothesis.length > MAX_HYPOTHESIS_LENGTH) {
    return NextResponse.json(
      { error: `hypothesis must be ${MAX_HYPOTHESIS_LENGTH} characters or fewer` },
      { status: 400 }
    );
  }

  let raw: string;
  try {
    raw = await callClaude(
      'You are a scientific literature specialist. Return ONLY valid JSON — no markdown fences, no preamble.',
      `Assess the novelty of this scientific experiment hypothesis:\n\n"${hypothesis}"\n\nReturn ONLY this JSON:\n{\n  "novelty": "not_found",\n  "signal_text": "2–3 sentence factual description",\n  "references": [\n    { "title": "...", "authors": "Last et al.", "year": 2023, "journal": "..." }\n  ]\n}\n\nnovelty must be exactly one of: "not_found", "similar_exists", "exact_match".\nOnly include references you are confident genuinely exist. 0–3 maximum.`,
      1000
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Claude API call failed';
    return NextResponse.json({ error: message }, { status: 502 });
  }

  try {
    const clean = raw.replace(/```json\n?|\n?```/g, '').trim();
    const result = JSON.parse(clean);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: 'Failed to parse literature response — try again' },
      { status: 502 }
    );
  }
}
