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
  ChevronRight,
  ArrowLeft,
  Save,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import type { AIModel, APIKeyConfig } from '../types';

// 提供商配置映射
const PROVIDER_CONFIG: Record<string, { label: string; color: string; letter: string; keyField: keyof APIKeyConfig; urlField: keyof APIKeyConfig; placeholder: string }> = {
  openai: { label: 'OpenAI', color: 'green', letter: 'O', keyField: 'openai', urlField: 'openaiBaseUrl', placeholder: 'sk-...' },
  anthropic: { label: 'Anthropic', color: 'orange', letter: 'A', keyField: 'anthropic', urlField: 'anthropicBaseUrl', placeholder: 'sk-ant-...' },
  google: { label: 'Google AI', color: 'blue', letter: 'G', keyField: 'google', urlField: 'googleBaseUrl', placeholder: 'AIza...' },
  deepseek: { label: 'DeepSeek', color: 'indigo', letter: 'D', keyField: 'deepseek', urlField: 'deepseekBaseUrl', placeholder: 'sk-...' },
  qwen: { label: '通义千问', color: 'purple', letter: 'Q', keyField: 'qwen', urlField: 'qwenBaseUrl', placeholder: 'sk-...' },
  moonshot: { label: 'Moonshot', color: 'sky', letter: 'M', keyField: 'moonshot', urlField: 'moonshotBaseUrl', placeholder: 'sk-...' },
  zhipu: { label: '智谱 AI', color: 'teal', letter: 'Z', keyField: 'zhipu', urlField: 'zhipuBaseUrl', placeholder: 'API Key' },
  baidu: { label: '百度文心一言', color: 'red', letter: 'B', keyField: 'baidu', urlField: 'baiduBaseUrl', placeholder: 'API Key' },
};

const PROVIDER_TO_LOWERCASE: Record<string, string> = {
  openai: 'openai', anthropic: 'anthropic', google: 'google',
  deepseek: 'deepseek', qwen: 'qwen', moonshot: 'moonshot',
  zhipu: 'zhipu', baidu: 'baidu',
};

function getApiKeyForProvider(apiKeys: APIKeyConfig, provider: string): string {
  const key = PROVIDER_TO_LOWERCASE[provider];
  if (!key) return '';
  return apiKeys[key as keyof APIKeyConfig] || '';
}

