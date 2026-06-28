export interface User {
  id: string;
  username: string;
  nickname: string;
  avatar: string;
  phone?: string;
  createdAt: number;
}

export interface AIAgent {
  id: string;
  name: string;
  avatar: string;
  role: string;
  description: string;
  model: string;
  expertise: string[];
  style: string;
  isActive: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  type: 'text' | 'image' | 'voice' | 'video' | 'emoji';
  timestamp: number;
  isAI: boolean;
  isHistory?: boolean;
}

export interface ChatSession {
  id: string;
  userId: string;
  topic: string;
  alias?: string;
  startTime: number;
  endTime?: number;
  messages: ChatMessage[];
  messageCount?: number;
  participants: AIAgent[];
  isActive: boolean;
  summary?: ChatSummary;
  settings?: SessionSettings;
  parentSessionId?: string;
  historyExpanded?: boolean;
  endReason?: 'manual' | 'topic_drift' | 'duration';
}

export interface ChatSummary {
  important: string[];
  secondary: string[];
  generatedAt: number;
}

export interface SessionSettings {
  chatDuration: {
    enabled: boolean;
    minutes: number;
  };
  activeHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  aiCapabilities: {
    imageUnderstanding: boolean;
    emojiReply: boolean;
    voiceReply: boolean;
    videoShare: boolean;
  };
  autoScroll: boolean;
  replyFrequency: 'slow' | 'medium' | 'fast';
  autoEndOnTopicDrift: boolean;
}

export interface AppSettings {
  activeHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  aiCapabilities: {
    imageUnderstanding: boolean;
    emojiReply: boolean;
    voiceReply: boolean;
    videoShare: boolean;
  };
  chatDuration: {
    enabled: boolean;
    minutes: number;
  };
  models: AIModel[];
  apiKeys: APIKeyConfig;
  autoScroll: boolean;
  theme: string;
  uiLayout: UILayout;
  replyFrequency: 'slow' | 'medium' | 'fast';
  autoEndOnTopicDrift: boolean;
}

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  modelId: string;
  isEnabled: boolean;
  isDefault: boolean;
}

export interface APIKeyConfig {
  openai: string;
  anthropic: string;
  google: string;
  openaiBaseUrl: string;
  anthropicBaseUrl: string;
  googleBaseUrl: string;
  deepseek: string;
  deepseekBaseUrl: string;
  qwen: string;
  qwenBaseUrl: string;
  moonshot: string;
  moonshotBaseUrl: string;
  zhipu: string;
  zhipuBaseUrl: string;
  baidu: string;
  baiduBaseUrl: string;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export type Page = 'home' | 'settings' | 'chat' | 'history' | 'agents' | 'profile' | 'login';

export type Theme = 'default' | 'dark' | 'warm' | 'cool' | 'purple';

export type UILayout = 'compact' | 'standard' | 'spacious';

