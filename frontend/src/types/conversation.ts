import { SourceItem } from './chat';

export interface ConversationSummary {
  conversation_id: string;
  created_at: string;
  title: string;
  total_messages: number;
  last_message: string | null;
  is_pinned?: boolean;
}

export interface ConversationListResponse {
  total_conversations: number;
  conversations: ConversationSummary[];
}

export interface ConversationHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: SourceItem[];
  latency?: number | null;
}

export interface ConversationHistoryResponse {
  conversation_id: string;
  total_messages: number;
  messages: ConversationHistoryMessage[];
}

export interface DeleteConversationResponse {
  message: string;
  conversation_id: string;
}
