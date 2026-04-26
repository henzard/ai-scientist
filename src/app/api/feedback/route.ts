import { NextRequest, NextResponse } from 'next/server';
import { addFeedback, getFeedback } from '@/lib/feedbackStore';
import { AgentId, FeedbackPayload } from '@/lib/types';

const VALID_AGENT_IDS: AgentId[] = ['protocol', 'materials', 'budget', 'timeline', 'validation'];
const VALID_RATINGS = ['up', 'down'] as const;

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: Partial<FeedbackPayload>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { domain, agentId, rating, correction, hypothesis } = body;

  if (!domain || typeof domain !== 'string') {
    return NextResponse.json({ error: 'domain is required' }, { status: 400 });
  }
  if (!agentId || !VALID_AGENT_IDS.includes(agentId)) {
    return NextResponse.json({ error: `agentId must be one of: ${VALID_AGENT_IDS.join(', ')}` }, { status: 400 });
  }
  if (!rating || !VALID_RATINGS.includes(rating)) {
    return NextResponse.json({ error: 'rating must be "up" or "down"' }, { status: 400 });
  }
  if (typeof correction !== 'string') {
    return NextResponse.json({ error: 'correction must be a string' }, { status: 400 });
  }
  if (!hypothesis || typeof hypothesis !== 'string') {
    return NextResponse.json({ error: 'hypothesis is required' }, { status: 400 });
  }

  const entry = addFeedback({ domain, agentId, rating, correction: correction.trim(), hypothesis });
  return NextResponse.json(entry, { status: 201 });
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const domain = searchParams.get('domain');
  const agentId = searchParams.get('agentId') as AgentId | null;

  if (!domain) return NextResponse.json({ error: 'domain param required' }, { status: 400 });
  if (!agentId || !VALID_AGENT_IDS.includes(agentId)) {
    return NextResponse.json({ error: 'valid agentId param required' }, { status: 400 });
  }

  return NextResponse.json(getFeedback(domain, agentId));
}
