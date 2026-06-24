import type { ChatSession, AppSettings, AIAgent, Skill } from '../types';

const STORAGE_KEYS = {
  sessions: 'ai_chat_sessions',
  settings: 'ai_chat_settings',
  agents: 'ai_chat_agents',
  skills: 'ai_chat_skills',
};

export const defaultSettings: AppSettings = {
  activeHours: {
    enabled: false,
    start: '09:00',
    end: '18:00',
  },
  aiCapabilities: {
    imageUnderstanding: false,
    emojiReply: true,
    voiceReply: false,
    videoShare: false,
  },
  chatDuration: {
    enabled: false,
    minutes: 30,
  },
  models: [
    { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', modelId: 'gpt-4o', isDefault: true },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', modelId: 'gpt-4o-mini', isDefault: false },
    { id: 'claude-sonnet', name: 'Claude Sonnet 4', provider: 'Anthropic', modelId: 'claude-sonnet-4-20250514', isDefault: false },
    { id: 'gemini', name: 'Gemini 2.5 Pro', provider: 'Google', modelId: 'gemini-2.5-pro-preview-06-05', isDefault: false },
  ],
  apiKeys: {
    openai: '',
    anthropic: '',
    google: '',
    openaiBaseUrl: 'https://api.openai.com',
    anthropicBaseUrl: 'https://api.anthropic.com',
    googleBaseUrl: 'https://generativelanguage.googleapis.com',
  },
};

export const defaultAgents: AIAgent[] = [
  {
    id: 'agent-1',
    name: '小智',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=1',
    role: '产品经理',
    description: '擅长需求分析和产品设计',
    model: 'gpt-4o',
    skills: [],
    isActive: true,
  },
  {
    id: 'agent-2',
    name: '小码',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=2',
    role: '开发工程师',
    description: '全栈开发专家',
    model: 'gpt-4o',
    skills: [],
    isActive: true,
  },
  {
    id: 'agent-3',
    name: '小设',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=3',
    role: 'UI设计师',
    description: '专注于用户体验和视觉设计',
    model: 'claude-sonnet',
    skills: [],
    isActive: true,
  },
  {
    id: 'agent-4',
    name: '小数',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=4',
    role: '数据分析师',
    description: '数据洞察和可视化专家',
    model: 'gemini',
    skills: [],
    isActive: false,
  },
  {
    id: 'agent-5',
    name: '小测',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=5',
    role: '测试工程师',
    description: '质量保证和自动化测试',
    model: 'gpt-4o-mini',
    skills: [],
    isActive: false,
  },
];

export const defaultSkills: Skill[] = [
  { id: 'skill-1', name: '代码审查', description: '审查代码质量和最佳实践', icon: 'code' },
  { id: 'skill-2', name: '数据分析', description: '处理和分析数据集', icon: 'bar-chart' },
  { id: 'skill-3', name: '文档编写', description: '生成技术文档和说明', icon: 'file-text' },
  { id: 'skill-4', name: '头脑风暴', description: '提供创意和解决方案', icon: 'lightbulb' },
  { id: 'skill-5', name: '翻译', description: '多语言翻译和本地化', icon: 'globe' },
  { id: 'skill-6', name: '搜索', description: '网络搜索和信息检索', icon: 'search' },
];

export const storage = {
  getSessions(): ChatSession[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.sessions);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveSessions(sessions: ChatSession[]) {
    localStorage.setItem(STORAGE_KEYS.sessions, JSON.stringify(sessions));
  },

  getSettings(): AppSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.settings);
      if (data) {
        const parsed = JSON.parse(data);
        return { ...defaultSettings, ...parsed, apiKeys: { ...defaultSettings.apiKeys, ...parsed.apiKeys } };
      }
      return defaultSettings;
    } catch {
      return defaultSettings;
    }
  },

  saveSettings(settings: AppSettings) {
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
  },

  getAgents(): AIAgent[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.agents);
      return data ? JSON.parse(data) : defaultAgents;
    } catch {
      return defaultAgents;
    }
  },

  saveAgents(agents: AIAgent[]) {
    localStorage.setItem(STORAGE_KEYS.agents, JSON.stringify(agents));
  },

  getSkills(): Skill[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.skills);
      return data ? JSON.parse(data) : defaultSkills;
    } catch {
      return defaultSkills;
    }
  },

  saveSkills(skills: Skill[]) {
    localStorage.setItem(STORAGE_KEYS.skills, JSON.stringify(skills));
  },
};
