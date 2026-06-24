import { useState } from 'react';
import { useStore } from '../store/useStore';
import {
  ArrowLeft,
  Save,
  LogOut,
  Calendar,
  MessageCircle,
  History,
  User,
} from 'lucide-react';

export default function Profile() {
  const { currentUser, updateUser, logout, sessions, setCurrentPage } = useStore();
  const [editingNickname, setEditingNickname] = useState(false);
  const [nickname, setNickname] = useState(currentUser?.nickname || '');

  if (!currentUser) return null;

  const totalSessions = sessions.length;
  const totalMessages = sessions.reduce(
    (sum, s) => sum + s.messages.length,
    0
  );

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleSaveNickname = () => {
    if (!nickname.trim()) return;
    updateUser({ ...currentUser, nickname: nickname.trim() });
    setEditingNickname(false);
  };

  const handleLogout = () => {
    logout();
    setCurrentPage('login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentPage('home')}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">个人资料</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* 用户信息卡片 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-start gap-6">
            {/* 头像 */}
            <div className="flex-shrink-0">
              <img
                src={currentUser.avatar}
                alt={currentUser.nickname}
                className="w-24 h-24 rounded-2xl bg-gray-100 object-cover"
              />
            </div>

            {/* 信息 */}
            <div className="flex-1 space-y-4">
              <div>
                <div className="text-sm text-gray-500 mb-1">昵称</div>
                {editingNickname ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveNickname();
                      }}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveNickname}
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-1"
                    >
                      <Save className="w-4 h-4" />
                      保存
                    </button>
                    <button
                      onClick={() => {
                        setEditingNickname(false);
                        setNickname(currentUser.nickname);
                      }}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
                    >
                      取消
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-semibold text-gray-900">
                      {currentUser.nickname}
                    </span>
                    <button
                      onClick={() => {
                        setEditingNickname(true);
                        setNickname(currentUser.nickname);
                      }}
                      className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      编辑
                    </button>
                  </div>
                )}
              </div>

              <div>
                <div className="text-sm text-gray-500 mb-1">用户名</div>
                <div className="flex items-center gap-2 text-gray-900">
                  <User className="w-4 h-4 text-gray-400" />
                  {currentUser.username}
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-500 mb-1">注册时间</div>
                <div className="flex items-center gap-2 text-gray-900">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {formatDate(currentUser.createdAt)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                <History className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-sm text-gray-500">总会话数</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{totalSessions}</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm text-gray-500">总消息数</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{totalMessages}</div>
          </div>
        </div>

        {/* 退出登录 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <button
            onClick={handleLogout}
            className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            退出登录
          </button>
        </div>
      </div>
    </div>
  );
}
