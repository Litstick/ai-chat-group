import { useState } from 'react';
import { useStore } from '../store/useStore';
import { apiLogin, apiRegister } from '../api/client';
import { LogIn, UserPlus, MessageCircle, AlertCircle } from 'lucide-react';

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
            {activeTab === 'login' ? (
              /* 登录表单 */
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    用户名
                  </label>
                  <input
                    type="text"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, handleLogin)}
                    placeholder="请输入用户名"
                    className="input-modern"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    密码
                  </label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, handleLogin)}
                    placeholder="请输入密码"
                    className="input-modern"
                  />
                </div>
                {loginError && (
                  <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50/80 backdrop-blur-sm px-4 py-3 rounded-xl">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {loginError}
                  </div>
                )}
                <button
                  onClick={handleLogin}
                  className="btn-primary w-full py-3.5 flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  登录
                </button>
              </div>
            ) : (
              /* 注册表单 */
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    用户名
                  </label>
                  <input
                    type="text"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="请输入用户名"
                    className="input-modern"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    密码
                  </label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="请输入密码（至少 6 位）"
                    className="input-modern"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    确认密码
                  </label>
                  <input
                    type="password"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, handleRegister)}
                    placeholder="请再次输入密码"
                    className="input-modern"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    昵称 <span className="text-gray-400">（选填）</span>
                  </label>
                  <input
                    type="text"
                    value={regNickname}
                    onChange={(e) => setRegNickname(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, handleRegister)}
                    placeholder="请输入昵称"
                    className="input-modern"
                  />
                </div>
                {regError && (
                  <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50/80 backdrop-blur-sm px-4 py-3 rounded-xl">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {regError}
                  </div>
                )}
                <button
                  onClick={handleRegister}
                  className="btn-primary w-full py-3.5 flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  注册
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
