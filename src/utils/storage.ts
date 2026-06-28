import type { ChatSession, AppSettings, AIAgent, Skill, User, Theme, UILayout } from '../types';

const STORAGE_KEYS = {
  currentUser: 'ai_chat_current_user',
  users: 'ai_chat_users',
  sessions: 'ai_chat_sessions',
  settings: 'ai_chat_settings',
  agents: 'ai_chat_agents',
  skills: 'ai_chat_skills',
  theme: 'ai_chat_theme',
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
    { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', modelId: 'gpt-4o', isEnabled: true, isDefault: true },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', modelId: 'gpt-4o-mini', isEnabled: false, isDefault: false },
    { id: 'claude-sonnet', name: 'Claude Sonnet 4', provider: 'Anthropic', modelId: 'claude-sonnet-4-20250514', isEnabled: false, isDefault: false },
    { id: 'gemini', name: 'Gemini 2.5 Pro', provider: 'Google', modelId: 'gemini-2.5-pro-preview-06-05', isEnabled: false, isDefault: false },
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
  autoScroll: true,
  theme: 'default',
  uiLayout: 'standard' as UILayout,
  replyFrequency: 'medium',
  autoEndOnTopicDrift: true,
};

// ===== 预设聊天场景 =====

export interface ChatScenario {
  id: string;
  name: string;
  icon: string;
  description: string;
  defaultTopic: string;
  recommendedAgents: string[];
}

export const chatScenarios: ChatScenario[] = [
  {
    id: 'work',
    name: '工作协作',
    icon: 'briefcase',
    description: '产品、开发、设计、数据团队协作',
    defaultTopic: '设计并开发一个任务管理 App',
    recommendedAgents: ['agent-1', 'agent-2', 'agent-3'],
  },
  {
    id: 'study',
    name: '学习研究',
    icon: 'book-open',
    description: '深入探讨知识点，辅助学习',
    defaultTopic: '帮我理解 React 的 Hooks 原理',
    recommendedAgents: ['agent-6', 'agent-2'],
  },
  {
    id: 'writing',
    name: '内容创作',
    icon: 'pen-tool',
    description: '文章、故事、剧本创作',
    defaultTopic: '写一个科幻短篇故事大纲',
    recommendedAgents: ['agent-7', 'agent-6'],
  },
  {
    id: 'life',
    name: '生活助手',
    icon: 'home',
    description: '日常生活的规划和建议',
    defaultTopic: '帮我规划一次周末旅行',
    recommendedAgents: ['agent-6', 'agent-8'],
  },
  {
    id: 'health',
    name: '健康养生',
    icon: 'heart',
    description: '健身、饮食、健康咨询',
    defaultTopic: '设计一个适合上班族的健身计划',
    recommendedAgents: ['agent-8', 'agent-6'],
  },
  {
    id: 'finance',
    name: '投资理财',
    icon: 'trending-up',
    description: '投资分析、财务规划',
    defaultTopic: '分析一下当前市场环境下适合的投资策略',
    recommendedAgents: ['agent-9', 'agent-6'],
  },
  {
    id: 'entertainment',
    name: '娱乐休闲',
    icon: 'gamepad-2',
    description: '游戏、电影、音乐推荐',
    defaultTopic: '推荐几款好玩的独立游戏',
    recommendedAgents: ['agent-7', 'agent-8'],
  },
  {
    id: 'travel',
    name: '旅行攻略',
    icon: 'map',
    description: '旅行规划、景点推荐',
    defaultTopic: '规划一趟云南七日游行程',
    recommendedAgents: ['agent-8', 'agent-6', 'agent-7'],
  },
];

// ===== 主题配置 =====

export const themeList: { id: Theme; name: string; primaryColor: string }[] = [
  { id: 'default', name: '默认蓝', primaryColor: '#3b82f6' },
  { id: 'dark', name: '暗黑模式', primaryColor: '#6366f1' },
  { id: 'warm', name: '暖阳橙', primaryColor: '#f97316' },
  { id: 'cool', name: '清新绿', primaryColor: '#10b981' },
  { id: 'purple', name: '梦幻紫', primaryColor: '#8b5cf6' },
];

// ===== 默认 AI Agent 配置 =====

