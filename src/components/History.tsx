import { useState, type MouseEvent } from 'react';
import { useStore } from '../store/useStore';
import { ArrowLeft, MessageCircle, Users, Clock, Sparkles, ChevronRight } from 'lucide-react';

export default function History() {
  const { sessions, setCurrentPage, setCurrentSession, generateSummary } = useStore();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const handleContinue = (session: typeof sessions[0]) => {
    setCurrentSession(session);
    setCurrentPage('chat');
  };

  const handleSummarize = (e: MouseEvent, sessionId: string) => {
    e.stopPropagation();
    generateSummary(sessionId);
  };

  const toggleExpand = (e: MouseEvent, sessionId: string) => {
    e.stopPropagation();
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(sessionId)) {
        next.delete(sessionId);
      } else {
        next.add(sessionId);
      }
      return next;
    });
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

  const sortedSessions = sessions
    .slice()
    .sort((a, b) => b.startTime - a.startTime);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-gray-100">
      <div className="max-w-4xl mx-auto">
        {/* ── Header ── */}
        <div className="gradient-bg-blue">
          <div className="px-5 py-7 flex items-center gap-4">
            <button
              onClick={() => setCurrentPage('home')}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-sm transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-wide">历史记录</h1>
              <p className="text-blue-100/80 mt-1 text-sm">共 {sessions.length} 个会话</p>
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

          {/* Session cards */}
          {sortedSessions.map((session, index) => {
            const isExpanded = expandedIds.has(session.id);
            return (
              <div
                key={session.id}
                onClick={() => handleContinue(session)}
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
                  {/* Top row: topic + status badge + action */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-[15px] truncate">
                        {session.topic}
                      </h3>
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

                    <div className="flex items-center gap-1 shrink-0 ml-3">
                      {!session.summary && !session.isActive && (
                        <button
                          onClick={(e) => handleSummarize(e, session.id)}
                          className="w-9 h-9 flex items-center justify-center rounded-xl text-purple-500 hover:bg-purple-50 transition-colors"
                          title="生成总结"
                        >
                          <Sparkles className="w-4.5 h-4.5" />
                        </button>
                      )}
                      <ChevronRight className="w-4 h-4 text-gray-300" />
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
                      <span>{session.messages.length} 条消息</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{formatDuration(session.startTime, session.endTime)}</span>
                    </span>
                    <span className="text-gray-300">|</span>
                    <span>{formatDate(session.startTime)}</span>
                  </div>

                  {/* Summary section */}
                  {session.summary && (
                    <div className="mt-4">
                      {/* Collapsible toggle */}
                      <button
                        onClick={(e) => toggleExpand(e, session.id)}
                        className="flex items-center gap-2 text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors group"
                      >
                        <Sparkles className="w-4 h-4 text-purple-500" />
                        <span>聊天总结</span>
                        <ChevronRight
                          className={`w-3.5 h-3.5 text-purple-400 transition-transform duration-200 ${
                            isExpanded ? 'rotate-90' : ''
                          }`}
                        />
                      </button>

                      {isExpanded && (
                        <div className="mt-3 space-y-3 slide-up">
                          {/* Important info */}
                          {session.summary.important.length > 0 && (
                            <div>
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 mb-2">
                                <span className="w-1 h-1 bg-rose-400 rounded-full" />
                                重要信息
                              </div>
                              <ul className="space-y-1.5">
                                {session.summary.important.map((item, i) => (
                                  <li
                                    key={i}
                                    className="text-sm text-gray-700 bg-gradient-to-r from-rose-50 to-orange-50 px-3.5 py-2.5 rounded-lg border border-rose-100/60"
                                  >
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Secondary info */}
                          {session.summary.secondary.length > 0 && (
                            <div>
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 mb-2">
                                <span className="w-1 h-1 bg-amber-400 rounded-full" />
                                次要信息
                              </div>
                              <ul className="space-y-1.5">
                                {session.summary.secondary.map((item, i) => (
                                  <li
                                    key={i}
                                    className="text-sm text-gray-600 bg-gradient-to-r from-amber-50 to-yellow-50 px-3.5 py-2.5 rounded-lg border border-amber-100/60"
                                  >
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
