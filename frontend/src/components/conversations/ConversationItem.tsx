import React, { useState } from 'react';
import { MoreHorizontal, Trash2, Pin } from 'lucide-react';
import { ConversationSummary } from '../../types/conversation';
import { DeleteConversationDialog } from './DeleteConversationDialog';
import { Dropdown } from '../ui/Dropdown';

interface ConversationItemProps {
  conversation: ConversationSummary;
  isActive: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => Promise<boolean>;
  onTogglePin?: (id: string) => Promise<boolean>;
}

export const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isActive,
  onSelect,
  onDelete,
  onTogglePin,
}) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    await onDelete(conversation.conversation_id);
    setIsDeleting(false);
    setShowDeleteModal(false);
  };

  return (
    <>
      <div
        onClick={() => onSelect(conversation.conversation_id)}
        className={`group relative flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg text-left cursor-pointer transition-colors text-xs select-none ${
          isActive
            ? 'bg-[#F0EAE1] text-[#1C1917] font-medium'
            : 'text-[#44403C] hover:text-[#1C1917] hover:bg-[#EAE4DC]'
        }`}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1 pr-1">
          {conversation.is_pinned && (
            <Pin className="w-2.5 h-2.5 text-[#9E4A25] fill-current shrink-0 icon-hover-tilt" />
          )}
          <span className="truncate leading-snug">
            {conversation.title || 'Untitled conversation'}
          </span>
        </div>

        {/* Options trigger */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Dropdown
            trigger={
              <button
                type="button"
                className="group/btn p-0.5 rounded text-[#78716C] hover:text-[#1C1917] hover:bg-[#DDD6CB] transition-colors"
                aria-label="Conversation options"
              >
                <MoreHorizontal className="w-3.5 h-3.5 icon-hover-scale group-hover/btn:text-[#1C1917]" />
              </button>
            }
            items={[
              ...(onTogglePin
                ? [
                    {
                      id: 'pin',
                      label: conversation.is_pinned ? 'Unpin chat' : 'Pin chat',
                      icon: (
                        <Pin
                          className={`w-3.5 h-3.5 ${
                            conversation.is_pinned
                              ? 'text-[#9E4A25] fill-current'
                              : 'text-[#78716C]'
                          }`}
                        />
                      ),
                      onClick: () => onTogglePin(conversation.conversation_id),
                    },
                  ]
                : []),
              {
                id: 'delete',
                label: 'Delete chat',
                danger: true,
                icon: <Trash2 className="w-3.5 h-3.5 text-brand-error" />,
                onClick: () => setShowDeleteModal(true),
              },
            ]}
          />
        </div>
      </div>

      <DeleteConversationDialog
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        conversationTitle={conversation.title}
        isDeleting={isDeleting}
      />
    </>
  );
};
