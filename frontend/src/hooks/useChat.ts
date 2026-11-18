import { useState, useCallback, useEffect, useRef } from 'react';
import { ChatMessage, SourceItem } from '../types/chat';
import { chatService } from '../services/chatService';
import { conversationService } from '../services/conversationService';
import { parseApiError } from '../services/api';
import { useToast } from '../components/ui/Toast';

interface UseChatProps {
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  selectedDocumentId: string | null;
  onConversationUpdated?: () => void;
}

export function useChat({
  activeConversationId,
  setActiveConversationId,
  selectedDocumentId,
  onConversationUpdated,
}: UseChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStep, setLoadingStep] = useState<'searching' | 'generating'>('searching');
  const [selectedSource, setSelectedSource] = useState<SourceItem | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const { error: toastError } = useToast();
  const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load chat history when activeConversationId changes
  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      setSelectedSource(null);
      return;
    }

    let isMounted = true;
    setIsLoadingHistory(true);

    conversationService
      .getConversationHistory(activeConversationId)
      .then((history) => {
        if (!isMounted) return;
        const loaded: ChatMessage[] = history.messages.map((m, idx) => ({
          id: `hist-${idx}-${Date.now()}`,
          role: m.role,
          content: m.content,
          sources: m.sources || [],
          status: 'sent',
        }));
        setMessages(loaded);
      })
      .catch((err) => {
        if (!isMounted) return;
        const parsed = parseApiError(err);
        toastError('Failed to load conversation history', parsed.message);
        setMessages([]);
      })
      .finally(() => {
        if (isMounted) setIsLoadingHistory(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeConversationId, toastError]);

  const sendMessage = useCallback(
    async (questionText: string) => {
      const trimmed = questionText.trim();
      if (!trimmed || isGenerating) return;

      const userMessageId = `user-${Date.now()}`;
      const assistantMessageId = `assistant-${Date.now()}`;

      // Optimistically add user message
      const userMessage: ChatMessage = {
        id: userMessageId,
        role: 'user',
        content: trimmed,
        timestamp: new Date().toISOString(),
        status: 'sent',
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsGenerating(true);
      setLoadingStep('searching');

      // Realistic staged feedback
      loadingTimerRef.current = setTimeout(() => {
        setLoadingStep('generating');
      }, 1400);

      try {
        const response = await chatService.sendMessage({
          question: trimmed,
          document_id: selectedDocumentId,
          conversation_id: activeConversationId,
        });

        // If this was a new conversation, update the conversation ID
        if (!activeConversationId && response.conversation_id) {
          setActiveConversationId(response.conversation_id);
        }

        const assistantMessage: ChatMessage = {
          id: assistantMessageId,
          role: 'assistant',
          content: response.answer,
          sources: response.sources || [],
          timestamp: new Date().toISOString(),
          status: 'sent',
        };

        setMessages((prev) => [...prev, assistantMessage]);
        onConversationUpdated?.();
      } catch (err) {
        const parsed = parseApiError(err);
        toastError('Query failed', parsed.message);

        const errorMessage: ChatMessage = {
          id: assistantMessageId,
          role: 'assistant',
          content: 'Sorry, I encountered an issue retrieving the information from your documents.',
          timestamp: new Date().toISOString(),
          status: 'error',
          errorMessage: parsed.message,
        };

        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
        setIsGenerating(false);
      }
    },
    [
      activeConversationId,
      isGenerating,
      onConversationUpdated,
      selectedDocumentId,
      setActiveConversationId,
      toastError,
    ]
  );

  const retryLastQuestion = useCallback(() => {
    // Find the last user message
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        const question = messages[i].content;
        // Remove subsequent error assistant message
        setMessages((prev) => prev.slice(0, i));
        sendMessage(question);
        break;
      }
    }
  }, [messages, sendMessage]);

  const editMessage = useCallback(
    (messageId: string, newContent: string) => {
      const trimmed = newContent.trim();
      if (!trimmed || isGenerating) return;

      const msgIndex = messages.findIndex((m) => m.id === messageId);
      if (msgIndex === -1) {
        sendMessage(trimmed);
        return;
      }

      // Slice out this message and any subsequent messages, then send updated question
      setMessages((prev) => prev.slice(0, msgIndex));
      sendMessage(trimmed);
    },
    [isGenerating, messages, sendMessage]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setSelectedSource(null);
    setActiveConversationId(null);
  }, [setActiveConversationId]);

  return {
    messages,
    isGenerating,
    loadingStep,
    selectedSource,
    setSelectedSource,
    isLoadingHistory,
    sendMessage,
    retryLastQuestion,
    editMessage,
    clearChat,
  };
}
