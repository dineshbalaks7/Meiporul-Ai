export interface SourceItem {
  source_id: number;
  filename: string;
  page_number?: number | null;
  content: string;
  rerank_score?: number | null;
}

export interface ChatRequest {
  question: string;
  document_id?: string | null;
  conversation_id?: string | null;
}

export interface ChatResponse {
  conversation_id: string;
  question: string;
  document_id: string | null;
  answer: string;
  sources: SourceItem[];
  latency?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: SourceItem[];
  timestamp?: string;
  status?: 'sending' | 'sent' | 'error';
  errorMessage?: string;
  latency?: number;
}
