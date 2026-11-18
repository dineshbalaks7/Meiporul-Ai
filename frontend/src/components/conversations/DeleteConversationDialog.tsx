import React from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';

interface DeleteConversationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  conversationTitle?: string;
  isDeleting: boolean;
}

export const DeleteConversationDialog: React.FC<DeleteConversationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  conversationTitle = 'this conversation',
  isDeleting,
}) => {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Conversation"
      description="Are you sure you want to delete this conversation?"
    >
      <div className="py-2">
        <p className="text-xs text-brand-secondary">
          You are deleting:
        </p>
        <div className="mt-1.5 p-2.5 rounded-lg bg-neutral-50 border border-neutral-200 text-xs font-medium text-brand-primary truncate">
          {conversationTitle}
        </div>
        <p className="mt-3 text-xs text-brand-muted">
          All messages and query context within this conversation thread will be removed from your history database.
        </p>
      </div>

      <div className="mt-5 flex items-center justify-end gap-2.5">
        <Button
          variant="outline"
          size="sm"
          onClick={onClose}
          disabled={isDeleting}
        >
          Cancel
        </Button>
        <Button
          variant="danger"
          size="sm"
          onClick={onConfirm}
          isLoading={isDeleting}
        >
          Delete
        </Button>
      </div>
    </Dialog>
  );
};
