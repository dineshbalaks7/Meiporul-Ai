import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  FileText,
  File,
  FileCode,
  Bookmark,
  Sparkles,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Quote,
} from 'lucide-react';
import { SourceItem } from '../../types/chat';
import { cleanDocumentName, formatScore } from '../../lib/utils';
import { useToast } from '../ui/Toast';

interface SourcePreviewProps {
  source: SourceItem | null;
  allSources?: SourceItem[];
  onSelectSource?: (source: SourceItem) => void;
  onClose: () => void;
}

export const SourcePreview: React.FC<SourcePreviewProps> = ({
  source,
  allSources = [],
  onSelectSource,
  onClose,
}) => {
  const [copiedChunk, setCopiedChunk] = useState(false);
  const [copiedFilename, setCopiedFilename] = useState(false);
  const { success } = useToast();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (source) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [source, onClose]);

  const handleCopyChunk = () => {
    if (!source) return;
    navigator.clipboard.writeText(source.content);
    setCopiedChunk(true);
    success('Copied to clipboard', 'Retrieved document content copied.');
    setTimeout(() => setCopiedChunk(false), 2000);
  };

  const handleCopyFilename = () => {
    if (!source?.filename) return;
    navigator.clipboard.writeText(source.filename);
    setCopiedFilename(true);
    success('Filename copied', source.filename);
    setTimeout(() => setCopiedFilename(false), 2000);
  };

  const currentIndex = useMemo(() => {
    if (!source || !allSources.length) return -1;
    return allSources.findIndex((s) => s.source_id === source.source_id);
  }, [source, allSources]);

  const handlePrevSource = () => {
    if (currentIndex > 0 && onSelectSource) {
      onSelectSource(allSources[currentIndex - 1]);
    }
  };

  const handleNextSource = () => {
    if (currentIndex < allSources.length - 1 && onSelectSource) {
      onSelectSource(allSources[currentIndex + 1]);
    }
  };

  const getFileBadge = (filename: string | null | undefined) => {
    if (!filename) {
      return {
        bg: 'bg-[#F5EBE1] text-[#9E4A25] border-[#EADBCE]',
        icon: <FileText className="w-3.5 h-3.5 text-[#9E4A25]" />,
        label: 'DOC',
      };
    }
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') {
      return {
        bg: 'bg-[#F5EBE1] text-[#9E4A25] border-[#EADBCE]',
        icon: <FileText className="w-3.5 h-3.5 text-[#9E4A25]" />,
        label: 'PDF',
      };
    }
    if (ext === 'docx' || ext === 'doc') {
      return {
        bg: 'bg-[#EEF2F6] text-[#2563EB] border-[#DCE4ED]',
        icon: <File className="w-3.5 h-3.5 text-[#2563EB]" />,
        label: 'DOCX',
      };
    }
    return {
      bg: 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]',
      icon: <FileCode className="w-3.5 h-3.5 text-[#D97706]" />,
      label: 'TXT',
    };
  };

  const filename = source?.filename?.trim() ? source.filename : 'Unknown document';
  const pageLabel =
    source?.page_number !== null && source?.page_number !== undefined
      ? `Page ${source.page_number}`
      : 'Page information unavailable';

  const badge = getFileBadge(source?.filename);

  return (
    <AnimatePresence>
      {source && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-end sm:p-4 pointer-events-none"
          role="dialog"
          aria-modal="true"
          aria-labelledby="source-preview-title"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-stone-900/15 backdrop-blur-[1px] pointer-events-auto"
            onClick={onClose}
          />

          {/* Slide-over Drawer */}
          <motion.div
            initial={{ opacity: 0, x: 28, y: 0 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: 28, y: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative pointer-events-auto w-full sm:max-w-md h-[88dvh] sm:h-[92vh] bg-[#FCFAF7] rounded-t-2xl sm:rounded-2xl border border-[#E8E2D7] shadow-flyout flex flex-col z-10 overflow-hidden pb-[max(0.5rem,env(safe-area-inset-bottom,0px))]"
          >
            {/* 1. Header Bar */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#E8E2D7] bg-[#F7F4EE]">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center px-1.5 py-0.5 rounded bg-[#9E4A25] text-white font-mono text-xs font-semibold shadow-xs">
                  [{source.source_id}]
                </span>
                <h3 id="source-preview-title" className="text-xs font-semibold text-[#1C1917] leading-none">
                  Source Reference
                </h3>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleCopyChunk}
                  className="p-1.5 rounded-lg text-[#78716C] hover:text-[#1C1917] hover:bg-[#EAE4DC] transition-colors"
                  title="Copy retrieved content"
                >
                  {copiedChunk ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-[#A8A29E] hover:text-[#1C1917] hover:bg-[#EAE4DC] transition-colors"
                  aria-label="Close source preview"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 2. Source Tabs Switcher (When Multiple Sources Exist) */}
            {allSources.length > 1 && onSelectSource && (
              <div className="flex items-center gap-1 px-4 py-2 bg-[#F2ECE4]/60 border-b border-[#E8E2D7] overflow-x-auto select-none">
                {allSources.map((s) => {
                  const isTabActive = s.source_id === source.source_id;
                  return (
                    <button
                      key={s.source_id}
                      type="button"
                      onClick={() => onSelectSource(s)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all shrink-0 cursor-pointer ${
                        isTabActive
                          ? 'bg-white text-[#9E4A25] font-semibold shadow-xs border border-[#E8E2D7]'
                          : 'text-[#78716C] hover:text-[#1C1917] hover:bg-white/60'
                      }`}
                    >
                      <span className="font-mono text-[10px]">[{s.source_id}]</span>
                      <span className="truncate max-w-[100px]">{cleanDocumentName(s.filename || 'Doc')}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* 3. Document Details */}
            <div className="p-4 border-b border-[#E8E2D7] bg-white space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className={`p-1.5 rounded-lg shrink-0 border ${badge.bg}`}>
                    {badge.icon}
                  </div>
                  <div className="min-w-0">
                    <p
                      className="text-xs font-semibold text-[#1C1917] truncate hover:text-[#9E4A25] transition-colors cursor-pointer"
                      title={filename}
                      onClick={handleCopyFilename}
                    >
                      {cleanDocumentName(filename)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-flex items-center gap-1 text-[11px] text-[#78716C]">
                        <Bookmark className="w-3 h-3 text-[#9E4A25]" />
                        {pageLabel}
                      </span>
                      {source.rerank_score !== null && source.rerank_score !== undefined && (
                        <span
                          className="inline-flex items-center gap-1 text-[11px] font-mono text-[#9E4A25]"
                          title="Relevance score calculated by mxbai-rerank-xsmall-v1"
                        >
                          <Sparkles className="w-2.5 h-2.5" />
                          {formatScore(source.rerank_score)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {source.filename && (
                  <button
                    type="button"
                    onClick={handleCopyFilename}
                    className="p-1 text-[#A8A29E] hover:text-[#1C1917] rounded shrink-0"
                    title="Copy document filename"
                  >
                    {copiedFilename ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  </button>
                )}
              </div>
            </div>

            {/* 4. Retrieved Document Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              <div className="flex items-center gap-1.5 text-[#78716C]">
                <Quote className="w-3 h-3 text-[#9E4A25]" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#78716C]">
                  Retrieved document content
                </span>
              </div>

              {/* Quotation Chunk Box */}
              <div className="p-3.5 rounded-xl bg-white border border-[#E8E2D7] text-xs text-[#1C1917] leading-relaxed whitespace-pre-wrap font-sans selection:bg-[#9E4A25]/20">
                {source.content}
              </div>
            </div>

            {/* 5. Navigation Footer (When Multiple Sources Exist) */}
            {allSources.length > 1 && (
              <div className="px-4 py-2.5 border-t border-[#E8E2D7] bg-[#F7F4EE] flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={handlePrevSource}
                  disabled={currentIndex <= 0}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-[#E8E2D7] bg-white text-[#1C1917] hover:bg-[#F2ECE4] disabled:opacity-40 disabled:pointer-events-none transition-colors"
                >
                  <ChevronLeft className="w-3 h-3" />
                  <span>Previous</span>
                </button>

                <span className="text-[11px] text-[#78716C] font-mono">
                  {currentIndex + 1} of {allSources.length}
                </span>

                <button
                  type="button"
                  onClick={handleNextSource}
                  disabled={currentIndex >= allSources.length - 1}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-[#E8E2D7] bg-white text-[#1C1917] hover:bg-[#F2ECE4] disabled:opacity-40 disabled:pointer-events-none transition-colors"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
