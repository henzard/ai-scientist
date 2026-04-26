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

export type AgentId = 'protocol' | 'materials' | 'budget' | 'timeline' | 'validation';
export type AgentStatus = 'pending' | 'running' | 'done' | 'error';

export interface AgentDefinition {
  id: AgentId;
  label: string;
  icon: string;
  system: string;
  getPrompt: (hypothesis: string) => string;
}

export interface PipelineState {
  hypothesis: string;
  stage: 'idle' | 'checking' | 'ready' | 'planning' | 'complete' | 'error';
  litResult: LiteratureResult | null;
  sections: Partial<Record<AgentId, string>>;
  agentStatus: Partial<Record<AgentId | 'lit', AgentStatus>>;
  activeAgent: AgentId | 'lit' | null;
  error: string | null;
}
