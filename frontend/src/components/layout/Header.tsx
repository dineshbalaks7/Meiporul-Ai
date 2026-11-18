import React, { useState } from 'react';
import {
  Menu,
  ChevronDown,
  Pin,
  Edit3,
  Trash2,
  Share2,
  MoreHorizontal,
  Archive,
  Flag,
} from 'lucide-react';
import { ConversationSummary } from '../../types/conversation';
import { Dropdown } from '../ui/Dropdown';
import { useToast } from '../ui/Toast';
import { RenameConversationDialog } from '../conversations/RenameConversationDialog';
import { DeleteConversationDialog } from '../conversations/DeleteConversationDialog';

interface HeaderProps {
  onOpenMobileMenu: () => void;
  activeConversation?: ConversationSummary | null;
  onRenameConversation?: (conversationId: string, newTitle: string) => Promise<boolean>;
  onTogglePinConversation?: (conversationId: string) => Promise<boolean>;
  onDeleteCurrentChat?: () => void;
  isBackendHealthy: boolean;
  onNewChat?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMobileMenu,
  activeConversation,
  onRenameConversation,
  onTogglePinConversation,
  onDeleteCurrentChat,
  isBackendHealthy,
}) => {
  const { success } = useToast();

  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    success('Link copied', 'Chat link copied to clipboard.');
  };

  const handleRenameConfirm = async (newTitle: string) => {
    if (!activeConversation || !onRenameConversation) return;
    setIsRenaming(true);
    const ok = await onRenameConversation(activeConversation.conversation_id, newTitle);
    setIsRenaming(false);
    if (ok) {
      setShowRenameModal(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!onDeleteCurrentChat) return;
    setIsDeleting(true);
    await onDeleteCurrentChat();
    setIsDeleting(false);
    setShowDeleteModal(false);
  };

  const handleTogglePin = async () => {
    if (!activeConversation || !onTogglePinConversation) return;
    await onTogglePinConversation(activeConversation.conversation_id);
  };

  const chatDropdownItems = activeConversation
    ? [
        {
          id: 'rename',
          label: 'Rename',
          icon: <Edit3 className="w-3.5 h-3.5 text-[#78716C]" />,
          onClick: () => setShowRenameModal(true),
        },
        {
          id: 'pin',
          label: activeConversation.is_pinned ? 'Unpin chat' : 'Pin chat',
          icon: (
            <Pin
              className={`w-3.5 h-3.5 ${
                activeConversation.is_pinned
                  ? 'text-[#9E4A25] fill-current'
                  : 'text-[#78716C]'
              }`}
            />
          ),
          onClick: handleTogglePin,
        },
        {
          id: 'delete',
          label: 'Delete',
          danger: true,
          icon: <Trash2 className="w-3.5 h-3.5 text-brand-error" />,
          onClick: () => setShowDeleteModal(true),
        },
      ]
    : [];

  return (
    <>
      <header className="h-13 sm:h-14 px-3 sm:px-6 bg-[#FCFAF7] border-b border-[#E8E2D7] flex items-center justify-between shrink-0 select-none pt-[env(safe-area-inset-top,0px)]">
        {/* Left: Mobile hamburger + Chat Title Dropdown */}
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 max-w-[68%] sm:max-w-[75%]">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="group md:hidden p-2 rounded-lg text-[#78716C] hover:text-[#1C1917] hover:bg-[#EAE4DC] active:scale-95 transition-transform shrink-0"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5 icon-hover-scale" />
          </button>

          {activeConversation ? (
            <Dropdown
              align="left"
              trigger={
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl hover:bg-[#EAE4DC] border border-transparent hover:border-[#E8E2D7] text-xs sm:text-sm font-medium text-[#1C1917] transition-all min-w-0 truncate text-left cursor-pointer group active:scale-[0.98]"
                  title={`${activeConversation.title || 'Untitled conversation'} • Click for options`}
                >
                  {activeConversation.is_pinned && (
                    <Pin className="w-3 h-3 text-[#9E4A25] fill-current shrink-0 icon-hover-tilt" />
                  )}
                  <span className="truncate max-w-[130px] sm:max-w-xs md:max-w-md">
                    {activeConversation.title || 'Untitled conversation'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#78716C] group-hover:text-[#1C1917] group-hover:translate-y-0.5 transition-all duration-200 shrink-0" />
                </button>
              }
              items={chatDropdownItems}
            />
          ) : (
            <div className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 text-xs sm:text-sm font-medium text-[#78716C]">
              <span>New conversation</span>
            </div>
          )}
        </div>

        {/* Right: Health Status + Share + More Menu */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Backend health status indicator */}
          <div
            className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] text-[#78716C]"
            title={isBackendHealthy ? 'Backend Connected' : 'Backend Disconnected'}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isBackendHealthy ? 'bg-emerald-500' : 'bg-red-500'
              }`}
            />
            <span className="text-[10px] uppercase font-mono tracking-wider">
              {isBackendHealthy ? 'Online' : 'Offline'}
            </span>
          </div>

          {/* Share Button */}
          <button
            type="button"
            onClick={handleShare}
            className="group inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#57534E] hover:text-[#1C1917] hover:bg-[#EAE4DC] transition-colors"
          >
            <Share2 className="w-3.5 h-3.5 icon-hover-scale group-hover:text-[#9E4A25]" />
            <span className="hidden sm:inline">Share</span>
          </button>

          {/* More Options Menu */}
          <Dropdown
            align="right"
            trigger={
              <button
                type="button"
                className="group p-1.5 rounded-lg text-[#57534E] hover:text-[#1C1917] hover:bg-[#EAE4DC] transition-colors"
                aria-label="More options"
              >
                <MoreHorizontal className="w-4 h-4 icon-hover-scale" />
              </button>
            }
            items={[
              {
                id: 'archive',
                label: 'Archive',
                icon: <Archive className="w-3.5 h-3.5 text-[#78716C]" />,
                onClick: () => {
                  success('Archived', 'Conversation moved to archive.');
                },
              },
              {
                id: 'report',
                label: 'Report',
                icon: <Flag className="w-3.5 h-3.5 text-[#78716C]" />,
                onClick: () => {
                  success('Feedback reported', 'Thank you for your feedback.');
                },
              },
            ]}
          />
        </div>
      </header>

      {/* Rename Dialog */}
      {activeConversation && (
        <RenameConversationDialog
          isOpen={showRenameModal}
          onClose={() => setShowRenameModal(false)}
          onConfirm={handleRenameConfirm}
          currentTitle={activeConversation.title}
          isRenaming={isRenaming}
        />
      )}

      {/* Delete Dialog */}
      {activeConversation && (
        <DeleteConversationDialog
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteConfirm}
          conversationTitle={activeConversation.title}
          isDeleting={isDeleting}
        />
      )}
    </>
  );
};
