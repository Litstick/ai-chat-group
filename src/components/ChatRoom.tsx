import { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store/useStore';
import type { ChatMessage, AIAgent, AIModel } from '../types';
import { callAI, callAIForSummary } from '../utils/aiService';
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
  Loader2,
  AlertCircle,
} from 'lucide-react';

export default function ChatRoom() {
  const {
    currentSession,
    addMessage,
    endSession,
    setCurrentPage,
    settings,
    isInActiveHours,
    agents,
  } = useStore();

  const [input, setInput] = useState('');
  const [showSummary, setShowSummary] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aiQueueRef = useRef<boolean>(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentSession?.messages]);

  const findModelForAgent = useCallback(
    (agent: AIAgent): AIModel | undefined => {
      return settings.models.find((m) => m.id === agent.model);
    },
    [settings.models]
  );

  const getApiKeyForProvider = useCallback(
    (provider: string): string => {
      const p = provider.toLowerCase();
      const map: Record<string, string> = {
        openai: 'openai',
        anthropic: 'anthropic',
        google: 'google',
        deepseek: 'deepseek',
        qwen: 'qwen',
        moonshot: 'moonshot',
        zhipu: 'zhipu',
        baidu: 'baidu',
      };
      const field = map[p];
      if (!field) return '';
      return (settings.apiKeys as Record<string, string>)[field] || '';
    },
    [settings.apiKeys]
  );

  const triggerAIDiscussion = useCallback(
    async (triggerMessage?: ChatMessage) => {
      if (!currentSession?.isActive || aiQueueRef.current) return;
      aiQueueRef.current = true;

      try {
        // 从 store 获取最新的 session（避免闭包过期）
        const latestSession = useStore.getState().currentSession || currentSession;
        if (!latestSession.isActive) return;

        // 随机选一个 AI 来发言
        const participants = latestSession.participants;
        const agent = participants[Math.floor(Math.random() * participants.length)];
        const model = findModelForAgent(agent);
        if (!model) {
          setError(`找不到 ${agent.name} 对应的模型配置`);
          return;
        }

        const apiKey = getApiKeyForProvider(model.provider);
        if (!apiKey) {
          setError(`${model.provider} 的 API Key 未配置，请在设置中添加`);
          return;
        }

        setIsLoading(true);
        setError(null);

        const response = await callAI(
          agent,
          model,
          settings.apiKeys,
          latestSession.topic,
          latestSession.messages,
          triggerMessage
        );

        if (!latestSession.isActive) return;

        const message: ChatMessage = {
          id: `msg-${Date.now()}`,
          senderId: agent.id,
          senderName: agent.name,
          senderAvatar: agent.avatar,
          content: response,
          type: 'text',
          timestamp: Date.now(),
          isAI: true,
        };

        addMessage(latestSession.id, message);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'AI 调用失败';
        setError(msg);
      } finally {
        setIsLoading(false);
        aiQueueRef.current = false;
      }
    },
    [currentSession, findModelForAgent, getApiKeyForProvider, settings.apiKeys, addMessage]
  );

  useEffect(() => {
    if (!currentSession?.isActive || !isInActiveHours()) return;

    // 首次进入时，触发第一个 AI 发言
    const initialTimer = setTimeout(() => {
      triggerAIDiscussion();
    }, 1500);

    // 定时触发 AI 讨论（每 8-15 秒）
    intervalRef.current = setInterval(() => {
      if (!isInActiveHours() || !currentSession.isActive) return;
      triggerAIDiscussion();
    }, 8000 + Math.random() * 7000);

    // 自动终止
    if (settings.chatDuration.enabled) {
      timeoutRef.current = setTimeout(() => {
        handleEndChat();
      }, settings.chatDuration.minutes * 60 * 1000);
    }

    return () => {
      clearTimeout(initialTimer);
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [currentSession?.id]);

  const handleSend = async () => {
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

    // 用户发言后，触发 AI 回应
    setTimeout(() => {
      triggerAIDiscussion(message);
    }, 1000);
  };

  const handleEndChat = () => {
    if (!currentSession) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    endSession(currentSession.id);
  };

  const handleSummarize = async () => {
    if (!currentSession) return;

    // 从已启用且有 API Key 的模型中选第一个，优先选默认模型
    const enabledModels = settings.models.filter((m) => m.isEnabled);
    let summaryModel = enabledModels.find((m) => m.isDefault);
    if (!summaryModel) summaryModel = enabledModels[0];

    if (!summaryModel) {
      setError('没有可用的模型来生成总结，请在设置中启用至少一个模型');
      return;
    }

    const apiKey = getApiKeyForProvider(summaryModel.provider);
    if (!apiKey) {
      setError(`${summaryModel.provider} 的 API Key 未配置，无法生成总结`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const summary = await callAIForSummary(
        summaryModel,
        settings.apiKeys,
        currentSession.topic,
        currentSession.messages
      );

      const sessions = useStore.getState().sessions;
      const updatedSessions = sessions.map((s) =>
        s.id === currentSession.id ? { ...s, summary } : s
      );
      const { updateSession } = useStore.getState();
      // 直接通过 store 更新
      useStore.setState({
        sessions: updatedSessions,
        currentSession: { ...currentSession, summary },
      });
      localStorage.setItem('ai_chat_sessions', JSON.stringify(updatedSessions));
      setShowSummary(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '总结生成失败';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentSession) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 gradient-bg rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <p className="text-gray-500">请先开始一个新的聊天</p>
          <button
            onClick={() => setCurrentPage('home')}
            className="mt-4 px-6 py-2.5 btn-primary text-sm"
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
      {/* Header - gradient-bg-blue with white text, glass-effect action buttons */}
      <div className="gradient-bg-blue px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentPage('home')}
            className="p-2 bg-white/20 rounded-xl hover:bg-white/30 transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="font-semibold text-white text-base">{currentSession.topic}</h1>
            <div className="flex items-center gap-2 text-xs text-blue-100">
              <span>{currentSession.participants.length} 个 AI 参与</span>
              {currentSession.isActive && (
                <span className="flex items-center gap-1 text-green-300">
                  <span className="w-1.5 h-1.5 bg-green-300 rounded-full pulse-dot"></span>
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
                disabled={isLoading}
                className="px-3 py-1.5 bg-white/20 text-white rounded-xl hover:bg-white/30 transition-all flex items-center gap-1.5 text-sm font-medium disabled:opacity-50 backdrop-blur-sm"
              >
                <Sparkles className="w-4 h-4" />
                一键总结
              </button>
              <button
                onClick={handleEndChat}
                className="px-3 py-1.5 bg-white/20 text-white rounded-xl hover:bg-white/30 transition-all flex items-center gap-1.5 text-sm font-medium backdrop-blur-sm"
              >
                <Square className="w-4 h-4" />
                终止聊天
              </button>
            </>
          )}
        </div>
      </div>

      {/* Participants - horizontal scroll with avatar+name chips */}
      <div className="bg-white border-b border-gray-100 px-4 py-2 flex items-center gap-2 overflow-x-auto scrollbar-hide">
        <div className="flex items-center gap-1.5 text-xs text-gray-400 shrink-0">
          <User className="w-3.5 h-3.5" />
          参与者
        </div>
        {currentSession.participants.map((agent) => {
          const model = findModelForAgent(agent);
          return (
            <div
              key={agent.id}
              className="flex items-center gap-1.5 shrink-0 px-2.5 py-1 bg-gray-50 rounded-full border border-gray-100"
            >
              <img src={agent.avatar} alt={agent.name} className="w-5 h-5 rounded-full" />
              <span className="text-xs text-gray-700 font-medium">{agent.name}</span>
              {model && (
                <span className="text-[10px] text-gray-400">{model.name}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Error Banner - glass effect with warm red */}
      {error && (
        <div className="bg-red-50/90 backdrop-blur-sm border-b border-red-200/50 px-4 py-2.5 flex items-center gap-2 fade-in">
          <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center shrink-0">
            <AlertCircle className="w-3.5 h-3.5 text-red-500" />
          </div>
          <span className="text-sm text-red-700 flex-1">{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-600 text-xs font-medium px-2 py-1 rounded-lg hover:bg-red-100 transition-all"
          >
            关闭
          </button>
        </div>
      )}

      {/* Loading Indicator - three bouncing dots animation */}
      {isLoading && (
        <div className="bg-blue-50/80 backdrop-blur-sm border-b border-blue-100 px-4 py-2.5 flex items-center gap-2 fade-in">
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
          </div>
          <span className="text-sm text-blue-600 font-medium">AI 正在思考中...</span>
        </div>
      )}

      {/* Messages - chat-bubble-ai / chat-bubble-user, AI role label badge */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {currentSession.messages.length === 0 && !isLoading && (
          <div className="text-center py-16 fade-in">
            <div className="w-20 h-20 gradient-bg rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <p className="text-gray-600 font-medium">聊天已开始，AI 们正在准备中...</p>
            <p className="text-sm text-gray-400 mt-2">请确保已在设置中配置 API Key</p>
          </div>
        )}

        {currentSession.messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 fade-in ${msg.isAI ? '' : 'flex-row-reverse'}`}
          >
            {msg.isAI && (
              <img
                src={msg.senderAvatar}
                alt={msg.senderName}
                className="w-11 h-11 rounded-full bg-gray-100 shrink-0 ring-2 ring-white shadow-sm"
              />
            )}
            <div className={`max-w-[70%] ${msg.isAI ? '' : 'items-end flex flex-col'}`}>
              <div className={`flex items-center gap-2 mb-1.5 ${msg.isAI ? '' : 'flex-row-reverse'}`}>
                {msg.isAI && (
                  <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    {msg.senderName}
                  </span>
                )}
                <span className="text-[10px] text-gray-400">{formatTime(msg.timestamp)}</span>
              </div>
              <div
                className={`px-4 py-3 ${
                  msg.isAI ? 'chat-bubble-ai' : 'chat-bubble-user'
                } shadow-sm`}
              >
                {msg.type === 'emoji' ? (
                  <span className="text-2xl">{msg.content}</span>
                ) : (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>
            </div>
            {!msg.isAI && (
              <img
                src={msg.senderAvatar}
                alt={msg.senderName}
                className="w-11 h-11 rounded-full bg-gray-100 shrink-0 ring-2 ring-white shadow-sm"
              />
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Summary Modal - glass-card with slide-up, gradient section headers */}
      {showSummary && currentSession.summary && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 fade-in">
          <div className="glass-card rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto slide-up">
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <div className="gradient-bg-purple w-8 h-8 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  聊天总结
                </h2>
                <button
                  onClick={() => setShowSummary(false)}
                  className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all"
                >
                  <span className="text-gray-500 text-sm">✕</span>
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                    <div className="gradient-bg-rose w-5 h-5 rounded-md flex items-center justify-center">
                      <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                    </div>
                    重要信息
                  </h3>
                  <ul className="space-y-2">
                    {currentSession.summary.important.map((item, i) => (
                      <li key={i} className="text-sm text-gray-700 bg-red-50/70 p-3 rounded-xl border border-red-100/50">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                    <div className="gradient-bg-orange w-5 h-5 rounded-md flex items-center justify-center">
                      <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                    </div>
                    次要信息
                  </h3>
                  <ul className="space-y-2">
                    {currentSession.summary.secondary.map((item, i) => (
                      <li key={i} className="text-sm text-gray-600 bg-yellow-50/70 p-3 rounded-xl border border-yellow-100/50">
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

      {/* Input - glass-card at bottom, input-modern, gradient send, media hover tooltip */}
      {currentSession.isActive && (
        <div className="glass-card border-t border-gray-200/50 px-4 py-3">
          <div className="flex items-center gap-2">
            {settings.aiCapabilities.imageUnderstanding && (
              <button className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all" title="发送图片">
                <Image className="w-5 h-5" />
              </button>
            )}
            {settings.aiCapabilities.voiceReply && (
              <button className="p-2 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-xl transition-all" title="语音输入">
                <Mic className="w-5 h-5" />
              </button>
            )}
            {settings.aiCapabilities.videoShare && (
              <button className="p-2 text-gray-400 hover:text-purple-500 hover:bg-purple-50 rounded-xl transition-all" title="视频分享">
                <Video className="w-5 h-5" />
              </button>
            )}
            {settings.aiCapabilities.emojiReply && (
              <button className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-all" title="表情">
                <Smile className="w-5 h-5" />
              </button>
            )}
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="输入消息..."
              className="input-modern flex-1 px-4 py-2.5 text-sm"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="p-2.5 btn-primary rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
