import React, { useState, useMemo } from 'react';
import {
  PenSquare,
  Search,
  Library,
  Pin,
  Clock,
  Settings as SettingsIcon,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
  X,
} from 'lucide-react';
import { ConversationSummary } from '../../types/conversation';
import { ConversationItem } from '../conversations/ConversationItem';
import { NavPage } from './AppLayout';
import { UserProfile } from '../../hooks/useUserProfile';

interface SidebarProps {
  currentPage: NavPage;
  onNavigate: (page: NavPage) => void;
  onNewChat: () => void;
  conversations: ConversationSummary[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => Promise<boolean>;
  onTogglePinConversation?: (id: string) => Promise<boolean>;
  isLoadingConversations?: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  documentCount?: number;
  onOpenSettings: () => void;
  userProfile: UserProfile;
  userInitials: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  onNewChat,
  conversations,
  activeConversationId,
  onSelectConversation,
  onDeleteConversation,
  onTogglePinConversation,
  isLoadingConversations,
  isCollapsed,
  onToggleCollapse,
  documentCount = 0,
  onOpenSettings,
  userProfile,
  userInitials,
}) => {
  const [searchFilter, setSearchFilter] = useState('');
  const [showSearchInput, setShowSearchInput] = useState(false);

  const filteredConversations = searchFilter.trim()
    ? conversations.filter((c) =>
        c.title.toLowerCase().includes(searchFilter.toLowerCase())
      )
    : conversations;

  const pinnedConversations = useMemo<ConversationSummary[]>(
    () => filteredConversations.filter((c) => Boolean(c.is_pinned)),
    [filteredConversations]
  );

  const unpinnedConversations = useMemo<ConversationSummary[]>(
    () => filteredConversations.filter((c) => !c.is_pinned),
    [filteredConversations]
  );

  return (
    <aside
      className={`relative flex flex-col h-full bg-[#F7F4EE] border-r border-[#E8E2D7] transition-all duration-300 ease-in-out select-none ${
        isCollapsed ? 'w-16' : 'w-[250px]'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div
          onClick={() => {
            onNewChat();
            onNavigate('chat');
          }}
          className="flex items-center gap-2.5 cursor-pointer group overflow-hidden"
        >
          {/* Logo emblem */}
          <div className="w-7 h-7 rounded-lg overflow-hidden bg-black shrink-0 shadow-sm border border-black/10 flex items-center justify-center group-hover:scale-105 transition-transform">
            <img
              src="/logo.jpg"
              alt="Meiporul AI"
              className="w-full h-full object-cover"
            />
          </div>

          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold tracking-tight text-[#1C1917] leading-none">
                Meiporul AI
              </span>
              <span className="text-[10px] text-[#A8A29E] tracking-tight mt-0.5 font-normal">
                Document Assistant
              </span>
            </div>
          )}
        </div>

        {/* Collapse button « */}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="group p-1 rounded-md text-[#A8A29E] hover:text-[#1C1917] hover:bg-[#EAE4DC] transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronsRight className="w-4 h-4 icon-hover-nudge-right" />
          ) : (
            <ChevronsLeft className="w-4 h-4 icon-hover-nudge-left" />
          )}
        </button>
      </div>

      {/* Top Navigation Items */}
      <div className="px-2.5 py-1.5 space-y-0.5">
        <button
          type="button"
          onClick={() => {
            onNewChat();
            if (currentPage !== 'chat') onNavigate('chat');
          }}
          className="group w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#1C1917] hover:bg-[#EAE4DC] transition-colors text-left"
        >
          <PenSquare className="w-3.5 h-3.5 text-[#78716C] group-hover:text-[#9E4A25] icon-hover-tilt shrink-0" />
          {!isCollapsed && <span>New chat</span>}
        </button>

        <button
          type="button"
          onClick={() => setShowSearchInput((prev) => !prev)}
          className={`group w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#1C1917] hover:bg-[#EAE4DC] transition-colors text-left ${
            showSearchInput ? 'bg-[#EAE4DC]' : ''
          }`}
        >
          <Search className="w-3.5 h-3.5 text-[#78716C] group-hover:text-[#1C1917] icon-hover-scale shrink-0" />
          {!isCollapsed && <span>Search</span>}
        </button>

        {showSearchInput && !isCollapsed && (
          <div className="px-1 py-1">
            <div className="relative flex items-center">
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filter chats..."
                className="w-full pl-7 pr-6 py-1 text-xs bg-white border border-[#E0D9CE] rounded-md text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:ring-1 focus:ring-[#9E4A25]"
                autoFocus
              />
              <Search className="absolute left-2 w-3 h-3 text-[#A8A29E]" />
              {searchFilter && (
                <button
                  type="button"
                  onClick={() => setSearchFilter('')}
                  className="absolute right-1.5 text-[#A8A29E] hover:text-[#1C1917]"
                >
                  <X className="w-3 h-3 icon-hover-scale" />
                </button>
              )}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => onNavigate('documents')}
          className={`group w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors text-left ${
            currentPage === 'documents'
              ? 'bg-[#EAE4DC] text-[#1C1917] font-semibold'
              : 'text-[#1C1917] hover:bg-[#EAE4DC]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Library className="w-3.5 h-3.5 text-[#78716C] group-hover:text-[#9E4A25] icon-hover-scale shrink-0" />
            {!isCollapsed && <span>Library</span>}
          </div>
          {!isCollapsed && documentCount > 0 && (
            <span className="text-[10px] text-[#78716C] bg-[#ECE5DB] px-1.5 py-0.2 rounded-full font-mono">
              {documentCount}
            </span>
          )}
        </button>
      </div>

      {/* Middle Scrollable Section: Pinned & History */}
      {!isCollapsed ? (
        <div className="flex-1 overflow-y-auto px-2.5 py-2 space-y-4">
          {/* Pinned Section */}
          {pinnedConversations.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-[#78716C]">
                <Pin className="w-3 h-3 text-[#9E4A25] fill-current" />
                <span>Pinned</span>
              </div>
              <div className="mt-0.5 space-y-0.5">
                {pinnedConversations.map((item) => (
                  <ConversationItem
                    key={item.conversation_id}
                    conversation={item}
                    isActive={item.conversation_id === activeConversationId}
                    onSelect={(id) => {
                      onSelectConversation(id);
                      if (currentPage !== 'chat') onNavigate('chat');
                    }}
                    onDelete={onDeleteConversation}
                    onTogglePin={onTogglePinConversation}
                  />
                ))}
              </div>
            </div>
          )}

          {/* History Section */}
          <div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-[#78716C]">
              <Clock className="w-3 h-3" />
              <span>History</span>
            </div>

            <div className="px-2.5 pt-1 pb-0.5 text-[10px] font-semibold text-[#A8A29E] uppercase tracking-wider">
              Recent
            </div>

            <div className="space-y-0.5">
              {isLoadingConversations && conversations.length === 0 ? (
                <div className="space-y-1 px-2.5 py-1">
                  <div className="h-6 rounded bg-[#EAE4DC] animate-pulse" />
                  <div className="h-6 rounded bg-[#EAE4DC] animate-pulse" />
                </div>
              ) : unpinnedConversations.length === 0 ? (
                <p className="px-2.5 py-2 text-[11px] text-[#A8A29E]">
                  {searchFilter ? 'No matching chats' : pinnedConversations.length > 0 ? 'All chats are pinned' : 'No previous chats'}
                </p>
              ) : (
                unpinnedConversations.map((item) => (
                  <ConversationItem
                    key={item.conversation_id}
                    conversation={item}
                    isActive={item.conversation_id === activeConversationId}
                    onSelect={(id) => {
                      onSelectConversation(id);
                      if (currentPage !== 'chat') onNavigate('chat');
                    }}
                    onDelete={onDeleteConversation}
                    onTogglePin={onTogglePinConversation}
                  />
                ))
              )}

              {conversations.length > 5 && (
                <button
                  type="button"
                  className="group w-full text-left px-2.5 py-1 rounded-md text-[11px] text-[#78716C] hover:text-[#1C1917] hover:bg-[#EAE4DC] flex items-center gap-1 transition-colors"
                >
                  <MoreHorizontal className="w-3 h-3 icon-hover-scale" />
                  <span>See all</span>
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1" />
      )}

      {/* Bottom Actions Section: Settings & Active User Profile */}
      <div className="px-2.5 py-2 border-t border-[#E8E2D7] space-y-1 bg-[#F7F4EE]">
        <button
          type="button"
          onClick={onOpenSettings}
          className="group w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#57534E] hover:text-[#1C1917] hover:bg-[#EAE4DC] transition-colors text-left"
          title="Settings"
        >
          <SettingsIcon className="w-3.5 h-3.5 text-[#78716C] group-hover:text-[#9E4A25] icon-hover-rotate-gear shrink-0" />
          {!isCollapsed && <span>Settings</span>}
        </button>

        {/* User Profile Pill at Bottom (Reflects the actual user using the app) */}
        {!isCollapsed && (
          <div
            onClick={onOpenSettings}
            className="pt-2 border-t border-[#E8E2D7] flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-[#EAE4DC] cursor-pointer transition-colors"
            title="Click to edit user profile in Settings"
          >
            <div className="w-7 h-7 rounded-full bg-[#E8DFD3] text-[#713F24] border border-[#D5CDBD] flex items-center justify-center text-[10px] font-bold select-none shrink-0 shadow-subtle">
              {userInitials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-[#1C1917] truncate leading-tight">
                {userProfile.name}
              </p>
              <p className="text-[10px] text-[#78716C] truncate leading-tight">
                {userProfile.email}
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
