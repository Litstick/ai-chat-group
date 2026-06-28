import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { useStore } from '../store/useStore';
import type { ChatMessage, AIAgent, AIModel } from '../types';
import { callAIForSummary, callAIStream } from '../utils/aiService';
import { apiCheckTopicDrift } from '../api/client';
import { extractFilesFromContent, downloadFile, getFileIcon } from '../utils/fileUtils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
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
  AlertCircle,
  Pencil,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Copy,
  ScrollText,
  Loader2,
  Download,
} from 'lucide-react';

// ===== 稳定的 Markdown 组件引用 =====

const MemoizedCodeBlock = memo(({ inline, className, children, ...props }: any) => {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  if (inline) {
    return (
      <code className="bg-gray-100 text-red-600 px-1.5 py-0.5 rounded-md text-sm font-mono" {...props}>
        {children}
      </code>
    );
  }

  return (
    <div className="relative group my-3 rounded-xl overflow-hidden border border-gray-200">
      <div className="flex items-center justify-between bg-gray-800 px-4 py-2 text-xs">
        <span className="text-gray-400 font-mono">{match ? match[1] : 'code'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" />
              已复制
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              复制
            </>
          )}
        </button>
      </div>
      <pre className="bg-gray-900 text-gray-100 p-4 overflow-x-auto text-sm">
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    </div>
  );
});

const MARKDOWN_COMPONENTS = {
  code: MemoizedCodeBlock,
  p: ({ children }: any) => <p className="mb-2 last:mb-0">{children}</p>,
  ul: ({ children }: any) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
  ol: ({ children }: any) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
  li: ({ children }: any) => <li className="text-sm">{children}</li>,
  blockquote: ({ children }: any) => (
    <blockquote className="border-l-4 border-gray-300 pl-3 my-2 text-gray-600 italic">
      {children}
    </blockquote>
  ),
  a: ({ href, children }: any) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
      {children}
    </a>
  ),
  table: ({ children }: any) => (
    <div className="overflow-x-auto my-3">
      <table className="min-w-full border border-gray-200 rounded-lg text-sm">
        {children}
      </table>
    </div>
  ),
  th: ({ children }: any) => (
    <th className="bg-gray-50 px-3 py-2 text-left font-medium text-gray-700 border-b border-gray-200">
      {children}
    </th>
  ),
  td: ({ children }: any) => (
    <td className="px-3 py-2 border-b border-gray-100">{children}</td>
  ),
  h1: ({ children }: any) => <h1 className="text-lg font-bold mb-2 mt-3">{children}</h1>,
  h2: ({ children }: any) => <h2 className="text-base font-bold mb-2 mt-3">{children}</h2>,
  h3: ({ children }: any) => <h3 className="text-sm font-bold mb-1.5 mt-2">{children}</h3>,
  hr: () => <hr className="my-3 border-gray-200" />,
};

// ===== 时间格式化工具 =====

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
};

// ===== 单条消息组件（memo 化）=====

interface MessageItemProps {
  msg: ChatMessage;
  isStreaming: boolean;
  isCollapsed: boolean;
  onToggleCollapse: (id: string) => void;
}

