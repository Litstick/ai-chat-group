import { useState } from 'react';
import { useStore } from '../store/useStore';
import { apiLogin, apiRegister } from '../api/client';
import { LogIn, UserPlus, MessageCircle, AlertCircle, User, Lock, X, Loader2 } from 'lucide-react';

export default function Login() {
  const { login, setCurrentPage } = useStore();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // 登录表单
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);

  // 注册表单
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regNickname, setRegNickname] = useState('');
  const [regError, setRegError] = useState('');

  const handleLogin = async () => {
    setLoginError('');
    if (!loginUsername.trim() || !loginPassword.trim()) {
      setLoginError('请输入用户名和密码');
      return;
    }
    setLoading(true);
    try {
      const result = await apiLogin(loginUsername.trim(), loginPassword);
      if (!result.success) {
        setLoginError(result.error || '登录失败');
        return;
      }
      if (result.user) {
        login(result.user);
        setCurrentPage('home');
      }
    } catch (err) {
      setLoginError('网络错误，请检查服务端是否启动');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setRegError('');
    if (!regUsername.trim() || !regPassword.trim()) {
      setRegError('请输入用户名和密码');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegError('两次输入的密码不一致');
      return;
    }
    if (regPassword.length < 6) {
      setRegError('密码长度不能少于 6 位');
      return;
    }
    setLoading(true);
    try {
      const result = await apiRegister(regUsername.trim(), regPassword, regNickname.trim());
      if (!result.success) {
        setRegError(result.error || '注册失败');
        return;
      }
      if (result.user) {
        login(result.user);
        setCurrentPage('home');
      }
    } catch (err) {
      setRegError('网络错误，请检查服务端是否启动');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, handler: () => void) => {
    if (e.key === 'Enter') handler();
  };

  // 统一输入框样式常量
  const inputBaseClass =
    'w-full pl-10 pr-4 py-3 bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400';

  const nicknameInputClass =
    'w-full pl-10 pr-4 py-3 bg-white/40 backdrop-blur-sm border border-dashed border-gray-200 rounded-xl text-sm text-gray-600 placeholder-gray-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300';

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md fade-in">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 gradient-bg-blue rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-blue-500/25">
            <MessageCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">AI 聊天群</h1>
          <p className="text-white/70 text-base">与多个 AI 一起协作讨论，开启智能对话新体验</p>
        </div>

        {/* Card */}
        <div className="glass-card rounded-3xl slide-up">
          {/* Tabs - 药丸风格 */}
          <div className="p-2">
            <div className="flex bg-gray-100/80 rounded-2xl p-1">
              <button
                onClick={() => setActiveTab('login')}
                className={`flex-1 py-3 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-all duration-300 ${
                  activeTab === 'login'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <LogIn className="w-4 h-4" />
                登录
              </button>
              <button
                onClick={() => setActiveTab('register')}
                className={`flex-1 py-3 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-all duration-300 ${
                  activeTab === 'register'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                注册
              </button>
            </div>
          </div>

          <div className="px-8 pb-8 pt-2">
            <div
              key={activeTab}
              className="animate-[fadeIn_0.3s_ease-in-out]"
              style={{
                animation: 'fadeIn 0.3s ease-in-out',
              }}
            >
              {activeTab === 'login' ? (
                /* 登录表单 */
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      用户名
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <input
                        type="text"
                        value={loginUsername}
                        onChange={(e) => setLoginUsername(e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, handleLogin)}
                        placeholder="请输入用户名"
                        className={inputBaseClass}
                        aria-label="用户名"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      密码
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <input
                        type="password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, handleLogin)}
                        placeholder="请输入密码"
                        className={inputBaseClass}
                        aria-label="密码"
                      />
                    </div>
                  </div>
                  {loginError && (
                    <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50/80 backdrop-blur-sm px-4 py-3 rounded-xl">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span className="flex-1">{loginError}</span>
                      <button
                        onClick={() => setLoginError('')}
                        className="ml-auto flex-shrink-0 p-0.5 rounded-full hover:bg-red-100/60 transition-colors"
                        aria-label="关闭错误提示"
                      >
                        <X className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                  )}
                  <button
                    onClick={handleLogin}
                    disabled={loading}
                    className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        登录中...
                      </>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4" />
                        登录
                      </>
                    )}
                  </button>

                  {/* Footer 提示 */}
                  <p className="text-center text-xs text-gray-400 pt-1">
                    首次使用？请先
                    <button
                      onClick={() => setActiveTab('register')}
                      className="text-blue-500 hover:text-blue-600 font-medium ml-1 transition-colors"
                    >
                      注册账号
                    </button>
                  </p>
                </div>
              ) : (
                /* 注册表单 */
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      用户名
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <input
                        type="text"
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value)}
                        placeholder="请输入用户名"
                        className={inputBaseClass}
                        aria-label="注册用户名"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      密码
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <input
                        type="password"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="请输入密码（至少 6 位）"
                        className={inputBaseClass}
                        aria-label="注册密码"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      确认密码
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <input
                        type="password"
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, handleRegister)}
                        placeholder="请再次输入密码"
                        className={inputBaseClass}
                        aria-label="确认密码"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-2">
                      昵称 <span className="text-gray-300">（选填）</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
                      <input
                        type="text"
                        value={regNickname}
                        onChange={(e) => setRegNickname(e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, handleRegister)}
                        placeholder="请输入昵称"
                        className={nicknameInputClass}
                        aria-label="昵称（选填）"
                      />
                    </div>
                  </div>
                  {regError && (
                    <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50/80 backdrop-blur-sm px-4 py-3 rounded-xl">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span className="flex-1">{regError}</span>
                      <button
                        onClick={() => setRegError('')}
                        className="ml-auto flex-shrink-0 p-0.5 rounded-full hover:bg-red-100/60 transition-colors"
                        aria-label="关闭错误提示"
                      >
                        <X className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                  )}
                  <button
                    onClick={handleRegister}
                    disabled={loading}
                    className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        注册中...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        注册
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* fadeIn keyframes */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
