import React, { useState } from 'react';
import { MessageSquare, Trash2, MoreVertical, Copy, Check } from 'lucide-react';
import { Dropdown } from '../ui/Dropdown';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';

interface DocumentActionsProps {
  documentId: string;
  documentName: string;
  onOpenChat: (docId: string) => void;
  onDelete: (docId: string) => Promise<boolean>;
  compact?: boolean;
}

export const DocumentActions: React.FC<DocumentActionsProps> = ({
  documentId,
  documentName,
  onOpenChat,
  onDelete,
  compact = false,
}) => {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const { success } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(documentName);
    setHasCopied(true);
    success('Copied to clipboard', `Filename "${documentName}" copied.`);
    setTimeout(() => setHasCopied(false), 2000);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    await onDelete(documentId);
    setIsDeleting(false);
    setShowConfirmDelete(false);
  };

  return (
    <>
      <div className="flex items-center gap-1">
        {!compact && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChat(documentId)}
            className="group/query text-xs h-7 px-2.5 rounded-lg border-[#E8E2D7] text-[#1C1917] hover:border-[#9E4A25]/40 hover:text-[#9E4A25] hover:bg-[#F5EBE1] transition-colors"
            leftIcon={<MessageSquare className="w-3 h-3 text-[#9E4A25] icon-hover-scale" />}
          >
            Query
          </Button>
        )}

        <Dropdown
          align="right"
          trigger={
            <button
              type="button"
              className="group/more w-7 h-7 rounded-lg text-[#78716C] hover:text-[#1C1917] hover:bg-[#F2ECE4] flex items-center justify-center transition-colors focus-visible:outline-none"
              aria-label="Document options"
            >
              <MoreVertical className="w-3.5 h-3.5 icon-hover-scale group-hover/more:text-[#1C1917]" />
            </button>
          }
          items={[
            {
              id: 'chat',
              label: 'Query in Chat',
              icon: <MessageSquare className="w-3.5 h-3.5 text-[#9E4A25]" />,
              onClick: () => onOpenChat(documentId),
            },
            {
              id: 'copy',
              label: hasCopied ? 'Copied!' : 'Copy Filename',
              icon: hasCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#78716C]" />,
              onClick: handleCopy,
            },
            {
              id: 'delete',
              label: 'Delete Document',
              danger: true,
              icon: <Trash2 className="w-3.5 h-3.5 text-red-600" />,
              onClick: () => setShowConfirmDelete(true),
            },
          ]}
        />
      </div>

      {/* Delete confirmation dialog */}
      <Dialog
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        title="Remove Document from Library"
        description="This document and its vector embeddings will be permanently deleted from ChromaDB."
      >
        <div className="py-2 space-y-3">
          <div className="p-3 rounded-xl bg-[#F7F4EE] border border-[#E8E2D7] text-xs font-mono break-all text-[#1C1917]">
            {documentName}
          </div>
          <p className="text-xs text-[#78716C] leading-relaxed">
            Meiporul AI will no longer be able to retrieve citations or answer questions based on this document.
          </p>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowConfirmDelete(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleDeleteConfirm}
            isLoading={isDeleting}
            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
          >
            Delete Document
          </Button>
        </div>
      </Dialog>
    </>
  );
};
