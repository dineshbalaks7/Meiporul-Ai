import React, { useState, useEffect, useRef } from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';

interface RenameConversationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newTitle: string) => Promise<void>;
  currentTitle?: string;
  isRenaming: boolean;
}

export const RenameConversationDialog: React.FC<RenameConversationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  currentTitle = '',
  isRenaming,
}) => {
  const [title, setTitle] = useState(currentTitle);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle(currentTitle);
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 50);
    }
  }, [isOpen, currentTitle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || trimmed === currentTitle) {
      onClose();
      return;
    }
    await onConfirm(trimmed);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Rename Conversation"
      description="Enter a new title for this conversation thread."
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        <div>
          <label htmlFor="conversation-title" className="block text-xs font-medium text-[#78716C] mb-1.5">
            Conversation Title
          </label>
          <input
            ref={inputRef}
            id="conversation-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isRenaming}
            maxLength={100}
            className="w-full px-3 py-2 rounded-xl border border-[#E8E2D7] bg-[#FCFAF7] text-base sm:text-sm text-[#1C1917] placeholder-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-[#9E4A25]/20 focus:border-[#9E4A25] transition-all"
            placeholder="e.g. Machine Learning Basics"
          />
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isRenaming}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={!title.trim() || isRenaming}
            isLoading={isRenaming}
          >
            Save Title
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
