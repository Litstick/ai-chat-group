import { create } from 'zustand';
import { ChatSession, AppSettings, AIAgent, Skill, Page, ChatMessage, User, APIKeyConfig } from '../types';
import { storage, userStorage } from '../utils/storage';
import * as api from '../api/client';
import { apiAddMessage, apiGetSessionMessages, apiUpdateUser, apiUpdateMessage, apiUpsertMessage } from '../api/client';

// 防抖 localStorage 写入
let saveSessionsTimer: ReturnType<typeof setTimeout> | null = null;
let pendingSessions: ChatSession[] | null = null;

function debouncedSaveSessions(sessions: ChatSession[]) {
  pendingSessions = sessions;
  if (saveSessionsTimer) return;
  saveSessionsTimer = setTimeout(() => {
    saveSessionsTimer = null;
    if (pendingSessions) {
      storage.saveSessions(pendingSessions);
      pendingSessions = null;
    }
  }, 300);
}

interface AppState {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;

  currentUser: User | null;
  login: (user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;

  sessions: ChatSession[];
  currentSession: ChatSession | null;
  setCurrentSession: (session: ChatSession | null) => void;
  addSession: (session: ChatSession) => void;
  updateSession: (session: ChatSession) => void;
  endSession: (sessionId: string) => void;
  addMessage: (sessionId: string, message: ChatMessage) => void;
  upsertMessage: (sessionId: string, message: ChatMessage) => void;
  updateMessageContent: (sessionId: string, messageId: string, content: string) => void;
  loadUserSessions: () => Promise<void>;
  loadSessionMessages: (sessionId: string, limit?: number, offset?: number) => Promise<void>;
  loadMoreSessionMessages: (sessionId: string, limit: number, offset: number) => Promise<{ hasMore: boolean }>;

  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;
  loadUserSettings: () => Promise<void>;

  agents: AIAgent[];
  updateAgents: (agents: AIAgent[]) => void;
  loadUserAgents: () => Promise<void>;

  skills: Skill[];
  initialized: boolean;
  initApp: () => Promise<void>;

  isInActiveHours: (session?: ChatSession | null) => boolean;
}

export const useStore = create<AppState>((set, get) => ({
  currentPage: 'home',
  setCurrentPage: (page) => set({ currentPage: page }),

  currentUser: userStorage.getCurrentUser(),
  login: (user) => {
    userStorage.setCurrentUser(user);
    set({ currentUser: user });
    get().loadUserSessions();
    get().loadUserSettings();
    get().loadUserAgents();
  },
  logout: () => {
    userStorage.logout();
    set({ currentUser: null, sessions: [], currentSession: null, currentPage: 'home' });
  },
  updateUser: (user: User) => {
    userStorage.updateUser(user);
    set({ currentUser: user });
    apiUpdateUser(user.id, {
      nickname: user.nickname,
      avatar: user.avatar,
      phone: user.phone,
    }).catch((err) => console.error('更新用户信息到服务端失败:', err));
  },

  sessions: [],
  currentSession: null,
  setCurrentSession: (session) => set({ currentSession: session }),

  loadUserSessions: async () => {
    const user = get().currentUser;
    if (!user) return;
    try {
      const sessions = await api.apiGetSessions(user.id);
      set({ sessions: sessions.map(s => ({ ...s, messages: s.messages || [] })) });
    } catch (err) {
      console.error('加载会话失败，使用本地缓存:', err);
      const sessions = storage.getSessions(user.id);
      set({ sessions: sessions.map(s => ({ ...s, messages: s.messages || [] })) });
    }
  },

  addSession: async (session) => {
    const sessions = [...get().sessions, session];
    set({ sessions, currentSession: session });
    debouncedSaveSessions(sessions);
    try {
      await api.apiSaveSession(session);
    } catch (err) {
      console.error('保存会话到服务端失败:', err);
    }
  },

  updateSession: (session) => {
    const sessions = get().sessions.map((s) => (s.id === session.id ? session : s));
    set({ sessions, currentSession: session });
    api.apiUpdateSession(session).catch((err) => console.error('更新会话到服务端失败:', err));
    debouncedSaveSessions(sessions);
  },

  endSession: (sessionId) => {
    const sessions = get().sessions.map((s) =>
      s.id === sessionId ? { ...s, isActive: false, endTime: Date.now() } : s
    );
    const endedSession = sessions.find((s) => s.id === sessionId);
    const current = get().currentSession;
    set({
      sessions,
      currentSession: current?.id === sessionId ? null : current,
    });
    if (endedSession) {
      api.apiUpdateSession(endedSession).catch((err) => console.error('结束会话失败:', err));
    }
    debouncedSaveSessions(sessions);
  },

  addMessage: (sessionId, message) => {
    const sessions = get().sessions.map((s) =>
      s.id === sessionId ? {
        ...s,
        messages: [...s.messages, message],
        messageCount: (s.messageCount ?? s.messages.length) + 1,
      } : s
    );
    const updatedSession = sessions.find((s) => s.id === sessionId);
    const current = get().currentSession;
    if (current?.id === sessionId) {
      set({ currentSession: { ...current, messages: [...current.messages, message] } });
    }
    set({ sessions });
    if (updatedSession) {
      debouncedSaveSessions(sessions);
      // 只有非空内容或非 AI 消息才写入数据库
      // AI 空消息（流式输出占位）由 upsertMessage 在流式完成后写入
      if (message.content || !message.isAI) {
        apiAddMessage(sessionId, message).catch((err) =>
          console.error('保存消息到服务端失败:', err)
        );
      }
    }
  },

  // 流式输出完成后一次性保存完整消息到数据库
  upsertMessage: (sessionId, message) => {
    apiUpsertMessage(sessionId, message.id, message).catch((err) =>
      console.error('Upsert 消息到服务端失败:', err)
    );
  },

  updateMessageContent: (sessionId, messageId, content) => {
    const updateMessages = (messages: ChatMessage[]) =>
      messages.map((m) => (m.id === messageId ? { ...m, content } : m));

    const sessions = get().sessions.map((s) =>
      s.id === sessionId ? { ...s, messages: updateMessages(s.messages) } : s
    );
    const current = get().currentSession;
    if (current?.id === sessionId) {
      set({ currentSession: { ...current, messages: updateMessages(current.messages) } });
    }
    set({ sessions });
    debouncedSaveSessions(sessions);
    apiUpdateMessage(sessionId, messageId, content).catch((err) =>
      console.error('更新消息内容到服务端失败:', err)
    );
  },

  loadSessionMessages: async (sessionId, limit, offset) => {
    try {
      const { messages, total } = await apiGetSessionMessages(sessionId, limit, offset);
      const sessions = get().sessions.map((s) =>
        s.id === sessionId ? { ...s, messages, messageCount: total } : s
      );
      const current = get().currentSession;
      if (current?.id === sessionId) {
        set({ currentSession: { ...current, messages } });
      }
      set({ sessions });
      debouncedSaveSessions(sessions);
    } catch (err) {
      console.error('加载会话消息失败:', err);
    }
  },

  loadMoreSessionMessages: async (sessionId, limit, offset) => {
    try {
      const { messages, hasMore, total } = await apiGetSessionMessages(sessionId, limit, offset);
      
      // Get existing messages
      const current = get().currentSession;
      const existingMessages = current?.id === sessionId ? current.messages : [];
      
      // Prepend new messages and deduplicate by id
      const mergedMap = new Map<string, ChatMessage>();
      for (const msg of [...messages, ...existingMessages]) {
        mergedMap.set(msg.id, msg);
      }
      const allMessages = Array.from(mergedMap.values()).sort((a, b) => a.timestamp - b.timestamp);
      
      const sessions = get().sessions.map((s) =>
        s.id === sessionId ? { ...s, messages: allMessages, messageCount: total } : s
      );
      if (current?.id === sessionId) {
        set({ currentSession: { ...current, messages: allMessages } });
      }
      set({ sessions });
      debouncedSaveSessions(sessions);
      
      return { hasMore };
    } catch (err) {
      console.error('加载更多消息失败:', err);
      return { hasMore: false };
    }
  },

  settings: storage.getSettings(),
  loadUserSettings: async () => {
    const user = get().currentUser;
    if (!user) return;
    try {
      const serverSettings = await api.apiGetSettings(user.id);
      const localSettings = storage.getSettings();
      const mergedApiKeys = { ...localSettings.apiKeys } as unknown as Record<string, string>;
      if (serverSettings?.apiKeys) {
        for (const [key, value] of Object.entries(serverSettings.apiKeys)) {
          if (value) {
            mergedApiKeys[key] = value as string;
          }
        }
      }
      const mergedSettings = { ...localSettings, ...serverSettings, apiKeys: mergedApiKeys as unknown as APIKeyConfig };
      storage.saveSettings(mergedSettings);
      set({ settings: mergedSettings });
    } catch (err) {
      console.error('加载用户设置失败，使用本地存储:', err);
    }
  },
  updateSettings: async (newSettings) => {
    const user = get().currentUser;
    const settings = { ...get().settings, ...newSettings };
    storage.saveSettings(settings);
    set({ settings });
    if (user) {
      api.apiUpdateSettings(user.id, settings).catch((err) => console.error('保存设置到服务端失败:', err));
    }
  },

  agents: storage.getAgents(),
  loadUserAgents: async () => {
    const user = get().currentUser;
    if (!user) return;
    try {
      const serverAgents = await api.apiGetAgents(user.id);
      if (Array.isArray(serverAgents) && serverAgents.length > 0) {
        storage.saveAgents(serverAgents);
        set({ agents: serverAgents });
      }
    } catch (err) {
      console.error('加载用户 AI 配置失败，使用本地存储:', err);
    }
  },
  updateAgents: (agents) => {
    const user = get().currentUser;
    storage.saveAgents(agents);
    set({ agents });
    if (user) {
      api.apiSaveAgents(user.id, agents).catch((err) => console.error('保存 Agent 到服务端失败:', err));
    }
  },

  skills: storage.getSkills(),

  initialized: false,
  initApp: async () => {
    const currentUser = get().currentUser;

    // 如果已登录，加载用户数据
    if (currentUser) {
      await Promise.all([
        get().loadUserSessions(),
        get().loadUserSettings(),
        get().loadUserAgents(),
      ]);
    }

    set({ initialized: true });
  },

  isInActiveHours: (session) => {
    const { settings } = get();
    const activeHours = session?.settings?.activeHours ?? settings.activeHours;
    if (!activeHours.enabled) return true;
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [startH, startM] = activeHours.start.split(':').map(Number);
    const [endH, endM] = activeHours.end.split(':').map(Number);
    const startTime = startH * 60 + startM;
    const endTime = endH * 60 + endM;
    return currentTime >= startTime && currentTime <= endTime;
  },
}));
