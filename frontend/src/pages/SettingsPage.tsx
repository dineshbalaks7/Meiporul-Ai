import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Server,
  Sparkles,
  Sun,
  Moon,
  Trash2,
  RefreshCw,
  Info,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Dialog } from '../components/ui/Dialog';
import { useToast } from '../components/ui/Toast';
import { checkBackendHealth } from '../services/api';

interface SettingsPageProps {
  isBackendHealthy: boolean;
  onRefreshHealth: () => void;
  documentCount: number;
  conversationCount: number;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  isBackendHealthy,
  onRefreshHealth,
  documentCount,
  conversationCount,
}) => {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  const { success } = useToast();

  const handleTestConnection = async () => {
    setIsCheckingHealth(true);
    await checkBackendHealth();
    onRefreshHealth();
    setIsCheckingHealth(false);
    success('Connection check complete', 'Updated backend service status.');
  };

  const handleClearPreferences = () => {
    localStorage.clear();
    setTheme('light');
    setShowClearConfirm(false);
    success('Preferences reset', 'Local UI preferences have been restored to defaults.');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="h-full w-full overflow-y-auto px-4 sm:px-8 py-6 max-w-3xl mx-auto space-y-5"
    >
      {/* Page Header */}
      <div className="pb-3 border-b border-[#E8E2D7]">
        <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[#1C1917]">
          Settings
        </h1>
        <p className="mt-0.5 text-xs text-[#78716C]">
          Configure application preferences and monitor backend connectivity.
        </p>
      </div>

      {/* Backend Status Section */}
      <div className="p-4 rounded-2xl bg-white border border-[#E8E2D7] shadow-subtle space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#F5EBE1] text-[#9E4A25] flex items-center justify-center shrink-0">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-semibold text-[#1C1917]">
                FastAPI Backend Connection
              </h2>
              <p className="text-[11px] text-[#78716C]">
                LangChain + ChromaDB + Cross-Encoder Reranker
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleTestConnection}
            isLoading={isCheckingHealth}
            leftIcon={<RefreshCw className="w-3 h-3" />}
            className="text-xs h-7"
          >
            Check Status
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          <div className="p-2.5 rounded-xl bg-[#F7F4EE] border border-[#E8E2D7]">
            <span className="text-[10px] text-[#A8A29E] font-medium">Service Health</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  isBackendHealthy ? 'bg-emerald-500' : 'bg-red-500'
                }`}
              />
              <span className="text-xs font-semibold text-[#1C1917]">
                {isBackendHealthy ? 'Online & Healthy' : 'Disconnected'}
              </span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-[#F7F4EE] border border-[#E8E2D7]">
            <span className="text-[10px] text-[#A8A29E] font-medium">API Base URL</span>
            <p className="text-xs font-mono font-medium text-[#1C1917] mt-0.5 truncate">
              {import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'}
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-[#F7F4EE] border border-[#E8E2D7]">
            <span className="text-[10px] text-[#A8A29E] font-medium">Indexed Knowledge</span>
            <p className="text-xs font-semibold text-[#1C1917] mt-0.5">
              {documentCount} docs • {conversationCount} chats
            </p>
          </div>
        </div>
      </div>

      {/* Theme Preference UI */}
      <div className="p-4 rounded-2xl bg-white border border-[#E8E2D7] shadow-subtle space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#F7F4EE] text-[#78716C] flex items-center justify-center shrink-0">
            <Sun className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-semibold text-[#1C1917]">
              Interface Theme
            </h2>
            <p className="text-[11px] text-[#78716C]">
              Meiporul AI defaults to a warm, eye-friendly editorial palette
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all ${
              theme === 'light'
                ? 'border-[#9E4A25] bg-[#F5EBE1] text-[#9E4A25] font-semibold ring-1 ring-[#9E4A25]/20'
                : 'border-[#E8E2D7] hover:bg-[#F7F4EE] text-[#78716C]'
            }`}
          >
            <Sun className="w-4 h-4" />
            <span>Light (Default)</span>
          </button>

          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all ${
              theme === 'dark'
                ? 'border-[#9E4A25] bg-[#F5EBE1] text-[#9E4A25] font-semibold ring-1 ring-[#9E4A25]/20'
                : 'border-[#E8E2D7] hover:bg-[#F7F4EE] text-[#78716C]'
            }`}
          >
            <Moon className="w-4 h-4" />
            <span>Dark</span>
          </button>

          <button
            type="button"
            onClick={() => setTheme('system')}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all ${
              theme === 'system'
                ? 'border-[#9E4A25] bg-[#F5EBE1] text-[#9E4A25] font-semibold ring-1 ring-[#9E4A25]/20'
                : 'border-[#E8E2D7] hover:bg-[#F7F4EE] text-[#78716C]'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>System</span>
          </button>
        </div>
      </div>

      {/* Architecture Information */}
      <div className="p-4 rounded-2xl bg-white border border-[#E8E2D7] shadow-subtle space-y-2.5">
        <h2 className="text-xs font-semibold text-[#1C1917] flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-[#9E4A25]" />
          <span>Application Stack Information</span>
        </h2>

        <div className="divide-y divide-[#F2EEE7] text-xs">
          <div className="py-2 flex items-center justify-between">
            <span className="text-[#78716C]">Application</span>
            <span className="font-semibold text-[#1C1917]">Meiporul AI</span>
          </div>
          <div className="py-2 flex items-center justify-between">
            <span className="text-[#78716C]">RAG Pipeline</span>
            <span className="text-[#1C1917]">LangChain + Hugging Face Embeddings + ChromaDB</span>
          </div>
          <div className="py-2 flex items-center justify-between">
            <span className="text-[#78716C]">Reranking Model</span>
            <span className="text-[#1C1917]">Cross-Encoder (MS-MARCO-MiniLM)</span>
          </div>
          <div className="py-2 flex items-center justify-between">
            <span className="text-[#78716C]">LLM</span>
            <span className="text-[#1C1917]">Groq LLM (Contextual Question Rewriting)</span>
          </div>
        </div>
      </div>

      {/* Reset UI Preferences */}
      <div className="p-4 rounded-2xl bg-white border border-[#E8E2D7] shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-xs font-semibold text-[#1C1917]">
            Reset UI Preferences
          </h3>
          <p className="text-[11px] text-[#78716C]">
            Restore default display settings.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowClearConfirm(true)}
          leftIcon={<Trash2 className="w-3 h-3 text-brand-error" />}
          className="text-brand-error hover:bg-red-50 border-red-200 text-xs h-7 self-start sm:self-auto"
        >
          Reset Preferences
        </Button>
      </div>

      {/* Reset Confirmation Dialog */}
      <Dialog
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        title="Reset UI Preferences"
        description="Are you sure you want to restore default preferences?"
      >
        <p className="text-xs text-[#78716C] py-2">
          This will reset local display configurations without affecting any indexed documents or chat history.
        </p>

        <div className="mt-4 flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowClearConfirm(false)}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" onClick={handleClearPreferences}>
            Confirm Reset
          </Button>
        </div>
      </Dialog>
    </motion.div>
  );
};
