import type { User, ChatSession, AppSettings, AIAgent } from '../types';

const BASE_URL = '/api';

async function request<T = void>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return undefined as T;
  }

  return (await res.json()) as T;
}

// Auth

export async function apiRegister(
  username: string,
  password: string,
  nickname?: string,
): Promise<{ success: boolean; user?: User; error?: string }> {
  return request('POST', '/auth/register', { username, password, nickname });
}

export async function apiLogin(
  username: string,
  password: string,
): Promise<{ success: boolean; user?: User; error?: string }> {
  return request('POST', '/auth/login', { username, password });
}

// Sessions

export async function apiGetSessions(userId: string): Promise<ChatSession[]> {
  return request<ChatSession[]>('GET', `/sessions/${encodeURIComponent(userId)}`);
}

export async function apiSaveSession(session: ChatSession): Promise<void> {
  return request('POST', '/sessions', session);
}

export async function apiUpdateSession(session: ChatSession): Promise<void> {
  return request('PUT', `/sessions/${encodeURIComponent(session.id)}`, session);
}

export async function apiDeleteSession(sessionId: string): Promise<void> {
  return request('DELETE', `/sessions/${encodeURIComponent(sessionId)}`);
}

// Settings

export async function apiGetSettings(): Promise<AppSettings> {
  return request<AppSettings>('GET', '/settings');
}

export async function apiUpdateSettings(settings: Partial<AppSettings>): Promise<void> {
  return request('PUT', '/settings', settings);
}

// Agents

export async function apiGetAgents(): Promise<AIAgent[]> {
  return request<AIAgent[]>('GET', '/agents');
}

export async function apiSaveAgents(agents: AIAgent[]): Promise<void> {
  return request('PUT', '/agents', agents);
}
