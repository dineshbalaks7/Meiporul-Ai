import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, FolderOpen, RefreshCw, LayoutGrid, List, X, Upload } from 'lucide-react';
import { DocumentItem } from '../../types/document';
import { DocumentCard } from './DocumentCard';
import { Button } from '../ui/Button';

interface DocumentListProps {
  documents: DocumentItem[];
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenChat: (docId: string) => void;
  onDelete: (docId: string) => Promise<boolean>;
  onRefresh: () => void;
  onUploadClick: () => void;
  selectedDocumentId?: string | null;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  isLoading,
  searchQuery,
  onSearchChange,
  onOpenChat,
  onDelete,
  onRefresh,
  onUploadClick,
  selectedDocumentId,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'chunks-desc' | 'chunks-asc'>('name');

  // Count by format
  const formatCounts = useMemo(() => {
    const counts = { all: documents.length, pdf: 0, docx: 0, txt: 0 };
    documents.forEach((d) => {
      const ext = d.file_type.toLowerCase();
      if (ext === '.pdf') counts.pdf += 1;
      else if (ext === '.docx' || ext === '.doc') counts.docx += 1;
      else if (ext === '.txt') counts.txt += 1;
    });
    return counts;
  }, [documents]);

  // Filter by format and sort
  const filteredAndSortedDocs = useMemo(() => {
    let result = documents;

    // Filter by format
    if (selectedFormat !== 'all') {
      result = result.filter((d) => {
        const ext = d.file_type.toLowerCase();
        if (selectedFormat === 'pdf') return ext === '.pdf';
        if (selectedFormat === 'docx') return ext === '.docx' || ext === '.doc';
        if (selectedFormat === 'txt') return ext === '.txt';
        return true;
      });
    }

    // Sort
    return [...result].sort((a, b) => {
      if (sortBy === 'name') {
        return a.filename.localeCompare(b.filename);
      }
      if (sortBy === 'chunks-desc') {
        return b.total_chunks - a.total_chunks;
      }
      if (sortBy === 'chunks-asc') {
        return a.total_chunks - b.total_chunks;
      }
      return 0;
    });
  }, [documents, selectedFormat, sortBy]);

