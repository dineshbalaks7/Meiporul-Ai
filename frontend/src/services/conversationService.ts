import { apiClient } from './api';
import {
  ConversationSummary,
  ConversationListResponse,
  ConversationHistoryResponse,
  DeleteConversationResponse,
} from '../types/conversation';

export const conversationService = {
  /**
   * List all conversations with summary statistics
   */
  async listConversations(): Promise<ConversationSummary[]> {
    const response = await apiClient.get<ConversationListResponse>('/api/chat/conversations');
    return response.data.conversations || [];
  },

  /**
   * Retrieve message history for a specific conversation
   */
  async getConversationHistory(conversationId: string): Promise<ConversationHistoryResponse> {
    const response = await apiClient.get<ConversationHistoryResponse>(
      `/api/chat/${encodeURIComponent(conversationId)}/history`
    );
    return response.data;
  },

  /**
   * Delete an entire conversation
   */
  async deleteConversation(conversationId: string): Promise<DeleteConversationResponse> {
    const response = await apiClient.delete<DeleteConversationResponse>(
      `/api/chat/conversations/${encodeURIComponent(conversationId)}`
    );
    return response.data;
  },

  /**
   * Rename a conversation title
   */
  async renameConversation(conversationId: string, title: string): Promise<{ title: string }> {
    const response = await apiClient.patch<{ message: string; conversation_id: string; title: string }>(
      `/api/chat/conversations/${encodeURIComponent(conversationId)}/rename`,
      { title }
    );
    return { title: response.data.title };
  },

  /**
   * Pin or unpin a conversation
   */
  async togglePinConversation(conversationId: string, isPinned?: boolean): Promise<{ is_pinned: boolean }> {
    const response = await apiClient.patch<{ message: string; conversation_id: string; is_pinned: boolean }>(
      `/api/chat/conversations/${encodeURIComponent(conversationId)}/pin`,
      isPinned !== undefined ? { is_pinned: isPinned } : {}
    );
    return { is_pinned: response.data.is_pinned };
  },
};
