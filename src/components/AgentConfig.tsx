import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import type { AIAgent } from '../types';
import { User, Wrench, ChevronDown, ChevronUp, Save, ArrowLeft, Brain } from 'lucide-react';

export default function AgentConfig() {
  const { agents, updateAgents, skills, settings, setCurrentPage } = useStore();
  const [localAgents, setLocalAgents] = useState<AIAgent[]>(agents);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);

  // 同步 store 中的 agents 到本地（initApp 异步加载后会更新 store）
  useEffect(() => {
    if (agents.length > 0) {
      setLocalAgents(agents);
    }
  }, [agents]);

  const enabledModels = settings.models.filter((m) => m.isEnabled);

  const toggleAgent = (id: string) => {
    const activeCount = localAgents.filter((a) => a.isActive).length;
    setLocalAgents(
      localAgents.map((a) => {
        if (a.id === id) {
          if (!a.isActive && activeCount >= 5) return a;
          return { ...a, isActive: !a.isActive };
        }
        return a;
      })
    );
  };

  const updateAgentField = (id: string, field: keyof AIAgent, value: string | string[]) => {
    setLocalAgents(
      localAgents.map((a) => (a.id === id ? { ...a, [field]: value } : a))
    );
  };

  const toggleSkill = (agentId: string, skillId: string) => {
    setLocalAgents(
      localAgents.map((a) => {
        if (a.id !== agentId) return a;
        const skills = a.skills.includes(skillId)
          ? a.skills.filter((s) => s !== skillId)
          : [...a.skills, skillId];
        return { ...a, skills };
      })
    );
  };

  const handleSave = () => {
    const activeAgents = localAgents.filter((a) => a.isActive);
    if (activeAgents.length < 2) {
      alert('请至少选择 2 个 AI 参与群聊');
      return;
    }
    for (const agent of activeAgents) {
      const model = enabledModels.find((m) => m.id === agent.model);
      if (!model) {
        alert(`AI「${agent.name}」选择的模型未启用或不存在，请在设置中启用对应模型。`);
        return;
      }
    }
    updateAgents(localAgents);
    setCurrentPage('home');
  };

  const activeCount = localAgents.filter((a) => a.isActive).length;

  return (
    <div className="min-h-screen bg-[#f0f2f5] p-4">
      <div className="max-w-2xl mx-auto slide-up">
        <div className="section-card overflow-hidden">
          {/* 头部 */}
          <div className="gradient-bg-purple p-6 flex items-center gap-3">
            <button
              onClick={() => setCurrentPage('home')}
              className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-white">AI 配置</h1>
              <p className="text-white/70 text-sm mt-0.5">
                选择参与群聊的 AI 并配置角色 ({activeCount}/5)
              </p>
            </div>
          </div>

          {/* 提示 */}
          {enabledModels.length === 0 && (
            <div className="mx-6 mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-700 text-sm">
              请先在「设置」中启用至少一个模型，然后再配置 AI 角色。
            </div>
          )}

          {/* AI 角色列表 */}
          <div className="p-6 space-y-3">
            {localAgents.map((agent) => {
              const currentModel = enabledModels.find((m) => m.id === agent.model);
              const isExpanded = expandedAgent === agent.id;

              return (
                <div
                  key={agent.id}
                  className={`rounded-xl overflow-hidden border-2 transition-all ${
                    agent.isActive
                      ? 'border-blue-300 bg-blue-50/30 shadow-sm'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  {/* 折叠头部 */}
                  <div
                    className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
                    onClick={() => setExpandedAgent(isExpanded ? null : agent.id)}
                  >
                    <img
                      src={agent.avatar}
                      alt={agent.name}
                      className={`w-11 h-11 rounded-full bg-gray-100 shrink-0 ${
                        agent.isActive ? 'ring-2 ring-blue-400 ring-offset-1' : ''
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{agent.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          agent.isActive
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {agent.role}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 mt-0.5 truncate">
                        {currentModel ? (
                          <span>{currentModel.name} ({currentModel.provider})</span>
                        ) : (
                          <span className="text-amber-500">未选择模型</span>
                        )}
                      </div>
                    </div>

                    {/* 开关 */}
                    <label
                      className="relative inline-flex items-center cursor-pointer shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={agent.isActive}
                        onChange={() => toggleAgent(agent.id)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>

                    {/* 展开箭头 */}
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
                    )}
                  </div>

                  {/* 展开内容 - 不要求 agent.isActive */}
                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-4 border-t border-gray-100 pt-4 fade-in">
                      {/* 模型选择 */}
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                          <div className="w-6 h-6 gradient-bg-blue rounded-md flex items-center justify-center">
                            <Brain className="w-3.5 h-3.5 text-white" />
                          </div>
                          模型选择
                        </label>
                        <select
                          value={agent.model}
                          onChange={(e) => updateAgentField(agent.id, 'model', e.target.value)}
                          className="input-modern w-full px-3 py-2.5 text-sm"
                        >
                          <option value="">请选择模型</option>
                          {enabledModels.map((model) => (
                            <option key={model.id} value={model.id}>
                              {model.name} ({model.provider})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* 角色描述 */}
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                          <div className="w-6 h-6 gradient-bg-green rounded-md flex items-center justify-center">
                            <User className="w-3.5 h-3.5 text-white" />
                          </div>
                          角色描述
                        </label>
                        <textarea
                          value={agent.description}
                          onChange={(e) => updateAgentField(agent.id, 'description', e.target.value)}
                          placeholder="描述这个 AI 的角色和专长..."
                          rows={3}
                          className="input-modern w-full px-3 py-2.5 text-sm resize-none"
                        />
                      </div>

                      {/* Skill 配置 */}
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                          <div className="w-6 h-6 gradient-bg-orange rounded-md flex items-center justify-center">
                            <Wrench className="w-3.5 h-3.5 text-white" />
                          </div>
                          Skill 配置
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {skills.map((skill) => {
                            const isSelected = agent.skills.includes(skill.id);
                            return (
                              <button
                                key={skill.id}
                                onClick={() => toggleSkill(agent.id, skill.id)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                  isSelected
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                              >
                                {skill.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 保存按钮 */}
          <div className="p-6 border-t border-gray-100">
            <button
              onClick={handleSave}
              className="w-full py-3 btn-primary flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              保存配置
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
