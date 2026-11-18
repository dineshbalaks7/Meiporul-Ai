import React, { useEffect, useRef, useState } from 'react';
import { ArrowDown } from 'lucide-react';
import { ChatMessage as ChatMessageType, SourceItem } from '../../types/chat';
import { DocumentItem } from '../../types/document';
import { ChatMessage } from './ChatMessage';
import { TypingIndicator } from './TypingIndicator';
import { EmptyChat } from './EmptyChat';
import { ChatInput } from './ChatInput';
import { SourcePreview } from '../sources/SourcePreview';
import { cleanDocumentName } from '../../lib/utils';

interface ChatWindowProps {
  messages: ChatMessageType[];
  isGenerating: boolean;
  loadingStep: 'searching' | 'generating';
  selectedSource: SourceItem | null;
  setSelectedSource: (source: SourceItem | null) => void;
  onSendMessage: (text: string) => void;
  onRetryLastQuestion?: () => void;
  onEditMessage?: (messageId: string, newText: string) => void;
  onOpenUpload?: () => void;
  documents: DocumentItem[];
  selectedDocumentId: string | null;
  onSelectDocument: (docId: string | null) => void;
  onUploadFile?: (file: File) => Promise<any> | void;
  isLoadingHistory?: boolean;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  isGenerating,
  loadingStep,
  selectedSource,
  setSelectedSource,
  onSendMessage,
  onRetryLastQuestion,
  onEditMessage,
  onOpenUpload,
  documents,
  selectedDocumentId,
  onSelectDocument,
  onUploadFile,
  isLoadingHistory,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [activeSourcesList, setActiveSourcesList] = useState<SourceItem[]>([]);

  const selectedDoc = documents.find((d) => d.document_id === selectedDocumentId);

  const handleSelectSource = (source: SourceItem, allSources?: SourceItem[]) => {
    setSelectedSource(source);
    if (allSources && allSources.length > 0) {
      setActiveSourcesList(allSources);
    } else {
      const parent = messages.find((m) =>
        m.sources?.some((s) => s.source_id === source.source_id)
      );
      setActiveSourcesList(parent?.sources || [source]);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isGenerating]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 120;
    setShowScrollBottom(!isNearBottom && messages.length > 2);
  };

  return (
    <div className="relative flex flex-col h-full w-full bg-[#FCFAF7] overflow-hidden">
      {/* Scrollable conversation stream */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overscroll-contain px-3 sm:px-8 py-3 sm:py-6 space-y-3 sm:space-y-4"
      >
        {isLoadingHistory ? (
          <div className="flex flex-col items-center justify-center h-full space-y-2 py-20 text-[#A8A29E]">
            <div className="w-5 h-5 border-2 border-[#9E4A25] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs">Loading conversation...</p>
          </div>
        ) : messages.length === 0 ? (
          <EmptyChat
            onSelectPrompt={onSendMessage}
            onOpenUpload={onOpenUpload}
            documentCount={documents.length}
            selectedDocumentName={selectedDoc?.filename}
          />
        ) : (
          <div className="max-w-2xl mx-auto space-y-3 pt-2">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                selectedSource={selectedSource}
                onSelectSource={handleSelectSource}
                onRetry={onRetryLastQuestion}
                onEdit={onEditMessage}
                isGenerating={isGenerating}
              />
            ))}

            {isGenerating && (
              <div className="max-w-2xl mx-auto pt-1">
                <TypingIndicator loadingStep={loadingStep} />
              </div>
            )}

            <div ref={messagesEndRef} className="h-4" />
          </div>
        )}
      </div>

      {/* Fixed bottom input container with scroll button anchored above it */}
      <div className="relative w-full shrink-0">
        {/* Floating Scroll to Bottom Button (positioned above the input field) */}
        {showScrollBottom && (
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-30">
            <button
              type="button"
              onClick={scrollToBottom}
              className="group w-8 h-8 rounded-full bg-white/95 shadow-[0_4px_16px_rgba(28,25,23,0.12)] border border-[#E8E2D7] text-[#78716C] hover:text-[#1C1917] hover:border-[#D5CDBD] hover:scale-110 active:scale-95 flex items-center justify-center transition-all cursor-pointer backdrop-blur-xs"
              aria-label="Scroll to bottom"
              title="Scroll to bottom"
            >
              <ArrowDown className="w-3.5 h-3.5 text-[#9E4A25] group-hover:translate-y-0.5 transition-transform" />
            </button>
          </div>
        )}

        <ChatInput
          onSendMessage={onSendMessage}
          isLoading={isGenerating}
          selectedDocumentId={selectedDocumentId}
          documents={documents}
          onSelectDocument={onSelectDocument}
          onOpenUpload={onOpenUpload}
          onUploadFile={onUploadFile}
          placeholder={
            selectedDoc
              ? `Ask about ${cleanDocumentName(selectedDoc.filename)}...`
              : 'Ask Meiporul AI...'
          }
        />
      </div>

      {/* Source preview slide-over drawer */}
      <SourcePreview
        source={selectedSource}
        allSources={activeSourcesList}
        onSelectSource={setSelectedSource}
        onClose={() => {
          setSelectedSource(null);
          setActiveSourcesList([]);
        }}
      />
    </div>
  );
};