const MessageItem = memo(({ msg, isStreaming, isCollapsed, onToggleCollapse }: MessageItemProps) => {
  const isLong = !isStreaming && (msg.content.length > 500 || /```[\s\S]*?```/.test(msg.content));

  // Extract files from code blocks for download
  const detectedFiles = useMemo(() => {
    if (isStreaming || !msg.isAI) return [];
    return extractFilesFromContent(msg.content);
  }, [msg.content, isStreaming, msg.isAI]);

  return (
    <div className={`flex gap-3 ${msg.isAI ? '' : 'flex-row-reverse'}`}>
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
          } shadow-sm relative`}
        >
          {msg.type === 'emoji' ? (
            <span className="text-2xl">{msg.content}</span>
          ) : msg.isAI ? (
            <div className={`text-sm leading-relaxed prose prose-sm max-w-none ${isLong && isCollapsed ? 'max-h-40 overflow-hidden mask-gradient-bottom' : ''}`}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={MARKDOWN_COMPONENTS}
              >
                {msg.content}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
          )}

          {/* File download buttons */}
          {detectedFiles.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex flex-wrap gap-2">
                {detectedFiles.map((file, index) => (
                  <button
                    key={`${file.filename}-${index}`}
                    onClick={() => downloadFile(file.filename, file.content)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-medium transition-colors border border-blue-200"
                    title={`下载 ${file.filename}`}
                  >
                    <span>{getFileIcon(file.filename)}</span>
                    <span>{file.filename}</span>
                    <Download className="w-3.5 h-3.5" />
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 mt-1.5">点击按钮下载生成的文件</p>
            </div>
          )}

          {isLong && msg.isAI && (
            <button
              onClick={() => onToggleCollapse(msg.id)}
              className="w-full mt-2 pt-2 border-t border-gray-200 flex items-center justify-center gap-1 text-xs text-blue-500 hover:text-blue-600 transition-colors"
            >
              {isCollapsed ? (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  展开完整内容（{Math.round(msg.content.length / 100) / 10}千字）
                </>
              ) : (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  收起
                </>
              )}
            </button>
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
  );
});

// ===== 主组件 =====

export default function ChatRoom() {
  const {
    currentSession,
    sessions,
    addMessage,
    upsertMessage,
    endSession,
    setCurrentPage,
    settings,
    isInActiveHours,
    updateSession,
    loadSessionMessages,
    loadMoreSessionMessages,
  } = useStore();

  const [input, setInput] = useState('');
  const [showSummary, setShowSummary] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoScroll, setAutoScroll] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [isEditingAlias, setIsEditingAlias] = useState(false);
  const [aliasInput, setAliasInput] = useState('');
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [collapsedMessages, setCollapsedMessages] = useState<Set<string>>(new Set());
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [messageOffset, setMessageOffset] = useState(0);

  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aiQueueRef = useRef<boolean>(false);
  const prevMessagesLengthRef = useRef<number>(0);
  const streamingContentRef = useRef<string>('');
  const streamingMessageIdRef = useRef<string>('');
  const rafIdRef = useRef<number>(0);
  const isAutoScrollRef = useRef<boolean>(false);
  const scrollToBottomThrottleRef = useRef<number>(0);

  // 用 ref 追踪 autoScroll 避免闭包过期
  useEffect(() => {
    isAutoScrollRef.current = autoScroll;
  }, [autoScroll]);

  const sessionSettings = useMemo(() => {
    if (!currentSession?.settings) return settings;
    return {
      ...settings,
      chatDuration: currentSession.settings.chatDuration ?? settings.chatDuration,
      activeHours: currentSession.settings.activeHours ?? settings.activeHours,
      aiCapabilities: currentSession.settings.aiCapabilities ?? settings.aiCapabilities,
      autoScroll: currentSession.settings.autoScroll ?? settings.autoScroll,
      replyFrequency: currentSession.settings.replyFrequency ?? settings.replyFrequency,
      autoEndOnTopicDrift: currentSession.settings.autoEndOnTopicDrift ?? settings.autoEndOnTopicDrift,
    };
  }, [currentSession?.settings, settings]);

  // 节流的 scrollToBottom - 流式输出时限制调用频率
  const scrollToBottom = useCallback((instant = false) => {
    const now = Date.now();
    if (!instant && now - scrollToBottomThrottleRef.current < 150) return;
    scrollToBottomThrottleRef.current = now;

    virtuosoRef.current?.scrollToIndex({ index: 'LAST', align: 'end', behavior: instant ? 'auto' : 'smooth' });
    setHasNewMessage(false);
  }, []);

  useEffect(() => {
    if (currentSession?.id && (!currentSession.messages || currentSession.messages.length === 0)) {
      // 加载全部消息（不传 limit/offset 或传大值）
      loadSessionMessages(currentSession.id, 10000, 0);
      setMessageOffset(0);
      setHasMoreMessages(false);
    }
  }, [currentSession?.id, loadSessionMessages]);

  useEffect(() => {
    if (!currentSession?.messages) return;
    const currentLength = currentSession.messages.length;
    if (prevMessagesLengthRef.current > 0 && currentLength > prevMessagesLengthRef.current) {
      if (autoScroll) {
        scrollToBottom(true);
      } else {
        setHasNewMessage(true);
      }
    }
    prevMessagesLengthRef.current = currentLength;
  }, [currentSession?.messages, autoScroll, scrollToBottom]);

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
      return (settings.apiKeys as unknown as Record<string, string>)[field] || '';
    },
    [settings.apiKeys]
  );

  // 流式输出：使用 ref + rAF 节流 Store 更新
  const streamingChunkCallback = useCallback((chunk: string) => {
    streamingContentRef.current += chunk;

    // 使用 rAF 合并多次 chunk 到一次渲染
    if (rafIdRef.current) return;

    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = 0;
      const content = streamingContentRef.current;
      const msgId = streamingMessageIdRef.current;
      if (!msgId) return;

      const storeState = useStore.getState();
      if (storeState.currentSession) {
        const updatedSession = {
          ...storeState.currentSession,
          messages: storeState.currentSession.messages.map(m =>
            m.id === msgId ? { ...m, content } : m
          ),
        };
        useStore.setState({ currentSession: updatedSession });

        if (isAutoScrollRef.current) {
          scrollToBottom(true);
        }
      }
    });
  }, [scrollToBottom]);

  const triggerAIDiscussion = useCallback(
    async (triggerMessage?: ChatMessage) => {
      if (!currentSession?.isActive) return;

      const replyFrequency = sessionSettings.replyFrequency;

      if (replyFrequency === 'slow') {
        if (aiQueueRef.current) return;
        aiQueueRef.current = true;

        const latestSession = useStore.getState().currentSession || currentSession;
        if (!latestSession.isActive) return;

        const recentMessages = latestSession.messages.slice(-2);
        const userMessageCount = recentMessages.filter(m => !m.isAI).length;
        if (userMessageCount < 2) {
          aiQueueRef.current = false;
          return;
        }
      }

      if (replyFrequency === 'medium') {
        if (aiQueueRef.current) return;
        aiQueueRef.current = true;
      }

      try {
        const latestSession = useStore.getState().currentSession || currentSession;
        if (!latestSession.isActive) return;

        const participants = latestSession.participants;

        let agentsToRespond: AIAgent[] = [];

        if (replyFrequency === 'slow') {
          agentsToRespond = [participants[Math.floor(Math.random() * participants.length)]];
        } else if (replyFrequency === 'medium') {
          agentsToRespond = [participants[Math.floor(Math.random() * participants.length)]];
        } else {
          const numAgents = Math.min(Math.ceil(Math.random() * 2), participants.length);
          const shuffled = [...participants].sort(() => Math.random() - 0.5);
          agentsToRespond = shuffled.slice(0, numAgents);
        }

        const promises = agentsToRespond.map(async (agent) => {
          const model = findModelForAgent(agent);
          if (!model) {
            setError(`找不到 ${agent.name} 对应的模型配置`);
            return null;
          }

          const apiKey = getApiKeyForProvider(model.provider);
          if (!apiKey) {
            setError(`${model.provider} 的 API Key 未配置，请在设置中添加`);
            return null;
          }

          const messageId = `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`;
          const tempMessage: ChatMessage = {
            id: messageId,
            senderId: agent.id,
            senderName: agent.name,
            senderAvatar: agent.avatar,
            content: '',
            type: 'text',
            timestamp: Date.now(),
            isAI: true,
          };

          addMessage(latestSession.id, tempMessage);
          setStreamingMessageId(messageId);

          // 重置流式状态
          streamingContentRef.current = '';
          streamingMessageIdRef.current = messageId;

          await callAIStream(
            agent,
            model,
            settings.apiKeys,
            latestSession.topic,
            latestSession.messages,
            triggerMessage,
            streamingChunkCallback,
            (errorMsg) => {
              setError(errorMsg);
              setStreamingMessageId(null);
              streamingMessageIdRef.current = '';
              aiQueueRef.current = false;
            },
            () => {
              // 取消待执行的 rAF
              if (rafIdRef.current) {
                cancelAnimationFrame(rafIdRef.current);
                rafIdRef.current = 0;
              }

              const finalContent = streamingContentRef.current;
              streamingMessageIdRef.current = '';

              setStreamingMessageId(null);
              aiQueueRef.current = false;

              // 最终内容同步到 store（确保最新）
              const storeState = useStore.getState();
              if (storeState.currentSession) {
                const updatedSession = {
                  ...storeState.currentSession,
                  messages: storeState.currentSession.messages.map(m =>
                    m.id === messageId ? { ...m, content: finalContent } : m
                  ),
                };
                useStore.setState({ currentSession: updatedSession });
              }

              // 一次性将完整消息写入数据库（upsert）
              upsertMessage(latestSession.id, {
                id: messageId,
                senderId: agent.id,
                senderName: agent.name,
                senderAvatar: agent.avatar,
                content: finalContent,
                type: 'text',
                timestamp: Date.now(),
                isAI: true,
              });

              // 自动折叠长消息
              if (finalContent.length > 500 || /```[\s\S]*?```/.test(finalContent)) {
                setCollapsedMessages(prev => {
                  const next = new Set(prev);
                  next.add(messageId);
                  return next;
                });
              }
            }
          );

          return messageId;
        });

        setIsLoading(true);
        setError(null);

        await Promise.all(promises);

        if (!latestSession.isActive) return;

        // Topic drift detection after all AI responses complete
        if (sessionSettings.autoEndOnTopicDrift && latestSession.topic) {
          try {
            const currentMessages = useStore.getState().currentSession?.messages || [];
            const recentMessages = currentMessages.slice(-10).map(m => ({
              senderName: m.senderName,
              content: m.content,
            }));

            // Find model info for drift detection (use first participant's model)
            const firstParticipant = latestSession.participants?.[0];
            if (firstParticipant) {
              const modelInfo = findModelForAgent(firstParticipant);
              if (modelInfo) {
                const driftResult = await apiCheckTopicDrift(
                  latestSession.topic,
                  recentMessages,
                  settings.apiKeys,
                  { provider: modelInfo.provider, modelId: modelInfo.modelId }
                );

                if (driftResult.success && driftResult.drifted) {
                  // End the session due to topic drift
                  const { endSession } = useStore.getState();
                  endSession(latestSession.id);
                  addMessage(latestSession.id, {
                    id: `system-drift-${Date.now()}`,
                    senderId: 'system',
                    senderName: '系统',
                    senderAvatar: '🤖',
                    content: `检测到讨论偏离核心话题「${latestSession.topic}」，聊天已自动结束。\n\n偏离原因：${driftResult.reason}`,
                    type: 'text',
                    timestamp: Date.now(),
                    isAI: false,
                  });
                  return;
                }
              }
            }
          } catch (driftErr) {
            console.error('话题偏离检测失败:', driftErr);
            // 静默失败，不影响正常聊天
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'AI 调用失败';
        setError(msg);
      } finally {
        setIsLoading(false);
        setStreamingMessageId(null);
        if (replyFrequency !== 'fast') {
          aiQueueRef.current = false;
        }
      }
    },
    [currentSession, sessionSettings, findModelForAgent, getApiKeyForProvider, settings.apiKeys, addMessage, upsertMessage, scrollToBottom, streamingChunkCallback]
  );

  useEffect(() => {
    if (!currentSession?.isActive || !isInActiveHours(currentSession)) return;

    const initialTimer = setTimeout(() => {
      triggerAIDiscussion();
    }, 1500);

    intervalRef.current = setInterval(() => {
      const latest = useStore.getState().currentSession;
      if (!latest || !isInActiveHours(latest) || !latest.isActive) return;
      triggerAIDiscussion();
    }, 8000 + Math.random() * 7000);

    const chatDuration = sessionSettings.chatDuration;
    if (chatDuration.enabled) {
      timeoutRef.current = setTimeout(() => {
        handleEndChat();
      }, chatDuration.minutes * 60 * 1000);
    }

    return () => {
      clearTimeout(initialTimer);
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const summaryResult = await callAIForSummary(
        summaryModel,
        settings.apiKeys,
        currentSession.topic,
        currentSession.messages
      );

      const summary = {
        ...summaryResult,
        generatedAt: Date.now(),
      };

      updateSession({ ...currentSession, summary });
      setShowSummary(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '总结生成失败';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartEditAlias = () => {
    if (!currentSession) return;
    setAliasInput(currentSession.alias || currentSession.topic);
    setIsEditingAlias(true);
  };

  const handleSaveAlias = () => {
    if (!currentSession) return;
    const newAlias = aliasInput.trim();
    if (newAlias) {
      const updatedSession = { ...currentSession, alias: newAlias };
      updateSession(updatedSession);
    }
    setIsEditingAlias(false);
  };

  const handleCancelEditAlias = () => {
    setIsEditingAlias(false);
    setAliasInput('');
  };

  const displayTitle = currentSession?.alias || currentSession?.topic || '';

  const { historyMessages, normalMessages } = useMemo(() => {
    if (!currentSession?.messages) return { historyMessages: [], normalMessages: [] };
    const history: ChatMessage[] = [];
    const normal: ChatMessage[] = [];
    for (const msg of currentSession.messages) {
      if (msg.isHistory) {
        history.push(msg);
      } else {
        normal.push(msg);
      }
    }
    return { historyMessages: history, normalMessages: normal };
  }, [currentSession?.messages]);

  const toggleMessageCollapse = useCallback((msgId: string) => {
    setCollapsedMessages((prev) => {
      const next = new Set(prev);
      if (next.has(msgId)) {
        next.delete(msgId);
      } else {
        next.add(msgId);
      }
      return next;
    });
  }, []);

  // Virtuoso 消息渲染
  const renderVirtuosoItem = useCallback((index: number) => {
    const msg = normalMessages[index];
    if (!msg) return null;
    return (
      <div className="px-4 py-2">
        <MessageItem
          msg={msg}
          isStreaming={streamingMessageId === msg.id}
          isCollapsed={collapsedMessages.has(msg.id)}
          onToggleCollapse={toggleMessageCollapse}
        />
      </div>
    );
  }, [normalMessages, streamingMessageId, collapsedMessages, toggleMessageCollapse]);

  // 加载更多消息
  const loadMoreMessages = useCallback(async () => {
    if (!hasMoreMessages || isLoadingMore || !currentSession?.id) return;
    setIsLoadingMore(true);
    const newOffset = messageOffset + 20;
    const result = await loadMoreSessionMessages(currentSession.id, 20, newOffset);
    setHasMoreMessages(result.hasMore);
    setMessageOffset(newOffset);
    setIsLoadingMore(false);
  }, [hasMoreMessages, isLoadingMore, currentSession?.id, messageOffset, loadMoreSessionMessages]);

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

  const hasMessages = normalMessages.length > 0;
  const totalItems = normalMessages.length;

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* 顶部栏 */}
      <div className="gradient-bg-blue px-4 py-3 flex items-center justify-between shadow-lg shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentPage('home')}
            className="p-2 bg-white/20 rounded-xl hover:bg-white/30 transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              {isEditingAlias ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={aliasInput}
                    onChange={(e) => setAliasInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveAlias();
                      if (e.key === 'Escape') handleCancelEditAlias();
                    }}
                    className="px-2 py-1 text-sm bg-white/20 text-white placeholder-blue-200 rounded-lg border border-white/30 focus:outline-none focus:border-white/50 w-48"
                    autoFocus
                    placeholder="输入群聊别名"
                  />
                  <button onClick={handleSaveAlias} className="p-1 bg-white/20 rounded-lg hover:bg-white/30 transition-all">
                    <Check className="w-4 h-4 text-white" />
                  </button>
                  <button onClick={handleCancelEditAlias} className="p-1 bg-white/20 rounded-lg hover:bg-white/30 transition-all">
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ) : (
                <>
                  <h1 className="font-semibold text-white text-base">{displayTitle}</h1>
                  <button onClick={handleStartEditAlias} className="p-1 hover:bg-white/20 rounded-lg transition-all" title="修改别名">
                    <Pencil className="w-4 h-4 text-white/80" />
                  </button>
                </>
              )}
            </div>
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
            <button
              onClick={handleEndChat}
              className="px-3 py-1.5 bg-white/20 text-white rounded-xl hover:bg-white/30 transition-all flex items-center gap-1.5 text-sm font-medium backdrop-blur-sm"
            >
              <Square className="w-4 h-4" />
              终止聊天
            </button>
          )}
        </div>
      </div>

      {/* 参与者栏 */}
      <div className="bg-white border-b border-gray-100 px-4 py-2 flex items-center gap-2 overflow-x-auto scrollbar-hide shrink-0">
        <div className="flex items-center gap-1.5 text-xs text-gray-400 shrink-0">
          <User className="w-3.5 h-3.5" />
          参与者
        </div>
        {currentSession.participants.map((agent) => {
          const model = findModelForAgent(agent);
          return (
            <div key={agent.id} className="flex items-center gap-1.5 shrink-0 px-2.5 py-1 bg-gray-50 rounded-full border border-gray-100">
              <img src={agent.avatar} alt={agent.name} className="w-5 h-5 rounded-full" />
              <span className="text-xs text-gray-700 font-medium">{agent.name}</span>
              {model && <span className="text-[10px] text-gray-400">{model.name}</span>}
            </div>
          );
        })}
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50/90 backdrop-blur-sm border-b border-red-200/50 px-4 py-2.5 flex items-center gap-2 shrink-0">
          <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center shrink-0">
            <AlertCircle className="w-3.5 h-3.5 text-red-500" />
          </div>
          <span className="text-sm text-red-700 flex-1">{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 text-xs font-medium px-2 py-1 rounded-lg hover:bg-red-100 transition-all">
            关闭
          </button>
        </div>
      )}

      {/* 加载提示 */}
      {isLoading && (
        <div className="bg-blue-50/80 backdrop-blur-sm border-b border-blue-100 px-4 py-2.5 flex items-center gap-2 shrink-0">
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
          </div>
          <span className="text-sm text-blue-600 font-medium">AI 正在思考中...</span>
        </div>
      )}

      {/* 消息列表 - 使用虚拟滚动 */}
      <div className="flex-1 relative">
        {isLoadingMore && (
          <div className="absolute top-0 left-0 right-0 z-10 text-center py-3 bg-gray-50/80 backdrop-blur-sm">
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              <span className="text-sm text-gray-500">加载更多消息...</span>
            </div>
          </div>
        )}

        {!hasMoreMessages && hasMessages && !isLoadingMore && (
          <div className="absolute top-0 left-0 right-0 z-10 text-center py-2 bg-gray-50/80">
            <span className="text-xs text-gray-400">已加载全部消息</span>
          </div>
        )}

        {totalItems === 0 && !isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center py-16">
              <div className="w-20 h-20 gradient-bg rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <p className="text-gray-600 font-medium">聊天已开始，AI 们正在准备中...</p>
              <p className="text-sm text-gray-400 mt-2">请确保已在设置中配置 API Key</p>
            </div>
          </div>
        ) : (
          <Virtuoso
            ref={virtuosoRef}
            totalCount={totalItems}
            itemContent={renderVirtuosoItem}
            followOutput={autoScroll ? 'smooth' : 'auto'}
            initialTopMostItemIndex={totalItems - 1}
            overscan={200}
            rangeChanged={({ endIndex }) => {
              // 当滚动到底部附近时关闭"有新消息"提示
              if (endIndex >= totalItems - 3) {
                setHasNewMessage(false);
              }
            }}
            components={{
              Header: () => {
                if (historyMessages.length === 0) return null;

                // Get source session info for the divider
                const sourceSession = currentSession.parentSessionId
                  ? sessions.find(s => s.id === currentSession.parentSessionId)
                  : null;
                const sourceTime = sourceSession
                  ? new Date(sourceSession.startTime).toLocaleString('zh-CN', {
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '';
                const sourceTopic = sourceSession?.topic || '';

                return (
                  <div className="px-4 py-2">
                    {/* Source divider */}
                    <div className="flex items-center gap-3 my-3">
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent"></div>
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-full border border-blue-100">
                        <ScrollText className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-xs text-blue-600 font-medium">
                          以上内容来源于历史记录
                          {sourceTopic && (
                            <span className="text-blue-500">「{sourceTopic}」</span>
                          )}
                          {sourceTime && (
                            <span className="text-blue-400 ml-1">{sourceTime}</span>
                          )}
                        </span>
                      </div>
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent"></div>
                    </div>

                    <button
                      onClick={() => setHistoryExpanded(!historyExpanded)}
                      className="w-full flex items-center justify-center gap-2 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors group"
                    >
                      <div className="flex-1 h-px bg-gray-200"></div>
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 rounded-full group-hover:bg-gray-200 transition-colors">
                        <ScrollText className="w-3.5 h-3.5" />
                        <span>历史讨论 ({historyMessages.length} 条)</span>
                        {historyExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </div>
                      <div className="flex-1 h-px bg-gray-200"></div>
                    </button>
                    {historyExpanded && (
                      <div className="mt-4 space-y-4 opacity-80">
                        {historyMessages.map((msg) => (
                          <div key={msg.id} className="px-4 py-2">
                            <MessageItem
                              msg={msg}
                              isStreaming={false}
                              isCollapsed={collapsedMessages.has(msg.id)}
                              onToggleCollapse={toggleMessageCollapse}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              },
            }}
          />
        )}

        {/* 浮动按钮 */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-10">
          {hasNewMessage && (
            <button
              onClick={() => scrollToBottom(true)}
              className="px-3 py-2 bg-blue-500 text-white text-sm rounded-full shadow-lg hover:bg-blue-600 transition-all flex items-center gap-1.5"
            >
              <ChevronDown className="w-4 h-4" />
              有新消息
            </button>
          )}
          <button
            onClick={() => {
              setAutoScroll(!autoScroll);
              if (!autoScroll) {
                scrollToBottom(true);
              }
            }}
            className={`px-3 py-2 rounded-full shadow-lg transition-all backdrop-blur-sm flex items-center gap-2 ${
              autoScroll
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
            title={autoScroll ? '自动滚动已开启' : '自动滚动已关闭'}
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${autoScroll ? '' : 'rotate-180'}`} />
            <span className="text-xs font-medium">{autoScroll ? '自动' : '手动'}</span>
          </button>
        </div>
      </div>

      {/* 总结弹窗 */}
      {showSummary && currentSession.summary && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto slide-up">
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <div className="gradient-bg-purple w-8 h-8 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  聊天总结
                </h2>
                <button onClick={() => setShowSummary(false)} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all">
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

      {/* 输入框 */}
      {currentSession.isActive && (
        <div className="glass-card border-t border-gray-200/50 px-4 py-3 shrink-0">
          <div className="flex items-center gap-2">
            {sessionSettings.aiCapabilities.imageUnderstanding && (
              <button className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all" title="发送图片">
                <Image className="w-5 h-5" />
              </button>
            )}
            {sessionSettings.aiCapabilities.voiceReply && (
              <button className="p-2 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-xl transition-all" title="语音输入">
                <Mic className="w-5 h-5" />
              </button>
            )}
            {sessionSettings.aiCapabilities.videoShare && (
              <button className="p-2 text-gray-400 hover:text-purple-500 hover:bg-purple-50 rounded-xl transition-all" title="视频分享">
                <Video className="w-5 h-5" />
              </button>
            )}
            {sessionSettings.aiCapabilities.emojiReply && (
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