  return (
    <div className="space-y-4">
      {/* Search, Filter Tabs and View Switcher Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#A8A29E]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search documents by name..."
            className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-white border border-[#E8E2D7] text-base sm:text-xs text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:border-[#9E4A25]/60 focus:ring-2 focus:ring-[#9E4A25]/10 shadow-subtle transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#A8A29E] hover:text-[#1C1917]"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right Toolbar: View Switcher & Refresh */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Sort Selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-base sm:text-xs bg-white border border-[#E8E2D7] text-[#57534E] rounded-xl px-2.5 py-1.5 shadow-subtle focus:outline-none focus:border-[#9E4A25]/50 cursor-pointer"
            title="Sort documents"
          >
            <option value="name">Sort: Name (A-Z)</option>
            <option value="chunks-desc">Sort: Most Chunks</option>
            <option value="chunks-asc">Sort: Fewest Chunks</option>
          </select>

          {/* View Mode Switcher (Grid vs List) */}
          <div className="flex items-center bg-[#F7F4EE] border border-[#E8E2D7] p-0.5 rounded-xl shadow-subtle">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`group p-1 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white text-[#9E4A25] shadow-xs'
                  : 'text-[#78716C] hover:text-[#1C1917]'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5 icon-hover-scale" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`group p-1 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-[#9E4A25] shadow-xs'
                  : 'text-[#78716C] hover:text-[#1C1917]'
              }`}
              title="List View"
            >
              <List className="w-3.5 h-3.5 icon-hover-scale" />
            </button>
          </div>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            isLoading={isLoading}
            className="group h-8 px-2.5 text-xs border-[#E8E2D7]"
            title="Refresh repository"
          >
            <RefreshCw className="w-3.5 h-3.5 icon-hover-spin-back" />
          </Button>
        </div>
      </div>

      {/* Format Filter Tabs (All, PDF, DOCX, TXT) */}
      {documents.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            type="button"
            onClick={() => setSelectedFormat('all')}
            className={`px-3 py-1 rounded-full font-medium transition-all cursor-pointer ${
              selectedFormat === 'all'
                ? 'bg-[#1C1917] text-white shadow-xs'
                : 'bg-white border border-[#E8E2D7] text-[#78716C] hover:text-[#1C1917] hover:bg-[#F7F4EE]'
            }`}
          >
            All ({formatCounts.all})
          </button>
          <button
            type="button"
            onClick={() => setSelectedFormat('pdf')}
            className={`px-3 py-1 rounded-full font-medium transition-all cursor-pointer ${
              selectedFormat === 'pdf'
                ? 'bg-[#9E4A25] text-white shadow-xs'
                : 'bg-white border border-[#E8E2D7] text-[#78716C] hover:text-[#9E4A25] hover:bg-[#F5EBE1]'
            }`}
          >
            PDF ({formatCounts.pdf})
          </button>
          <button
            type="button"
            onClick={() => setSelectedFormat('docx')}
            className={`px-3 py-1 rounded-full font-medium transition-all cursor-pointer ${
              selectedFormat === 'docx'
                ? 'bg-[#2563EB] text-white shadow-xs'
                : 'bg-white border border-[#E8E2D7] text-[#78716C] hover:text-[#2563EB] hover:bg-[#EEF2F6]'
            }`}
          >
            DOCX ({formatCounts.docx})
          </button>
          <button
            type="button"
            onClick={() => setSelectedFormat('txt')}
            className={`px-3 py-1 rounded-full font-medium transition-all cursor-pointer ${
              selectedFormat === 'txt'
                ? 'bg-[#D97706] text-white shadow-xs'
                : 'bg-white border border-[#E8E2D7] text-[#78716C] hover:text-[#D97706] hover:bg-[#FEF3C7]'
            }`}
          >
            TXT ({formatCounts.txt})
          </button>
        </div>
      )}

      {/* Loading Skeletons */}
      {isLoading && documents.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 py-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-36 rounded-2xl bg-white border border-[#E8E2D7] animate-pulse p-4 space-y-3"
            >
              <div className="w-8 h-8 rounded-lg bg-[#F2ECE4]" />
              <div className="h-4 bg-[#F2ECE4] rounded w-3/4" />
              <div className="h-3 bg-[#F2ECE4] rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : documents.length === 0 ? (
        /* Empty State */
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-14 px-4 text-center rounded-2xl bg-white border border-[#E8E2D7] border-dashed my-4 shadow-subtle"
        >
          <div className="w-14 h-14 rounded-2xl overflow-hidden bg-black shadow-card border border-black/10 flex items-center justify-center p-1.5 ring-1 ring-black/5 mb-3.5">
            <img
              src="/logo.jpg"
              alt="Meiporul AI"
              className="w-full h-full object-cover rounded-xl"
            />
          </div>
          <h3 className="text-sm sm:text-base font-semibold text-[#1C1917]">
            {searchQuery ? 'No documents match your search' : 'Your Document Library is empty'}
          </h3>
          <p className="mt-1 text-xs text-[#78716C] max-w-sm leading-relaxed">
            {searchQuery
              ? `No indexed files matched "${searchQuery}". Try modifying your search or clear filters.`
              : 'Upload PDF, DOCX or TXT documents to build your Meiporul AI knowledge base and start asking questions with verified citations.'}
          </p>
          <div className="mt-5">
            {searchQuery ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSearchChange('')}
              >
                Clear Search Query
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={onUploadClick}
                leftIcon={<Upload className="w-3.5 h-3.5" />}
              >
                Upload First Document
              </Button>
            )}
          </div>
        </motion.div>
      ) : filteredAndSortedDocs.length === 0 ? (
        /* No items for specific format */
        <div className="py-12 px-4 text-center rounded-2xl bg-white border border-[#E8E2D7] border-dashed">
          <FolderOpen className="w-8 h-8 text-[#A8A29E] mx-auto mb-2" />
          <p className="text-xs font-medium text-[#1C1917]">
            No {selectedFormat.toUpperCase()} files found
          </p>
          <p className="text-[11px] text-[#78716C] mt-0.5">
            Select "All" or upload a new {selectedFormat.toUpperCase()} document.
          </p>
          <button
            type="button"
            onClick={() => setSelectedFormat('all')}
            className="mt-3 text-xs font-semibold text-[#9E4A25] hover:underline cursor-pointer"
          >
            View all documents
          </button>
        </div>
      ) : (
        /* Documents Grid or List */
        <AnimatePresence mode="popLayout">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 pt-1">
              {filteredAndSortedDocs.map((doc) => (
                <DocumentCard
                  key={doc.document_id}
                  document={doc}
                  onOpenChat={onOpenChat}
                  onDelete={onDelete}
                  isSelected={selectedDocumentId === doc.document_id}
                  viewMode="grid"
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2 pt-1">
              {filteredAndSortedDocs.map((doc) => (
                <DocumentCard
                  key={doc.document_id}
                  document={doc}
                  onOpenChat={onOpenChat}
                  onDelete={onDelete}
                  isSelected={selectedDocumentId === doc.document_id}
                  viewMode="list"
                />
              ))}
            </div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
};
