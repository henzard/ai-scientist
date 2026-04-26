import { NextRequest, NextResponse } from 'next/server';
import { callClaude } from '@/lib/anthropic';

export async function POST(req: NextRequest) {
  const { hypothesis } = await req.json();
  if (!hypothesis) return NextResponse.json({ error: 'No hypothesis' }, { status: 400 });

  const raw = await callClaude(
    'You are a scientific literature specialist. Return ONLY valid JSON — no markdown fences, no preamble.',
    `Assess the novelty of this scientific experiment hypothesis:\n\n"${hypothesis}"\n\nReturn ONLY this JSON:\n{\n  "novelty": "not_found",\n  "signal_text": "2–3 sentence factual description",\n  "references": [\n    { "title": "...", "authors": "Last et al.", "year": 2023, "journal": "..." }\n  ]\n}\n\nnovelty must be exactly one of: "not_found", "similar_exists", "exact_match".\nOnly include references you are confident genuinely exist. 0–3 maximum.`,
    1000
  );

  const clean = raw.replace(/```json\n?|\n?```/g, '').trim();
  const result = JSON.parse(clean);
  return NextResponse.json(result);
}
