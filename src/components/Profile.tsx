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
  Edit3,
  X,
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
    <div className="min-h-screen" style={{ backgroundColor: '#f0f2f5' }}>
      {/* 顶部渐变头部 + 导航 */}
      <div className="gradient-bg relative">
        <div className="max-w-4xl mx-auto px-4 pt-4 pb-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentPage('home')}
              className="p-2.5 hover:bg-white/15 rounded-2xl transition-all duration-300 backdrop-blur-sm"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-xl font-bold text-white">个人资料</h1>
          </div>
        </div>
      </div>

      {/* 主内容区域 - 上移覆盖渐变头部底部 */}
      <div className="max-w-4xl mx-auto px-4 -mt-16 space-y-6 pb-8">
        {/* 用户信息卡片 - 头像突出显示 */}
        <div className="section-card rounded-3xl p-8 slide-up">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* 头像 - 悬浮在卡片上方 */}
            <div className="flex-shrink-0 -mt-20 sm:-mt-16">
              <div className="w-28 h-28 rounded-3xl overflow-hidden ring-4 ring-white shadow-xl shadow-gray-200/50">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.nickname}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* 信息区域 */}
            <div className="flex-1 space-y-5 w-full sm:w-auto text-center sm:text-left">
              {/* 昵称 */}
              <div>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">昵称</div>
                {editingNickname ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveNickname();
                      }}
                      className="input-modern"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveNickname}
                      className="btn-primary px-5 py-2.5 flex items-center gap-1.5"
                    >
                      <Save className="w-4 h-4" />
                      保存
                    </button>
                    <button
                      onClick={() => {
                        setEditingNickname(false);
                        setNickname(currentUser.nickname);
                      }}
                      className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-xl transition-all duration-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 justify-center sm:justify-start">
                    <span className="text-2xl font-bold text-gray-900">
                      {currentUser.nickname}
                    </span>
                    <button
                      onClick={() => {
                        setEditingNickname(true);
                        setNickname(currentUser.nickname);
                      }}
                      className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all duration-300"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* 用户名 & 注册时间 - 双栏布局 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-2xl p-4">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">用户名</div>
                  <div className="flex items-center gap-2 text-gray-900 font-medium justify-center sm:justify-start">
                    <User className="w-4 h-4 text-gray-400" />
                    {currentUser.username}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">注册时间</div>
                  <div className="flex items-center gap-2 text-gray-900 font-medium justify-center sm:justify-start">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {formatDate(currentUser.createdAt)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 gap-5">
          <div className="section-card rounded-3xl p-6 slide-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 gradient-bg-purple rounded-2xl flex items-center justify-center shadow-md shadow-purple-500/20">
                <History className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-500">总会话数</span>
            </div>
            <div className="text-4xl font-extrabold text-gray-900">{totalSessions}</div>
            <div className="mt-2 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full gradient-bg-purple rounded-full transition-all duration-500"
                style={{ width: `${Math.min(totalSessions * 10, 100)}%` }}
              />
            </div>
          </div>
          <div className="section-card rounded-3xl p-6 slide-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 gradient-bg-blue rounded-2xl flex items-center justify-center shadow-md shadow-blue-500/20">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-500">总消息数</span>
            </div>
            <div className="text-4xl font-extrabold text-gray-900">{totalMessages}</div>
            <div className="mt-2 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full gradient-bg-blue rounded-full transition-all duration-500"
                style={{ width: `${Math.min(totalMessages * 2, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* 退出登录 */}
        <div className="section-card rounded-3xl p-6 slide-up">
          <button
            onClick={handleLogout}
            className="w-full py-3.5 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-2xl font-semibold hover:from-red-600 hover:to-rose-600 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-red-500/25 hover:shadow-red-500/40"
          >
            <LogOut className="w-5 h-5" />
            退出登录
          </button>
        </div>
      </div>
    </div>
  );
}
