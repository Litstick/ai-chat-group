import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import {
  Clock,
  Eye,
  MessageSquare,
  Brain,
  Plus,
  Trash2,
  Key,
  Globe,
  AlertTriangle,
  ChevronRight,
  ArrowLeft,
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

// ===== API Key 二级页面 =====
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
    <div className="min-h-screen bg-[#f0f2f5] p-4">
      <div className="max-w-2xl mx-auto slide-up">
        <div className="section-card overflow-hidden">
          <div className="gradient-bg-blue p-6 flex items-center gap-3">
            <button onClick={onBack} className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-white">API Key 配置</h1>
              <p className="text-white/70 text-sm mt-0.5">已配置 {configuredCount}/{Object.keys(PROVIDER_CONFIG).length} 个提供商</p>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {Object.entries(PROVIDER_CONFIG).map(([key, cfg]) => {
              const hasKey = !!localApiKeys[cfg.keyField];
              return (
                <div key={key} className={`rounded-xl p-4 border transition-colors ${hasKey ? 'bg-green-50/50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 gradient-bg-blue rounded-xl flex items-center justify-center shadow-sm">
                        <span className="text-sm font-bold text-white">{cfg.letter}</span>
                      </div>
                      <span className="font-semibold text-gray-900">{cfg.label}</span>
                    </div>
                    {hasKey ? (
                      <span className="flex items-center gap-1 text-xs text-green-700 bg-green-100 px-2.5 py-1 rounded-full font-medium">
                        <ShieldCheck className="w-3 h-3" />
                        已配置
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
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
                        className="input-modern w-full px-3 py-2.5 pr-12 text-sm font-mono"
                      />
                      <button
                        onClick={() => toggleKeyVisibility(key)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-medium"
                      >
                        {showKeys[key] ? '隐藏' : '显示'}
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-gray-400 shrink-0" />
                      <input
                        type="text"
                        value={localApiKeys[cfg.urlField]}
                        onChange={(e) => updateApiKey(cfg.urlField, e.target.value)}
                        placeholder="API Base URL"
                        className="input-modern flex-1 px-3 py-2.5 text-sm"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-6 border-t border-gray-100 flex gap-3">
            <button onClick={handleSave} className="flex-1 py-3 btn-primary">保存</button>
            <button onClick={onBack} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors">取消</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== 模型管理二级页面 =====
function ModelPage({ onBack }: { onBack: () => void }) {
  const { settings, updateSettings } = useStore();
  const [localModels, setLocalModels] = useState(settings.models);
  const [newModel, setNewModel] = useState({ name: '', provider: '', modelId: '' });
  const [validationError, setValidationError] = useState<string | null>(null);

  const toggleModelEnabled = (id: string) => {
    setValidationError(null);
    setLocalModels((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const newEnabled = !m.isEnabled;
        if (newEnabled) {
          const apiKey = getApiKeyForProvider(settings.apiKeys, m.provider);
          if (!apiKey) {
            setValidationError(`模型「${m.name}」(${m.provider}) 需要先配置 API Key，请返回设置页面配置。`);
            return m;
          }
        }
        return { ...m, isEnabled: newEnabled };
      })
    );
  };

  const setDefaultModel = (id: string) => {
    setLocalModels((prev) => prev.map((m) => ({ ...m, isDefault: m.id === id })));
  };

  const addModel = () => {
    if (!newModel.name || !newModel.provider || !newModel.modelId) return;
    setLocalModels((prev) => [
      ...prev,
      { id: `model-${Date.now()}`, name: newModel.name, provider: newModel.provider, modelId: newModel.modelId, isEnabled: false, isDefault: false },
    ]);
    setNewModel({ name: '', provider: '', modelId: '' });
  };

  const removeModel = (id: string) => {
    setLocalModels((prev) => prev.filter((m) => m.id !== id));
  };

  const handleSave = () => {
    const enabledModels = localModels.filter((m) => m.isEnabled);
    for (const model of enabledModels) {
      const apiKey = getApiKeyForProvider(settings.apiKeys, model.provider);
      if (!apiKey) {
        setValidationError(`模型「${model.name}」(${model.provider}) 已勾选但未配置 API Key，请返回设置页面配置。`);
        return;
      }
    }
    setValidationError(null);
    updateSettings({ models: localModels });
    onBack();
  };

  const enabledCount = localModels.filter((m) => m.isEnabled).length;

  return (
    <div className="min-h-screen bg-[#f0f2f5] p-4">
      <div className="max-w-2xl mx-auto slide-up">
        <div className="section-card overflow-hidden">
          <div className="gradient-bg-orange p-6 flex items-center gap-3">
            <button onClick={onBack} className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-white">模型管理</h1>
              <p className="text-white/70 text-sm mt-0.5">已启用 {enabledCount} 个模型</p>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {validationError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div className="text-sm text-red-700 flex-1">{validationError}</div>
                <button onClick={() => setValidationError(null)} className="text-red-400 hover:text-red-600 shrink-0 text-sm">关闭</button>
              </div>
            )}

            <div className="space-y-2">
              {localModels.map((model) => {
                const apiKey = getApiKeyForProvider(settings.apiKeys, model.provider);
                const hasKey = !!apiKey;
                return (
                  <div
                    key={model.id}
                    className={`flex items-center justify-between rounded-xl p-4 border-2 transition-all ${
                      model.isEnabled
                        ? 'border-blue-400 bg-blue-50/50 shadow-sm'
                        : hasKey
                          ? 'border-gray-200 bg-white hover:border-gray-300'
                          : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={model.isEnabled}
                        onChange={() => toggleModelEnabled(model.id)}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <div className="font-medium text-gray-900 flex items-center gap-2">
                          {model.name}
                          {!hasKey && (
                            <span className="text-xs text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded font-medium">需配置 Key</span>
                          )}
                          {model.isDefault && (
                            <span className="text-xs text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded font-medium">默认</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">{model.provider} / {model.modelId}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setDefaultModel(model.id)}
                        className={`px-2.5 py-1 text-xs rounded-lg transition-colors font-medium ${
                          model.isDefault
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
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

            <div className="border-t-2 border-dashed border-gray-200 pt-4">
              <p className="text-sm font-medium text-gray-600 mb-3">添加自定义模型</p>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="显示名称"
                    value={newModel.name}
                    onChange={(e) => setNewModel({ ...newModel, name: e.target.value })}
                    className="input-modern flex-1 px-3 py-2.5 text-sm"
                  />
                  <select
                    value={newModel.provider}
                    onChange={(e) => setNewModel({ ...newModel, provider: e.target.value })}
                    className="input-modern px-3 py-2.5 text-sm w-36"
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
                    className="input-modern flex-1 px-3 py-2.5 text-sm"
                  />
                  <button onClick={addModel} className="btn-primary px-5 py-2.5 text-sm flex items-center gap-1.5">
                    <Plus className="w-4 h-4" />
                    添加
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-gray-100 flex gap-3">
            <button onClick={handleSave} className="flex-1 py-3 btn-primary">保存</button>
            <button onClick={onBack} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors">取消</button>
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
  const [subPage, setSubPage] = useState<'none' | 'apikey' | 'model'>('none');

  // 正确方式：用 useEffect 监听 store settings 变化，同步到 localSettings
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  if (subPage === 'apikey') {
    return <ApiKeyPage onBack={() => setSubPage('none')} />;
  }

  if (subPage === 'model') {
    return <ModelPage onBack={() => setSubPage('none')} />;
  }

  const handleSave = () => {
    // 验证：勾选的模型必须有对应的 API Key
    const enabledModels = localSettings.models.filter((m) => m.isEnabled);
    for (const model of enabledModels) {
      const apiKey = getApiKeyForProvider(localSettings.apiKeys, model.provider);
      if (!apiKey) {
        alert(`模型「${model.name}」(${model.provider}) 已勾选但未配置 API Key，请先前往 API Key 配置页面填写。`);
        return;
      }
    }
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

  const enabledCount = localSettings.models.filter((m) => m.isEnabled).length;

  return (
    <div className="min-h-screen bg-[#f0f2f5] p-4">
      <div className="max-w-2xl mx-auto slide-up">
        <div className="section-card overflow-hidden">
          <div className="gradient-bg-blue p-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentPage('home')}
                className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-white">设置</h1>
                <p className="text-white/70 text-sm mt-0.5">配置 AI 聊天群的各项参数</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* API Key 入口 */}
            <button
              onClick={() => setSubPage('apikey')}
              className="w-full rounded-xl p-4 flex items-center justify-between hover:shadow-md transition-all border border-gray-100 bg-white"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 gradient-bg-rose rounded-xl flex items-center justify-center shadow-sm">
                  <Key className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-gray-900">API Key 配置</div>
                  <div className="text-sm text-gray-500">管理 AI 提供商密钥和接口地址</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>

            {/* 模型管理入口 */}
            <button
              onClick={() => setSubPage('model')}
              className="w-full rounded-xl p-4 flex items-center justify-between hover:shadow-md transition-all border border-gray-100 bg-white"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 gradient-bg-orange rounded-xl flex items-center justify-center shadow-sm">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-gray-900">模型管理</div>
                  <div className="text-sm text-gray-500">已启用 {enabledCount} 个模型</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>

            {/* 分隔 */}
            <div className="border-t border-gray-100"></div>

            {/* 群活跃时间 */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-5 h-5 text-blue-500" />
                <h2 className="text-base font-semibold text-gray-900">群活跃时间段</h2>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localSettings.activeHours.enabled}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, activeHours: { ...localSettings.activeHours, enabled: e.target.checked } })
                    }
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700 text-sm">启用活跃时间段限制</span>
                </label>
                {localSettings.activeHours.enabled && (
                  <div className="flex items-center gap-3 pl-8">
                    <input type="time" value={localSettings.activeHours.start}
                      onChange={(e) => setLocalSettings({ ...localSettings, activeHours: { ...localSettings.activeHours, start: e.target.value } })}
                      className="input-modern px-3 py-2 text-sm"
                    />
                    <span className="text-gray-400 text-sm">至</span>
                    <input type="time" value={localSettings.activeHours.end}
                      onChange={(e) => setLocalSettings({ ...localSettings, activeHours: { ...localSettings.activeHours, end: e.target.value } })}
                      className="input-modern px-3 py-2 text-sm"
                    />
                  </div>
                )}
              </div>
            </section>

            {/* AI 视听能力 */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Eye className="w-5 h-5 text-purple-500" />
                <h2 className="text-base font-semibold text-gray-900">AI 视听能力</h2>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                {[
                  { key: 'imageUnderstanding' as const, label: '图片理解', desc: '理解和分析图片内容' },
                  { key: 'emojiReply' as const, label: '表情包回复', desc: '使用表情包回复' },
                  { key: 'voiceReply' as const, label: '语音回复', desc: '发送语音消息' },
                  { key: 'videoShare' as const, label: '视频分享', desc: '分享和讨论视频' },
                ].map((item) => (
                  <label key={item.key} className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={localSettings.aiCapabilities[item.key]}
                      onChange={() => toggleCapability(item.key)}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-gray-900 text-sm font-medium">{item.label}</span>
                      <span className="text-gray-400 text-sm ml-2">{item.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </section>

            {/* 聊天时长 */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-5 h-5 text-green-500" />
                <h2 className="text-base font-semibold text-gray-900">聊天时长限制</h2>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localSettings.chatDuration.enabled}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, chatDuration: { ...localSettings.chatDuration, enabled: e.target.checked } })
                    }
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700 text-sm">启用自动终止</span>
                </label>
                {localSettings.chatDuration.enabled && (
                  <div className="flex items-center gap-3 pl-8">
                    <input type="number" min={5} max={180} value={localSettings.chatDuration.minutes}
                      onChange={(e) => setLocalSettings({ ...localSettings, chatDuration: { ...localSettings.chatDuration, minutes: parseInt(e.target.value) || 30 } })}
                      className="input-modern w-24 px-3 py-2 text-sm"
                    />
                    <span className="text-gray-500 text-sm">分钟</span>
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="p-6 border-t border-gray-100 flex gap-3">
            <button onClick={handleSave} className="flex-1 py-3 btn-primary">保存设置</button>
            <button onClick={() => setCurrentPage('home')} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors">取消</button>
          </div>
        </div>
      </div>
    </div>
  );
}
