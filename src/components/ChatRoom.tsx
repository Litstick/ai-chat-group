import { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import type { ChatMessage } from '../types';
import {
  Send,
  Square,
  FileText,
  ArrowLeft,
  Image,
  Mic,
  Video,
  Smile,
  Sparkles,
  User,
} from 'lucide-react';

const AI_RESPONSES = [
  '这个想法很有意思，我认为可以从用户体验的角度再优化一下。',
  '从数据角度来看，这个方案的可行性很高，建议先做一个小范围的测试。',
  '技术上实现没有问题，但需要考虑性能和扩展性。',
  '我同意前面的观点，另外补充一点关于安全性的考虑。',
  '这个需求很清晰，我可以帮忙整理一份详细的需求文档。',
  '从设计角度来说，建议采用更简洁的交互方式。',
  '我们可以用敏捷开发的方式，分阶段实现这个功能。',
  '让我搜索一下相关的最佳实践和案例。',
  '数据分析显示，用户对这个功能的接受度应该会很高。',
  '我建议我们先定义好核心指标，然后再开始开发。',
];

export default function ChatRoom() {
  const {
    currentSession,
    addMessage,
    endSession,
    generateSummary,
    setCurrentPage,
    settings,
    isInActiveHours,
  } = useStore();

  const [input, setInput] = useState('');
  const [showSummary, setShowSummary] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentSession?.messages]);

  useEffect(() => {
    if (currentSession?.isActive && isInActiveHours()) {
      startAIChat();
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [currentSession?.id]);

  const startAIChat = () => {
    if (!currentSession) return;
    // AI 自动发言间隔
    intervalRef.current = setInterval(() => {
      if (!isInActiveHours()) return;
      const activeAgents = currentSession.participants;
      if (activeAgents.length === 0) return;

      const agent = activeAgents[Math.floor(Math.random() * activeAgents.length)];
      const response = AI_RESPONSES[Math.floor(Math.random() * AI_RESPONSES.length)];

      const message: ChatMessage = {
        id: `msg-${Date.now()}`,
        senderId: agent.id,
        senderName: agent.name,
        senderAvatar: agent.avatar,
        content: response,
        type: settings.aiCapabilities.emojiReply && Math.random() > 0.7 ? 'emoji' : 'text',
        timestamp: Date.now(),
        isAI: true,
      };

      addMessage(currentSession.id, message);
    }, 3000 + Math.random() * 4000);

    // 自动终止
    if (settings.chatDuration.enabled) {
      timeoutRef.current = setTimeout(() => {
        handleEndChat();
      }, settings.chatDuration.minutes * 60 * 1000);
    }
  };

  const handleSend = () => {
    if (!input.trim() || !currentSession) return;

    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: 'user',
      senderName: '我',
      senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user',
      content: input.trim(),
      type: 'text',
      timestamp: Date.now(),
      isAI: false,
    };

    addMessage(currentSession.id, message);
    setInput('');

    // 用户发言后，AI 更有可能回应
    setTimeout(() => {
      if (!currentSession.isActive || !isInActiveHours()) return;
      const activeAgents = currentSession.participants;
      const agent = activeAgents[Math.floor(Math.random() * activeAgents.length)];
      const response = AI_RESPONSES[Math.floor(Math.random() * AI_RESPONSES.length)];

      const aiMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        senderId: agent.id,
        senderName: agent.name,
        senderAvatar: agent.avatar,
        content: `回复 @我：${response}`,
        type: 'text',
        timestamp: Date.now(),
        isAI: true,
      };

      addMessage(currentSession.id, aiMessage);
    }, 1500);
  };

  const handleEndChat = () => {
    if (!currentSession) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    endSession(currentSession.id);
  };

  const handleSummarize = () => {
    if (!currentSession) return;
    generateSummary(currentSession.id);
    setShowSummary(true);
  };

  if (!currentSession) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">请先开始一个新的聊天</p>
          <button
            onClick={() => setCurrentPage('home')}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentPage('home')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="font-semibold text-gray-900">{currentSession.topic}</h1>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>{currentSession.participants.length} 个 AI 参与</span>
              {currentSession.isActive && (
                <span className="flex items-center gap-1 text-green-600">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  进行中
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {currentSession.isActive && (
            <>
              <button
                onClick={handleSummarize}
                className="px-3 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors flex items-center gap-1 text-sm font-medium"
              >
                <Sparkles className="w-4 h-4" />
                一键总结
              </button>
              <button
                onClick={handleEndChat}
                className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-1 text-sm font-medium"
              >
                <Square className="w-4 h-4" />
                终止聊天
              </button>
            </>
          )}
        </div>
      </div>

      {/* Participants */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-3 overflow-x-auto">
        <div className="flex items-center gap-2 text-sm text-gray-500 shrink-0">
          <User className="w-4 h-4" />
          参与者：
        </div>
        {currentSession.participants.map((agent) => (
          <div key={agent.id} className="flex items-center gap-1.5 shrink-0">
            <img src={agent.avatar} alt={agent.name} className="w-6 h-6 rounded-full" />
            <span className="text-sm text-gray-700">{agent.name}</span>
          </div>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {currentSession.messages.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-blue-500" />
            </div>
            <p className="text-gray-500">聊天已开始，AI 们正在准备中...</p>
          </div>
        )}

        {currentSession.messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.isAI ? '' : 'flex-row-reverse'}`}
          >
            <img
              src={msg.senderAvatar}
              alt={msg.senderName}
              className="w-10 h-10 rounded-full bg-gray-100 shrink-0"
            />
            <div className={`max-w-[70%] ${msg.isAI ? '' : 'items-end'}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-gray-700">{msg.senderName}</span>
                <span className="text-xs text-gray-400">{formatTime(msg.timestamp)}</span>
              </div>
              <div
                className={`px-4 py-2.5 rounded-2xl ${
                  msg.isAI
                    ? 'bg-white border border-gray-200 text-gray-800'
                    : 'bg-blue-600 text-white'
                }`}
              >
                {msg.type === 'emoji' ? (
                  <span className="text-2xl">{msg.content}</span>
                ) : (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Summary Modal */}
      {showSummary && currentSession.summary && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-600" />
                  聊天总结
                </h2>
                <button
                  onClick={() => setShowSummary(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <span className="text-gray-400">✕</span>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    重要信息
                  </h3>
                  <ul className="space-y-2">
                    {currentSession.summary.important.map((item, i) => (
                      <li key={i} className="text-sm text-gray-700 bg-red-50 p-3 rounded-lg">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                    次要信息
                  </h3>
                  <ul className="space-y-2">
                    {currentSession.summary.secondary.map((item, i) => (
                      <li key={i} className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      {currentSession.isActive && (
        <div className="bg-white border-t border-gray-200 px-4 py-3">
          <div className="flex items-center gap-2">
            {settings.aiCapabilities.imageUnderstanding && (
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <Image className="w-5 h-5" />
              </button>
            )}
            {settings.aiCapabilities.voiceReply && (
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <Mic className="w-5 h-5" />
              </button>
            )}
            {settings.aiCapabilities.videoShare && (
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <Video className="w-5 h-5" />
              </button>
            )}
            {settings.aiCapabilities.emojiReply && (
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <Smile className="w-5 h-5" />
              </button>
            )}
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="输入消息..."
              className="flex-1 px-4 py-2.5 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
