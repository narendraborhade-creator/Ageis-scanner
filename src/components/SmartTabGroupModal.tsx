import React, { useState } from 'react';
import {
  FolderPlus,
  Layers,
  Sparkles,
  X,
  Check,
  Trash2,
  FolderMinus,
  Palette,
  Tag,
} from 'lucide-react';
import { BrowserTab, TabGroup, TabGroupColor } from '../types';
import {
  autoGroupTabs,
  createTabGroup,
  assignTabToGroup,
  removeTabFromGroup,
  ungroupAll,
  TAB_GROUP_PRESETS,
} from '../services/resourceMonitorService';

interface SmartTabGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  tabs: BrowserTab[];
  tabGroups: TabGroup[];
  onUpdateTabsAndGroups: (tabs: BrowserTab[], groups: TabGroup[]) => void;
}

const AVAILABLE_GROUP_COLORS: Array<{ id: TabGroupColor; label: string; classBg: string; classBorder: string; classText: string }> = [
  { id: 'cyan', label: 'Cyan', classBg: 'bg-cyan-500/20', classBorder: 'border-cyan-500', classText: 'text-cyan-300' },
  { id: 'purple', label: 'Purple', classBg: 'bg-purple-500/20', classBorder: 'border-purple-500', classText: 'text-purple-300' },
  { id: 'emerald', label: 'Emerald', classBg: 'bg-emerald-500/20', classBorder: 'border-emerald-500', classText: 'text-emerald-300' },
  { id: 'amber', label: 'Amber', classBg: 'bg-amber-500/20', classBorder: 'border-amber-500', classText: 'text-amber-300' },
  { id: 'rose', label: 'Rose', classBg: 'bg-rose-500/20', classBorder: 'border-rose-500', classText: 'text-rose-300' },
  { id: 'blue', label: 'Blue', classBg: 'bg-blue-500/20', classBorder: 'border-blue-500', classText: 'text-blue-300' },
  { id: 'slate', label: 'Slate', classBg: 'bg-slate-500/20', classBorder: 'border-slate-500', classText: 'text-slate-300' },
];

