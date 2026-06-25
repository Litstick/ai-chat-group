import { useState } from 'react';
import { useStore } from '../store/useStore';
import { ChatSession } from '../types';
import {
  MessageCircle,
  Settings,
  Users,
  History,
  Plus,
  Clock,
  ArrowRight,
  Sparkles,
  UserCircle,
  LogOut,
} from 'lucide-react';

export default function Home() {
  const {
    agents,
    sessions,
    setCurrentPage,
    setCurrentSession,
    addSession,
    settings,
    currentUser,
    logout,
  } = useStore();

  const [topic, setTopic] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);

  const activeAgents = agents.filter((a) => a.isActive);

  const handleStartChat = () => {
    if (!topic.trim()) return;
    if (!currentUser) return;
    if (activeAgents.length < 2) {
      alert('请至少选择 2 个 AI 参与群聊');
      setCurrentPage('agents');
      return;
    }

    const session: ChatSession = {
      id: `session-${Date.now()}`,
      userId: currentUser.id,
      topic: topic.trim(),
      startTime: Date.now(),
      messages: [],
      participants: activeAgents,
      isActive: true,
    };

    addSession(session);
    setTopic('');
    setShowNewChat(false);
    setCurrentPage('chat');
  };

  const handleContinueChat = (session: ChatSession) => {
    setCurrentSession(session);
    setCurrentPage('chat');
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - gradient-bg-blue with white text, user avatar circle, settings gear */}
      <div className="gradient-bg-blue">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">AI 聊天群</h1>
              <p className="text-blue-100 mt-1 text-sm">与多个 AI 一起协作讨论</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentPage('profile')}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/20 rounded-full hover:bg-white/30 transition-all"
              >
                <img
                  src={currentUser?.avatar}
                  alt=""
                  className="w-7 h-7 rounded-full ring-2 ring-white/50"
                />
                <span className="text-sm text-white max-w-[80px] truncate font-medium">{currentUser?.nickname}</span>
              </button>
              <button
                onClick={() => setCurrentPage('settings')}
                className="p-2.5 bg-white/20 rounded-full hover:bg-white/30 transition-all"
              >
                <Settings className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Quick Actions - bigger cards with gradient icon circles, hover lift */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => setShowNewChat(true)}
            className="section-card p-5 text-left hover:shadow-lg hover:-translate-y-0.5 transition-all group"
          >
            <div className="gradient-bg-blue w-12 h-12 rounded-2xl flex items-center justify-center mb-3 shadow-md">
              <Plus className="w-6 h-6 text-white" />
            </div>
            <div className="font-semibold text-gray-900">新建聊天</div>
            <div className="text-sm text-gray-400 mt-0.5">开始新话题</div>
          </button>
          <button
            onClick={() => setCurrentPage('agents')}
            className="section-card p-5 text-left hover:shadow-lg hover:-translate-y-0.5 transition-all group"
          >
            <div className="gradient-bg-green w-12 h-12 rounded-2xl flex items-center justify-center mb-3 shadow-md">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="font-semibold text-gray-900">AI 配置</div>
            <div className="text-sm text-gray-400 mt-0.5">
              {activeAgents.length} 个 AI 已激活
            </div>
          </button>
          <button
            onClick={() => setCurrentPage('history')}
            className="section-card p-5 text-left hover:shadow-lg hover:-translate-y-0.5 transition-all group"
          >
            <div className="gradient-bg-purple w-12 h-12 rounded-2xl flex items-center justify-center mb-3 shadow-md">
              <History className="w-6 h-6 text-white" />
            </div>
            <div className="font-semibold text-gray-900">历史记录</div>
            <div className="text-sm text-gray-400 mt-0.5">
              {sessions.length} 个会话
            </div>
          </button>
          <button
            onClick={() => setCurrentPage('settings')}
            className="section-card p-5 text-left hover:shadow-lg hover:-translate-y-0.5 transition-all group"
          >
            <div className="gradient-bg-orange w-12 h-12 rounded-2xl flex items-center justify-center mb-3 shadow-md">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div className="font-semibold text-gray-900">设置</div>
            <div className="text-sm text-gray-400 mt-0.5">群聊参数</div>
          </button>
        </div>

        {/* New Chat Modal - slide-up animation, input-modern, avatar chips, btn-primary */}
        {showNewChat && (
          <div className="glass-card rounded-2xl p-6 slide-up">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <div className="gradient-bg-purple w-8 h-8 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              新建群聊
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  核心话题
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="例如：开发一款任务管理软件、调研 AI 市场分析报告..."
                  className="input-modern w-full px-4 py-3 text-sm"
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Users className="w-4 h-4" />
                将邀请 {activeAgents.length} 个 AI 参与：
              </div>
              {/* Participant avatar chips */}
              <div className="flex flex-wrap gap-2">
                {activeAgents.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-full"
                  >
                    <img src={a.avatar} alt={a.name} className="w-5 h-5 rounded-full" />
                    <span className="text-sm text-blue-700 font-medium">{a.name}</span>
                  </div>
                ))}
              </div>
              {settings.chatDuration.enabled && (
                <div className="flex items-center gap-2 text-sm text-gray-500 bg-orange-50 px-3 py-2 rounded-xl">
                  <Clock className="w-4 h-4 text-orange-500" />
                  聊天将在 {settings.chatDuration.minutes} 分钟后自动终止
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={handleStartChat}
                  disabled={!topic.trim()}
                  className="btn-primary flex-1 py-3 text-sm"
                >
                  开始聊天
                </button>
                <button
                  onClick={() => setShowNewChat(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all text-sm"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Active Sessions - section-card with left accent border, participant avatars */}
        {sessions.filter((s) => s.isActive).length > 0 && (
          <div className="fade-in">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <div className="gradient-bg-green w-7 h-7 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-white" />
              </div>
              进行中的聊天
            </h2>
            <div className="space-y-3">
              {sessions
                .filter((s) => s.isActive)
                .map((session) => (
                  <div
                    key={session.id}
                    onClick={() => handleContinueChat(session)}
                    className="section-card border-l-4 border-blue-500 p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{session.topic}</h3>
                        {/* Participant avatars in a row */}
                        <div className="flex items-center gap-1 mt-2">
                          {session.participants.slice(0, 5).map((p, idx) => (
                            <img
                              key={p.id}
                              src={p.avatar}
                              alt={p.name}
                              className="w-6 h-6 rounded-full ring-2 ring-white -ml-1 first:ml-0"
                              style={{ zIndex: 5 - idx }}
                            />
                          ))}
                          {session.participants.length > 5 && (
                            <span className="text-xs text-gray-400 ml-1">+{session.participants.length - 5}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-3.5 h-3.5" />
                            {session.messages.length} 条消息
                          </span>
                          <span>{formatDate(session.startTime)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-green-600 text-xs font-medium bg-green-50 px-2 py-1 rounded-full">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full pulse-dot"></span>
                          进行中
                        </span>
                        <ArrowRight className="w-5 h-5 text-gray-300" />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Recent History - section-card with left accent border, cleaner meta */}
        {sessions.filter((s) => !s.isActive).length > 0 && (
          <div className="fade-in">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <div className="gradient-bg-purple w-7 h-7 rounded-lg flex items-center justify-center">
                <History className="w-4 h-4 text-white" />
              </div>
              最近历史
            </h2>
            <div className="space-y-3">
              {sessions
                .filter((s) => !s.isActive)
                .slice(0, 5)
                .map((session) => (
                  <div
                    key={session.id}
                    onClick={() => handleContinueChat(session)}
                    className="section-card border-l-4 border-purple-400 p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{session.topic}</h3>
                        {/* Participant avatars in a row */}
                        <div className="flex items-center gap-1 mt-2">
                          {session.participants.slice(0, 5).map((p, idx) => (
                            <img
                              key={p.id}
                              src={p.avatar}
                              alt={p.name}
                              className="w-6 h-6 rounded-full ring-2 ring-white -ml-1 first:ml-0"
                              style={{ zIndex: 5 - idx }}
                            />
                          ))}
                          {session.participants.length > 5 && (
                            <span className="text-xs text-gray-400 ml-1">+{session.participants.length - 5}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-3.5 h-3.5" />
                            {session.messages.length} 条消息
                          </span>
                          <span>{formatDate(session.startTime)}</span>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-300" />
                    </div>
                    {session.summary && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-1 text-sm text-purple-600 bg-purple-50 px-2 py-1 rounded-full w-fit">
                          <Sparkles className="w-3.5 h-3.5" />
                          已生成总结
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </div>
            {sessions.filter((s) => !s.isActive).length > 5 && (
              <button
                onClick={() => setCurrentPage('history')}
                className="w-full mt-3 py-2.5 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all font-medium"
              >
                查看全部历史
              </button>
            )}
          </div>
        )}

        {/* Empty State - bigger illustration area with gradient icon, warmer text */}
        {sessions.length === 0 && !showNewChat && (
          <div className="text-center py-16 fade-in">
            <div className="w-24 h-24 gradient-bg-blue rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <MessageCircle className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">还没有聊天</h3>
            <p className="text-gray-500 mt-2 max-w-sm mx-auto leading-relaxed">
              点击上方「新建聊天」开始你的第一个 AI 群聊，让多个 AI 为你出谋划策
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
