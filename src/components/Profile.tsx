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
  Phone,
  Camera,
} from 'lucide-react';

export default function Profile() {
  const { currentUser, updateUser, logout, sessions, setCurrentPage } = useStore();
  const [editingNickname, setEditingNickname] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [nickname, setNickname] = useState(currentUser?.nickname || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');

  if (!currentUser) return null;

  const totalSessions = sessions.length;
  const totalMessages = sessions.reduce(
    (sum, s) => sum + (s.messageCount ?? s.messages.length),
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

  const handleSavePhone = () => {
    if (phone.trim() && !/^1[3-9]\d{9}$/.test(phone.trim())) {
      alert('请输入正确的手机号码');
      return;
    }
    updateUser({ ...currentUser, phone: phone.trim() || undefined });
    setEditingPhone(false);
  };

  const handleLogout = () => {
    logout();
    setCurrentPage('login');
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f0f2f5' }}>
      {/* 顶部渐变头部 */}
      <div className="gradient-bg">
        <div className="max-w-4xl mx-auto px-4 pt-4 pb-6">
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

      {/* 主内容区域 */}
      <div className="max-w-4xl mx-auto px-4 -mt-2 space-y-5 pb-8">
        {/* 用户信息卡片 */}
        <div className="section-card rounded-3xl overflow-hidden slide-up">
          {/* 头像区域 - 独立的头部 */}
          <div className="relative bg-gradient-to-br from-blue-50 to-purple-50 pt-8 pb-10">
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="w-28 h-28 rounded-3xl overflow-hidden ring-4 ring-white shadow-xl shadow-gray-200/50 bg-white">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.nickname}
                    className="w-full h-full object-cover"
                  />
                </div>
                <button className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-blue-600 transition-colors">
                  <Camera className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* 信息区域 */}
          <div className="px-6 pb-6 -mt-4 relative">
            <div className="space-y-5">
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
                      className="input-modern flex-1"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveNickname}
                      className="btn-primary px-4 py-2 flex items-center gap-1.5 text-sm"
                    >
                      <Save className="w-4 h-4" />
                      保存
                    </button>
                    <button
                      onClick={() => {
                        setEditingNickname(false);
                        setNickname(currentUser.nickname);
                      }}
                      className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-xl transition-all duration-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-bold text-gray-900">
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

              {/* 手机号 */}
              <div>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">手机号</div>
                {editingPhone ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSavePhone();
                      }}
                      placeholder="请输入手机号"
                      className="input-modern flex-1"
                      autoFocus
                    />
                    <button
                      onClick={handleSavePhone}
                      className="btn-primary px-4 py-2 flex items-center gap-1.5 text-sm"
                    >
                      <Save className="w-4 h-4" />
                      保存
                    </button>
                    <button
                      onClick={() => {
                        setEditingPhone(false);
                        setPhone(currentUser.phone || '');
                      }}
                      className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-xl transition-all duration-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-base font-medium text-gray-700">
                      {currentUser.phone || '未设置'}
                    </span>
                    <button
                      onClick={() => {
                        setEditingPhone(true);
                        setPhone(currentUser.phone || '');
                      }}
                      className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all duration-300"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* 用户名 & 注册时间 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-2xl p-4">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">用户名</div>
                  <div className="flex items-center gap-2 text-gray-900 font-medium text-sm">
                    <User className="w-4 h-4 text-gray-400" />
                    {currentUser.username}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">注册时间</div>
                  <div className="flex items-center gap-2 text-gray-900 font-medium text-sm">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {formatDate(currentUser.createdAt)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="section-card rounded-3xl p-5 slide-up">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 gradient-bg-purple rounded-2xl flex items-center justify-center shadow-md shadow-purple-500/20">
                <History className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-500">总会话数</span>
            </div>
            <div className="text-3xl font-extrabold text-gray-900">{totalSessions}</div>
            <div className="mt-2 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full gradient-bg-purple rounded-full transition-all duration-500"
                style={{ width: `${Math.min(totalSessions * 10, 100)}%` }}
              />
            </div>
          </div>
          <div className="section-card rounded-3xl p-5 slide-up">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 gradient-bg-blue rounded-2xl flex items-center justify-center shadow-md shadow-blue-500/20">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-500">总消息数</span>
            </div>
            <div className="text-3xl font-extrabold text-gray-900">{totalMessages}</div>
            <div className="mt-2 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full gradient-bg-blue rounded-full transition-all duration-500"
                style={{ width: `${Math.min(totalMessages * 2, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* 退出登录 */}
        <div className="section-card rounded-3xl p-5 slide-up">
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
