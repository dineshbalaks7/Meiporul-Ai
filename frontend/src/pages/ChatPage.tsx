import React, { useState } from 'react';
import { ChatWindow } from '../components/chat/ChatWindow';
import { DocumentUpload } from '../components/documents/DocumentUpload';
import { Dialog } from '../components/ui/Dialog';
import { ChatMessage, SourceItem } from '../types/chat';
import { DocumentItem } from '../types/document';

interface ChatPageProps {
  messages: ChatMessage[];
  isGenerating: boolean;
  loadingStep: 'searching' | 'generating';
  selectedSource: SourceItem | null;
  setSelectedSource: (source: SourceItem | null) => void;
  onSendMessage: (text: string) => void;
  onRetryLastQuestion?: () => void;
  onEditMessage?: (messageId: string, newText: string) => void;
  documents: DocumentItem[];
  selectedDocumentId: string | null;
  onSelectDocument: (docId: string | null) => void;
  onUploadDocument: (file: File) => Promise<unknown>;
  isUploading: boolean;
  uploadProgress?: number;
  isLoadingHistory?: boolean;
}

export const ChatPage: React.FC<ChatPageProps> = ({
  messages,
  isGenerating,
  loadingStep,
  selectedSource,
  setSelectedSource,
  onSendMessage,
  onRetryLastQuestion,
  onEditMessage,
  documents,
  selectedDocumentId,
  onSelectDocument,
  onUploadDocument,
  isUploading,
  uploadProgress,
  isLoadingHistory,
}) => {
  const [showUploadModal, setShowUploadModal] = useState(false);

  const handleModalUpload = async (file: File) => {
    const result = await onUploadDocument(file);
    if (result) {
      setShowUploadModal(false);
    }
  };

  return (
    <div className="h-full w-full relative">
      <ChatWindow
        messages={messages}
        isGenerating={isGenerating}
        loadingStep={loadingStep}
        selectedSource={selectedSource}
        setSelectedSource={setSelectedSource}
        onSendMessage={onSendMessage}
        onRetryLastQuestion={onRetryLastQuestion}
        onEditMessage={onEditMessage}
        onOpenUpload={() => setShowUploadModal(true)}
        documents={documents}
        selectedDocumentId={selectedDocumentId}
        onSelectDocument={onSelectDocument}
        onUploadFile={onUploadDocument}
        isLoadingHistory={isLoadingHistory}
      />

      {/* Quick Upload Modal */}
      <Dialog
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Upload Document"
        description="Add a new document to your Meiporul knowledge base."
      >
        <div className="pt-2">
          <DocumentUpload
            onUpload={handleModalUpload}
            isUploading={isUploading}
            uploadProgress={uploadProgress}
            compact
          />
        </div>
      </Dialog>
    </div>
  );
};
