import { create } from 'zustand';
import { ChatSession, AppSettings, AIAgent, Skill, Page, ChatMessage, User } from '../types';
import { storage, userStorage, defaultSettings, defaultAgents } from '../utils/storage';
import * as api from '../api/client';

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
  loadUserSessions: () => Promise<void>;

  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;

  agents: AIAgent[];
  updateAgents: (agents: AIAgent[]) => void;

  skills: Skill[];
  initialized: boolean;
  initApp: () => Promise<void>;

  isInActiveHours: () => boolean;
}

export const useStore = create<AppState>((set, get) => ({
  currentPage: 'home',
  setCurrentPage: (page) => set({ currentPage: page }),

  currentUser: userStorage.getCurrentUser(),
  login: (user) => {
    userStorage.setCurrentUser(user);
    set({ currentUser: user });
    get().loadUserSessions();
  },
  logout: () => {
    userStorage.logout();
    set({ currentUser: null, sessions: [], currentSession: null, currentPage: 'home' });
  },
  updateUser: (user) => {
    userStorage.updateUser(user);
    set({ currentUser: user });
  },

  sessions: [],
  currentSession: null,
  setCurrentSession: (session) => set({ currentSession: session }),

  loadUserSessions: async () => {
    const user = get().currentUser;
    if (!user) return;
    try {
      const sessions = await api.apiGetSessions(user.id);
      set({ sessions });
    } catch (err) {
      console.error('加载会话失败，使用本地缓存:', err);
      // 降级到本地存储
      const sessions = storage.getSessions(user.id);
      set({ sessions });
    }
  },

  addSession: (session) => {
    const sessions = [...get().sessions, session];
    set({ sessions, currentSession: session });
    // 同时保存到服务端和本地
    api.apiSaveSession(session).catch((err) => console.error('保存会话到服务端失败:', err));
    storage.saveSessions(sessions);
  },

  updateSession: (session) => {
    const sessions = get().sessions.map((s) => (s.id === session.id ? session : s));
    set({ sessions, currentSession: session });
    api.apiUpdateSession(session).catch((err) => console.error('更新会话到服务端失败:', err));
    storage.saveSessions(sessions);
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
    storage.saveSessions(sessions);
  },

  addMessage: (sessionId, message) => {
    const sessions = get().sessions.map((s) =>
      s.id === sessionId ? { ...s, messages: [...s.messages, message] } : s
    );
    const updatedSession = sessions.find((s) => s.id === sessionId);
    const current = get().currentSession;
    if (current?.id === sessionId) {
      set({ currentSession: { ...current, messages: [...current.messages, message] } });
    }
    set({ sessions });
    if (updatedSession) {
      // 防抖：不要每条消息都立即保存到服务端，改为批量保存
      storage.saveSessions(sessions);
    }
  },

  settings: storage.getSettings(),
  updateSettings: async (newSettings) => {
    const settings = { ...get().settings, ...newSettings };
    storage.saveSettings(settings);
    set({ settings });
    api.apiUpdateSettings(settings).catch((err) => console.error('保存设置到服务端失败:', err));
  },

  agents: storage.getAgents(),
  updateAgents: (agents) => {
    storage.saveAgents(agents);
    set({ agents });
    api.apiSaveAgents(agents).catch((err) => console.error('保存 Agent 到服务端失败:', err));
  },

  skills: storage.getSkills(),

  initialized: false,
  initApp: async () => {
    const currentUser = get().currentUser;
    try {
      // 从服务端加载设置
      const serverSettings = await api.apiGetSettings();
      const mergedSettings = { ...defaultSettings, ...serverSettings, apiKeys: { ...defaultSettings.apiKeys, ...serverSettings.apiKeys } };
      storage.saveSettings(mergedSettings);
      set({ settings: mergedSettings });
    } catch {
      // 服务端不可用，使用本地
      console.log('服务端不可用，使用本地存储');
    }

    try {
      const serverAgents = await api.apiGetAgents();
      storage.saveAgents(serverAgents);
      set({ agents: serverAgents });
    } catch {
      set({ agents: storage.getAgents() });
    }

    // 如果已登录，加载用户会话
    if (currentUser) {
      await get().loadUserSessions();
    }

    set({ initialized: true });
  },

  isInActiveHours: () => {
    const { settings } = get();
    if (!settings.activeHours.enabled) return true;
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [startH, startM] = settings.activeHours.start.split(':').map(Number);
    const [endH, endM] = settings.activeHours.end.split(':').map(Number);
    const startTime = startH * 60 + startM;
    const endTime = endH * 60 + endM;
    return currentTime >= startTime && currentTime <= endTime;
  },
}));
