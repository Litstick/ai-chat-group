import type { ChatSession, AppSettings, AIAgent, Skill, User } from '../types';

const STORAGE_KEYS = {
  currentUser: 'ai_chat_current_user',
  users: 'ai_chat_users',
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
    // 海外模型
    { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', modelId: 'gpt-4o', isEnabled: true, isDefault: true },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', modelId: 'gpt-4o-mini', isEnabled: false, isDefault: false },
    { id: 'claude-sonnet', name: 'Claude Sonnet 4', provider: 'Anthropic', modelId: 'claude-sonnet-4-20250514', isEnabled: false, isDefault: false },
    { id: 'gemini', name: 'Gemini 2.5 Pro', provider: 'Google', modelId: 'gemini-2.5-pro-preview-06-05', isEnabled: false, isDefault: false },
    // 国内模型
    { id: 'deepseek-chat', name: 'DeepSeek V3', provider: 'DeepSeek', modelId: 'deepseek-chat', isEnabled: false, isDefault: false },
    { id: 'deepseek-reasoner', name: 'DeepSeek R1', provider: 'DeepSeek', modelId: 'deepseek-reasoner', isEnabled: false, isDefault: false },
    { id: 'qwen-max', name: '通义千问 Max', provider: 'Qwen', modelId: 'qwen-max', isEnabled: false, isDefault: false },
    { id: 'qwen-plus', name: '通义千问 Plus', provider: 'Qwen', modelId: 'qwen-plus', isEnabled: false, isDefault: false },
    { id: 'moonshot-v1', name: 'Moonshot V1', provider: 'Moonshot', modelId: 'moonshot-v1-8k', isEnabled: false, isDefault: false },
    { id: 'glm-4', name: '智谱 GLM-4', provider: 'Zhipu', modelId: 'glm-4', isEnabled: false, isDefault: false },
    { id: 'ernie-4', name: '文心一言 4.0', provider: 'Baidu', modelId: 'ernie-4.0-8k', isEnabled: false, isDefault: false },
  ],
  apiKeys: {
    openai: '',
    anthropic: '',
    google: '',
    openaiBaseUrl: 'https://api.openai.com',
    anthropicBaseUrl: 'https://api.anthropic.com',
    googleBaseUrl: 'https://generativelanguage.googleapis.com',
    deepseek: '',
    deepseekBaseUrl: 'https://api.deepseek.com',
    qwen: '',
    qwenBaseUrl: 'https://dashscope.aliyuncs.com/compatible-mode',
    moonshot: '',
    moonshotBaseUrl: 'https://api.moonshot.cn',
    zhipu: '',
    zhipuBaseUrl: 'https://open.bigmodel.cn/api/paas',
    baidu: '',
    baiduBaseUrl: 'https://qianfan.baidubce.com',
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

// ===== 用户管理 =====

function getAllUsers(): User[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.users);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveAllUsers(users: User[]) {
  localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
}

export const userStorage = {
  getCurrentUser(): User | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.currentUser);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  setCurrentUser(user: User | null) {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.currentUser);
    }
  },

  register(username: string, password: string, nickname: string): User | string {
    const users = getAllUsers();
    if (users.find((u) => u.username === username)) {
      return '用户名已存在';
    }
    const user: User = {
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      username,
      nickname: nickname || username,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      createdAt: Date.now(),
    };
    users.push(user);
    saveAllUsers(users);
    // 存储密码（简单实现，生产环境应使用后端）
    localStorage.setItem(`pwd_${user.id}`, password);
    return user;
  },

  login(username: string, password: string): User | string {
    const users = getAllUsers();
    const user = users.find((u) => u.username === username);
    if (!user) return '用户不存在';
    const storedPwd = localStorage.getItem(`pwd_${user.id}`);
    if (storedPwd !== password) return '密码错误';
    return user;
  },

  logout() {
    localStorage.removeItem(STORAGE_KEYS.currentUser);
  },

  updateUser(user: User) {
    const users = getAllUsers();
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx >= 0) {
      users[idx] = user;
      saveAllUsers(users);
    }
    localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(user));
  },
};

// ===== 会话管理（按用户隔离） =====

export const storage = {
  getSessions(userId?: string): ChatSession[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.sessions);
      const all: ChatSession[] = data ? JSON.parse(data) : [];
      if (userId) {
        return all.filter((s) => s.userId === userId);
      }
      return all;
    } catch {
      return [];
    }
  },

  saveSessions(sessions: ChatSession[]) {
    try {
      // 读取已有数据，合并保存（避免覆盖其他用户的数据）
      const existing = localStorage.getItem(STORAGE_KEYS.sessions);
      const all: ChatSession[] = existing ? JSON.parse(existing) : [];
      const existingIds = new Set(sessions.map((s) => s.id));
      // 保留不属于当前批次的旧数据
      const kept = all.filter((s) => !existingIds.has(s.id));
      const merged = [...kept, ...sessions];
      localStorage.setItem(STORAGE_KEYS.sessions, JSON.stringify(merged));
    } catch {
      localStorage.setItem(STORAGE_KEYS.sessions, JSON.stringify(sessions));
    }
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
