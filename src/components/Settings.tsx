import { useState } from 'react';
import { useStore } from '../store/useStore';
import {
  Clock,
  Eye,
  MessageSquare,
  Brain,
  Plus,
  Trash2,
  Check,
  Key,
  Globe,
  AlertTriangle,
} from 'lucide-react';

export default function Settings() {
  const { settings, updateSettings, setCurrentPage } = useStore();
  const [localSettings, setLocalSettings] = useState(settings);
  const [newModel, setNewModel] = useState({ name: '', provider: '', modelId: '' });
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  const handleSave = () => {
    updateSettings(localSettings);
    setCurrentPage('home');
  };

  const toggleCapability = (key: keyof typeof settings.aiCapabilities) => {
    setLocalSettings({
      ...localSettings,
      aiCapabilities: {
        ...localSettings.aiCapabilities,
        [key]: !localSettings.aiCapabilities[key],
      },
    });
  };

  const addModel = () => {
    if (!newModel.name || !newModel.provider || !newModel.modelId) return;
    const model = {
      id: `model-${Date.now()}`,
      name: newModel.name,
      provider: newModel.provider,
      modelId: newModel.modelId,
      isDefault: false,
    };
    setLocalSettings({
      ...localSettings,
      models: [...localSettings.models, model],
    });
    setNewModel({ name: '', provider: '', modelId: '' });
  };

  const removeModel = (id: string) => {
    setLocalSettings({
      ...localSettings,
      models: localSettings.models.filter((m) => m.id !== id),
    });
  };

  const setDefaultModel = (id: string) => {
    setLocalSettings({
      ...localSettings,
      models: localSettings.models.map((m) => ({ ...m, isDefault: m.id === id })),
    });
  };

  const toggleKeyVisibility = (key: string) => {
    setShowKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const updateApiKey = (key: keyof typeof localSettings.apiKeys, value: string) => {
    setLocalSettings({
      ...localSettings,
      apiKeys: { ...localSettings.apiKeys, [key]: value },
    });
  };

  const hasAnyKey = localSettings.apiKeys.openai || localSettings.apiKeys.anthropic || localSettings.apiKeys.google;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h1 className="text-2xl font-bold text-gray-900">设置</h1>
            <p className="text-gray-500 mt-1">配置 AI 聊天群的各项参数</p>
          </div>

          <div className="p-6 space-y-8">
            {/* API Key 配置 */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Key className="w-5 h-5 text-red-600" />
                <h2 className="text-lg font-semibold text-gray-900">API Key 配置</h2>
              </div>
              {!hasAnyKey && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    尚未配置任何 API Key。AI 聊天功能需要至少配置一个提供商的 Key 才能正常工作。
                  </div>
                </div>
              )}
              <div className="space-y-4">
                {/* OpenAI */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <span className="text-sm font-bold text-green-700">O</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">OpenAI</div>
                        <div className="text-xs text-gray-500">GPT-4o, GPT-4o Mini 等</div>
                      </div>
                    </div>
                    {localSettings.apiKeys.openai && (
                      <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">已配置</span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="relative">
                      <input
                        type={showKeys.openai ? 'text' : 'password'}
                        value={localSettings.apiKeys.openai}
                        onChange={(e) => updateApiKey('openai', e.target.value)}
                        placeholder="sk-..."
                        className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                      />
                      <button
                        onClick={() => toggleKeyVisibility('openai')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showKeys.openai ? '隐藏' : '显示'}
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={localSettings.apiKeys.openaiBaseUrl}
                        onChange={(e) => updateApiKey('openaiBaseUrl', e.target.value)}
                        placeholder="API Base URL"
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Anthropic */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                        <span className="text-sm font-bold text-orange-700">A</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">Anthropic</div>
                        <div className="text-xs text-gray-500">Claude Sonnet 4 等</div>
                      </div>
                    </div>
                    {localSettings.apiKeys.anthropic && (
                      <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">已配置</span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="relative">
                      <input
                        type={showKeys.anthropic ? 'text' : 'password'}
                        value={localSettings.apiKeys.anthropic}
                        onChange={(e) => updateApiKey('anthropic', e.target.value)}
                        placeholder="sk-ant-..."
                        className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                      />
                      <button
                        onClick={() => toggleKeyVisibility('anthropic')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showKeys.anthropic ? '隐藏' : '显示'}
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={localSettings.apiKeys.anthropicBaseUrl}
                        onChange={(e) => updateApiKey('anthropicBaseUrl', e.target.value)}
                        placeholder="API Base URL"
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Google */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-sm font-bold text-blue-700">G</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">Google AI</div>
                        <div className="text-xs text-gray-500">Gemini 2.5 Pro 等</div>
                      </div>
                    </div>
                    {localSettings.apiKeys.google && (
                      <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">已配置</span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="relative">
                      <input
                        type={showKeys.google ? 'text' : 'password'}
                        value={localSettings.apiKeys.google}
                        onChange={(e) => updateApiKey('google', e.target.value)}
                        placeholder="AIza..."
                        className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                      />
                      <button
                        onClick={() => toggleKeyVisibility('google')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showKeys.google ? '隐藏' : '显示'}
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={localSettings.apiKeys.googleBaseUrl}
                        onChange={(e) => updateApiKey('googleBaseUrl', e.target.value)}
                        placeholder="API Base URL"
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 群活跃时间 */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">群活跃时间段</h2>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localSettings.activeHours.enabled}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        activeHours: { ...localSettings.activeHours, enabled: e.target.checked },
                      })
                    }
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">启用活跃时间段限制</span>
                </label>
                {localSettings.activeHours.enabled && (
                  <div className="flex items-center gap-4 pl-8">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">开始</span>
                      <input
                        type="time"
                        value={localSettings.activeHours.start}
                        onChange={(e) =>
                          setLocalSettings({
                            ...localSettings,
                            activeHours: { ...localSettings.activeHours, start: e.target.value },
                          })
                        }
                        className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <span className="text-gray-400">至</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">结束</span>
                      <input
                        type="time"
                        value={localSettings.activeHours.end}
                        onChange={(e) =>
                          setLocalSettings({
                            ...localSettings,
                            activeHours: { ...localSettings.activeHours, end: e.target.value },
                          })
                        }
                        className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* AI 视听能力 */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Eye className="w-5 h-5 text-purple-600" />
                <h2 className="text-lg font-semibold text-gray-900">AI 视听能力</h2>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                {[
                  { key: 'imageUnderstanding' as const, label: '图片理解', desc: 'AI 可以理解和分析图片内容' },
                  { key: 'emojiReply' as const, label: '表情包回复', desc: 'AI 可以使用表情包进行回复' },
                  { key: 'voiceReply' as const, label: '语音回复', desc: 'AI 可以发送语音消息' },
                  { key: 'videoShare' as const, label: '视频分享', desc: 'AI 可以分享和讨论视频内容' },
                ].map((item) => (
                  <label key={item.key} className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localSettings.aiCapabilities[item.key]}
                      onChange={() => toggleCapability(item.key)}
                      className="w-5 h-5 mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="text-gray-900 font-medium">{item.label}</div>
                      <div className="text-sm text-gray-500">{item.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </section>

            {/* 聊天时长 */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-5 h-5 text-green-600" />
                <h2 className="text-lg font-semibold text-gray-900">聊天时长限制</h2>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localSettings.chatDuration.enabled}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        chatDuration: { ...localSettings.chatDuration, enabled: e.target.checked },
                      })
                    }
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">启用自动终止</span>
                </label>
                {localSettings.chatDuration.enabled && (
                  <div className="flex items-center gap-4 pl-8">
                    <span className="text-sm text-gray-600">时长</span>
                    <input
                      type="number"
                      min={5}
                      max={180}
                      value={localSettings.chatDuration.minutes}
                      onChange={(e) =>
                        setLocalSettings({
                          ...localSettings,
                          chatDuration: {
                            ...localSettings.chatDuration,
                            minutes: parseInt(e.target.value) || 30,
                          },
                        })
                      }
                      className="w-24 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-gray-600">分钟</span>
                  </div>
                )}
              </div>
            </section>

            {/* 模型管理 */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Brain className="w-5 h-5 text-orange-600" />
                <h2 className="text-lg font-semibold text-gray-900">模型管理</h2>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                <div className="space-y-2">
                  {localSettings.models.map((model) => (
                    <div
                      key={model.id}
                      className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-200"
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setDefaultModel(model.id)}
                          className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            model.isDefault
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-400 hover:bg-gray-300'
                          }`}
                          title="设为默认"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <div>
                          <div className="font-medium text-gray-900">{model.name}</div>
                          <div className="text-xs text-gray-500">
                            {model.provider} / {model.modelId}
                          </div>
                        </div>
                      </div>
                      {!model.isDefault && (
                        <button
                          onClick={() => removeModel(model.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="显示名称"
                      value={newModel.name}
                      onChange={(e) => setNewModel({ ...newModel, name: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <select
                      value={newModel.provider}
                      onChange={(e) => setNewModel({ ...newModel, provider: e.target.value })}
                      className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="">提供商</option>
                      <option value="OpenAI">OpenAI</option>
                      <option value="Anthropic">Anthropic</option>
                      <option value="Google">Google</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="模型 ID（如 gpt-4o, claude-sonnet-4-20250514）"
                      value={newModel.modelId}
                      onChange={(e) => setNewModel({ ...newModel, modelId: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <button
                      onClick={addModel}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      添加
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="p-6 border-t border-gray-100 flex gap-3">
            <button
              onClick={handleSave}
              className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
            >
              保存设置
            </button>
            <button
              onClick={() => setCurrentPage('home')}
              className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
