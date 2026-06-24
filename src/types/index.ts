export interface AIAgent {
  id: string;
  name: string;
  avatar: string;
  role: string;
  description: string;
  model: string;
  skills: string[];
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
}

export interface ChatSession {
  id: string;
  topic: string;
  startTime: number;
  endTime?: number;
  messages: ChatMessage[];
  participants: AIAgent[];
  isActive: boolean;
  summary?: ChatSummary;
}

export interface ChatSummary {
  important: string[];
  secondary: string[];
  generatedAt: number;
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
}

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  isDefault: boolean;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export type Page = 'home' | 'settings' | 'chat' | 'history' | 'agents';
