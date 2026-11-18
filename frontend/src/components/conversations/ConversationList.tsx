import React from 'react';
import { ConversationSummary } from '../../types/conversation';
import { ConversationItem } from './ConversationItem';

interface ConversationListProps {
  conversations: ConversationSummary[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => Promise<boolean>;
  onTogglePin?: (id: string) => Promise<boolean>;
  isLoading?: boolean;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onDeleteConversation,
  onTogglePin,
  isLoading,
}) => {
  if (isLoading && conversations.length === 0) {
    return (
      <div className="space-y-1.5 px-3 py-2">
        {[1, 2, 3].map((n) => (
          <div key={n} className="h-8 rounded-lg bg-neutral-100/70 animate-pulse" />
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="px-4 py-6 text-center">
        <p className="text-xs text-brand-muted">No conversations yet</p>
        <p className="text-[11px] text-neutral-400 mt-0.5">
          Start a new chat to see your history here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0.5 px-2">
      {conversations.map((item) => (
        <ConversationItem
          key={item.conversation_id}
          conversation={item}
          isActive={item.conversation_id === activeConversationId}
          onSelect={onSelectConversation}
          onDelete={onDeleteConversation}
          onTogglePin={onTogglePin}
        />
      ))}
    </div>
  );
};
