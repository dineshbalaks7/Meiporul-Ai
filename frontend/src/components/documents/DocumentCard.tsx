import React from 'react';
import { motion } from 'framer-motion';
import { FileText, File, FileCode, CheckCircle2, MessageSquare, Layers } from 'lucide-react';
import { DocumentItem } from '../../types/document';
import { DocumentActions } from './DocumentActions';
import { cleanDocumentName } from '../../lib/utils';

interface DocumentCardProps {
  document: DocumentItem;
  onOpenChat: (docId: string) => void;
  onDelete: (docId: string) => Promise<boolean>;
  isSelected?: boolean;
  viewMode?: 'grid' | 'list';
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  onOpenChat,
  onDelete,
  isSelected,
  viewMode = 'grid',
}) => {
  const getFileBadge = (fileType: string) => {
    const ext = fileType.toLowerCase();
    if (ext === '.pdf') {
      return {
        bg: 'bg-[#F5EBE1] text-[#9E4A25] border-[#EADBCE]',
        icon: <FileText className="w-4 h-4 text-[#9E4A25]" />,
        label: 'PDF',
      };
    }
    if (ext === '.docx' || ext === '.doc') {
      return {
        bg: 'bg-[#EEF2F6] text-[#2563EB] border-[#DCE4ED]',
        icon: <File className="w-4 h-4 text-[#2563EB]" />,
        label: 'DOCX',
      };
    }
    return {
      bg: 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]',
      icon: <FileCode className="w-4 h-4 text-[#D97706]" />,
      label: 'TXT',
    };
  };

  const badge = getFileBadge(document.file_type);

  if (viewMode === 'list') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        className={`group flex items-center justify-between p-3 rounded-xl border bg-white shadow-subtle hover:shadow transition-all ${
          isSelected
            ? 'border-[#9E4A25] ring-1 ring-[#9E4A25]/20 bg-[#FAF7F2]'
            : 'border-[#E8E2D7] hover:border-[#D5CDBD]'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1 pr-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${badge.bg}`}>
            {badge.icon}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4
                className="text-xs sm:text-sm font-semibold text-[#1C1917] truncate hover:text-[#9E4A25] cursor-pointer transition-colors"
                title={document.filename}
                onClick={() => onOpenChat(document.document_id)}
              >
                {cleanDocumentName(document.filename)}
              </h4>
              <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-medium border uppercase ${badge.bg}`}>
                {badge.label}
              </span>
            </div>

            <div className="flex items-center gap-2.5 mt-0.5 text-[11px] text-[#78716C]">
              <span className="flex items-center gap-1">
                <Layers className="w-3 h-3 text-[#A8A29E]" />
                {document.total_chunks} chunks
              </span>
              <span className="w-1 h-1 rounded-full bg-[#D5CDBD]" />
              <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                <CheckCircle2 className="w-3 h-3" />
                Indexed in ChromaDB
              </span>
            </div>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-1.5">
          <DocumentActions
            documentId={document.document_id}
            documentName={document.filename}
            onOpenChat={onOpenChat}
            onDelete={onDelete}
          />
        </div>
      </motion.div>
    );
  }

  // Grid Card Layout
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.15 }}
      className={`group flex flex-col justify-between p-4 rounded-2xl border bg-white shadow-subtle hover:shadow-[0_8px_24px_-6px_rgba(28,25,23,0.08)] transition-all ${
        isSelected
          ? 'border-[#9E4A25] ring-2 ring-[#9E4A25]/15 bg-[#FCFAF7]'
          : 'border-[#E8E2D7] hover:border-[#D5CDBD]'
      }`}
    >
      <div>
        {/* Top Header of Card */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${badge.bg}`}>
            {badge.icon}
          </div>

          <div className="flex items-center gap-1">
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-medium border uppercase ${badge.bg}`}>
              {badge.label}
            </span>
            <DocumentActions
              documentId={document.document_id}
              documentName={document.filename}
              onOpenChat={onOpenChat}
              onDelete={onDelete}
              compact
            />
          </div>
        </div>

        {/* Title */}
        <h4
          className="text-sm font-semibold text-[#1C1917] line-clamp-2 hover:text-[#9E4A25] cursor-pointer transition-colors leading-snug mb-2"
          title={document.filename}
          onClick={() => onOpenChat(document.document_id)}
        >
          {cleanDocumentName(document.filename)}
        </h4>

        {/* Metadata stats */}
        <div className="flex items-center gap-2 text-xs text-[#78716C] mb-4">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F7F4EE] border border-[#E8E2D7] text-[11px] font-mono">
            <Layers className="w-3 h-3 text-[#9E4A25]" />
            {document.total_chunks} chunks
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
            <CheckCircle2 className="w-3 h-3" />
            Ready
          </span>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="pt-3 border-t border-[#F2EEE7] flex items-center justify-between">
        <button
          type="button"
          onClick={() => onOpenChat(document.document_id)}
          className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-[#F7F4EE] hover:bg-[#F5EBE1] text-[#9E4A25] text-xs font-semibold border border-[#E8E2D7] hover:border-[#EADBCE] transition-all cursor-pointer group-hover:bg-[#9E4A25] group-hover:text-white group-hover:border-[#9E4A25]"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Query Document</span>
        </button>
      </div>
    </motion.div>
  );
};
