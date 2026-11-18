import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Share2,
  MoreHorizontal,
  AlertCircle,
  Pencil,
} from 'lucide-react';
import { ChatMessage as ChatMessageType, SourceItem } from '../../types/chat';
import { AnswerView } from './AnswerView';
import { useToast } from '../ui/Toast';
import { Button } from '../ui/Button';

interface ChatMessageProps {
  message: ChatMessageType;
  selectedSource?: SourceItem | null;
  onSelectSource?: (source: SourceItem, allSources?: SourceItem[]) => void;
  onRetry?: () => void;
  onEdit?: (messageId: string, newText: string) => void;
  isGenerating?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onRetry,
  onEdit,
  isGenerating = false,
}) => {
  const isUser = message.role === 'user';
  const isError = message.status === 'error';
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState<boolean | null>(null);

  // User message inline edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content || '');
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  const { success } = useToast();

  useEffect(() => {
    setEditText(message.content || '');
  }, [message.content]);

  useEffect(() => {
    if (isEditing && editTextareaRef.current) {
      editTextareaRef.current.focus();
      editTextareaRef.current.style.height = 'auto';
      editTextareaRef.current.style.height = `${editTextareaRef.current.scrollHeight}px`;
    }
  }, [isEditing]);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareMessage = () => {
    navigator.clipboard.writeText(message.content || '');
    success('Copied', 'Message content copied to clipboard.');
  };

  const handleSaveEdit = () => {
    const trimmed = editText.trim();
    if (!trimmed || isGenerating) return;
    setIsEditing(false);
    if (trimmed !== message.content && onEdit) {
      onEdit(message.id, trimmed);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditText(message.content || '');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className={`w-full flex py-2 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {isUser ? (
        /* User Message Container */
        isEditing ? (
          /* Inline Editing Box */
          <div className="w-full max-w-[92%] sm:max-w-[72%] bg-white rounded-2xl border border-[#9E4A25]/40 shadow-card p-3 space-y-2">
            <textarea
              ref={editTextareaRef}
              value={editText}
              onChange={(e) => {
                setEditText(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSaveEdit();
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  handleCancelEdit();
                }
              }}
              rows={2}
              disabled={isGenerating}
              className="w-full text-base sm:text-sm text-[#1C1917] bg-transparent resize-none focus:outline-none leading-relaxed"
            />
            <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#F2ECE4]">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-2.5 py-1 text-xs text-[#78716C] hover:text-[#1C1917] hover:bg-[#F2ECE4] active:bg-[#EAE4DC] rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!editText.trim() || isGenerating}
                onClick={handleSaveEdit}
                className="px-3 py-1 text-xs font-medium bg-[#9E4A25] hover:bg-[#883E1D] text-white rounded-lg transition-colors cursor-pointer shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              >
                Send
              </button>
            </div>
          </div>
        ) : (
          /* User Message Bubble + Action Buttons Below */
          <div className="group relative flex flex-col items-end max-w-[88%] sm:max-w-[70%]">
            <div className="bg-[#F5EBE1] text-[#44392E] px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-[18px] rounded-tr-[4px] shadow-subtle text-xs sm:text-sm leading-relaxed font-normal selection:bg-[#9E4A25]/20 select-text">
              {message.content}
            </div>

            {/* Action Toolbar Below User Message (Always visible on mobile touch, hover on desktop) */}
            <div className="flex items-center gap-1 pt-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-150 text-[#A8A29E]">
              {onEdit && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  disabled={isGenerating}
                  className="group/btn flex items-center gap-1 p-1 px-1.5 rounded-md hover:text-[#1C1917] hover:bg-[#EAE4DC] active:bg-[#E2DDD5] transition-colors text-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Edit message"
                  aria-label="Edit message"
                >
                  <Pencil className="w-3.5 h-3.5 icon-hover-tilt group-hover/btn:text-[#9E4A25]" />
                  <span className="text-[11px] font-medium">Edit</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleCopy}
                className="group/btn flex items-center gap-1 p-1 px-1.5 rounded-md hover:text-[#1C1917] hover:bg-[#EAE4DC] active:bg-[#E2DDD5] transition-colors text-xs cursor-pointer"
                title="Copy message"
                aria-label="Copy message text"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 icon-hover-scale" />
                    <span className="text-[11px] font-medium text-emerald-600">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 icon-hover-scale group-hover/btn:text-[#1C1917]" />
                    <span className="text-[11px] font-medium">Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )
      ) : (
        /* Assistant Message: Clean, Direct on Canvas with AnswerView & Actions */
        <div className="group max-w-full sm:max-w-[88%] space-y-2">
          {isError ? (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800 space-y-2">
              <div className="flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 text-brand-error" />
                <span>Unable to retrieve answer</span>
              </div>
              {message.errorMessage && (
                <p className="text-xs text-red-700/90">{message.errorMessage}</p>
              )}
              {onRetry && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRetry}
                  leftIcon={<RotateCcw className="w-3 h-3 icon-hover-spin-back" />}
                  className="bg-white text-xs h-7 mt-1 border-red-200"
                >
                  Retry Question
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Answer View Component (Markdown + Tables + Citations + Sources) */}
              <AnswerView
                answer={message.content}
                sources={message.sources}
              />

              {/* Message Action Toolbar */}
              <div className="flex items-center gap-1 pt-0.5 text-[#A8A29E]">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="group/btn p-1 rounded hover:text-[#1C1917] hover:bg-[#EAE4DC] transition-colors cursor-pointer"
                  title="Copy to clipboard"
                  aria-label="Copy assistant answer"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600 icon-hover-scale" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 icon-hover-scale group-hover/btn:text-[#1C1917]" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setLiked(liked === true ? null : true)}
                  className={`group/btn p-1 rounded hover:text-[#1C1917] hover:bg-[#EAE4DC] transition-colors cursor-pointer ${
                    liked === true ? 'text-[#9E4A25]' : ''
                  }`}
                  title="Good response"
                  aria-label="Good response"
                >
                  <ThumbsUp className="w-3.5 h-3.5 icon-hover-thumbs-up" />
                </button>

                <button
                  type="button"
                  onClick={() => setLiked(liked === false ? null : false)}
                  className={`group/btn p-1 rounded hover:text-[#1C1917] hover:bg-[#EAE4DC] transition-colors cursor-pointer ${
                    liked === false ? 'text-red-500' : ''
                  }`}
                  title="Bad response"
                  aria-label="Bad response"
                >
                  <ThumbsDown className="w-3.5 h-3.5 icon-hover-thumbs-down" />
                </button>

                {onRetry && (
                  <button
                    type="button"
                    onClick={onRetry}
                    className="group/btn p-1 rounded hover:text-[#1C1917] hover:bg-[#EAE4DC] transition-colors cursor-pointer"
                    title="Regenerate response"
                    aria-label="Regenerate response"
                  >
                    <RotateCcw className="w-3.5 h-3.5 icon-hover-spin-back group-hover/btn:text-[#1C1917]" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleShareMessage}
                  className="group/btn p-1 rounded hover:text-[#1C1917] hover:bg-[#EAE4DC] transition-colors cursor-pointer"
                  title="Share response"
                  aria-label="Share response"
                >
                  <Share2 className="w-3.5 h-3.5 icon-hover-scale group-hover/btn:text-[#9E4A25]" />
                </button>

                <button
                  type="button"
                  className="group/btn p-1 rounded hover:text-[#1C1917] hover:bg-[#EAE4DC] transition-colors cursor-pointer"
                  title="More actions"
                  aria-label="More actions"
                >
                  <MoreHorizontal className="w-3.5 h-3.5 icon-hover-scale" />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default ChatMessage;