// ===== API Key 二级页面组件 =====
function ApiKeyPage({ onBack }: { onBack: () => void }) {
  const { settings, updateSettings } = useStore();
  const [localApiKeys, setLocalApiKeys] = useState(settings.apiKeys);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  const updateApiKey = (key: keyof APIKeyConfig, value: string) => {
    setLocalApiKeys((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    updateSettings({ apiKeys: localApiKeys });
    onBack();
  };

  const toggleKeyVisibility = (key: string) => {
    setShowKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const configuredCount = Object.entries(PROVIDER_CONFIG).filter(
    ([, cfg]) => localApiKeys[cfg.keyField]
  ).length;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center gap-3">
            <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">API Key 配置</h1>
              <p className="text-gray-500 mt-1">已配置 {configuredCount}/{Object.keys(PROVIDER_CONFIG).length} 个提供商</p>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {Object.entries(PROVIDER_CONFIG).map(([key, cfg]) => {
              const hasKey = !!localApiKeys[cfg.keyField];
              return (
                <div key={key} className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 bg-${cfg.color}-100 rounded-lg flex items-center justify-center`}>
                        <span className={`text-sm font-bold text-${cfg.color}-700`}>{cfg.letter}</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{cfg.label}</div>
                      </div>
                    </div>
                    {hasKey ? (
                      <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                        <ShieldCheck className="w-3 h-3" />
                        已配置
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                        <ShieldAlert className="w-3 h-3" />
                        未配置
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="relative">
                      <input
                        type={showKeys[key] ? 'text' : 'password'}
                        value={localApiKeys[cfg.keyField]}
                        onChange={(e) => updateApiKey(cfg.keyField, e.target.value)}
                        placeholder={cfg.placeholder}
                        className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                      />
                      <button
                        onClick={() => toggleKeyVisibility(key)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                      >
                        {showKeys[key] ? '隐藏' : '显示'}
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={localApiKeys[cfg.urlField]}
                        onChange={(e) => updateApiKey(cfg.urlField, e.target.value)}
                        placeholder="API Base URL"
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-6 border-t border-gray-100 flex gap-3">
            <button
              onClick={handleSave}
              className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
            >
              保存
            </button>
            <button
              onClick={onBack}
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

// ===== 主设置页面 =====
export default function Settings() {
  const { settings, updateSettings, setCurrentPage } = useStore();
  const [localSettings, setLocalSettings] = useState(settings);
  const [showApiKeyPage, setShowApiKeyPage] = useState(false);
  const [newModel, setNewModel] = useState({ name: '', provider: '', modelId: '' });
  const [validationError, setValidationError] = useState<string | null>(null);

  if (showApiKeyPage) {
    return <ApiKeyPage onBack={() => setShowApiKeyPage(false)} />;
  }

  const handleSave = () => {
    // 验证：勾选的模型必须有对应的 API Key
    const enabledModels = localSettings.models.filter((m) => m.isEnabled);
    for (const model of enabledModels) {
      const apiKey = getApiKeyForProvider(localSettings.apiKeys, model.provider);
      if (!apiKey) {
        setValidationError(`模型「${model.name}」(${model.provider}) 已勾选但未配置 API Key，请先前往 API Key 配置页面填写。`);
        return;
      }
    }
    setValidationError(null);
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

  const toggleModelEnabled = (id: string) => {
    setLocalSettings({
      ...localSettings,
      models: localSettings.models.map((m) => {
        if (m.id !== id) return m;
        const newEnabled = !m.isEnabled;
        if (newEnabled) {
          // 勾选时检查 API Key
          const apiKey = getApiKeyForProvider(localSettings.apiKeys, m.provider);
          if (!apiKey) {
            setValidationError(`模型「${m.name}」(${m.provider}) 需要先配置 API Key。`);
            return m;
          }
        }
        return { ...m, isEnabled: newEnabled };
      }),
    });
  };

  const addModel = () => {
    if (!newModel.name || !newModel.provider || !newModel.modelId) return;
    const model = {
      id: `model-${Date.now()}`,
      name: newModel.name,
      provider: newModel.provider,
      modelId: newModel.modelId,
      isEnabled: false,
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

  const enabledCount = localSettings.models.filter((m) => m.isEnabled).length;
  const configuredProviders = new Set(
    localSettings.models
      .filter((m) => m.isEnabled)
      .map((m) => m.provider)
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h1 className="text-2xl font-bold text-gray-900">设置</h1>
            <p className="text-gray-500 mt-1">配置 AI 聊天群的各项参数</p>
          </div>

          <div className="p-6 space-y-8">
            {/* API Key 入口卡片 */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Key className="w-5 h-5 text-red-600" />
                <h2 className="text-lg font-semibold text-gray-900">API Key 配置</h2>
              </div>
              <button
                onClick={() => setShowApiKeyPage(true)}
                className="w-full bg-gray-50 rounded-xl p-4 flex items-center justify-between hover:bg-gray-100 transition-colors border border-gray-200"
              >
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-1">
                    {Object.entries(PROVIDER_CONFIG).slice(0, 4).map(([key, cfg]) => {
                      const hasKey = !!localSettings.apiKeys[cfg.keyField];
                      return (
                        <div
                          key={key}
                          className={`w-7 h-7 rounded-full flex items-center justify-center border-2 border-white ${
                            hasKey ? 'bg-green-100' : 'bg-gray-200'
                          }`}
                        >
                          <span className={`text-xs font-bold ${hasKey ? 'text-green-700' : 'text-gray-400'}`}>
                            {cfg.letter}
                          </span>
                        </div>
                      );
                    })}
                    <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center border-2 border-white text-xs text-gray-400">
                      +{Object.keys(PROVIDER_CONFIG).length - 4}
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">
                      管理提供商密钥
                    </div>
                    <div className="text-sm text-gray-500">
                      {configuredProviders.size} 个提供商已启用，共 {Object.keys(PROVIDER_CONFIG).length} 个可选
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </section>

            {/* 模型管理 - 多选 */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Brain className="w-5 h-5 text-orange-600" />
                <h2 className="text-lg font-semibold text-gray-900">模型管理</h2>
                <span className="text-sm text-gray-500">已选 {enabledCount} 个</span>
              </div>
              {validationError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div className="text-sm text-red-700">{validationError}</div>
                  <button onClick={() => setValidationError(null)} className="text-red-400 hover:text-red-600 ml-auto shrink-0">关闭</button>
                </div>
              )}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="space-y-2">
                  {localSettings.models.map((model) => {
                    const apiKey = getApiKeyForProvider(localSettings.apiKeys, model.provider);
                    const hasKey = !!apiKey;
                    return (
                      <div
                        key={model.id}
                        className={`flex items-center justify-between rounded-lg p-3 border transition-colors ${
                          model.isEnabled
                            ? 'border-blue-200 bg-blue-50/50'
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={model.isEnabled}
                            onChange={() => toggleModelEnabled(model.id)}
                            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            title={hasKey ? '取消选择' : '需要先配置 API Key'}
                          />
                          <div>
                            <div className="font-medium text-gray-900 flex items-center gap-2">
                              {model.name}
                              {!hasKey && (
                                <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">需配置 Key</span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              {model.provider} / {model.modelId}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setDefaultModel(model.id)}
                            className={`px-2 py-1 text-xs rounded-md transition-colors ${
                              model.isDefault
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                            }`}
                            title="设为默认"
                          >
                            默认
                          </button>
                          <button
                            onClick={() => removeModel(model.id)}
                            className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="border-t border-gray-200 pt-3 space-y-2">
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
                      <option value="DeepSeek">DeepSeek</option>
                      <option value="Qwen">通义千问</option>
                      <option value="Moonshot">Moonshot</option>
                      <option value="Zhipu">智谱 AI</option>
                      <option value="Baidu">百度文心一言</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="模型 ID（如 gpt-4o, deepseek-chat）"
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
