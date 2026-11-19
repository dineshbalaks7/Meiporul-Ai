import React, { useEffect, useState } from 'react';
import {
  Sun,
  Moon,
  Sparkles,
  Server,
  RefreshCw,
  Trash2,
  Sliders,
  Info,
  Database,
  Layers,
  Check,
} from 'lucide-react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import { checkBackendHealth } from '../../services/api';
import { UserProfile, getUserInitials } from '../../hooks/useUserProfile';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isBackendHealthy: boolean;
  onRefreshHealth: () => void;
  documentCount: number;
  conversationCount: number;
  userProfile: UserProfile;
  onUpdateUserProfile: (newProfile: Partial<UserProfile>) => void;
  onStartFresh?: () => Promise<boolean>;
  onClearAllChats?: () => Promise<boolean>;
}

type SettingsTab = 'general' | 'backend' | 'about';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  isBackendHealthy,
  onRefreshHealth,
  documentCount,
  conversationCount,
  userProfile,
  onUpdateUserProfile,
  onStartFresh,
  onClearAllChats,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    const saved = localStorage.getItem('meiporul-theme');
    return saved === 'dark' || saved === 'system' || saved === 'light' ? saved : 'light';
  });
  const [isChecking, setIsChecking] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isStartingFresh, setIsStartingFresh] = useState(false);

  // Profile form state
  const [nameInput, setNameInput] = useState(userProfile.name);
  const [emailInput, setEmailInput] = useState(userProfile.email);
  const [isProfileSaved, setIsProfileSaved] = useState(false);

  const { success } = useToast();

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const applyTheme = () => {
      const isDark = theme === 'dark' || (theme === 'system' && media.matches);
      document.documentElement.classList.toggle('dark', isDark);
      document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
    };
    applyTheme();
    localStorage.setItem('meiporul-theme', theme);
    if (theme === 'system') media.addEventListener('change', applyTheme);
    return () => media.removeEventListener('change', applyTheme);
  }, [theme]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    onUpdateUserProfile({
      name: nameInput.trim(),
      email: emailInput.trim() || 'user@meiporul.ai',
    });
    setIsProfileSaved(true);
    success('Profile updated', `Saved display name as "${nameInput.trim()}".`);
    setTimeout(() => setIsProfileSaved(false), 2000);
  };

  const handleTestConnection = async () => {
    setIsChecking(true);
    await checkBackendHealth();
    onRefreshHealth();
    setIsChecking(false);
    success('Connection check complete', 'Updated backend service status.');
  };

  const handleClearAllChats = async () => {
    setIsStartingFresh(true);
    const clearFn = onClearAllChats || onStartFresh;
    const cleared = clearFn ? await clearFn() : false;
    setIsStartingFresh(false);
    if (!cleared) return;
    // Only delete chats: DO NOT touch localStorage, user profile, or theme!
    setShowClearConfirm(false);
    success('Chats cleared', 'All conversation history has been deleted.');
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Settings"
      description="Manage your profile, theme, and backend connectivity."
      maxWidth="lg"
    >
      <div className="flex flex-col sm:flex-row gap-5 pt-1">
        {/* Left vertical tabs */}
        <div className="flex sm:flex-col gap-1 sm:w-40 border-b sm:border-b-0 sm:border-r border-[#E8E2D7] pb-3 sm:pb-0 sm:pr-3 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors text-left ${
              activeTab === 'general'
                ? 'bg-[#F0EAE1] text-[#1C1917] font-semibold'
                : 'text-[#78716C] hover:text-[#1C1917] hover:bg-[#F7F4EE]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-[#9E4A25]" />
            <span>General</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('backend')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors text-left ${
              activeTab === 'backend'
                ? 'bg-[#F0EAE1] text-[#1C1917] font-semibold'
                : 'text-[#78716C] hover:text-[#1C1917] hover:bg-[#F7F4EE]'
            }`}
          >
            <Server className="w-3.5 h-3.5 text-[#9E4A25]" />
            <span>Backend & RAG</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('about')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors text-left ${
              activeTab === 'about'
                ? 'bg-[#F0EAE1] text-[#1C1917] font-semibold'
                : 'text-[#78716C] hover:text-[#1C1917] hover:bg-[#F7F4EE]'
            }`}
          >
            <Info className="w-3.5 h-3.5 text-[#9E4A25]" />
            <span>About</span>
          </button>
        </div>

        {/* Tab content area */}
        <div className="flex-1 min-w-0 min-h-[300px] space-y-4">
          {/* GENERAL TAB */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              {/* User Profile Customization */}
              <div className="p-3.5 rounded-xl bg-[#F7F4EE] border border-[#E8E2D7] space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#E8DFD3] text-[#713F24] border border-[#D5CDBD] flex items-center justify-center text-xs font-bold shrink-0">
                    {getUserInitials(nameInput)}
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-[#1C1917]">Your Profile</h4>
                    <p className="text-[10px] text-[#78716C]">
                      Set your name and email shown in the sidebar.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-2.5 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-[#78716C] uppercase tracking-wider mb-1">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        placeholder="Your Name (e.g. Alex Doe)"
                        className="w-full px-2.5 py-1.5 text-base sm:text-xs bg-white border border-[#E0D9CE] rounded-lg text-[#1C1917] focus:outline-none focus:ring-1 focus:ring-[#9E4A25]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-[#78716C] uppercase tracking-wider mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="your.email@example.com"
                        className="w-full px-2.5 py-1.5 text-base sm:text-xs bg-white border border-[#E0D9CE] rounded-lg text-[#1C1917] focus:outline-none focus:ring-1 focus:ring-[#9E4A25]"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      className="text-xs h-7"
                      leftIcon={isProfileSaved ? <Check className="w-3 h-3 text-white" /> : undefined}
                    >
                      {isProfileSaved ? 'Saved!' : 'Save Profile'}
                    </Button>
                  </div>
                </form>
              </div>

              {/* Theme Selector */}
              <div>
                <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                  Interface Theme
                </label>
                <p className="text-[11px] text-[#78716C] mb-2">
                  Select your preferred color theme.
                </p>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                      theme === 'light'
                        ? 'border-[#9E4A25] bg-[#F5EBE1] text-[#9E4A25] font-semibold ring-1 ring-[#9E4A25]/20'
                        : 'border-[#E8E2D7] hover:bg-[#F7F4EE] text-[#78716C]'
                    }`}
                  >
                    <Sun className="w-4 h-4" />
                    <span>Light</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border text-xs font-medium transition-all ${
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
                    className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border text-xs font-medium transition-all ${
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

              {/* Delete all chats */}
              <div className="pt-2.5 border-t border-[#E8E2D7] flex items-center justify-between gap-3">
                <div className="min-w-0 pr-2">
                  <h4 className="text-xs font-semibold text-[#1C1917]">
                    Delete all chats
                  </h4>
                  <p className="text-[10px] text-[#78716C] leading-relaxed">
                    Permanently delete all conversation history. Your indexed documents, profile, and preferences remain safe.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowClearConfirm(true)}
                  leftIcon={<Trash2 className="w-3.5 h-3.5 text-brand-error" />}
                  className="text-brand-error hover:bg-red-50 border-red-200 text-xs h-8 px-3 whitespace-nowrap shrink-0"
                >
                  Delete all chats
                </Button>
              </div>
            </div>
          )}

          {/* BACKEND & RAG TAB */}
          {activeTab === 'backend' && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-[#F7F4EE] border border-[#E8E2D7] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      isBackendHealthy ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
                    }`}
                  />
                  <div>
                    <p className="text-xs font-semibold text-[#1C1917]">
                      FastAPI Server: {isBackendHealthy ? 'Connected & Healthy' : 'Offline'}
                    </p>
                    <p className="text-[10px] font-mono text-[#78716C]">
                      {import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'}
                    </p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestConnection}
                  isLoading={isChecking}
                  leftIcon={<RefreshCw className="w-3 h-3" />}
                  className="text-xs h-7"
                >
                  Ping
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-white border border-[#E8E2D7]">
                  <div className="flex items-center gap-1.5 text-xs text-[#78716C]">
                    <Database className="w-3.5 h-3.5 text-[#9E4A25]" />
                    <span>Documents</span>
                  </div>
                  <p className="text-base font-bold text-[#1C1917] mt-1">
                    {documentCount}
                  </p>
                  <p className="text-[10px] text-[#A8A29E]">Indexed in ChromaDB</p>
                </div>

                <div className="p-3 rounded-xl bg-white border border-[#E8E2D7]">
                  <div className="flex items-center gap-1.5 text-xs text-[#78716C]">
                    <Layers className="w-3.5 h-3.5 text-[#9E4A25]" />
                    <span>Conversations</span>
                  </div>
                  <p className="text-base font-bold text-[#1C1917] mt-1">
                    {conversationCount}
                  </p>
                  <p className="text-[10px] text-[#A8A29E]">Stored in SQLite</p>
                </div>
              </div>
            </div>
          )}

          {/* ABOUT TAB */}
          {activeTab === 'about' && (
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-[#F7F4EE] border border-[#E8E2D7]">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="w-6 h-6 rounded-md overflow-hidden bg-black shrink-0 shadow-sm flex items-center justify-center">
                    <img src="/logo.jpg" alt="Meiporul AI" className="w-full h-full object-cover" />
                  </div>
                  <h4 className="font-semibold text-[#1C1917]">Meiporul AI</h4>
                </div>
                <p className="text-[#78716C] leading-relaxed text-[11px]">
                  Intelligent document question-answering assistant using Retrieval-Augmented Generation (RAG).
                </p>
              </div>

              <div className="divide-y divide-[#F2EEE7] pt-1">
                <div className="py-1.5 flex items-center justify-between">
                  <span className="text-[#78716C]">Version</span>
                  <span className="font-mono text-[#1C1917]">v1.0.0</span>
                </div>
                <div className="py-1.5 flex items-center justify-between">
                  <span className="text-[#78716C]">Embeddings</span>
                  <span className="text-[#1C1917]">sentence-transformers / MiniLM</span>
                </div>
                <div className="py-1.5 flex items-center justify-between">
                  <span className="text-[#78716C]">Reranker</span>
                  <span className="text-[#1C1917]">mxbai-rerank-xsmall-v1 (Mixedbread AI)</span>
                </div>
                <div className="py-1.5 flex items-center justify-between">
                  <span className="text-[#78716C]">LLM</span>
                  <span className="text-[#1C1917]">Groq LLM</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation dialog for deleting all chats */}
      <Dialog
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        title="Delete all chats?"
        description="This permanently deletes all your saved conversations and message history."
      >
        <p className="text-xs text-[#78716C] py-2">
          Only your conversations will be cleared. Your indexed documents, profile, and theme settings will not be affected.
        </p>
        <div className="mt-4 flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowClearConfirm(false)}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" onClick={handleClearAllChats} isLoading={isStartingFresh} className="whitespace-nowrap">
            Delete all chats
          </Button>
        </div>
      </Dialog>
    </Dialog>
  );
};
