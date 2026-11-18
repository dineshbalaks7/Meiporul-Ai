import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, ChevronUp, ChevronDown, Files, Database, Sparkles } from 'lucide-react';
import { DocumentItem } from '../types/document';
import { DocumentUpload } from '../components/documents/DocumentUpload';
import { DocumentList } from '../components/documents/DocumentList';
import { Button } from '../components/ui/Button';
import { Dialog } from '../components/ui/Dialog';

interface DocumentsPageProps {
  documents: DocumentItem[];
  filteredDocuments: DocumentItem[];
  isLoading: boolean;
  isUploading: boolean;
  uploadProgress?: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onUploadDocument: (file: File) => Promise<unknown>;
  onDeleteDocument: (docId: string) => Promise<boolean>;
  onRefresh: () => void;
  onOpenChatWithDocument: (docId: string) => void;
  selectedDocumentId?: string | null;
}

export const DocumentsPage: React.FC<DocumentsPageProps> = ({
  documents,
  filteredDocuments,
  isLoading,
  isUploading,
  uploadProgress,
  searchQuery,
  onSearchChange,
  onUploadDocument,
  onDeleteDocument,
  onRefresh,
  onOpenChatWithDocument,
  selectedDocumentId,
}) => {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showInlineDropzone, setShowInlineDropzone] = useState(false);

  const totalChunks = useMemo(() => {
    return documents.reduce((sum, doc) => sum + (doc.total_chunks || 0), 0);
  }, [documents]);

  const handleModalUpload = async (file: File) => {
    const res = await onUploadDocument(file);
    if (res) {
      setShowUploadModal(false);
      setShowInlineDropzone(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="h-full w-full overflow-y-auto px-4 sm:px-8 py-6 max-w-5xl mx-auto space-y-6 select-none"
    >
      {/* Editorial Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E8E2D7]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1C1917]">
              Library
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#F7F4EE] text-[#9E4A25] border border-[#E8E2D7]">
              Knowledge Base
            </span>
          </div>
          <p className="mt-1 text-xs text-[#78716C]">
            Manage indexed documents and use them as RAG context for your chats with Meiporul AI.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle inline dropzone */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowInlineDropzone((prev) => !prev)}
            rightIcon={showInlineDropzone ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            className="text-xs border-[#E8E2D7]"
          >
            {showInlineDropzone ? 'Hide Dropzone' : 'Quick Dropzone'}
          </Button>

          {/* Primary Upload Button */}
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowUploadModal(true)}
            leftIcon={<Upload className="w-3.5 h-3.5 icon-hover-scale" />}
          >
            Upload Document
          </Button>
        </div>
      </div>

      {/* Overview Metric Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Metric 1: Total Documents */}
        <div className="group p-3.5 rounded-2xl bg-white border border-[#E8E2D7] shadow-subtle flex items-center gap-3 hover:border-[#D5CDBD] transition-all">
          <div className="w-9 h-9 rounded-xl bg-[#F5EBE1] text-[#9E4A25] flex items-center justify-center shrink-0">
            <Files className="w-4 h-4 icon-hover-scale" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-[#78716C]">Indexed Documents</p>
            <p className="text-base font-bold text-[#1C1917] tracking-tight">
              {documents.length} <span className="text-xs font-normal text-[#A8A29E]">{documents.length === 1 ? 'file' : 'files'}</span>
            </p>
          </div>
        </div>

        {/* Metric 2: Total Chunks */}
        <div className="group p-3.5 rounded-2xl bg-white border border-[#E8E2D7] shadow-subtle flex items-center gap-3 hover:border-[#D5CDBD] transition-all">
          <div className="w-9 h-9 rounded-xl bg-[#F7F4EE] text-[#78716C] flex items-center justify-center shrink-0">
            <Database className="w-4 h-4 icon-hover-scale" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-[#78716C]">Vector Chunks</p>
            <p className="text-base font-bold text-[#1C1917] tracking-tight">
              {totalChunks} <span className="text-xs font-normal text-[#A8A29E]">in ChromaDB</span>
            </p>
          </div>
        </div>

        {/* Metric 3: RAG Engine Status */}
        <div className="p-3.5 rounded-2xl bg-white border border-[#E8E2D7] shadow-subtle flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[11px] font-medium text-[#78716C]">RAG Engine</p>
            </div>
            <p className="text-xs font-semibold text-[#1C1917] truncate">
              Ready for Citations & Q&A
            </p>
          </div>
        </div>
      </div>

      {/* Inline Drag & Drop Area (Animated Expand/Collapse) */}
      <AnimatePresence>
        {showInlineDropzone && (
          <motion.section
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="p-1">
              <DocumentUpload
                onUpload={onUploadDocument}
                isUploading={isUploading}
                uploadProgress={uploadProgress}
              />
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Document Listing */}
      <section aria-labelledby="documents-list-title" className="space-y-3 pt-1">
        <DocumentList
          documents={filteredDocuments}
          isLoading={isLoading}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          onOpenChat={onOpenChatWithDocument}
          onDelete={onDeleteDocument}
          onRefresh={onRefresh}
          onUploadClick={() => setShowUploadModal(true)}
          selectedDocumentId={selectedDocumentId}
        />
      </section>

      {/* Upload Modal Dialog */}
      <Dialog
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Upload Document"
        description="Select a PDF, DOCX or TXT file to index into Meiporul AI."
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
    </motion.div>
  );
};
