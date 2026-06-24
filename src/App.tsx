import { useStore } from './store/useStore';
import Home from './components/Home';
import Settings from './components/Settings';
import ChatRoom from './components/ChatRoom';
import AgentConfig from './components/AgentConfig';
import History from './components/History';

function App() {
  const { currentPage } = useStore();

  return (
    <div className="min-h-screen bg-gray-50">
      {currentPage === 'home' && <Home />}
      {currentPage === 'settings' && <Settings />}
      {currentPage === 'chat' && <ChatRoom />}
      {currentPage === 'agents' && <AgentConfig />}
      {currentPage === 'history' && <History />}
    </div>
  );
}

export default App;
