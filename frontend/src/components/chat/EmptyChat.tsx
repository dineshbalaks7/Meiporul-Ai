import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Sparkles, Upload, Layers } from 'lucide-react';
import { SuggestedPrompts } from './SuggestedPrompts';
import { cleanDocumentName } from '../../lib/utils';

interface EmptyChatProps {
  onSelectPrompt: (prompt: string) => void;
  onOpenUpload?: () => void;
  documentCount?: number;
  selectedDocumentName?: string | null;
}

export const EmptyChat: React.FC<EmptyChatProps> = ({
  onSelectPrompt,
  onOpenUpload,
  documentCount = 0,
  selectedDocumentName,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="flex flex-col items-center justify-center min-h-[48vh] sm:min-h-[55vh] max-w-xl mx-auto px-2 sm:px-4 text-center my-auto py-2 sm:py-6"
    >
      {/* Meiporul AI Hero Logo Emblem */}
      <div className="relative mb-3 sm:mb-4 group cursor-pointer">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden bg-black shadow-card border border-black/10 flex items-center justify-center p-1.5 ring-1 ring-black/5 group-hover:scale-105 group-hover:rotate-1 transition-transform duration-300">
          <img
            src="/logo.jpg"
            alt="Meiporul AI"
            className="w-full h-full object-cover rounded-xl"
          />
        </div>
        <div className="absolute -bottom-1 -right-1 w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-md bg-[#9E4A25] text-white flex items-center justify-center shadow-xs group-hover:scale-115 group-hover:rotate-12 transition-transform duration-300">
          <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
        </div>
      </div>

      {/* Headings */}
      <h1 className="text-lg sm:text-2xl font-semibold tracking-tight text-[#1C1917] px-2">
        Ask anything, or explore your documents.
      </h1>
      <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-[#78716C] max-w-md leading-relaxed px-2">
        Chat freely for general knowledge, brainstorming, and writing — or upload documents for verified answers with page citations.
      </p>

      {/* Dual Capability & Scope Pills */}
      <div className="mt-3 mb-4 sm:mt-4 sm:mb-6 flex items-center justify-center flex-wrap gap-1.5 sm:gap-2">
        <div className="group inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-[#FAF5EE] border border-[#E8E2D7] text-xs font-medium text-[#57534E]">
          <Sparkles className="w-3.5 h-3.5 text-[#9E4A25] icon-hover-sparkle" />
          <span>General AI Ready</span>
        </div>

        {selectedDocumentName ? (
          <div className="group inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-[#F5EBE1] border border-[#EADBCE] text-xs text-[#9E4A25] font-medium">
            <FileText className="w-3.5 h-3.5 shrink-0 icon-hover-scale" />
            <span className="truncate max-w-[150px] sm:max-w-[240px]">
              {cleanDocumentName(selectedDocumentName)}
            </span>
          </div>
        ) : (
          <div className="group inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-[#F7F4EE] border border-[#E8E2D7] text-xs text-[#78716C]">
            <Layers className="w-3.5 h-3.5 text-[#A8A29E] icon-hover-scale" />
            <span>
              {documentCount > 0
                ? `${documentCount} document${documentCount === 1 ? '' : 's'} indexed`
                : 'No documents attached'}
            </span>
          </div>
        )}

        {onOpenUpload && (
          <button
            type="button"
            onClick={onOpenUpload}
            className="group inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-xs font-medium text-[#1C1917] bg-white border border-[#E8E2D7] hover:bg-[#F2ECE4] hover:border-[#D5CDBD] active:bg-[#EAE4DC] transition-all shadow-subtle cursor-pointer active:scale-95"
          >
            <Upload className="w-3 h-3 text-[#9E4A25] icon-hover-scale" />
            <span>Upload</span>
          </button>
        )}
      </div>

      {/* Suggested prompts with General & Document tabs */}
      <div className="w-full">
        <SuggestedPrompts
          onSelectPrompt={onSelectPrompt}
          onOpenUpload={onOpenUpload}
          hasDocuments={documentCount > 0}
          selectedDocumentName={selectedDocumentName}
        />
      </div>
    </motion.div>
  );
};

export default EmptyChat;
