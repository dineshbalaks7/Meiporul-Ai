import React, { useState, useMemo, useId, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChevronDown, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { SourceItem } from '../../types/chat';
import { cleanDocumentName, cn } from '../../lib/utils';

export interface AnswerViewProps {
  answer?: string | null;
  sources?: SourceItem[] | null;
  className?: string;
}

interface SourceCardProps {
  source: SourceItem;
  instanceId: string;
  isHighlighted: boolean;
}

const SourceCard: React.FC<SourceCardProps> = ({ source, instanceId, isHighlighted }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const content = source.content || '';
  const isLong = content.length > 180;
  const displayedContent = isExpanded || !isLong
    ? content
    : `${content.slice(0, 180).trimEnd()}...`;

  const filename = source.filename?.trim() ? source.filename : 'Unknown document';
  const pageLabel =
    source.page_number !== null &&
    source.page_number !== undefined &&
    String(source.page_number).trim() !== '' &&
    String(source.page_number).toUpperCase() !== 'N/A'
      ? `p. ${source.page_number}`
      : 'Page N/A';

  return (
    <div
      id={`source-card-${instanceId}-${source.source_id}`}
      style={{ scrollSnapAlign: 'start' }}
      className={cn(
        'w-[230px] sm:w-[280px] shrink-0 p-3 rounded-xl border text-xs transition-all duration-300 flex flex-col justify-between select-text',
        isHighlighted
          ? 'ring-2 ring-[#9E4A25] border-[#9E4A25] bg-[#FAF2ED] shadow-xs'
          : 'border-[#E8E2D7] bg-white hover:border-[#D5CDBD]'
      )}
    >
      <div>
        {/* Card Header: Source Badge + Filename + Page */}
        <div className="flex items-center justify-between gap-1.5 mb-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#9E4A25] text-white shrink-0 shadow-xs">
              [{source.source_id}]
            </span>
            <span
              className="font-medium text-xs text-[#1C1917] truncate"
              title={filename}
            >
              {cleanDocumentName(filename)}
            </span>
          </div>

          <span className="text-[10px] text-[#78716C] font-medium shrink-0 font-mono bg-[#F7F4EE] px-1.5 py-0.5 rounded border border-[#E8E2D7]">
            {pageLabel}
          </span>
        </div>

        {/* Content Snippet */}
        <div className="text-[#44392E] leading-relaxed whitespace-pre-wrap text-[11px]">
          <span>{displayedContent}</span>
        </div>
      </div>

      {isLong && (
        <div className="pt-2 mt-auto">
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="text-[11px] font-medium text-[#9E4A25] hover:text-[#883E1D] underline underline-offset-2 cursor-pointer focus:outline-none"
          >
            {isExpanded ? 'Show less' : 'Show more'}
          </button>
        </div>
      )}
    </div>
  );
};

interface CitationPillProps {
  sourceId: number;
  source?: SourceItem;
  onClick: (sourceId: number) => void;
}

const CitationPill: React.FC<CitationPillProps> = ({ sourceId, source, onClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (!source) {
    return <span className="font-mono text-xs text-[#78716C]">[{sourceId}]</span>;
  }

  const filename = source.filename?.trim() ? source.filename : 'Unknown document';
  const cleanName = cleanDocumentName(filename);
  const pageLabel =
    source.page_number !== null &&
    source.page_number !== undefined &&
    String(source.page_number).trim() !== '' &&
    String(source.page_number).toUpperCase() !== 'N/A'
      ? `p. ${source.page_number}`
      : null;

  const contentSnippet = source.content
    ? source.content.length > 120
      ? `${source.content.slice(0, 120).trimEnd()}...`
      : source.content
    : '';

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setIsOpen(true);
    }, 100);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsOpen(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Dismiss hover card immediately on click so it never lingers or pops awkwardly
    setIsOpen(false);
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    onClick(sourceId);
  };

  return (
    <span
      className="citation-sup relative inline-block group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        onClick={handleClick}
        className="citation-btn"
        aria-label={`Citation [${sourceId}]: ${cleanName}${pageLabel ? `, ${pageLabel}` : ''}`}
      >
        [{sourceId}]
      </button>

      {/* Warm, luxury editorial citation card (replaces the harsh black box) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 2, scale: 0.96 }}
            transition={{ duration: 0.14, ease: 'easeOut' }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 sm:w-72 max-w-[calc(100vw-2.5rem)] p-3 bg-white rounded-xl border border-[#E8E2D7] shadow-[0_8px_24px_-4px_rgba(28,25,23,0.14),0_2px_6px_-1px_rgba(28,25,23,0.06)] z-50 text-left pointer-events-none select-none"
          >
            {/* Header: Badge + Filename + Page */}
            <div className="flex items-center justify-between gap-1.5 mb-1.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#F5EBE1] text-[#9E4A25] border border-[#EADBCE] shrink-0">
                  [{sourceId}]
                </span>
                <span className="font-semibold text-xs text-[#1C1917] truncate" title={filename}>
                  {cleanName}
                </span>
              </div>
              {pageLabel && (
                <span className="text-[10px] text-[#78716C] font-mono font-medium shrink-0 bg-[#F7F4EE] px-1.5 py-0.2 rounded border border-[#E8E2D7]">
                  {pageLabel}
                </span>
              )}
            </div>

            {/* Snippet text */}
            {contentSnippet && (
              <p className="text-[11px] text-[#57534E] leading-relaxed line-clamp-2 italic mb-1.5">
                "{contentSnippet}"
              </p>
            )}

            {/* Jump hint */}
            <div className="pt-1.5 border-t border-[#F2ECE4] flex items-center justify-between text-[10px] font-medium text-[#9E4A25]">
              <span>Click to view source card</span>
              <span>↓</span>
            </div>

            {/* Soft Downward Arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px w-2.5 h-2.5 bg-white border-r border-b border-[#E8E2D7] rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
};

export const AnswerView: React.FC<AnswerViewProps> = ({
  answer,
  sources,
  className,
}) => {
  const rawId = useId();
  const instanceId = useMemo(() => rawId.replace(/[^a-zA-Z0-9_-]/g, ''), [rawId]);
  const scrollRowRef = useRef<HTMLDivElement>(null);

  const [isSourcesOpen, setIsSourcesOpen] = useState(false);
  const [highlightedSourceId, setHighlightedSourceId] = useState<number | null>(null);

  const scrollByAmount = (offset: number) => {
    if (scrollRowRef.current) {
      scrollRowRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  // Map of valid source_ids to SourceItem (robust against number or string source_id)
  const sourceMap = useMemo(() => {
    const map = new Map<number, SourceItem>();
    if (sources && Array.isArray(sources)) {
      sources.forEach((s) => {
        if (s && s.source_id !== undefined && s.source_id !== null) {
          const id = typeof s.source_id === 'number' ? s.source_id : parseInt(String(s.source_id), 10);
          if (!isNaN(id)) {
            map.set(id, s);
          }
        }
      });
    }
    return map;
  }, [sources]);

  // Sources sorted by source_id
  const sortedSources = useMemo(() => {
    if (!sources || !Array.isArray(sources)) return [];
    return [...sources]
      .filter((s): s is SourceItem => {
        if (!s || s.source_id === undefined || s.source_id === null) return false;
        const id = typeof s.source_id === 'number' ? s.source_id : parseInt(String(s.source_id), 10);
        return !isNaN(id);
      })
      .sort((a, b) => {
        const idA = typeof a.source_id === 'number' ? a.source_id : parseInt(String(a.source_id), 10);
        const idB = typeof b.source_id === 'number' ? b.source_id : parseInt(String(b.source_id), 10);
        return idA - idB;
      });
  }, [sources]);

  // Handle citation click: expand sources section, scroll horizontally and center matching card
  const handleCitationClick = (sourceId: number) => {
    setIsSourcesOpen(true);
    setHighlightedSourceId(sourceId);

    const tryScroll = (attempts = 0) => {
      const cardElement = document.getElementById(
        `source-card-${instanceId}-${sourceId}`
      );
      if (cardElement) {
        cardElement.scrollIntoView({
          behavior: 'smooth',
          inline: 'center',
          block: 'nearest',
        });
      } else if (attempts < 6) {
        setTimeout(() => tryScroll(attempts + 1), 50);
      }
    };

    tryScroll();

    setTimeout(() => {
      setHighlightedSourceId((curr) => (curr === sourceId ? null : curr));
    }, 2500);
  };

  // Convert valid [n] citations outside of code blocks into [cite-n](#cite-n)
  // Strips leading whitespace before [n] so it sits tight to the word or adjacent citation
  const formattedMarkdown = useMemo(() => {
    if (!answer || typeof answer !== 'string') return '';

    // Step 1: Normalize 【1】, 【1†L5-L7】, [SOURCE 1], and comma-separated citations [1, 2] outside code blocks
    let normalized = answer.replace(
      /(```[\s\S]*?```|`[^`\n]+`)|(?:\[|【)\s*(?:SOURCE\s*)?(\d{1,2}(?:\s*[,;]\s*\d{1,2})*)(?:[†:][^\]】]*)?\s*(?:\]|】)/gi,
      (match, codeSegment, idsGroup) => {
        if (codeSegment) return codeSegment; // Preserve code segments untouched
        if (!idsGroup) return match;
        const numbers = idsGroup
          .split(/[,;]/)
          .map((s: string) => s.trim())
          .filter(Boolean);
        return numbers.map((n: string) => `[${n}]`).join('');
      }
    );

    // Step 2: Convert [n] to [cite-n](#cite-n) outside code blocks, stripping any leading whitespace
    return normalized.replace(
      /(```[\s\S]*?```|`[^`\n]+`)|(?:\s*)\[(\d{1,2})\](?!\()/g,
      (match, codeSegment, numStr) => {
        if (codeSegment) {
          return codeSegment; // Preserve code blocks/spans untouched
        }
        const num = parseInt(numStr, 10);
        if (sourceMap.has(num)) {
          return `[cite-${num}](#cite-${num})`;
        }
        // If marker has no matching source, render as plain text
        return match;
      }
    );
  }, [answer, sourceMap]);

  if (!answer && sortedSources.length === 0) {
    return null;
  }

  return (
    <div className="w-full space-y-3">
      {/* 1. Markdown Answer Wrapper (.answer) */}
      {answer ? (
        <div className={cn('answer', className)}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({ href, children }) => {
                if (href && href.startsWith('#cite-')) {
                  const sourceId = parseInt(href.replace('#cite-', ''), 10);
                  const source = sourceMap.get(sourceId);

                  return (
                    <CitationPill
                      sourceId={sourceId}
                      source={source}
                      onClick={handleCitationClick}
                    />
                  );
                }

                return (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#9E4A25] underline underline-offset-2 hover:opacity-80"
                  >
                    {children}
                  </a>
                );
              },
              table: ({ children }) => (
                <div className="w-full overflow-x-auto my-3 rounded-xl border border-[#E8E2D7] bg-white shadow-2xs">
                  <table className="w-full border-collapse text-left text-xs">
                    {children}
                  </table>
                </div>
              ),
              th: ({ children }) => (
                <th className="px-3.5 py-2.5 font-semibold text-[#1C1917] bg-[#F7F4EE] border-b border-r border-[#E8E2D7] last:border-r-0 whitespace-nowrap">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="px-3.5 py-2 text-[#44392E] border-b border-r border-[#E8E2D7] last:border-r-0 align-top">
                  {children}
                </td>
              ),
            }}
          >
            {formattedMarkdown}
          </ReactMarkdown>
        </div>
      ) : null}

      {/* 2. Collapsible Horizontal Sources Panel */}
      {sortedSources.length > 0 && (
        <div className="pt-2 border-t border-[#E8E2D7]">
          <button
            type="button"
            onClick={() => setIsSourcesOpen((prev) => !prev)}
            className="flex items-center justify-between w-full text-left py-1 text-xs font-semibold text-[#78716C] hover:text-[#1C1917] transition-colors group cursor-pointer select-none"
            aria-expanded={isSourcesOpen}
          >
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-[#9E4A25] icon-hover-scale" />
              <span>Sources</span>
              <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-[#F2ECE4] text-[#78716C]">
                {sortedSources.length}
              </span>
            </span>

            <div className="flex items-center gap-2">
              {/* Optional Quick Scroll Arrows if multiple cards and opened */}
              {sortedSources.length > 2 && isSourcesOpen && (
                <div className="flex items-center gap-0.5 mr-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      scrollByAmount(-260);
                    }}
                    className="group/arrow p-1 rounded text-[#78716C] hover:text-[#1C1917] hover:bg-[#EAE4DC] transition-colors"
                    title="Scroll left"
                    aria-label="Scroll left in sources"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 icon-hover-nudge-left" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      scrollByAmount(260);
                    }}
                    className="group/arrow p-1 rounded text-[#78716C] hover:text-[#1C1917] hover:bg-[#EAE4DC] transition-colors"
                    title="Scroll right"
                    aria-label="Scroll right in sources"
                  >
                    <ChevronRight className="w-3.5 h-3.5 icon-hover-nudge-right" />
                  </button>
                </div>
              )}

              <span className="flex items-center gap-1 text-[11px] text-[#A8A29E] font-normal group-hover:text-[#78716C]">
                <span>{isSourcesOpen ? 'Hide' : 'Show'}</span>
                <ChevronDown
                  className={cn(
                    'w-3.5 h-3.5 transition-transform duration-200',
                    isSourcesOpen && 'rotate-180'
                  )}
                />
              </span>
            </div>
          </button>

          {/* Horizontal Scrolling Card Track */}
          {isSourcesOpen && (
            <div
              ref={scrollRowRef}
              className="mt-2.5 flex items-stretch gap-2.5 overflow-x-auto pb-2 pt-0.5 scroll-smooth overscroll-contain"
              style={{ scrollSnapType: 'x proximity', touchAction: 'pan-y' }}
            >
              {sortedSources.map((source) => (
                <SourceCard
                  key={source.source_id}
                  source={source}
                  instanceId={instanceId}
                  isHighlighted={highlightedSourceId === source.source_id}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AnswerView;
