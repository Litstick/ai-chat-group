import { useState } from 'react';
import { useStore } from '../store/useStore';
import { userStorage } from '../utils/storage';
import { LogIn, UserPlus, MessageCircle } from 'lucide-react';

export default function Login() {
  const { login, setCurrentPage } = useStore();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // 登录表单
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // 注册表单
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regNickname, setRegNickname] = useState('');
  const [regError, setRegError] = useState('');

  const handleLogin = () => {
    setLoginError('');
    if (!loginUsername.trim() || !loginPassword.trim()) {
      setLoginError('请输入用户名和密码');
      return;
    }
    const result = userStorage.login(loginUsername.trim(), loginPassword);
    if (typeof result === 'string') {
      setLoginError(result);
      return;
    }
    login(result);
    setCurrentPage('home');
  };

  const handleRegister = () => {
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
    const result = userStorage.register(
      regUsername.trim(),
      regPassword,
      regNickname.trim()
    );
    if (typeof result === 'string') {
      setRegError(result);
      return;
    }
    login(result);
    setCurrentPage('home');
  };

  const handleKeyDown = (e: React.KeyboardEvent, handler: () => void) => {
    if (e.key === 'Enter') handler();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">AI 聊天群</h1>
          <p className="text-gray-500 mt-1">与多个 AI 一起协作讨论</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                activeTab === 'login'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <LogIn className="w-4 h-4" />
              登录
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                activeTab === 'register'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              注册
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'login' ? (
              /* 登录表单 */
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    用户名
                  </label>
                  <input
                    type="text"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, handleLogin)}
                    placeholder="请输入用户名"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    密码
                  </label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, handleLogin)}
                    placeholder="请输入密码"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                {loginError && (
                  <div className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-lg">
                    {loginError}
                  </div>
                )}
                <button
                  onClick={handleLogin}
                  className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  登录
                </button>
              </div>
            ) : (
              /* 注册表单 */
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    用户名
                  </label>
                  <input
                    type="text"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="请输入用户名"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    密码
                  </label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="请输入密码（至少 6 位）"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    确认密码
                  </label>
                  <input
                    type="password"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, handleRegister)}
                    placeholder="请再次输入密码"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    昵称 <span className="text-gray-400">（选填）</span>
                  </label>
                  <input
                    type="text"
                    value={regNickname}
                    onChange={(e) => setRegNickname(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, handleRegister)}
                    placeholder="请输入昵称"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                {regError && (
                  <div className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-lg">
                    {regError}
                  </div>
                )}
                <button
                  onClick={handleRegister}
                  className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
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
