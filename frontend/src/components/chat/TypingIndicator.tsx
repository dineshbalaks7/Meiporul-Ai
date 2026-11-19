import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Search, Timer } from 'lucide-react';

interface TypingIndicatorProps {
  loadingStep: 'searching' | 'generating';
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ loadingStep }) => {
  const isSearching = loadingStep === 'searching';
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      setElapsed((Date.now() - startTime) / 1000);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.15 }}
      className="flex items-center gap-2.5 py-1 text-xs text-[#78716C]"
    >
      <div className="flex items-center justify-center w-6 h-6 rounded-md bg-[#F5EBE1] text-[#9E4A25]">
        {isSearching ? (
          <Search className="w-3 h-3 animate-pulse" />
        ) : (
          <Sparkles className="w-3 h-3 animate-pulse" />
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className="font-medium text-[11px] text-[#57534E]">
          {isSearching ? 'Thinking...' : 'Generating answer...'}
        </span>
        <div className="flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-[#9E4A25] animate-pulse" style={{ animationDelay: '0ms' }} />
          <span className="w-1 h-1 rounded-full bg-[#9E4A25] animate-pulse" style={{ animationDelay: '200ms' }} />
          <span className="w-1 h-1 rounded-full bg-[#9E4A25] animate-pulse" style={{ animationDelay: '400ms' }} />
        </div>
        <div className="flex items-center gap-1 text-[10px] font-mono text-[#A8A29E] ml-1 select-none">
          <Timer className="w-2.5 h-2.5 text-[#9E4A25]/70" />
          <span>{elapsed.toFixed(1)}s</span>
        </div>
      </div>
    </motion.div>
  );
};
