import { useState } from 'react';
import { useStore } from '../store/useStore';
import type { AIAgent } from '../types';
import { User, Wrench, ChevronDown, ChevronUp, Save, ArrowLeft } from 'lucide-react';

export default function AgentConfig() {
  const { agents, updateAgents, skills, setCurrentPage } = useStore();
  const [localAgents, setLocalAgents] = useState<AIAgent[]>(agents);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);

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
    updateAgents(localAgents);
    setCurrentPage('home');
  };

  const activeCount = localAgents.filter((a) => a.isActive).length;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentPage('home')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">AI 配置</h1>
                <p className="text-gray-500 mt-1">
                  选择参与群聊的 AI 并配置角色 ({activeCount}/5)
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {localAgents.map((agent) => (
              <div
                key={agent.id}
                className={`border rounded-xl overflow-hidden transition-all ${
                  agent.isActive ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200 bg-white'
                }`}
              >
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer"
                  onClick={() => setExpandedAgent(expandedAgent === agent.id ? null : agent.id)}
                >
                  <img
                    src={agent.avatar}
                    alt={agent.name}
                    className="w-12 h-12 rounded-full bg-gray-100"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{agent.name}</span>
                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                        {agent.role}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 mt-0.5">{agent.model}</div>
                  </div>
                  <label
                    className="relative inline-flex items-center cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={agent.isActive}
                      onChange={() => toggleAgent(agent.id)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                  {expandedAgent === agent.id ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>

                {expandedAgent === agent.id && agent.isActive && (
                  <div className="px-4 pb-4 space-y-4 border-t border-gray-100 pt-4">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <User className="w-4 h-4" />
                        角色描述
                      </label>
                      <textarea
                        value={agent.description}
                        onChange={(e) => updateAgentField(agent.id, 'description', e.target.value)}
                        placeholder="描述这个 AI 的角色和专长..."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <Wrench className="w-4 h-4" />
                        Skill 配置
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {skills.map((skill) => (
                          <button
                            key={skill.id}
                            onClick={() => toggleSkill(agent.id, skill.id)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              agent.skills.includes(skill.id)
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {skill.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="p-6 border-t border-gray-100">
            <button
              onClick={handleSave}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
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
