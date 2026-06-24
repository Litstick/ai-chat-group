import type { MouseEvent } from 'react';
import { useStore } from '../store/useStore';
import { ArrowLeft, MessageCircle, Users, Clock, Sparkles } from 'lucide-react';

export default function History() {
  const { sessions, setCurrentPage, setCurrentSession, generateSummary } = useStore();

  const handleContinue = (session: typeof sessions[0]) => {
    setCurrentSession(session);
    setCurrentPage('chat');
  };

  const handleSummarize = (e: MouseEvent, sessionId: string) => {
    e.stopPropagation();
    generateSummary(sessionId);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white border-b border-gray-200">
          <div className="px-4 py-6 flex items-center gap-3">
            <button
              onClick={() => setCurrentPage('home')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">历史记录</h1>
              <p className="text-gray-500 mt-1">共 {sessions.length} 个会话</p>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {sessions.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500">暂无历史记录</p>
            </div>
          )}

          {sessions
            .slice()
            .sort((a, b) => b.startTime - a.startTime)
            .map((session) => (
              <div
                key={session.id}
                onClick={() => handleContinue(session)}
                className="bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{session.topic}</h3>
                      {session.isActive ? (
                        <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                          进行中
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                          已结束
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {session.participants.length} 个 AI
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-4 h-4" />
                        {session.messages.length} 条消息
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatDuration(session.startTime, session.endTime)}
                      </span>
                    </div>

                    <div className="text-sm text-gray-400 mt-2">
                      {formatDate(session.startTime)}
                    </div>

                    {session.summary && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-2 text-sm text-purple-600 mb-2">
                          <Sparkles className="w-4 h-4" />
                          聊天总结
                        </div>
                        <div className="space-y-2">
                          {session.summary.important.length > 0 && (
                            <div>
                              <div className="text-xs font-medium text-gray-500 mb-1">重要信息</div>
                              <ul className="space-y-1">
                                {session.summary.important.map((item, i) => (
                                  <li key={i} className="text-sm text-gray-700 bg-red-50 p-2 rounded">
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {session.summary.secondary.length > 0 && (
                            <div>
                              <div className="text-xs font-medium text-gray-500 mb-1">次要信息</div>
                              <ul className="space-y-1">
                                {session.summary.secondary.map((item, i) => (
                                  <li key={i} className="text-sm text-gray-600 bg-yellow-50 p-2 rounded">
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    {!session.summary && !session.isActive && (
                      <button
                        onClick={(e) => handleSummarize(e, session.id)}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="生成总结"
                      >
                        <Sparkles className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
