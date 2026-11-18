import { apiClient } from './api';
import { ChatRequest, ChatResponse } from '../types/chat';

export const chatService = {
  /**
   * Ask question to RAG backend
   */
  async sendMessage(payload: ChatRequest): Promise<ChatResponse> {
    const response = await apiClient.post<ChatResponse>('/api/chat/', {
      question: payload.question.trim(),
      document_id: payload.document_id || null,
      conversation_id: payload.conversation_id || null,
    });
    return response.data;
  },
};
