import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, Plus, FileText, Check, FileUp } from 'lucide-react';
import { DocumentItem } from '../../types/document';
import { Dropdown } from '../ui/Dropdown';
import { cn } from '../../lib/utils';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  selectedDocumentId: string | null;
  documents: DocumentItem[];
  onSelectDocument: (docId: string | null) => void;
  onOpenUpload?: () => void;
  onUploadFile?: (file: File) => Promise<any> | void;
  placeholder?: string;
  showDisclaimer?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  selectedDocumentId,
  documents,
  onSelectDocument,
  onOpenUpload,
  onUploadFile,
  placeholder = 'Ask Meiporul AI...',
  showDisclaimer = false,
}) => {
  const [input, setInput] = useState('');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dragCounterRef = useRef(0);

  const selectedDoc = documents.find((d) => d.document_id === selectedDocumentId);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 160)}px`;
    }
  }, [input]);

  // Track cursor position across input container
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
      setIsDraggingOver(true);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsDraggingOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDraggingOver(false);

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (onUploadFile) {
        onUploadFile(file);
      } else if (onOpenUpload) {
        onOpenUpload();
      }
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const toolMenuItems = [
    {
      id: 'all',
      label: 'All Documents (ChromaDB)',
      description: !selectedDocumentId
        ? `Search across all ${documents.length} indexed files • Multi-Doc RAG`
        : `Search across all ${documents.length} indexed files`,
      icon: !selectedDocumentId ? <Check className="w-3.5 h-3.5 text-[#9E4A25]" /> : undefined,
      onClick: () => onSelectDocument(null),
    },
    ...documents.map((doc) => ({
      id: doc.document_id,
      label: doc.filename,
      description: selectedDocumentId === doc.document_id
        ? `${doc.total_chunks} chunks • Strict RAG Active`
        : `${doc.total_chunks} chunks • Strict RAG`,
      icon: selectedDocumentId === doc.document_id ? <Check className="w-3.5 h-3.5 text-[#9E4A25]" /> : undefined,
      onClick: () => onSelectDocument(doc.document_id),
    })),
  ];

  const computedPlaceholder = selectedDoc
    ? `Ask about ${selectedDoc.filename} (Strict RAG)...`
    : placeholder;

  return (
    <div
      className="w-full max-w-2xl mx-auto px-3 sm:px-4 pb-2 sm:pb-4 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))]"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsDraggingOver(false);
        dragCounterRef.current = 0;
      }}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Floating interactive input container with physics-based spring animation */}
      <motion.div
        ref={cardRef}
        animate={{
          y: isDraggingOver ? -5 : isFocused ? -3 : isHovered ? -2 : 0,
          scale: isDraggingOver ? 1.012 : isFocused ? 1.006 : isHovered ? 1.003 : 1,
        }}
        transition={{
          type: 'spring',
          stiffness: 420,
          damping: 28,
          mass: 0.8,
        }}
        className={cn(
          'relative flex flex-col bg-white rounded-[20px] sm:rounded-[22px] border transition-colors duration-200',
          isDraggingOver
            ? 'border-[#9E4A25] ring-4 ring-[#9E4A25]/20 shadow-[0_16px_40px_-8px_rgba(158,74,37,0.22)]'
            : isFocused
            ? 'border-[#9E4A25]/40 ring-2 ring-[#9E4A25]/15 shadow-[0_10px_32px_-6px_rgba(158,74,37,0.13),0_2px_10px_-2px_rgba(28,25,23,0.06)]'
            : isHovered
            ? 'border-[#D8CFBE] shadow-[0_8px_28px_-6px_rgba(158,74,37,0.1),0_2px_8px_-2px_rgba(28,25,23,0.05)]'
            : 'border-[#E8E2D7] shadow-[0_4px_24px_-4px_rgba(28,25,23,0.06)]'
        )}
      >
        {/* Interactive cursor-following spotlight glow */}
        <div
          className="pointer-events-none absolute inset-0 rounded-[20px] sm:rounded-[22px] overflow-hidden transition-opacity duration-300"
          style={{
            opacity: isHovered || isFocused ? 1 : 0,
            background: `radial-gradient(340px circle at ${mousePos.x}px ${mousePos.y}px, rgba(158, 74, 37, 0.075), transparent 75%)`,
          }}
        />

        {/* Drag-over dropzone overlay animation */}
        <AnimatePresence>
          {isDraggingOver && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
              className="absolute inset-0 z-30 rounded-[20px] sm:rounded-[22px] bg-[#FAF5EE]/95 border-2 border-dashed border-[#9E4A25] flex items-center justify-center gap-3 backdrop-blur-[2px] shadow-inner pointer-events-none"
            >
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
                className="w-8 h-8 rounded-full bg-[#9E4A25]/10 flex items-center justify-center text-[#9E4A25]"
              >
                <FileUp className="w-4 h-4 stroke-[2.2]" />
              </motion.div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-[#1C1917]">
                  Drop document here to add to Meiporul AI
                </span>
                <span className="text-[10px] text-[#78716C]">
                  Accepts PDF, DOCX, and TXT files
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder={computedPlaceholder}
          disabled={isLoading}
          rows={1}
          enterKeyHint="send"
          className="chat-composer-textarea relative z-10 w-full px-3.5 sm:px-4 pt-3 sm:pt-3.5 pb-2 text-base sm:text-sm text-[#1C1917] placeholder:text-[#A8A29E] bg-transparent resize-none overflow-y-auto overscroll-contain focus:outline-none max-h-40 disabled:opacity-60 leading-relaxed"
        />

        {/* Action bar inside input bottom */}
        <div className="relative z-10 flex items-center justify-between px-2.5 sm:px-3 pb-2 sm:pb-2.5 pt-1">
          <div className="flex items-center gap-1 sm:gap-1.5">
            {/* + Button for uploading document */}
            {onOpenUpload && (
              <motion.button
                type="button"
                onClick={onOpenUpload}
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.94 }}
                transition={{ type: 'spring', stiffness: 450, damping: 22 }}
                className="w-7 h-7 rounded-lg text-[#78716C] hover:text-[#1C1917] hover:bg-[#F2ECE4] active:bg-[#EAE4DC] flex items-center justify-center transition-colors cursor-pointer"
                title="Upload document"
                aria-label="Upload document"
              >
                <Plus className="w-4 h-4" />
              </motion.button>
            )}

            {/* Documents scope pill button */}
            <Dropdown
              align="left"
              direction="up"
              trigger={
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className={cn(
                    "inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer",
                    selectedDoc
                      ? "bg-[#F5EBE1] text-[#9E4A25] font-semibold border border-[#9E4A25]/30 shadow-xs"
                      : "text-[#57534E] hover:text-[#1C1917] hover:bg-[#F2ECE4] active:bg-[#EAE4DC]"
                  )}
                  title={selectedDoc ? `Strict RAG: Scoped to ${selectedDoc.filename}` : "Select document scope"}
                >
                  <FileText className={cn("w-3 h-3 shrink-0", selectedDoc ? "text-[#9E4A25]" : "text-[#78716C]")} />
                  <span className="truncate max-w-[110px] sm:max-w-[200px]">
                    {selectedDoc ? selectedDoc.filename : 'Documents'}
                  </span>
                </motion.button>
              }
              items={toolMenuItems}
            />
          </div>

          {/* Warm Terracotta / Burnt Orange Circular Send Button */}
          <motion.button
            type="button"
            disabled={!input.trim() || isLoading}
            onClick={() => handleSubmit()}
            whileHover={
              input.trim() && !isLoading
                ? { scale: 1.12, rotate: -2 }
                : undefined
            }
            whileTap={
              input.trim() && !isLoading
                ? { scale: 0.92 }
                : undefined
            }
            transition={{ type: 'spring', stiffness: 480, damping: 24 }}
            className={cn(
              'w-7 h-7 rounded-full flex items-center justify-center transition-colors',
              input.trim() && !isLoading
                ? 'bg-[#9E4A25] hover:bg-[#883E1D] text-white shadow-sm cursor-pointer'
                : 'bg-[#ECE5DC] text-[#B0A79C] cursor-not-allowed'
            )}
            aria-label="Send message"
          >
            <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
          </motion.button>
        </div>
      </motion.div>

      {showDisclaimer && (
        <p className="text-[10px] sm:text-[11px] text-[#A8A29E] text-center mt-2 sm:mt-2.5 select-none">
          AI can make mistakes. Please double-check responses.
        </p>
      )}

    </div>
  );
};