export const defaultAgents: AIAgent[] = [
  {
    id: 'agent-1',
    name: '小智',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=1',
    role: '产品经理',
    description: '擅长需求分析和产品设计，注重用户体验和商业价值',
    model: 'gpt-4o',
    expertise: ['需求分析', '产品设计', '用户研究', '竞品分析'],
    style: '逻辑清晰，善于拆解问题，注重用户价值',
    isActive: true,
  },
  {
    id: 'agent-2',
    name: '小码',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=2',
    role: '开发工程师',
    description: '全栈开发专家，精通前后端技术和架构设计',
    model: 'gpt-4o',
    expertise: ['前端开发', '后端开发', '系统架构', '性能优化'],
    style: '注重代码质量，提供可运行的完整实现',
    isActive: true,
  },
  {
    id: 'agent-3',
    name: '小设',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=3',
    role: 'UI设计师',
    description: '专注于用户体验和视觉设计，追求美感与实用的平衡',
    model: 'claude-sonnet',
    expertise: ['UI设计', '交互设计', '视觉设计', '设计系统'],
    style: '审美在线，注重细节，追求极致体验',
    isActive: true,
  },
  {
    id: 'agent-4',
    name: '小数',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=4',
    role: '数据分析师',
    description: '数据洞察和可视化专家，善于从数据中发现规律',
    model: 'gemini',
    expertise: ['数据分析', '可视化', '统计建模', '商业智能'],
    style: '数据驱动，结论有据，表达清晰',
    isActive: false,
  },
  {
    id: 'agent-5',
    name: '小测',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=5',
    role: '测试工程师',
    description: '质量保证和自动化测试专家，追求零缺陷',
    model: 'gpt-4o-mini',
    expertise: ['功能测试', '自动化测试', '性能测试', '安全测试'],
    style: '严谨细致，善于发现边界问题',
    isActive: false,
  },
  {
    id: 'agent-6',
    name: '小导师',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=6',
    role: '学习顾问',
    description: '耐心解答问题，擅长深入浅出讲解知识',
    model: 'gpt-4o',
    expertise: ['知识讲解', '学习规划', '答疑解惑', '思维训练'],
    style: '耐心细致，循序渐进，善于启发',
    isActive: false,
  },
  {
    id: 'agent-7',
    name: '小文',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=7',
    role: '创意作家',
    description: '擅长写作、创意构思和文案撰写',
    model: 'claude-sonnet',
    expertise: ['创意写作', '文案策划', '故事创作', '内容编辑'],
    style: '想象力丰富，文笔生动，创意十足',
    isActive: false,
  },
  {
    id: 'agent-8',
    name: '小生活',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=8',
    role: '生活达人',
    description: '熟悉生活百科、旅行攻略、美食推荐',
    model: 'gpt-4o',
    expertise: ['旅行规划', '美食推荐', '生活技巧', '健康养生'],
    style: '热情开朗，实用接地气，懂生活',
    isActive: false,
  },
  {
    id: 'agent-9',
    name: '小财',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=9',
    role: '理财顾问',
    description: '熟悉投资理财、市场分析、财务规划',
    model: 'deepseek-chat',
    expertise: ['投资分析', '财务规划', '市场研究', '风险管理'],
    style: '理性客观，数据说话，稳健务实',
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

// ===== 敏感词列表（话题合规检测） =====

export const sensitiveWords = [
  '赌博', '色情', '毒品', '暴力', '恐怖', '反动',
  '诈骗', '洗钱', '走私', '枪支', '弹药', '爆炸物',
  '传销', '非法集资', '假币', '邪教', '迷信',
];

// ===== 用户管理（本地缓存，服务端为主） =====

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

// ===== 会话管理（本地缓存，服务端为主） =====

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
      const existing = localStorage.getItem(STORAGE_KEYS.sessions);
      const all: ChatSession[] = existing ? JSON.parse(existing) : [];
      const existingIds = new Set(sessions.map((s) => s.id));
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
        return {
          ...defaultSettings,
          ...parsed,
          apiKeys: { ...defaultSettings.apiKeys, ...parsed.apiKeys },
        };
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
      if (data) {
        const parsed: AIAgent[] = JSON.parse(data);
        // 兼容旧数据：补充缺失字段
        return parsed.map((a) => ({
          ...a,
          expertise: a.expertise || [],
          style: a.style || '',
        }));
      }
      return defaultAgents;
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

  getTheme(): string {
    try {
      return localStorage.getItem(STORAGE_KEYS.theme) || 'default';
    } catch {
      return 'default';
    }
  },

  saveTheme(theme: string) {
    localStorage.setItem(STORAGE_KEYS.theme, theme);
  },
};
