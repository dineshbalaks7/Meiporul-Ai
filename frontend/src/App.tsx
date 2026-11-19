import React, { useState, useEffect, useCallback } from 'react';
import { ToastProvider } from './components/ui/Toast';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { AppLayout, NavPage } from './components/layout/AppLayout';
import { ChatPage } from './pages/ChatPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { SettingsModal } from './components/settings/SettingsModal';
import { useDocuments } from './hooks/useDocuments';
import { useConversations } from './hooks/useConversations';
import { useChat } from './hooks/useChat';
import { useUserProfile } from './hooks/useUserProfile';
import { checkBackendHealth } from './services/api';

export const AppContent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<NavPage>('chat');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isBackendHealthy, setIsBackendHealthy] = useState<boolean>(true);

  // User Profile Hook (Persisted, editable, initials generator)
  const { profile: userProfile, updateProfile, initials: userInitials } = useUserProfile();

  // Document Management Hook
  const {
    documents,
    filteredDocuments,
    isLoading: isLoadingDocs,
    isUploading,
    uploadProgress,
    searchQuery,
    setSearchQuery,
    selectedDocumentId,
    setSelectedDocumentId,
    uploadDocument,
    deleteDocument,
    fetchDocuments,
  } = useDocuments();

  // Conversation Management Hook
  const {
    conversations,
    activeConversationId,
    setActiveConversationId,
    isLoading: isLoadingConversations,
    fetchConversations,
    deleteConversation,
    renameConversation,
    togglePinConversation,
    startNewChat,
    clearAllConversations,
  } = useConversations();

  // Chat Experience Hook
  const {
    messages,
    isGenerating,
    loadingStep,
    selectedSource,
    setSelectedSource,
    sendMessage,
    retryLastQuestion,
    editMessage,
    clearChat,
    isLoadingHistory,
  } = useChat({
    activeConversationId,
    setActiveConversationId,
    selectedDocumentId,
    onConversationUpdated: fetchConversations,
  });

  // Verify backend health
  const refreshBackendHealth = useCallback(async () => {
    const res = await checkBackendHealth();
    setIsBackendHealthy(res.healthy);
  }, []);

  useEffect(() => {
    refreshBackendHealth();
    const interval = setInterval(refreshBackendHealth, 30000);
    return () => clearInterval(interval);
  }, [refreshBackendHealth]);

  const handleNewChat = () => {
    startNewChat();
    clearChat();
    setCurrentPage('chat');
  };

  const handleStartFresh = async () => {
    const cleared = await clearAllConversations();
    if (cleared) {
      clearChat();
      setCurrentPage('chat');
    }
    return cleared;
  };

  const handleOpenChatWithDocument = (docId: string) => {
    setSelectedDocumentId(docId);
    handleNewChat();
    setCurrentPage('chat');
  };

  const activeConversation = conversations.find(
    (c) => c.conversation_id === activeConversationId
  );

  return (
    <>
      <AppLayout
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        onNewChat={handleNewChat}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={(id) => {
          setActiveConversationId(id);
          setCurrentPage('chat');
        }}
        onDeleteConversation={deleteConversation}
        onRenameConversation={renameConversation}
        onTogglePinConversation={togglePinConversation}
        isLoadingConversations={isLoadingConversations}
        documentCount={documents.length}
        documents={documents}
        selectedDocumentId={selectedDocumentId}
        onSelectDocument={setSelectedDocumentId}
        isBackendHealthy={isBackendHealthy}
        activeConversationTitle={activeConversation?.title}
        onOpenSettings={() => setIsSettingsOpen(true)}
        userProfile={userProfile}
        userInitials={userInitials}
      >
        {currentPage === 'chat' && (
          <ChatPage
            messages={messages}
            isGenerating={isGenerating}
            loadingStep={loadingStep}
            selectedSource={selectedSource}
            setSelectedSource={setSelectedSource}
            onSendMessage={sendMessage}
            onRetryLastQuestion={retryLastQuestion}
            onEditMessage={editMessage}
            documents={documents}
            selectedDocumentId={selectedDocumentId}
            onSelectDocument={setSelectedDocumentId}
            onUploadDocument={uploadDocument}
            isUploading={isUploading}
            uploadProgress={uploadProgress}
            isLoadingHistory={isLoadingHistory}
          />
        )}

        {currentPage === 'documents' && (
          <DocumentsPage
            documents={documents}
            filteredDocuments={filteredDocuments}
            isLoading={isLoadingDocs}
            isUploading={isUploading}
            uploadProgress={uploadProgress}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onUploadDocument={uploadDocument}
            onDeleteDocument={deleteDocument}
            onRefresh={fetchDocuments}
            onOpenChatWithDocument={handleOpenChatWithDocument}
            selectedDocumentId={selectedDocumentId}
          />
        )}
      </AppLayout>

      {/* Settings Modal Popup Dialog */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        isBackendHealthy={isBackendHealthy}
        onRefreshHealth={refreshBackendHealth}
        documentCount={documents.length}
        conversationCount={conversations.length}
        userProfile={userProfile}
        onUpdateUserProfile={updateProfile}
        onStartFresh={handleStartFresh}
        onClearAllChats={handleStartFresh}
      />
    </>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </ErrorBoundary>
  );
}