export const SmartTabGroupModal: React.FC<SmartTabGroupModalProps> = ({
  isOpen,
  onClose,
  tabs,
  tabGroups,
  onUpdateTabsAndGroups,
}) => {
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupColor, setNewGroupColor] = useState<TabGroupColor>('cyan');
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleSmartAutoGroup = () => {
    const { groupedTabs, groups } = autoGroupTabs(tabs);
    onUpdateTabsAndGroups(groupedTabs, groups);
    showToast(`Smart Grouping Complete: Organized ${tabs.length} tabs into ${groups.length} groups!`);
  };

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    const group = createTabGroup(newGroupName.trim(), newGroupColor);
    const updatedGroups = [...tabGroups, group];
    onUpdateTabsAndGroups(tabs, updatedGroups);
    setNewGroupName('');
    showToast(`Group "${group.name}" created!`);
  };

  const handleUngroupAll = () => {
    const ungrouped = ungroupAll(tabs);
    onUpdateTabsAndGroups(ungrouped, []);
    showToast('All tabs ungrouped.');
  };

  const handleToggleTabInGroup = (tabId: string, group: TabGroup) => {
    const tab = tabs.find((t) => t.id === tabId);
    if (!tab) return;

    if (tab.groupId === group.id) {
      const updated = removeTabFromGroup(tabs, tabId);
      onUpdateTabsAndGroups(updated, tabGroups);
      showToast(`Removed "${tab.title.slice(0, 20)}" from ${group.name}`);
    } else {
      const updated = assignTabToGroup(tabs, tabId, group);
      onUpdateTabsAndGroups(updated, tabGroups);
      showToast(`Added "${tab.title.slice(0, 20)}" to ${group.name}`);
    }
  };

  const handleDeleteGroup = (groupId: string) => {
    const updatedTabs = tabs.map((t) => (t.groupId === groupId ? { ...t, groupId: undefined, groupTitle: undefined, groupColor: undefined } : t));
    const updatedGroups = tabGroups.filter((g) => g.id !== groupId);
    onUpdateTabsAndGroups(updatedTabs, updatedGroups);
    showToast('Group deleted.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-xl bg-slate-900 border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 font-mono flex items-center gap-2">
                Smart Tab Grouping
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                  AI & Heuristic
                </span>
              </h2>
              <p className="text-xs text-slate-400">Organize tabs by domain, task category, and custom color tags</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Banner */}
        {feedback && (
          <div className="mx-4 mt-3 p-2.5 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono shadow-[0_0_15px_rgba(6,182,212,0.2)] animate-in fade-in flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-cyan-400" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Body content */}
        <div className="p-4 space-y-5 overflow-y-auto flex-1">
          {/* Smart Auto-Group Hero Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/40 via-purple-950/30 to-slate-900 border border-cyan-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-cyan-300 font-bold text-sm">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>1-Click Smart Auto-Group</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-md">
                Automatically cluster tabs into Security, Developer, Research, and Reference groups based on domain heuristics.
              </p>
            </div>

            <button
              type="button"
              onClick={handleSmartAutoGroup}
              className="py-2 px-3.5 rounded-xl text-xs font-mono font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:scale-105 shrink-0 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Auto-Group Tabs</span>
            </button>
          </div>

          {/* Create Custom Tab Group Form */}
          <form onSubmit={handleCreateGroup} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="text-xs font-mono font-semibold text-slate-300 flex items-center gap-1.5">
              <FolderPlus className="w-3.5 h-3.5 text-cyan-400" />
              <span>Create New Tab Group</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Group name (e.g. Sprint Tasks, Vulnerability Research)"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
              />

              <div className="flex items-center gap-1 shrink-0">
                {AVAILABLE_GROUP_COLORS.map((col) => (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => setNewGroupColor(col.id)}
                    className={`w-6 h-6 rounded-full border-2 transition-all cursor-pointer ${
                      col.classBg
                    } ${
                      newGroupColor === col.id ? 'border-white scale-110 shadow-[0_0_8px_rgba(255,255,255,0.4)]' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                    title={col.label}
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={!newGroupName.trim()}
                className="px-3 py-1.5 rounded-lg text-xs font-mono bg-slate-800 hover:bg-cyan-950 hover:text-cyan-300 hover:border-cyan-500/40 border border-slate-700 text-slate-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
              >
                Create
              </button>
            </div>
          </form>

          {/* Active Tab Groups Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-300 font-semibold">
                Active Tab Groups ({tabGroups.length})
              </span>
              {tabGroups.length > 0 && (
                <button
                  type="button"
                  onClick={handleUngroupAll}
                  className="text-slate-400 hover:text-rose-400 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <FolderMinus className="w-3.5 h-3.5" />
                  <span>Ungroup All</span>
                </button>
              )}
            </div>

            {tabGroups.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500 font-mono">
                No active tab groups yet. Click "Auto-Group Tabs" above or create a group to start organizing!
              </div>
            ) : (
              <div className="space-y-3">
                {tabGroups.map((group) => {
                  const memberTabs = tabs.filter((t) => t.groupId === group.id);
                  const colorConfig =
                    AVAILABLE_GROUP_COLORS.find((c) => c.id === group.color) || AVAILABLE_GROUP_COLORS[0];

                  return (
                    <div
                      key={group.id}
                      className={`p-3 rounded-xl border ${colorConfig.classBorder}/30 bg-slate-950/60 space-y-2`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold border ${colorConfig.classBg} ${colorConfig.classBorder} ${colorConfig.classText}`}
                          >
                            {group.name}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            ({memberTabs.length} tab{memberTabs.length === 1 ? '' : 's'})
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteGroup(group.id)}
                          className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Delete group"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Member Tabs List */}
                      <div className="space-y-1.5 pl-2 border-l-2 border-slate-800">
                        {tabs.map((tab) => {
                          const isInGroup = tab.groupId === group.id;
                          return (
                            <div
                              key={tab.id}
                              className={`flex items-center justify-between p-1.5 rounded-lg text-xs font-mono transition-colors ${
                                isInGroup
                                  ? 'bg-slate-900 text-slate-200'
                                  : 'text-slate-500 hover:text-slate-300'
                              }`}
                            >
                              <span className="truncate max-w-[280px] text-[11px]">
                                {tab.title}
                              </span>

                              <button
                                type="button"
                                onClick={() => handleToggleTabInGroup(tab.id, group)}
                                className={`px-2 py-0.5 rounded text-[10px] cursor-pointer border transition-colors ${
                                  isInGroup
                                    ? 'bg-rose-950/80 border-rose-500/40 text-rose-300 hover:bg-rose-900'
                                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40'
                                }`}
                              >
                                {isInGroup ? 'Remove' : 'Add to group'}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
