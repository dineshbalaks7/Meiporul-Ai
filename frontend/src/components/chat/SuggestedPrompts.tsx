import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, Sparkles, FileText, Upload } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface SuggestedPromptsProps {
  onSelectPrompt: (prompt: string) => void;
  onOpenUpload?: () => void;
  hasDocuments?: boolean;
  selectedDocumentName?: string | null;
  disabled?: boolean;
}

interface PromptItem {
  label: string;
  query: string;
}

const GENERAL_PROMPTS: PromptItem[] = [
  {
    label: 'Explain a complex concept in simple terms',
    query: 'Explain how neural networks learn patterns, using a clear everyday analogy.',
  },
  {
    label: 'Draft a professional follow-up email',
    query: 'Draft a concise, professional follow-up email after a project review meeting.',
  },
  {
    label: 'Help me brainstorm creative ideas',
    query: 'Give me 3 creative strategies to improve user onboarding for a modern web application.',
  },
  {
    label: 'Write or debug a code function',
    query: 'Write a clean Python function with type hints to parse and validate date strings.',
  },
];

const DOCUMENT_PROMPTS: PromptItem[] = [
  {
    label: 'Summarize the key takeaways',
    query: 'Summarize the key takeaways and main conclusions from the document.',
  },
  {
    label: 'What are the important details and dates?',
    query: 'What are the most important details, key dates, and obligations mentioned?',
  },
  {
    label: 'Explain the key terms and conditions',
    query: 'Explain the key terms, definitions, and payment conditions.',
  },
  {
    label: 'Extract critical figures & facts',
    query: 'Extract the critical figures, statistics, and facts with exact page references.',
  },
];

export const SuggestedPrompts: React.FC<SuggestedPromptsProps> = ({
  onSelectPrompt,
  onOpenUpload,
  hasDocuments = false,
  selectedDocumentName,
  disabled = false,
}) => {
  // Default to 'doc' if a specific document is selected or documents exist; otherwise 'general'
  const [activeTab, setActiveTab] = useState<'general' | 'doc'>(
    selectedDocumentName ? 'doc' : hasDocuments ? 'general' : 'general'
  );

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center">
      {/* Category Tabs Toggle */}
      <div className="inline-flex items-center p-1 rounded-xl bg-[#F2ECE4] border border-[#E8E2D7] mb-3.5 shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={cn(
            'group flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer',
            activeTab === 'general'
              ? 'bg-white text-[#1C1917] shadow-xs'
              : 'text-[#78716C] hover:text-[#1C1917]'
          )}
        >
          <Sparkles className={cn('w-3 h-3 icon-hover-sparkle', activeTab === 'general' ? 'text-[#9E4A25]' : 'text-[#A8A29E]')} />
          <span>General AI</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('doc')}
          className={cn(
            'group flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer',
            activeTab === 'doc'
              ? 'bg-white text-[#1C1917] shadow-xs'
              : 'text-[#78716C] hover:text-[#1C1917]'
          )}
        >
          <FileText className={cn('w-3 h-3 icon-hover-scale', activeTab === 'doc' ? 'text-[#9E4A25]' : 'text-[#A8A29E]')} />
          <span>Document Intelligence</span>
          {hasDocuments && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#9E4A25]" />
          )}
        </button>
      </div>

      {/* Prompts Container */}
      <AnimatePresence mode="wait">
        {activeTab === 'general' ? (
          <motion.div
            key="general"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg"
          >
            {GENERAL_PROMPTS.map((item) => (
              <button
                key={item.label}
                type="button"
                disabled={disabled}
                onClick={() => onSelectPrompt(item.query)}
                className="group flex items-center justify-between gap-2 px-3 py-2.5 sm:py-2 text-xs font-medium text-[#443D36] bg-[#F7F4EE] hover:bg-[#EFE9DF] active:bg-[#EAE4DC] border border-[#E8E2D7] hover:border-[#D5CDBD] rounded-xl transition-all shadow-subtle active:scale-[0.98] cursor-pointer text-left"
              >
                <span className="truncate">{item.label}</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-[#A8A29E] group-hover:text-[#9E4A25] icon-hover-arrow-diag transition-colors shrink-0" />
              </button>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="doc"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="w-full flex flex-col items-center"
          >
            {hasDocuments || selectedDocumentName ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                {DOCUMENT_PROMPTS.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    disabled={disabled}
                    onClick={() => onSelectPrompt(item.query)}
                    className="group flex items-center justify-between gap-2 px-3 py-2.5 sm:py-2 text-xs font-medium text-[#443D36] bg-[#F7F4EE] hover:bg-[#EFE9DF] active:bg-[#EAE4DC] border border-[#E8E2D7] hover:border-[#D5CDBD] rounded-xl transition-all shadow-subtle active:scale-[0.98] cursor-pointer text-left"
                  >
                    <span className="truncate">{item.label}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-[#A8A29E] group-hover:text-[#9E4A25] icon-hover-arrow-diag transition-colors shrink-0" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="w-full max-w-md p-3.5 rounded-xl border border-dashed border-[#D5CDBD] bg-[#FAF5EE]/80 text-center flex flex-col items-center gap-2.5">
                <p className="text-xs text-[#78716C] leading-relaxed">
                  Upload a PDF, DOCX, or TXT file to search and analyze content with page-accurate citations.
                </p>
                <div className="flex items-center gap-2">
                  {onOpenUpload && (
                    <button
                      type="button"
                      onClick={onOpenUpload}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-[#9E4A25] hover:bg-[#883E1D] text-white transition-colors cursor-pointer shadow-2xs"
                    >
                      <Upload className="w-3 h-3 icon-hover-scale" />
                      <span>Upload Document</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onSelectPrompt('How do document citations work in Meiporul AI?')}
                    className="group inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-[#78716C] hover:text-[#1C1917] hover:bg-white/80 transition-colors cursor-pointer"
                  >
                    <span>How it works</span>
                    <ArrowUpRight className="w-3 h-3 text-[#A8A29E] group-hover:text-[#9E4A25] icon-hover-arrow-diag transition-colors" />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SuggestedPrompts;
