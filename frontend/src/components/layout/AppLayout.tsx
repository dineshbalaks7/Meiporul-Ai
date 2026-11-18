import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { MobileSidebar } from './MobileSidebar';
import { Header } from './Header';
import { ConversationSummary } from '../../types/conversation';
import { DocumentItem } from '../../types/document';
import { UserProfile } from '../../hooks/useUserProfile';

export type NavPage = 'chat' | 'documents';

interface AppLayoutProps {
  currentPage: NavPage;
  onNavigate: (page: NavPage) => void;
  onNewChat: () => void;
  conversations: ConversationSummary[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => Promise<boolean>;
  onRenameConversation?: (id: string, newTitle: string) => Promise<boolean>;
  onTogglePinConversation?: (id: string) => Promise<boolean>;
  isLoadingConversations?: boolean;
  documentCount?: number;
  documents?: DocumentItem[];
  selectedDocumentId?: string | null;
  onSelectDocument?: (docId: string | null) => void;
  isBackendHealthy: boolean;
  activeConversationTitle?: string;
  onOpenSettings: () => void;
  userProfile: UserProfile;
  userInitials: string;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentPage,
  onNavigate,
  onNewChat,
  conversations,
  activeConversationId,
  onSelectConversation,
  onDeleteConversation,
  onRenameConversation,
  onTogglePinConversation,
  isLoadingConversations,
  documentCount = 0,
  isBackendHealthy,
  onOpenSettings,
  userProfile,
  userInitials,
  children,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const activeConversation = conversations.find(
    (c) => c.conversation_id === activeConversationId
  ) || null;

  const handleDeleteActiveChat = () => {
    if (activeConversationId) {
      onDeleteConversation(activeConversationId);
    }
  };

  return (
    <div className="h-full h-[100dvh] w-full bg-[#FCFAF7] flex overflow-hidden font-sans">
      {/* Desktop & Tablet Sidebar */}
      <div className="hidden md:flex shrink-0 h-full">
        <Sidebar
          currentPage={currentPage}
          onNavigate={onNavigate}
          onNewChat={onNewChat}
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={onSelectConversation}
          onDeleteConversation={onDeleteConversation}
          onTogglePinConversation={onTogglePinConversation}
          isLoadingConversations={isLoadingConversations}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
          documentCount={documentCount}
          onOpenSettings={onOpenSettings}
          userProfile={userProfile}
          userInitials={userInitials}
        />
      </div>

      {/* Mobile Slide-out Drawer */}
      <MobileSidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        currentPage={currentPage}
        onNavigate={onNavigate}
        onNewChat={onNewChat}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={onSelectConversation}
        onDeleteConversation={onDeleteConversation}
        onTogglePinConversation={onTogglePinConversation}
        isLoadingConversations={isLoadingConversations}
        documentCount={documentCount}
        onOpenSettings={onOpenSettings}
        userProfile={userProfile}
        userInitials={userInitials}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-[#FCFAF7] overflow-hidden relative">
        <Header
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          activeConversation={activeConversation}
          onRenameConversation={onRenameConversation}
          onTogglePinConversation={onTogglePinConversation}
          isBackendHealthy={isBackendHealthy}
          onNewChat={onNewChat}
          onDeleteCurrentChat={handleDeleteActiveChat}
        />

        <main className="flex-1 overflow-hidden relative">
          {children}
        </main>
      </div>
    </div>
  );
};
