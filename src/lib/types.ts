// ─── Literature ──────────────────────────────────────────────────────────────

export type NoveltyLevel = 'not_found' | 'similar_exists' | 'exact_match';

export interface LiteratureReference {
  title: string;
  authors: string;
  journal: string;
  year: number;
}

export interface LiteratureResult {
  novelty: NoveltyLevel;
  signal_text: string;
  references: LiteratureReference[];
}

// ─── Agents ──────────────────────────────────────────────────────────────────

export type AgentId = 'protocol' | 'materials' | 'budget' | 'timeline' | 'validation';
export type AgentStatus = 'pending' | 'running' | 'done' | 'error';

export interface AgentDefinition {
  id: AgentId;
  label: string;
  icon: string;
  system: string;
  getPrompt: (hypothesis: string) => string;
}

// ─── Pipeline state ───────────────────────────────────────────────────────────

export interface PipelineState {
  hypothesis: string;
  stage: 'idle' | 'checking' | 'ready' | 'planning' | 'complete' | 'error';
  litResult: LiteratureResult | null;
  sections: Partial<Record<AgentId, string>>;
  agentStatus: Partial<Record<AgentId | 'lit', AgentStatus>>;
  activeAgent: AgentId | 'lit' | null;
  error: string | null;
}

// ─── Feedback / Scientist Review ─────────────────────────────────────────────

export type FeedbackRating = 'up' | 'down';

export interface FeedbackEntry {
  id: string;
  domain: string;
  agentId: AgentId;
  rating: FeedbackRating;
  /** Free-text correction supplied when rating === 'down'. Empty string otherwise. */
  correction: string;
  hypothesis: string;
  createdAt: number;
}

export interface FeedbackPayload {
  domain: string;
  agentId: AgentId;
  rating: FeedbackRating;
  correction: string;
  hypothesis: string;
}
