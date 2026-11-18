import React, { useState } from 'react';
import { SourceItem } from '../../types/chat';
import { cleanDocumentName } from '../../lib/utils';
import { cn } from '../../lib/utils';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface SourceReferencesProps {
  sources: SourceItem[];
  selectedSource?: SourceItem | null;
  onSelectSource: (source: SourceItem, allSources?: SourceItem[]) => void;
  maxInitialDisplay?: number;
}

export const SourceReferences: React.FC<SourceReferencesProps> = ({
  sources,
  selectedSource,
  onSelectSource,
  maxInitialDisplay = 3,
}) => {
  const [expanded, setExpanded] = useState(false);

  if (!sources || sources.length === 0) return null;

  const hasOverflow = sources.length > maxInitialDisplay;
  const displayedSources = expanded || !hasOverflow
    ? sources
    : sources.slice(0, maxInitialDisplay);
  const remainingCount = sources.length - maxInitialDisplay;

  return (
    <div className="flex flex-wrap items-center gap-1.5 pt-2 select-none">
      <span className="text-[11px] font-medium tracking-wide text-[#8C827A] mr-0.5">
        Sources:
      </span>

      {displayedSources.map((source) => {
        const isSelected = selectedSource?.source_id === source.source_id;
        const filename = cleanDocumentName(source.filename || 'Unknown document');
        const page =
          source.page_number !== null && source.page_number !== undefined
            ? `p.${source.page_number}`
            : null;

        return (
          <button
            key={source.source_id}
            type="button"
            onClick={() => onSelectSource(source, sources)}
            className={cn(
              'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-normal transition-colors cursor-pointer border',
              isSelected
                ? 'bg-[#9E4A25] text-white border-[#9E4A25] shadow-xs'
                : 'bg-[#F7F4EE] hover:bg-[#EFE7DE] text-[#44392E] hover:text-[#1C1917] border-[#E8E2D7]'
            )}
            title={`${source.filename || 'Document'}${page ? ` • Page ${source.page_number}` : ''} • Click to inspect source`}
          >
            <span
              className={cn(
                'font-mono text-[10px] font-semibold',
                isSelected ? 'text-white' : 'text-[#9E4A25]'
              )}
            >
              [{source.source_id}]
            </span>

            <span className="truncate max-w-[120px] sm:max-w-[160px]">
              {filename}
            </span>

            {page && (
              <span
                className={cn(
                  'text-[10px] font-mono',
                  isSelected ? 'text-white/80' : 'text-[#8C827A]'
                )}
              >
                {page}
              </span>
            )}
          </button>
        );
      })}

      {hasOverflow && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium text-[#9E4A25] hover:text-[#7A3618] bg-[#F4EDE5] hover:bg-[#EFE5D9] border border-[#E8DFD3] transition-colors cursor-pointer"
          title={expanded ? 'Show fewer sources' : `Show ${remainingCount} more sources`}
        >
          <span>{expanded ? 'Show less' : `+${remainingCount} more`}</span>
          {expanded ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
        </button>
      )}
    </div>
  );
};
