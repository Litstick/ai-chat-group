import { useState } from 'react';
import { useStore } from '../store/useStore';
import { ChatSession, SessionSettings } from '../types';
import { chatScenarios } from '../utils/storage';
import { apiValidateTopic } from '../api/client';
import {
  MessageCircle,
  Settings,
  Users,
  History,
  Plus,
  Clock,
  ArrowRight,
  Sparkles,
  Briefcase,
  BookOpen,
  PenTool,
  Heart,
  TrendingUp,
  Gamepad2,
  Map,
  Zap,
  HomeIcon,
  ChevronDown,
  ChevronUp,
  X,
  Image,
  Mic,
  Video,
  Smile,
  AlertCircle,
  UserPlus,
} from 'lucide-react';

export default function Home() {
  const {
    agents,
    sessions,
    setCurrentPage,
    setCurrentSession,
    addSession,
    settings,
    currentUser,
  } = useStore();

  const [topic, setTopic] = useState('');
  const [alias, setAlias] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [topicError, setTopicError] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);

  const [chatDurationEnabled, setChatDurationEnabled] = useState(settings.chatDuration.enabled);
  const [chatDurationMinutes, setChatDurationMinutes] = useState(settings.chatDuration.minutes);
  const [activeHoursEnabled, setActiveHoursEnabled] = useState(settings.activeHours.enabled);
  const [activeHoursStart, setActiveHoursStart] = useState(settings.activeHours.start);
  const [activeHoursEnd, setActiveHoursEnd] = useState(settings.activeHours.end);
  const [imageUnderstanding, setImageUnderstanding] = useState(settings.aiCapabilities.imageUnderstanding);
  const [voiceReply, setVoiceReply] = useState(settings.aiCapabilities.voiceReply);
  const [videoShare, setVideoShare] = useState(settings.aiCapabilities.videoShare);
  const [emojiReply, setEmojiReply] = useState(settings.aiCapabilities.emojiReply);
  const [replyFrequency, setReplyFrequency] = useState<'slow' | 'medium' | 'fast'>(settings.replyFrequency);
  const [autoEndOnTopicDrift, setAutoEndOnTopicDrift] = useState(settings.autoEndOnTopicDrift);
  const [showFastWarning, setShowFastWarning] = useState(false);
  const [capabilityWarning, setCapabilityWarning] = useState<string | null>(null);

  // 支持多模态能力的模型列表
  const MULTIMODAL_MODELS = ['gpt-4o', 'gpt-4-vision', 'gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro-vision', 'claude-3-opus', 'claude-3-sonnet', 'claude-3-5-sonnet', 'claude-3-5-sonnet-20241022'];

  // 检查模型是否支持多模态能力
  const checkModelCapability = (capability: 'image' | 'voice' | 'video'): boolean => {
    const activeModelIds = activeAgents.map(agent => {
      const model = settings.models.find(m => m.id === agent.model);
      return model?.modelId || '';
    });

    if (capability === 'image' || capability === 'video') {
      // 检查是否有模型支持视觉
      const hasVisionModel = activeModelIds.some(id =>
        MULTIMODAL_MODELS.some(m => id.includes(m) || m.includes(id))
      );
      return hasVisionModel;
    }

    return true; // 语音能力大多数模型都支持
  };

  const activeAgents = agents.filter((a) => a.isActive);
  const selectedAgents = agents.filter((a) => selectedAgentIds.includes(a.id));

  const iconMap: Record<string, React.ElementType> = {
    briefcase: Briefcase,
    'book-open': BookOpen,
    'pen-tool': PenTool,
    home: HomeIcon,
    heart: Heart,
    'trending-up': TrendingUp,
    'gamepad-2': Gamepad2,
    map: Map,
  };

  const getRecommendedAgentIds = () => {
    if (!selectedScenario) return [];
    const scenario = chatScenarios.find((s) => s.id === selectedScenario);
    return scenario?.recommendedAgents || [];
  };

  const getExtraActiveAgents = () => {
    const recommendedIds = getRecommendedAgentIds();
    return activeAgents.filter((a) => !recommendedIds.includes(a.id));
  };

  const isRecommendedButMissing = (agentId: string): boolean => {
    const recommendedIds = getRecommendedAgentIds();
    if (!recommendedIds.includes(agentId)) return false;
    return !activeAgents.some((a) => a.id === agentId);
  };

  const handleToggleAgent = (agentId: string) => {
    if (!activeAgents.some((a) => a.id === agentId)) return;
    setSelectedAgentIds((prev) => {
      if (prev.includes(agentId)) {
        return prev.filter((id) => id !== agentId);
      }
      return [...prev, agentId];
    });
  };

  const getMissingRecommendedAgents = () => {
    const recommendedIds = getRecommendedAgentIds();
    return recommendedIds.filter((id) => !activeAgents.some((a) => a.id === id));
  };

  const handleStartChat = async () => {
    if (!topic.trim()) return;
    if (!currentUser) return;

    setTopicError('');
    setIsValidating(true);

    try {
      const result = await apiValidateTopic(topic.trim());
      if (!result.valid) {
        setTopicError(result.reason || '话题内容不符合规范，请修改后重试');
        setIsValidating(false);
        return;
      }
    } catch (err) {
      console.error('话题验证失败:', err);
    }

    setIsValidating(false);

    // 前置校验：如果有推荐角色但未配置，阻止开始聊天
    if (selectedScenario) {
      const missing = getMissingRecommendedAgents();
      if (missing.length > 0) {
        const missingNames = missing
          .map((id) => agents.find((a) => a.id === id)?.name || id)
          .join('、');
        alert(
          `当前场景推荐的 AI 角色（${missingNames}）未在 AI 配置中启用，请先前往「AI 配置」开启这些角色后再开始聊天。`
        );
        setCurrentPage('agents');
        return;
      }
    }

    const finalParticipants = selectedScenario
      ? agents.filter((a) => getRecommendedAgentIds().includes(a.id) && a.isActive)
      : selectedAgents;

    if (finalParticipants.length < 2) {
      alert('请至少选择 2 个 AI 参与群聊');
      setCurrentPage('agents');
      return;
    }

    const sessionSettings: SessionSettings = {
      chatDuration: {
        enabled: chatDurationEnabled,
        minutes: chatDurationMinutes,
      },
      activeHours: {
        enabled: activeHoursEnabled,
        start: activeHoursStart,
        end: activeHoursEnd,
      },
      aiCapabilities: {
        imageUnderstanding,
        voiceReply,
        videoShare,
        emojiReply,
      },
      autoScroll: settings.autoScroll,
      replyFrequency,
      autoEndOnTopicDrift,
    };

    const session: ChatSession = {
      id: `session-${Date.now()}`,
      userId: currentUser.id,
      topic: topic.trim(),
      alias: alias.trim() || undefined,
      startTime: Date.now(),
      messages: [],
      participants: finalParticipants,
      isActive: true,
      settings: sessionSettings,
    };

    addSession(session);
    setTopic('');
    setAlias('');
    setShowNewChat(false);
    setSelectedScenario(null);
    setShowAdvancedSettings(false);
    setTopicError('');
    setSelectedAgentIds([]);
    setCurrentPage('chat');
  };

  const handleSelectScenario = (scenarioId: string) => {
    if (selectedScenario === scenarioId) {
      setSelectedScenario(null);
      setTopic('');
    } else {
      const scenario = chatScenarios.find((s) => s.id === scenarioId);
      if (scenario) {
        setSelectedScenario(scenarioId);
        setTopic(scenario.defaultTopic);
        // 只更新本地选择，不修改全局配置
        const recommended = scenario.recommendedAgents.filter((id) =>
          activeAgents.some((a) => a.id === id)
        );
        setSelectedAgentIds(recommended);
      }
    }
    setTopicError('');
  };

  const handleContinueChat = (session: ChatSession) => {
    setCurrentSession(session);
    setCurrentPage('chat');
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDisplayTopic = (session: ChatSession) => {
    return session.alias || session.topic;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="gradient-bg-blue pt-safe-top">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg">
                <img src="/logo.svg" alt="灵犀 LingXi" className="w-full h-full" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">灵犀 LingXi</h1>
                <p className="text-blue-100 mt-0.5 text-xs">多 AI 角色协作讨论</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentPage('profile')}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/20 rounded-full hover:bg-white/30 transition-all"
              >
                <img
                  src={currentUser?.avatar}
                  alt=""
                  className="w-7 h-7 rounded-full ring-2 ring-white/50"
                />
                <span className="text-sm text-white max-w-[80px] truncate font-medium">{currentUser?.nickname}</span>
              </button>
              <button
                onClick={() => setCurrentPage('settings')}
                className="p-2.5 bg-white/20 rounded-full hover:bg-white/30 transition-all"
              >
                <Settings className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => setShowNewChat(true)}
            className="section-card p-5 text-left hover:shadow-lg hover:-translate-y-0.5 transition-all group"
          >
            <div className="gradient-bg-blue w-12 h-12 rounded-2xl flex items-center justify-center mb-3 shadow-md">
              <Plus className="w-6 h-6 text-white" />
            </div>
            <div className="font-semibold text-gray-900">新建聊天</div>
            <div className="text-sm text-gray-400 mt-0.5">开始新话题</div>
          </button>
          <button
            onClick={() => setCurrentPage('agents')}
            className="section-card p-5 text-left hover:shadow-lg hover:-translate-y-0.5 transition-all group"
          >
            <div className="gradient-bg-green w-12 h-12 rounded-2xl flex items-center justify-center mb-3 shadow-md">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="font-semibold text-gray-900">AI 配置</div>
            <div className="text-sm text-gray-400 mt-0.5">
              {activeAgents.length} 个 AI 已激活
            </div>
          </button>
          <button
            onClick={() => setCurrentPage('history')}
            className="section-card p-5 text-left hover:shadow-lg hover:-translate-y-0.5 transition-all group"
          >
            <div className="gradient-bg-purple w-12 h-12 rounded-2xl flex items-center justify-center mb-3 shadow-md">
              <History className="w-6 h-6 text-white" />
            </div>
            <div className="font-semibold text-gray-900">历史记录</div>
            <div className="text-sm text-gray-400 mt-0.5">
              {sessions.length} 个会话
            </div>
          </button>
          <button
            onClick={() => setCurrentPage('settings')}
            className="section-card p-5 text-left hover:shadow-lg hover:-translate-y-0.5 transition-all group"
          >
            <div className="gradient-bg-orange w-12 h-12 rounded-2xl flex items-center justify-center mb-3 shadow-md">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div className="font-semibold text-gray-900">设置</div>
            <div className="text-sm text-gray-400 mt-0.5">群聊参数</div>
          </button>
        </div>

        {showNewChat && (
          <div className="glass-card rounded-2xl p-6 slide-up">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <div className="gradient-bg-purple w-8 h-8 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              新建群聊
            </h2>

            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                <Zap className="w-4 h-4 text-amber-500" />
                选择场景（可选）
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {chatScenarios.map((scenario) => {
                  const Icon = iconMap[scenario.icon] || Sparkles;
                  const isSelected = selectedScenario === scenario.id;
                  return (
                    <button
                      key={scenario.id}
                      onClick={() => handleSelectScenario(scenario.id)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 shadow-sm'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${
                        isSelected ? 'bg-blue-500' : 'bg-gray-100'
                      }`}>
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-gray-500'}`} />
                      </div>
                      <div className={`text-sm font-medium ${isSelected ? 'text-blue-700' : 'text-gray-700'}`}>
                        {scenario.name}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                        {scenario.description}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {selectedScenario ? '调整话题（可选）' : '核心话题'}
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => {
                    setTopic(e.target.value);
                    if (selectedScenario) setSelectedScenario(null);
                    setTopicError('');
                  }}
                  placeholder={selectedScenario ? '' : '例如：开发一款任务管理软件、调研 AI 市场分析报告...'}
                  className={`input-modern w-full px-4 py-3 text-sm ${
                    topicError ? 'border-red-400 focus:ring-red-200' : ''
                  }`}
                />
                {topicError && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {topicError}
                  </p>
                )}
                {selectedScenario && (
                  <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    已选择「{chatScenarios.find(s => s.id === selectedScenario)?.name}」场景，将自动配置合适的 AI 角色
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  群聊别名（选填）
                </label>
                <input
                  type="text"
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  placeholder="不填则使用话题作为显示名"
                  className="input-modern w-full px-4 py-3 text-sm"
                />
              </div>

              {selectedScenario && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4">
                  <div className="text-sm font-medium text-gray-700 mb-3 flex items-center justify-between">
                    <span>推荐参与角色：</span>
                    <button
                      onClick={() => setCurrentPage('agents')}
                      className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      管理 AI 角色
                    </button>
                  </div>
                  <div className="space-y-2">
                    {getRecommendedAgentIds().map((agentId) => {
                      const agent = agents.find((a) => a.id === agentId);
                      if (!agent) {
                        return (
                          <div
                            key={agentId}
                            className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-lg border border-red-100"
                          >
                            <div className="w-7 h-7 rounded-full bg-red-200 flex items-center justify-center">
                              <AlertCircle className="w-4 h-4 text-red-500" />
                            </div>
                            <div className="flex-1">
                              <div className="text-sm text-red-700 font-medium">未配置角色</div>
                              <div className="text-xs text-red-500">请到 AI 配置中开启此角色</div>
                            </div>
                            <span className="text-xs text-red-500 font-medium">未启用</span>
                          </div>
                        );
                      }
                      const isSelected = selectedAgentIds.includes(agent.id);
                      const isMissing = isRecommendedButMissing(agent.id);
                      return (
                        <div
                          key={agent.id}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                            isMissing
                              ? 'bg-red-50 border border-red-100'
                              : isSelected
                              ? 'bg-white shadow-sm ring-2 ring-blue-400'
                              : 'bg-gray-50 opacity-60'
                          }`}
                        >
                          <img
                            src={agent.avatar}
                            alt={agent.name}
                            className={`w-7 h-7 rounded-full ${isMissing ? 'opacity-50' : ''}`}
                          />
                          <div className="flex-1 min-w-0">
                            <div className={`text-sm font-medium ${isMissing ? 'text-red-700' : 'text-gray-700'}`}>
                              {agent.name}
                              {!isMissing && (
                                <span className="ml-1.5 text-xs text-blue-500">（推荐）</span>
                              )}
                            </div>
                            <div className="text-xs text-gray-400 truncate">{agent.role}</div>
                          </div>
                          {isMissing ? (
                            <span className="text-xs text-red-500 font-medium">未启用</span>
                          ) : isSelected ? (
                            <button
                              onClick={() => handleToggleAgent(agent.id)}
                              className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                              title="移除"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleAgent(agent.id)}
                              className="p-1 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded transition-all"
                              title="添加"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {getExtraActiveAgents().length > 0 && (
                    <div className="mt-4 pt-3 border-t border-blue-100">
                      <div className="text-xs text-gray-500 mb-2">其他可选角色（已启用）：</div>
                      <div className="space-y-2">
                        {getExtraActiveAgents().map((agent) => {
                          const isSelected = selectedAgentIds.includes(agent.id);
                          return (
                            <div
                              key={agent.id}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                                isSelected ? 'bg-white shadow-sm ring-2 ring-blue-400' : 'bg-white/60'
                              }`}
                            >
                              <img src={agent.avatar} alt={agent.name} className="w-7 h-7 rounded-full" />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm text-gray-700 font-medium">{agent.name}</div>
                                <div className="text-xs text-gray-400 truncate">{agent.role}</div>
                              </div>
                              {isSelected ? (
                                <button
                                  onClick={() => handleToggleAgent(agent.id)}
                                  className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                                  title="移除"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleToggleAgent(agent.id)}
                                  className="p-1 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded transition-all"
                                  title="添加"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 pt-3 border-t border-blue-100">
                    <div className="text-sm font-medium text-blue-700 flex items-center gap-1.5">
                      <Users className="w-4 h-4" />
                      当前群聊将有 {activeAgents.length} 个 AI 角色参与
                    </div>
                  </div>
                </div>
              )}

              {!selectedScenario && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Users className="w-4 h-4" />
                  当前活跃 {activeAgents.length} 个 AI：
                </div>
              )}

              {!selectedScenario && activeAgents.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {activeAgents.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-full"
                    >
                      <img src={a.avatar} alt={a.name} className="w-5 h-5 rounded-full" />
                      <span className="text-sm text-blue-700 font-medium">{a.name}</span>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all text-sm"
              >
                <span className="font-medium text-gray-700 flex items-center gap-2">
                  <Settings className="w-4 h-4 text-gray-500" />
                  高级设置
                </span>
                {showAdvancedSettings ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>

              {showAdvancedSettings && (
                <div className="space-y-4 px-1 fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-orange-500" />
                      <span className="text-sm font-medium text-gray-700">聊天时长限制</span>
                    </div>
                    <button
                      onClick={() => setChatDurationEnabled(!chatDurationEnabled)}
                      className={`relative w-11 h-6 rounded-full transition-all ${
                        chatDurationEnabled ? 'bg-blue-500' : 'bg-gray-300'
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${
                          chatDurationEnabled ? 'left-5' : 'left-0.5'
                        }`}
                      />
                    </button>
                  </div>
                  {chatDurationEnabled && (
                    <div className="pl-6">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={chatDurationMinutes}
                          onChange={(e) => setChatDurationMinutes(Math.max(1, parseInt(e.target.value) || 30))}
                          min={1}
                          className="input-modern w-24 px-3 py-2 text-sm"
                        />
                        <span className="text-sm text-gray-500">分钟</span>
                      </div>
                    </div>
                  )}

                  <div className="border-t border-gray-100 pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-medium text-gray-700">群活跃时间段</span>
                      </div>
                      <button
                        onClick={() => setActiveHoursEnabled(!activeHoursEnabled)}
                        className={`relative w-11 h-6 rounded-full transition-all ${
                          activeHoursEnabled ? 'bg-blue-500' : 'bg-gray-300'
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${
                            activeHoursEnabled ? 'left-5' : 'left-0.5'
                          }`}
                        />
                      </button>
                    </div>
                    {activeHoursEnabled && (
                      <div className="pl-6 mt-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="time"
                            value={activeHoursStart}
                            onChange={(e) => setActiveHoursStart(e.target.value)}
                            className="input-modern px-3 py-2 text-sm"
                          />
                          <span className="text-gray-400">至</span>
                          <input
                            type="time"
                            value={activeHoursEnd}
                            onChange={(e) => setActiveHoursEnd(e.target.value)}
                            className="input-modern px-3 py-2 text-sm"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-gray-100 pt-4">
                    <div className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-500" />
                      AI 视听能力
                    </div>
                    <div className="grid grid-cols-2 gap-3 pl-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Image className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">图片理解</span>
                        </div>
                        <button
                          onClick={() => {
                            if (!imageUnderstanding && !checkModelCapability('image')) {
                              setCapabilityWarning('当前选择的 AI 模型不支持图片理解能力。建议使用 GPT-4o、Gemini 1.5 Pro 或 Claude 3 等多模态模型。');
                            } else {
                              setImageUnderstanding(!imageUnderstanding);
                            }
                          }}
                          className={`relative w-10 h-5 rounded-full transition-all ${
                            imageUnderstanding ? 'bg-blue-500' : 'bg-gray-300'
                          }`}
                        >
                          <div
                            className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${
                              imageUnderstanding ? 'left-5' : 'left-0.5'
                            }`}
                          />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Mic className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">语音回复</span>
                        </div>
                        <button
                          onClick={() => setVoiceReply(!voiceReply)}
                          className={`relative w-10 h-5 rounded-full transition-all ${
                            voiceReply ? 'bg-blue-500' : 'bg-gray-300'
                          }`}
                        >
                          <div
                            className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${
                              voiceReply ? 'left-5' : 'left-0.5'
                            }`}
                          />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Video className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">视频分享</span>
                        </div>
                        <button
                          onClick={() => {
                            if (!videoShare && !checkModelCapability('video')) {
                              setCapabilityWarning('当前选择的 AI 模型不支持视频处理能力。建议使用 GPT-4o、Gemini 1.5 Pro 等多模态模型。');
                            } else {
                              setVideoShare(!videoShare);
                            }
                          }}
                          className={`relative w-10 h-5 rounded-full transition-all ${
                            videoShare ? 'bg-blue-500' : 'bg-gray-300'
                          }`}
                        >
                          <div
                            className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${
                              videoShare ? 'left-5' : 'left-0.5'
                            }`}
                          />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Smile className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">表情回复</span>
                        </div>
                        <button
                          onClick={() => setEmojiReply(!emojiReply)}
                          className={`relative w-10 h-5 rounded-full transition-all ${
                            emojiReply ? 'bg-blue-500' : 'bg-gray-300'
                          }`}
                        >
                          <div
                            className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${
                              emojiReply ? 'left-5' : 'left-0.5'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-4">
                    <div className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-500" />
                      AI 回复频率
                    </div>
                    <div className="grid grid-cols-3 gap-2 pl-2">
                      {[
                        { value: 'slow', label: '慢', desc: '每两条消息后回复' },
                        { value: 'medium', label: '中', desc: '正常回复' },
                        { value: 'fast', label: '快', desc: '多个 AI 同时回复' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setReplyFrequency(option.value as 'slow' | 'medium' | 'fast');
                            if (option.value === 'fast') {
                              setShowFastWarning(true);
                            }
                          }}
                          className={`px-3 py-2.5 rounded-lg border-2 text-center transition-all ${
                            replyFrequency === option.value
                              ? 'border-amber-400 bg-amber-50 shadow-sm'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <div className="text-sm font-medium text-gray-900">{option.label}</div>
                          <div className="text-xs text-gray-500 mt-1">{option.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {showFastWarning && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 fade-in">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-amber-900 mb-1">温馨提示</div>
                      <div className="text-xs text-amber-700 leading-relaxed">
                        选择「快」频率后，多个 AI 可能同时回复消息，这将消耗更多的 API Token，请注意成本控制。
                      </div>
                    </div>
                    <button
                      onClick={() => setShowFastWarning(false)}
                      className="text-amber-600 hover:text-amber-700 text-xs font-medium px-2 py-1 rounded hover:bg-amber-100 transition-all"
                    >
                     知道了
                    </button>
                  </div>
                </div>
              )}

              {capabilityWarning && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 fade-in">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-blue-900 mb-1">能力提醒</div>
                      <div className="text-xs text-blue-700 leading-relaxed">
                        {capabilityWarning}
                      </div>
                    </div>
                    <button
                      onClick={() => setCapabilityWarning(null)}
                      className="text-blue-600 hover:text-blue-700 text-xs font-medium px-2 py-1 rounded hover:bg-blue-100 transition-all"
                    >
                      知道了
                    </button>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleStartChat}
                  disabled={!topic.trim() || isValidating}
                  className="btn-primary flex-1 py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isValidating ? '验证中...' : '开始聊天'}
                </button>
                <button
                  onClick={() => {
                    setShowNewChat(false);
                    setSelectedScenario(null);
                    setTopic('');
                    setAlias('');
                    setTopicError('');
                    setShowAdvancedSettings(false);
                  }}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all text-sm"
                >
                  取消
                </button>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                        <div>
                          <span className="text-sm font-medium text-gray-700">偏离话题自动结束</span>
                          <p className="text-xs text-gray-400 mt-0.5">AI 检测到讨论偏离核心话题时自动结束聊天</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setAutoEndOnTopicDrift(!autoEndOnTopicDrift)}
                        className={`relative w-11 h-6 rounded-full transition-all ${
                          autoEndOnTopicDrift ? 'bg-amber-500' : 'bg-gray-300'
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${
                            autoEndOnTopicDrift ? 'left-5' : 'left-0.5'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              )}

        {sessions.filter((s) => s.isActive).length > 0 && (
          <div className="fade-in">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <div className="gradient-bg-green w-7 h-7 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-white" />
              </div>
              进行中的聊天
            </h2>
            <div className="space-y-3">
              {sessions
                .filter((s) => s.isActive)
                .map((session) => (
                  <div
                    key={session.id}
                    onClick={() => handleContinueChat(session)}
                    className="section-card border-l-4 border-blue-500 p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{getDisplayTopic(session)}</h3>
                        {session.alias && (
                          <p className="text-xs text-gray-400 mt-0.5">{session.topic}</p>
                        )}
                        <div className="flex items-center gap-1 mt-2">
                          {session.participants.slice(0, 5).map((p, idx) => (
                            <img
                              key={p.id}
                              src={p.avatar}
                              alt={p.name}
                              className="w-6 h-6 rounded-full ring-2 ring-white -ml-1 first:ml-0"
                              style={{ zIndex: 5 - idx }}
                            />
                          ))}
                          {session.participants.length > 5 && (
                            <span className="text-xs text-gray-400 ml-1">+{session.participants.length - 5}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-3.5 h-3.5" />
                            {session.messageCount ?? session.messages.length} 条消息
                          </span>
                          <span>{formatDate(session.startTime)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-green-600 text-xs font-medium bg-green-50 px-2 py-1 rounded-full">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full pulse-dot"></span>
                          进行中
                        </span>
                        <ArrowRight className="w-5 h-5 text-gray-300" />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {sessions.filter((s) => !s.isActive).length > 0 && (
          <div className="fade-in">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <div className="gradient-bg-purple w-7 h-7 rounded-lg flex items-center justify-center">
                <History className="w-4 h-4 text-white" />
              </div>
              最近历史
            </h2>
            <div className="space-y-3">
              {sessions
                .filter((s) => !s.isActive)
                .slice(0, 5)
                .map((session) => (
                  <div
                    key={session.id}
                    onClick={() => handleContinueChat(session)}
                    className="section-card border-l-4 border-purple-400 p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{getDisplayTopic(session)}</h3>
                        {session.alias && (
                          <p className="text-xs text-gray-400 mt-0.5">{session.topic}</p>
                        )}
                        <div className="flex items-center gap-1 mt-2">
                          {session.participants.slice(0, 5).map((p, idx) => (
                            <img
                              key={p.id}
                              src={p.avatar}
                              alt={p.name}
                              className="w-6 h-6 rounded-full ring-2 ring-white -ml-1 first:ml-0"
                              style={{ zIndex: 5 - idx }}
                            />
                          ))}
                          {session.participants.length > 5 && (
                            <span className="text-xs text-gray-400 ml-1">+{session.participants.length - 5}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-3.5 h-3.5" />
                            {session.messageCount ?? session.messages.length} 条消息
                          </span>
                          <span>{formatDate(session.startTime)}</span>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-300" />
                    </div>
                    {session.summary && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-1 text-sm text-purple-600 bg-purple-50 px-2 py-1 rounded-full w-fit">
                          <Sparkles className="w-3.5 h-3.5" />
                          已生成总结
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </div>
            {sessions.filter((s) => !s.isActive).length > 5 && (
              <button
                onClick={() => setCurrentPage('history')}
                className="w-full mt-3 py-2.5 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all font-medium"
              >
                查看全部历史
              </button>
            )}
          </div>
        )}

        {sessions.length === 0 && !showNewChat && (
          <div className="text-center py-16 fade-in">
            <div className="w-24 h-24 gradient-bg-blue rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <MessageCircle className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">还没有聊天</h3>
            <p className="text-gray-500 mt-2 max-w-sm mx-auto leading-relaxed">
              点击上方「新建聊天」开始你的第一个 AI 群聊，让多个 AI 为你出谋划策
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
