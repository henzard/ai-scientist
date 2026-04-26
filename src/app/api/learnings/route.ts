import { NextRequest } from 'next/server';
import { getSemanticCorrections } from '@/lib/feedbackStore';
import { PLAN_AGENTS } from '@/lib/agents';
import { AgentId } from '@/lib/types';

export interface AgentLearning {
  agentId: AgentId;
  agentLabel: string;
  agentIcon: string;
  corrections: string[];
}

export async function POST(req: NextRequest) {
  let body: { hypothesis?: unknown };
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const { hypothesis } = body;
  if (typeof hypothesis !== 'string' || !hypothesis.trim()) {
    return new Response('hypothesis is required', { status: 400 });
  }

  const learnings: AgentLearning[] = [];

  for (const agent of PLAN_AGENTS) {
    const corrections = getSemanticCorrections(hypothesis, agent.id, 3);
    if (corrections.length > 0) {
      learnings.push({
        agentId: agent.id,
        agentLabel: agent.label,
        agentIcon: agent.icon,
        corrections,
      });
    }
  }

  return Response.json({ learnings });
}
