import { ChatSession, AppSettings, AIAgent, Skill } from '../types';

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
    { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI', isDefault: true },
    { id: 'gpt-3.5', name: 'GPT-3.5', provider: 'OpenAI', isDefault: false },
    { id: 'claude-3', name: 'Claude 3', provider: 'Anthropic', isDefault: false },
    { id: 'gemini', name: 'Gemini Pro', provider: 'Google', isDefault: false },
  ],
};

export const defaultAgents: AIAgent[] = [
  {
    id: 'agent-1',
    name: '小智',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=1',
    role: '产品经理',
    description: '擅长需求分析和产品设计',
    model: 'gpt-4',
    skills: [],
    isActive: true,
  },
  {
    id: 'agent-2',
    name: '小码',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=2',
    role: '开发工程师',
    description: '全栈开发专家',
    model: 'gpt-4',
    skills: [],
    isActive: true,
  },
  {
    id: 'agent-3',
    name: '小设',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=3',
    role: 'UI设计师',
    description: '专注于用户体验和视觉设计',
    model: 'claude-3',
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
    model: 'gpt-3.5',
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
      return data ? { ...defaultSettings, ...JSON.parse(data) } : defaultSettings;
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
