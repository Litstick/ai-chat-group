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
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI 聊天群</h1>
              <p className="text-gray-500 mt-1">与多个 AI 一起协作讨论</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentPage('profile')}
                className="flex items-center gap-2 p-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                <img
                  src={currentUser?.avatar}
                  alt=""
                  className="w-6 h-6 rounded-full"
                />
                <span className="text-sm text-gray-700 max-w-[80px] truncate">{currentUser?.nickname}</span>
              </button>
              <button
                onClick={() => setCurrentPage('settings')}
                className="p-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => setShowNewChat(true)}
            className="bg-blue-600 text-white p-4 rounded-2xl hover:bg-blue-700 transition-colors text-left"
          >
            <Plus className="w-6 h-6 mb-2" />
            <div className="font-semibold">新建聊天</div>
            <div className="text-sm text-blue-200">开始新话题</div>
          </button>
          <button
            onClick={() => setCurrentPage('agents')}
            className="bg-white border border-gray-200 p-4 rounded-2xl hover:border-blue-300 transition-colors text-left"
          >
            <Users className="w-6 h-6 mb-2 text-green-600" />
            <div className="font-semibold text-gray-900">AI 配置</div>
            <div className="text-sm text-gray-500">
              {activeAgents.length} 个 AI 已激活
            </div>
          </button>
          <button
            onClick={() => setCurrentPage('history')}
            className="bg-white border border-gray-200 p-4 rounded-2xl hover:border-blue-300 transition-colors text-left"
          >
            <History className="w-6 h-6 mb-2 text-purple-600" />
            <div className="font-semibold text-gray-900">历史记录</div>
            <div className="text-sm text-gray-500">
              {sessions.length} 个会话
            </div>
          </button>
          <button
            onClick={() => setCurrentPage('settings')}
            className="bg-white border border-gray-200 p-4 rounded-2xl hover:border-blue-300 transition-colors text-left"
          >
            <Settings className="w-6 h-6 mb-2 text-orange-600" />
            <div className="font-semibold text-gray-900">设置</div>
            <div className="text-sm text-gray-500">群聊参数</div>
          </button>
        </div>

        {/* New Chat Modal */}
        {showNewChat && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
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
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Users className="w-4 h-4" />
                将邀请 {activeAgents.length} 个 AI 参与：
                {activeAgents.map((a) => a.name).join('、')}
              </div>
              {settings.chatDuration.enabled && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  聊天将在 {settings.chatDuration.minutes} 分钟后自动终止
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={handleStartChat}
                  disabled={!topic.trim()}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  开始聊天
                </button>
                <button
                  onClick={() => setShowNewChat(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Active Sessions */}
        {sessions.filter((s) => s.isActive).length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-green-600" />
              进行中的聊天
            </h2>
            <div className="space-y-3">
              {sessions
                .filter((s) => s.isActive)
                .map((session) => (
                  <div
                    key={session.id}
                    onClick={() => handleContinueChat(session)}
                    className="bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{session.topic}</h3>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {session.participants.length} 个 AI
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-4 h-4" />
                            {session.messages.length} 条消息
                          </span>
                          <span>{formatDate(session.startTime)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-green-600 text-sm">
                          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                          进行中
                        </span>
                        <ArrowRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Recent History */}
        {sessions.filter((s) => !s.isActive).length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <History className="w-5 h-5 text-purple-600" />
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
                    className="bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{session.topic}</h3>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {session.participants.length} 个 AI
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-4 h-4" />
                            {session.messages.length} 条消息
                          </span>
                          <span>{formatDate(session.startTime)}</span>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-400" />
                    </div>
                    {session.summary && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-1 text-sm text-purple-600">
                          <Sparkles className="w-4 h-4" />
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
                className="w-full mt-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                查看全部历史
              </button>
            )}
          </div>
        )}

        {/* Empty State */}
        {sessions.length === 0 && !showNewChat && (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-10 h-10 text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">还没有聊天</h3>
            <p className="text-gray-500 mt-1">点击上方「新建聊天」开始你的第一个 AI 群聊</p>
          </div>
        )}
      </div>
    </div>
  );
}
