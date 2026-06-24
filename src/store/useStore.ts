import { create } from 'zustand';
import { ChatSession, AppSettings, AIAgent, Skill, Page, ChatMessage, User } from '../types';
import { storage, userStorage } from '../utils/storage';

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
  loadUserSessions: () => void;

  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;

  agents: AIAgent[];
  updateAgents: (agents: AIAgent[]) => void;

  skills: Skill[];

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

  loadUserSessions: () => {
    const user = get().currentUser;
    if (user) {
      const sessions = storage.getSessions(user.id);
      set({ sessions });
    }
  },

  addSession: (session) => {
    const sessions = [...get().sessions, session];
    storage.saveSessions(sessions);
    set({ sessions, currentSession: session });
  },

  updateSession: (session) => {
    const sessions = get().sessions.map((s) => (s.id === session.id ? session : s));
    storage.saveSessions(sessions);
    set({ sessions, currentSession: session });
  },

  endSession: (sessionId) => {
    const sessions = get().sessions.map((s) =>
      s.id === sessionId ? { ...s, isActive: false, endTime: Date.now() } : s
    );
    storage.saveSessions(sessions);
    const current = get().currentSession;
    set({
      sessions,
      currentSession: current?.id === sessionId ? null : current,
    });
  },

  addMessage: (sessionId, message) => {
    const sessions = get().sessions.map((s) =>
      s.id === sessionId ? { ...s, messages: [...s.messages, message] } : s
    );
    storage.saveSessions(sessions);
    const current = get().currentSession;
    if (current?.id === sessionId) {
      set({ currentSession: { ...current, messages: [...current.messages, message] } });
    }
    set({ sessions });
  },

  settings: storage.getSettings(),
  updateSettings: (newSettings) => {
    const settings = { ...get().settings, ...newSettings };
    storage.saveSettings(settings);
    set({ settings });
  },

  agents: storage.getAgents(),
  updateAgents: (agents) => {
    storage.saveAgents(agents);
    set({ agents });
  },

  skills: storage.getSkills(),

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
