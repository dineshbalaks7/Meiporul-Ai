import { useState, useEffect, useCallback } from 'react';
import { conversationService } from '../services/conversationService';
import { ConversationSummary } from '../types/conversation';
import { parseApiError } from '../services/api';
import { useToast } from '../components/ui/Toast';

export function useConversations() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { success, error: toastError } = useToast();

  const fetchConversations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await conversationService.listConversations();
      setConversations(data);
    } catch (err) {
      const parsed = parseApiError(err);
      setError(parsed.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const deleteConversation = useCallback(
    async (conversationId: string): Promise<boolean> => {
      try {
        await conversationService.deleteConversation(conversationId);
        success('Conversation deleted', 'The chat thread was removed.');

        // If the active conversation was deleted, start fresh
        if (activeConversationId === conversationId) {
          setActiveConversationId(null);
        }

        await fetchConversations();
        return true;
      } catch (err) {
        const parsed = parseApiError(err);
        toastError('Failed to delete conversation', parsed.message);
        return false;
      }
    },
    [activeConversationId, fetchConversations, success, toastError]
  );

  const renameConversation = useCallback(
    async (conversationId: string, newTitle: string): Promise<boolean> => {
      try {
        const { title } = await conversationService.renameConversation(conversationId, newTitle);
        setConversations((prev) =>
          prev.map((c) =>
            c.conversation_id === conversationId ? { ...c, title } : c
          )
        );
        success('Renamed', 'Conversation title updated.');
        return true;
      } catch (err) {
        const parsed = parseApiError(err);
        toastError('Failed to rename conversation', parsed.message);
        return false;
      }
    },
    [success, toastError]
  );

  const togglePinConversation = useCallback(
    async (conversationId: string, isPinned?: boolean): Promise<boolean> => {
      try {
        const { is_pinned } = await conversationService.togglePinConversation(
          conversationId,
          isPinned
        );
        setConversations((prev) =>
          prev.map((c) =>
            c.conversation_id === conversationId ? { ...c, is_pinned } : c
          )
        );
        success(
          is_pinned ? 'Conversation pinned' : 'Conversation unpinned',
          is_pinned ? 'Chat added to pinned list.' : 'Chat removed from pinned list.'
        );
        return true;
      } catch (err) {
        const parsed = parseApiError(err);
        toastError('Failed to update pin status', parsed.message);
        return false;
      }
    },
    [success, toastError]
  );

  const startNewChat = useCallback(() => {
    setActiveConversationId(null);
  }, []);

  const clearAllConversations = useCallback(async (): Promise<boolean> => {
    try {
      const { deleted_count } = await conversationService.deleteAllConversations();
      setConversations([]);
      setActiveConversationId(null);
      success('Started fresh', `${deleted_count} chat${deleted_count === 1 ? '' : 's'} cleared.`);
      return true;
    } catch (err) {
      const parsed = parseApiError(err);
      toastError('Unable to clear chats', parsed.message);
      return false;
    }
  }, [success, toastError]);

  return {
    conversations,
    activeConversationId,
    setActiveConversationId,
    isLoading,
    error,
    fetchConversations,
    deleteConversation,
    renameConversation,
    togglePinConversation,
    startNewChat,
    clearAllConversations,
  };
}
