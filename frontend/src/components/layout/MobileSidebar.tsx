import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  PenSquare,
  Library,
  Settings as SettingsIcon,
} from 'lucide-react';
import { ConversationSummary } from '../../types/conversation';
import { ConversationList } from '../conversations/ConversationList';
import { NavPage } from './AppLayout';
import { UserProfile } from '../../hooks/useUserProfile';

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentPage: NavPage;
  onNavigate: (page: NavPage) => void;
  onNewChat: () => void;
  conversations: ConversationSummary[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => Promise<boolean>;
  onTogglePinConversation?: (id: string) => Promise<boolean>;
  isLoadingConversations?: boolean;
  documentCount?: number;
  onOpenSettings: () => void;
  userProfile: UserProfile;
  userInitials: string;
}

export const MobileSidebar: React.FC<MobileSidebarProps> = ({
  isOpen,
  onClose,
  currentPage,
  onNavigate,
  onNewChat,
  conversations,
  activeConversationId,
  onSelectConversation,
  onDeleteConversation,
  onTogglePinConversation,
  isLoadingConversations,
  documentCount = 0,
  onOpenSettings,
  userProfile,
  userInitials,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-stone-900/30 backdrop-blur-[2px]"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-4/5 max-w-xs h-full h-[100dvh] bg-[#F7F4EE] flex flex-col z-10 shadow-flyout border-r border-[#E8E2D7] select-none"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#E8E2D7] pt-[max(0.875rem,env(safe-area-inset-top,0px))]">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg overflow-hidden bg-black shrink-0 shadow-sm border border-black/10 flex items-center justify-center">
                  <img
                    src="/logo.jpg"
                    alt="Meiporul AI"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col min-w-0">
                  <h2 className="text-sm font-semibold text-[#1C1917] leading-none">Meiporul AI</h2>
                  <span className="text-[10px] text-[#A8A29E] tracking-tight mt-0.5">Document Assistant</span>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-md text-[#A8A29E] hover:text-[#1C1917] hover:bg-[#EAE4DC] active:scale-95 transition-all"
                aria-label="Close sidebar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Actions */}
            <div className="px-2.5 py-2 space-y-0.5 border-b border-[#E8E2D7]">
              <button
                type="button"
                onClick={() => {
                  onNewChat();
                  onNavigate('chat');
                  onClose();
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#1C1917] hover:bg-[#EAE4DC] transition-colors"
              >
                <PenSquare className="w-3.5 h-3.5 text-[#78716C]" />
                <span>New chat</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onNavigate('documents');
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  currentPage === 'documents'
                    ? 'bg-[#EAE4DC] text-[#1C1917] font-semibold'
                    : 'text-[#1C1917] hover:bg-[#EAE4DC]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Library className="w-3.5 h-3.5 text-[#78716C]" />
                  <span>Library</span>
                </div>
                {documentCount > 0 && (
                  <span className="text-[10px] text-[#78716C] bg-[#ECE5DB] px-1.5 py-0.2 rounded-full font-mono">
                    {documentCount}
                  </span>
                )}
              </button>
            </div>

            {/* Chat History */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="px-3 pt-3 pb-1 text-[11px] font-semibold text-[#78716C]">
                History
              </div>
              <div className="flex-1 overflow-y-auto px-2 pb-4 overscroll-contain">
                <ConversationList
                  conversations={conversations}
                  activeConversationId={activeConversationId}
                  onSelectConversation={(id) => {
                    onSelectConversation(id);
                    onNavigate('chat');
                    onClose();
                  }}
                  onDeleteConversation={onDeleteConversation}
                  onTogglePin={onTogglePinConversation}
                  isLoading={isLoadingConversations}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-2.5 border-t border-[#E8E2D7] bg-[#F7F4EE] space-y-1 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]">
              <button
                type="button"
                onClick={() => {
                  onOpenSettings();
                  onClose();
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#57534E] hover:text-[#1C1917] hover:bg-[#EAE4DC]"
              >
                <SettingsIcon className="w-3.5 h-3.5 text-[#78716C]" />
                <span>Settings</span>
              </button>

              {/* Dynamic User profile */}
              <div
                onClick={() => {
                  onOpenSettings();
                  onClose();
                }}
                className="pt-2 border-t border-[#E8E2D7] flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-[#EAE4DC] cursor-pointer"
              >
                <div className="w-6 h-6 rounded-full bg-[#E8DFD3] text-[#713F24] border border-[#D5CDBD] flex items-center justify-center text-[10px] font-bold select-none shrink-0 shadow-subtle">
                  {userInitials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-[#1C1917] truncate">{userProfile.name}</p>
                  <p className="text-[10px] text-[#78716C] truncate">{userProfile.email}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
