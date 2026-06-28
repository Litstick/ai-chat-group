import { useState, useMemo, useEffect, type MouseEvent } from 'react';
import { useStore } from '../store/useStore';
import { callAIForSummary } from '../utils/aiService';
import type { ChatSession, ChatSummary } from '../types';
import {
  ArrowLeft,
  MessageCircle,
  Users,
  Clock,
  Sparkles,
  Search,
  Pencil,
  Check,
  X,
  RefreshCw,
  Eye,
  Download,
  CheckSquare,
  Square,
} from 'lucide-react';

export default function History() {
  const {
    sessions,
    currentUser,
    setCurrentPage,
    setCurrentSession,
    addSession,
    updateSession,
    settings,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [editingAliasId, setEditingAliasId] = useState<string | null>(null);
  const [editingAliasValue, setEditingAliasValue] = useState('');
  const [summarizingId, setSummarizingId] = useState<string | null>(null);
  const [summaryModalSession, setSummaryModalSession] = useState<ChatSession | null>(null);
  const [selectModeSessionId, setSelectModeSessionId] = useState<string | null>(null);
  const [selectedMessageIds, setSelectedMessageIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessions;
    const query = searchQuery.toLowerCase();
    return sessions.filter(
      (s) =>
        s.topic.toLowerCase().includes(query) ||
        (s.alias && s.alias.toLowerCase().includes(query))
    );
  }, [sessions, searchQuery]);

  const sortedSessions = useMemo(
    () => filteredSessions.slice().sort((a, b) => b.startTime - a.startTime),
    [filteredSessions]
  );

  const getDefaultModel = () => {
    const defaultModel = settings.models?.find((m) => m.isDefault);
    return defaultModel || settings.models?.[0];
  };

  const getApiKeyForModel = (model: { provider: string }): string => {
    const map: Record<string, keyof typeof settings.apiKeys> = {
      openai: 'openai',
      anthropic: 'anthropic',
      google: 'google',
      deepseek: 'deepseek',
      qwen: 'qwen',
      moonshot: 'moonshot',
      zhipu: 'zhipu',
      baidu: 'baidu',
    };
    const field = map[model.provider.toLowerCase()];
    if (!field) return '';
    return (settings.apiKeys?.[field] as string) || '';
  };

  const handleGenerateSummary = async (e: MouseEvent, session: ChatSession) => {
    e.stopPropagation();
    if (summarizingId) return;

    const model = getDefaultModel();
    if (!model) {
      if (confirm('请先在设置中配置【默认】 AI 模型，是否立即前往设置？')) {
        setCurrentPage('settings');
      }
      return;
    }

    const apiKey = getApiKeyForModel(model);
    if (!apiKey) {
      if (confirm('请先在设置中配置【默认】模型的 API Key，是否立即前往设置？')) {
        setCurrentPage('settings');
      }
      return;
    }

    setSummarizingId(session.id);
    try {
      const summary = await callAIForSummary(
        model,
        settings.apiKeys,
        session.topic,
        session.messages
      );
      const chatSummary: ChatSummary = {
        ...summary,
        generatedAt: Date.now(),
      };
      const updatedSession = { ...session, summary: chatSummary };
      updateSession(updatedSession);
    } catch (err) {
      console.error('生成总结失败:', err);
      if (confirm('生成总结失败，请检查 API 配置后重试。是否前往设置？')) {
        setCurrentPage('settings');
      }
    } finally {
      setSummarizingId(null);
    }
  };

  const handleViewSummary = (e: MouseEvent, session: ChatSession) => {
    e.stopPropagation();
    setSummaryModalSession(session);
  };

  const handleContinueDiscussion = (e: MouseEvent, oldSession: ChatSession) => {
    e.stopPropagation();
    if (!currentUser) return;

    const historyMessages = oldSession.messages.map((msg) => ({
      ...msg,
      isHistory: true,
    }));

    const newSession: ChatSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      userId: currentUser.id,
      topic: `${oldSession.topic}（续）`,
      startTime: Date.now(),
      messages: historyMessages,
      participants: oldSession.participants,
      isActive: true,
      parentSessionId: oldSession.id,
      settings: oldSession.settings,
    };

    addSession(newSession);
    setCurrentSession(newSession);
    setCurrentPage('chat');
  };

  const handleStartEditAlias = (e: MouseEvent, session: ChatSession) => {
    e.stopPropagation();
    setEditingAliasId(session.id);
    setEditingAliasValue(session.alias || '');
  };

  const handleSaveAlias = (e: MouseEvent, session: ChatSession) => {
    e.stopPropagation();
    const updatedSession = {
      ...session,
      alias: editingAliasValue.trim() || undefined,
    };
    updateSession(updatedSession);
    setEditingAliasId(null);
    setEditingAliasValue('');
  };

  const handleCancelEditAlias = (e: MouseEvent) => {
    e.stopPropagation();
    setEditingAliasId(null);
    setEditingAliasValue('');
  };

  const handleCardClick = (session: ChatSession) => {
    if (editingAliasId || summaryModalSession) return;
    setCurrentSession(session);
    setCurrentPage('chat');
  };

  const handleToggleSelectMode = (e: MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (selectModeSessionId === sessionId) {
      setSelectModeSessionId(null);
      setSelectedMessageIds(new Set());
    } else {
      setSelectModeSessionId(sessionId);
      setSelectedMessageIds(new Set());
    }
  };

  const handleToggleMessageSelect = (messageId: string) => {
    setSelectedMessageIds(prev => {
      const next = new Set(prev);
      if (next.has(messageId)) {
        next.delete(messageId);
      } else {
        next.add(messageId);
      }
      return next;
    });
  };

  const handleSelectAllMessages = (session: ChatSession) => {
    if (selectedMessageIds.size === session.messages.length) {
      setSelectedMessageIds(new Set());
    } else {
      setSelectedMessageIds(new Set(session.messages.map(m => m.id)));
    }
  };

  const handleImportSelectedMessages = (e: MouseEvent, session: ChatSession) => {
    e.stopPropagation();
    if (!currentUser || selectedMessageIds.size === 0) return;

    const selectedMessages = session.messages
      .filter(m => selectedMessageIds.has(m.id))
      .map(msg => ({
        ...msg,
        isHistory: true,
      }));

    if (selectedMessages.length === 0) return;

    const newSession: ChatSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      userId: currentUser.id,
      topic: `${session.topic}（导入）`,
      startTime: Date.now(),
      messages: selectedMessages,
      participants: session.participants,
      isActive: true,
      parentSessionId: session.id,
      settings: session.settings,
    };

    addSession(newSession);
    setCurrentSession(newSession);
    setSelectModeSessionId(null);
    setSelectedMessageIds(new Set());
    setCurrentPage('chat');
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (start: number, end?: number) => {
    const endTime = end || Date.now();
    const minutes = Math.floor((endTime - start) / 60000);
    if (minutes < 1) return '不到 1 分钟';
    if (minutes < 60) return `${minutes} 分钟`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours} 小时 ${mins} 分钟`;
  };

  const getDisplayTitle = (session: ChatSession) => {
    return session.alias || session.topic;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-gray-100">
      <div className="max-w-4xl mx-auto">
        {/* ── Header ── */}
        <div className="gradient-bg-blue pt-safe-top">
          <div className="px-5 py-7 flex items-center gap-4">
            <button
              onClick={() => setCurrentPage('home')}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-sm transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white tracking-wide">历史记录</h1>
              <p className="text-blue-100/80 mt-1 text-sm">共 {sessions.length} 个会话</p>
            </div>
          </div>
        </div>

        {/* ── Search Bar ── */}
        <div className="px-4 -mt-3 relative z-10">
          <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 p-3">
            <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
              <Search className="w-4.5 h-4.5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索话题或别名..."
                className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder:text-gray-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-gray-500" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="px-4 py-5 space-y-4">
          {/* Empty state */}
          {sessions.length === 0 && (
            <div className="text-center py-20">
              <div className="w-20 h-20 gradient-bg-purple rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-purple-200/50 rotate-6">
                <MessageCircle className="w-10 h-10 text-white" />
              </div>
              <p className="text-gray-500 text-lg font-medium">暂无历史记录</p>
              <p className="text-gray-400 text-sm mt-2">开始一段新的 AI 对话吧</p>
            </div>
          )}

          {/* Search empty state */}
          {sessions.length > 0 && sortedSessions.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">未找到匹配的会话</p>
              <p className="text-gray-400 text-sm mt-1">试试其他关键词吧</p>
            </div>
          )}

          {/* Session cards */}
          {sortedSessions.map((session, index) => {
            const isEditingAlias = editingAliasId === session.id;
            const isSummarizing = summarizingId === session.id;

            return (
              <div
                key={session.id}
                onClick={() => handleCardClick(session)}
                className="section-card relative overflow-hidden slide-up cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                {/* Left accent border */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl ${
                    session.isActive
                      ? 'bg-gradient-to-b from-emerald-400 to-emerald-600'
                      : 'bg-gradient-to-b from-gray-300 to-gray-400'
                  }`}
                />

                <div className="pl-4 pr-4 py-5">
                  {/* Top row: title + status badge + actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {isEditingAlias ? (
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <input
                            type="text"
                            value={editingAliasValue}
                            onChange={(e) => setEditingAliasValue(e.target.value)}
                            placeholder="输入别名..."
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                            className="flex-1 min-w-0 px-3 py-1.5 text-[15px] font-semibold text-gray-900 bg-gray-50 border border-blue-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-200"
                          />
                          <button
                            onClick={(e) => handleSaveAlias(e, session)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-colors shrink-0"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleCancelEditAlias}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <h3 className="font-semibold text-gray-900 text-[15px] truncate">
                            {getDisplayTitle(session)}
                          </h3>
                          {session.alias && (
                            <span className="text-xs text-gray-400 truncate shrink-0">
                              · {session.topic}
                            </span>
                          )}
                          <button
                            onClick={(e) => handleStartEditAlias(e, session)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-blue-500 hover:bg-blue-50 transition-colors shrink-0"
                            title="编辑别名"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                      {session.isActive ? (
                        <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full shrink-0">
                          <span className="pulse-dot w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                          进行中
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full shrink-0">
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                          已结束
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Meta info row */}
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3 text-[13px] text-gray-400">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-blue-400" />
                      <span>{session.participants.length} 个 AI</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MessageCircle className="w-3.5 h-3.5 text-amber-400" />
                      <span>{session.messageCount ?? session.messages.length} 条消息</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{formatDuration(session.startTime, session.endTime)}</span>
                    </span>
                    <span className="text-gray-300">|</span>
                    <span>{formatDate(session.startTime)}</span>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                    {session.summary ? (
                      <button
                        onClick={(e) => handleViewSummary(e, session)}
                        className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        查看总结
                      </button>
                    ) : !session.isActive ? (
                      <button
                        onClick={(e) => handleGenerateSummary(e, session)}
                        disabled={isSummarizing}
                        className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {isSummarizing ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            生成中...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            生成总结
                          </>
                        )}
                      </button>
                    ) : null}

                    <button
                      onClick={(e) => handleContinueDiscussion(e, session)}
                      className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      继续讨论
                    </button>

                    {/* Select mode toggle */}
                    {session.messages.length > 0 && (
                      <button
                        onClick={(e) => handleToggleSelectMode(e, session.id)}
                        className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-xl transition-colors ${
                          selectModeSessionId === session.id
                            ? 'text-amber-700 bg-amber-100 hover:bg-amber-200'
                            : 'text-amber-600 bg-amber-50 hover:bg-amber-100'
                        }`}
                      >
                        <CheckSquare className="w-3.5 h-3.5" />
                        {selectModeSessionId === session.id ? '取消选择' : '选择导入'}
                      </button>
                    )}
                  </div>

                  {/* Select mode message list */}
                  {selectModeSessionId === session.id && (
                    <div className="mt-4 pt-4 border-t border-amber-200 bg-amber-50/50 -mx-4 px-4 -mb-5 pb-5 rounded-b-2xl">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium text-amber-700">
                          已选择 {selectedMessageIds.size} / {session.messages.length} 条消息
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectAllMessages(session);
                            }}
                            className="text-xs text-amber-600 hover:text-amber-700 font-medium"
                          >
                            {selectedMessageIds.size === session.messages.length ? '取消全选' : '全选'}
                          </button>
                          {selectedMessageIds.size > 0 && (
                            <button
                              onClick={(e) => handleImportSelectedMessages(e, session)}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" />
                              导入选中
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="max-h-48 overflow-y-auto space-y-2">
                        {session.messages.slice(0, 20).map((msg) => (
                          <div
                            key={msg.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleMessageSelect(msg.id);
                            }}
                            className={`flex items-start gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                              selectedMessageIds.has(msg.id)
                                ? 'bg-amber-100 border border-amber-300'
                                : 'bg-white border border-gray-200 hover:border-amber-200'
                            }`}
                          >
                            {selectedMessageIds.has(msg.id) ? (
                              <CheckSquare className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            ) : (
                              <Square className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-medium text-gray-600 truncate">
                                  {msg.senderName}
                                </span>
                                <span className="text-[10px] text-gray-400">
                                  {new Date(msg.timestamp).toLocaleTimeString('zh-CN', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 truncate mt-0.5">{msg.content}</p>
                            </div>
                          </div>
                        ))}
                        {session.messages.length > 20 && (
                          <p className="text-[10px] text-gray-400 text-center py-1">
                            还有 {session.messages.length - 20} 条消息未显示...
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Modal */}
      {summaryModalSession && summaryModalSession.summary && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={() => setSummaryModalSession(null)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-lg max-h-[80vh] overflow-hidden shadow-2xl slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="gradient-bg-purple px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">聊天总结</h3>
                    <p className="text-purple-100/80 text-xs mt-0.5">
                      {summaryModalSession.alias || summaryModalSession.topic}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSummaryModalSession(null)}
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/15 hover:bg-white/25 transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[60vh] space-y-5">
              {/* Important info */}
              {summaryModalSession.summary.important.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 bg-rose-400 rounded-full" />
                    <span className="text-sm font-bold text-rose-600">重要信息</span>
                  </div>
                  <ul className="space-y-2">
                    {summaryModalSession.summary.important.map((item, i) => (
                      <li
                        key={i}
                        className="text-sm text-gray-700 bg-gradient-to-r from-rose-50 to-orange-50 px-4 py-3 rounded-xl border border-rose-100/60"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Secondary info */}
              {summaryModalSession.summary.secondary.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 bg-amber-400 rounded-full" />
                    <span className="text-sm font-bold text-amber-600">次要信息</span>
                  </div>
                  <ul className="space-y-2">
                    {summaryModalSession.summary.secondary.map((item, i) => (
                      <li
                        key={i}
                        className="text-sm text-gray-600 bg-gradient-to-r from-amber-50 to-yellow-50 px-4 py-3 rounded-xl border border-amber-100/60"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Generated at */}
              <div className="text-center text-xs text-gray-400 pt-2">
                生成于 {formatDate(summaryModalSession.summary.generatedAt)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
