import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Upload,
  FileUp,
  AlertCircle,
  FileText,
  Layers,
  Database,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';

interface DocumentUploadProps {
  onUpload: (file: File) => Promise<unknown>;
  isUploading: boolean;
  uploadProgress?: number;
  className?: string;
  compact?: boolean;
}

const ALLOWED_EXTENSIONS = ['.pdf', '.txt', '.docx'];
const MAX_FILE_SIZE_MB = 25;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

interface FileInfo {
  name: string;
  size: string;
}

const STAGES = [
  {
    step: 1,
    title: 'Uploading File',
    detail: 'Transferring raw file to Meiporul backend',
    icon: Upload,
  },
  {
    step: 2,
    title: 'Parsing Document',
    detail: 'Extracting text structure and page metadata',
    icon: FileText,
  },
  {
    step: 3,
    title: 'Recursive Chunking',
    detail: 'Dividing text into semantic overlapping chunks',
    icon: Layers,
  },
  {
    step: 4,
    title: 'Vector Embeddings & ChromaDB',
    detail: 'Generating MiniLM embeddings and indexing in ChromaDB',
    icon: Sparkles,
  },
];

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  onUpload,
  isUploading,
  uploadProgress = 0,
  className,
  compact = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [currentStage, setCurrentStage] = useState<number>(1);
  const [syntheticProgress, setSyntheticProgress] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const stageTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Pipeline Stage Simulator while isUploading is active
  useEffect(() => {
    if (isUploading) {
      setCurrentStage(1);
      setSyntheticProgress(Math.max(uploadProgress, 15));

      const startTime = Date.now();
      stageTimerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;

        if (elapsed < 800) {
          setCurrentStage(1);
          setSyntheticProgress((prev) => Math.min(Math.max(prev, uploadProgress), 35));
        } else if (elapsed < 2000) {
          setCurrentStage(2);
          setSyntheticProgress((prev) => Math.min(prev + 3, 60));
        } else if (elapsed < 3600) {
          setCurrentStage(3);
          setSyntheticProgress((prev) => Math.min(prev + 2, 85));
        } else {
          setCurrentStage(4);
          setSyntheticProgress((prev) => Math.min(prev + 1, 95));
        }
      }, 200);
    } else {
      if (stageTimerRef.current) {
        clearInterval(stageTimerRef.current);
        stageTimerRef.current = null;
      }
      setSyntheticProgress(0);
      setCurrentStage(1);
      setFileInfo(null);
    }

    return () => {
      if (stageTimerRef.current) {
        clearInterval(stageTimerRef.current);
      }
    };
  }, [isUploading, uploadProgress]);

  const validateAndUpload = async (file: File) => {
    setValidationError(null);

    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      setValidationError(`Unsupported format. Please upload ${ALLOWED_EXTENSIONS.join(', ')}.`);
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setValidationError(`File too large. Max limit is ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }

    setFileInfo({
      name: file.name,
      size: formatFileSize(file.size),
    });

    try {
      await onUpload(file);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isUploading) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (isUploading) return;
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      validateAndUpload(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      validateAndUpload(files[0]);
    }
  };

  return (
    <div className={cn('w-full', className)}>
      <motion.div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        animate={{
          borderColor: isUploading ? '#9E4A25' : isDragOver ? '#9E4A25' : '#E8E2D7',
          backgroundColor: isUploading ? '#FAF7F2' : isDragOver ? '#F7ECE4' : '#FFFFFF',
        }}
        transition={{ duration: 0.18 }}
        className={cn(
          'relative flex flex-col items-center justify-center rounded-2xl border text-center transition-all overflow-hidden shadow-subtle',
          compact ? 'py-5 px-4' : 'py-8 px-6',
          isUploading ? 'border-solid ring-2 ring-[#9E4A25]/15' : 'border-dashed'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,.docx"
          className="hidden"
          disabled={isUploading}
          onChange={handleFileChange}
        />

        {isUploading ? (
          /* ========================================================================= */
          /* Dynamic Chunking & Embedding Pipeline Animation                          */
          /* ========================================================================= */
          <div className="w-full max-w-md mx-auto space-y-5">
            {/* 1. Visual Graphic: Scanner Document splitting into Vector Chunks */}
            <div className="relative flex items-center justify-center gap-6 py-2">
              {/* Document with Moving Scanner Beam */}
              <div className="relative w-16 h-22 rounded-xl bg-white border border-[#E8E2D7] shadow-sm p-2 flex flex-col justify-between overflow-hidden">
                {/* Laser scan line */}
                <motion.div
                  animate={{ y: [0, 68, 0] }}
                  transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
                  className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#9E4A25] to-transparent shadow-[0_0_8px_#9E4A25] z-10"
                />

                {/* Document text skeleton */}
                <div className="space-y-1.5 pt-1 opacity-40">
                  <div className="h-1 bg-[#1C1917] rounded w-full" />
                  <div className="h-1 bg-[#1C1917] rounded w-4/5" />
                  <div className="h-1 bg-[#1C1917] rounded w-full" />
                  <div className="h-1 bg-[#1C1917] rounded w-2/3" />
                  <div className="h-1 bg-[#1C1917] rounded w-3/4" />
                </div>

                <div className="flex items-center justify-between text-[8px] font-mono text-[#9E4A25] font-semibold pt-1">
                  <span>DOC</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#9E4A25] animate-ping" />
                </div>
              </div>

              {/* Streaming Chunk Particles */}
              <div className="flex flex-col items-center justify-center gap-1.5">
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3].map((num) => (
                    <motion.div
                      key={num}
                      animate={{
                        opacity: [0.25, 1, 0.25],
                        x: [-2, 4, -2],
                        scale: [0.92, 1.08, 0.92],
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 1.6,
                        delay: num * 0.3,
                        ease: 'easeInOut',
                      }}
                      className="w-5 h-6 rounded-md bg-[#F5EBE1] border border-[#EADBCE] flex items-center justify-center text-[8px] font-mono font-bold text-[#9E4A25] shadow-xs"
                    >
                      #{num}
                    </motion.div>
                  ))}
                </div>
                <span className="text-[10px] text-[#9E4A25] tracking-wider uppercase font-mono font-medium">
                  {currentStage === 3 ? 'Chunking Text...' : currentStage === 4 ? 'Embedding...' : 'Streaming...'}
                </span>
              </div>

              {/* Target Vector Store / ChromaDB */}
              <div className="relative w-16 h-22 rounded-xl bg-white border border-[#E8E2D7] shadow-sm p-2 flex flex-col items-center justify-between">
                <div className="w-7 h-7 rounded-lg bg-[#9E4A25]/10 flex items-center justify-center text-[#9E4A25]">
                  <Database className="w-3.5 h-3.5" />
                </div>
                <div className="text-center">
                  <p className="text-[9px] font-mono font-bold text-[#1C1917] leading-none">ChromaDB</p>
                  <span className="text-[8px] text-emerald-600 font-medium">384-dim</span>
                </div>
                <div className="w-full bg-[#EAE4DC] rounded-full h-1 overflow-hidden">
                  <motion.div
                    animate={{ width: ['25%', '85%', '55%'] }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                    className="bg-[#9E4A25] h-full rounded-full"
                  />
                </div>
              </div>
            </div>

            {/* 2. File Metadata Banner */}
            {fileInfo && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#E8E2D7] text-xs shadow-xs max-w-full truncate">
                <FileText className="w-3.5 h-3.5 text-[#9E4A25] shrink-0" />
                <span className="font-semibold text-[#1C1917] truncate">{fileInfo.name}</span>
                <span className="text-[10px] font-mono text-[#A8A29E] shrink-0">({fileInfo.size})</span>
              </div>
            )}

            {/* 3. Shimmering Progress Bar */}
            <div className="space-y-1.5 w-full">
              <div className="flex items-center justify-between text-xs text-[#78716C]">
                <span className="font-medium text-[#1C1917]">
                  {STAGES.find((s) => s.step === currentStage)?.title || 'Processing...'}
                </span>
                <span className="font-mono text-[11px] text-[#9E4A25] font-semibold">
                  {syntheticProgress}%
                </span>
              </div>

              <div className="relative w-full bg-[#EAE4DC] rounded-full h-1.5 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-[#9E4A25] via-[#C86D43] to-[#9E4A25] transition-all duration-300 relative overflow-hidden"
                  style={{ width: `${syntheticProgress}%` }}
                >
                  <div className="absolute inset-0 bg-white/25 w-1/2 -skew-x-12 animate-shimmer-fast" />
                </motion.div>
              </div>
            </div>

            {/* 4. Multi-Stage Pipeline Stepper */}
            <div className="grid grid-cols-4 gap-1.5 pt-1 text-left">
              {STAGES.map((stage) => {
                const isComplete = currentStage > stage.step;
                const isCurrent = currentStage === stage.step;

                return (
                  <div
                    key={stage.step}
                    className={cn(
                      'p-2 rounded-xl border text-[10px] transition-all',
                      isCurrent
                        ? 'bg-white border-[#9E4A25]/40 shadow-xs ring-1 ring-[#9E4A25]/15'
                        : isComplete
                        ? 'bg-white/80 border-[#E8E2D7] text-[#1C1917]'
                        : 'bg-[#F2ECE4]/40 border-transparent text-[#A8A29E]'
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-[9px] font-bold">0{stage.step}</span>
                      {isComplete ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      ) : isCurrent ? (
                        <span className="w-2 h-2 rounded-full bg-[#9E4A25] animate-pulse" />
                      ) : null}
                    </div>
                    <p
                      className={cn(
                        'font-medium leading-tight truncate',
                        isCurrent ? 'text-[#9E4A25] font-semibold' : isComplete ? 'text-[#1C1917]' : 'text-[#A8A29E]'
                      )}
                      title={stage.title}
                    >
                      {stage.title}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* Idle / Drag & Drop State                                                  */
          /* ========================================================================= */
          <>
            <div
              className={cn(
                'flex items-center justify-center rounded-xl transition-transform mb-2.5',
                compact ? 'w-8 h-8' : 'w-11 h-11',
                isDragOver ? 'scale-110 bg-[#F5EBE1] text-[#9E4A25]' : 'bg-[#F7F4EE] text-[#78716C]'
              )}
            >
              {isDragOver ? (
                <FileUp className={cn(compact ? 'w-4 h-4 text-[#9E4A25]' : 'w-5 h-5 text-[#9E4A25]')} />
              ) : (
                <Upload className={cn(compact ? 'w-4 h-4' : 'w-5 h-5')} />
              )}
            </div>

            <p className="text-xs font-semibold text-[#1C1917]">
              <span
                className="text-[#9E4A25] cursor-pointer hover:underline"
                onClick={() => fileInputRef.current?.click()}
              >
                Click to upload
              </span>{' '}
              or drag and drop
            </p>
            <p className="mt-0.5 text-[11px] text-[#A8A29E]">
              PDF, TXT or DOCX (up to {MAX_FILE_SIZE_MB}MB)
            </p>

            <div className="mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                leftIcon={<Upload className="w-3 h-3" />}
                className="text-xs h-7 border-[#E8E2D7]"
              >
                Browse Files
              </Button>
            </div>
          </>
        )}
      </motion.div>

      {validationError && (
        <div className="mt-2 flex items-center gap-1.5 p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}
    </div>
  );
};
