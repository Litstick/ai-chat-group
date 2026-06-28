import type { User, ChatSession, AppSettings, AIAgent, ChatMessage, APIKeyConfig } from '../types';

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

export async function apiSendVerifyCode(
  phone: string,
): Promise<{ success: boolean; error?: string; message?: string; devCode?: string }> {
  return request('POST', '/auth/send-code', { phone });
}

export async function apiRegister(
  username: string,
  password: string,
  phone: string,
  verifyCode: string,
  nickname?: string,
): Promise<{ success: boolean; user?: User; error?: string }> {
  return request('POST', '/auth/register', { username, password, phone, verifyCode, nickname });
}

export async function apiLogin(
  username: string,
  password: string,
): Promise<{ success: boolean; user?: User; error?: string }> {
  return request('POST', '/auth/login', { username, password });
}

export async function apiUpdateUser(
  userId: string,
  data: { nickname?: string; avatar?: string; phone?: string },
): Promise<{ success: boolean; user?: User; error?: string }> {
  return request('PUT', `/users/${encodeURIComponent(userId)}`, data);
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

export async function apiGetSessionMessages(
  sessionId: string,
  limit?: number,
  offset?: number
): Promise<{ messages: ChatMessage[]; total: number; hasMore: boolean }> {
  const params = new URLSearchParams();
  if (limit !== undefined) params.append('limit', String(limit));
  if (offset !== undefined) params.append('offset', String(offset));
  const query = params.toString() ? `?${params.toString()}` : '';
  return request<{ messages: ChatMessage[]; total: number; hasMore: boolean }>(
    'GET',
    `/sessions/${encodeURIComponent(sessionId)}/messages${query}`
  );
}

export async function apiAddMessage(sessionId: string, message: ChatMessage): Promise<void> {
  return request('POST', `/sessions/${encodeURIComponent(sessionId)}/messages`, message);
}

export async function apiUpdateMessage(
  sessionId: string,
  messageId: string,
  content: string
): Promise<void> {
  return request('PUT', `/sessions/${encodeURIComponent(sessionId)}/messages/${encodeURIComponent(messageId)}`, { content });
}

export async function apiUpsertMessage(
  sessionId: string,
  messageId: string,
  message: ChatMessage
): Promise<void> {
  return request('PUT', `/sessions/${encodeURIComponent(sessionId)}/messages/${encodeURIComponent(messageId)}/upsert`, message);
}

// Settings

export async function apiGetSettings(userId: string): Promise<AppSettings> {
  return request<AppSettings>('GET', `/settings/${encodeURIComponent(userId)}`);
}

export async function apiUpdateSettings(userId: string, settings: Partial<AppSettings>): Promise<void> {
  return request('PUT', `/settings/${encodeURIComponent(userId)}`, settings);
}

// Agents

export async function apiGetAgents(userId: string): Promise<AIAgent[]> {
  return request<AIAgent[]>('GET', `/agents/${encodeURIComponent(userId)}`);
}

export async function apiSaveAgents(userId: string, agents: AIAgent[]): Promise<void> {
  return request('PUT', `/agents/${encodeURIComponent(userId)}`, agents);
}

// Topic validation

export async function apiValidateTopic(topic: string): Promise<{ valid: boolean; reason?: string }> {
  return request('POST', '/validate-topic', { topic });
}

// API Key test connection

export async function apiTestConnection(
  provider: string,
  apiKey: string,
  baseUrl?: string
): Promise<{ success: boolean; error?: string }> {
  return request('POST', '/ai/test-connection', { provider, apiKey, baseUrl });
}

// Topic drift detection

export async function apiCheckTopicDrift(
  topic: string,
  recentMessages: { senderName: string; content: string }[],
  apiKeys: APIKeyConfig,
  model: { provider: string; modelId: string }
): Promise<{ success: boolean; drifted: boolean; reason: string }> {
  return request('POST', '/ai/check-topic-drift', { topic, recentMessages, apiKeys, model });
}
