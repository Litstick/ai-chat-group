import { useEffect } from 'react';
import { useStore } from './store/useStore';
import Home from './components/Home';
import Settings from './components/Settings';
import ChatRoom from './components/ChatRoom';
import AgentConfig from './components/AgentConfig';
import History from './components/History';
import Login from './components/Login';
import Profile from './components/Profile';

function App() {
  const { currentPage, currentUser, initialized, initApp, settings } = useStore();

  useEffect(() => {
    initApp();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme || 'default');
  }, [settings.theme]);

  useEffect(() => {
    const layout = settings.uiLayout || 'standard';
    document.documentElement.setAttribute('data-layout', layout);
    document.body.className = `layout-${layout}`;
  }, [settings.uiLayout]);

  if (!initialized) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-medium">加载中...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) return <Login />;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {currentPage === 'home' && <Home />}
      {currentPage === 'settings' && <Settings />}
      {currentPage === 'chat' && <ChatRoom />}
      {currentPage === 'agents' && <AgentConfig />}
      {currentPage === 'history' && <History />}
      {currentPage === 'profile' && <Profile />}
    </div>
  );
}

export default App;
