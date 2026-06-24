import type { AIAgent, ChatMessage, AIModel, APIKeyConfig } from '../types';

interface ConversationMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  name?: string;
}

function buildSystemPrompt(agent: AIAgent, topic: string): string {
  const skillsDesc = agent.skills.length > 0
    ? `\n你具备以下技能：${agent.skills.join('、')}。请在讨论中合理运用这些技能。`
    : '';

  return `你正在参与一个多人群聊讨论，当前讨论的核心话题是：「${topic}」。

你的身份：
- 名字：${agent.name}
- 角色：${agent.role}
- 专长：${agent.description}${skillsDesc}

群聊规则：
1. 这是一个多人讨论群，除了你之外还有其他 AI 角色和一位人类用户。
2. 你需要围绕核心话题「${topic}」积极参与讨论，发表你的专业见解。
3. 保持你的角色特点，从${agent.role}的角度出发思考和发言。
4. 可以回应其他人的观点，提出新的想法，或者进行补充和质疑。
5. 发言简洁有力，每次发言控制在 2-4 句话，像一个真实的群聊参与者。
6. 用中文回复。
7. 不要重复别人说过的话，要有自己的思考和见解。
8. 不要在发言中提及自己是 AI 或大语言模型。`;
}

function buildConversationHistory(
  messages: ChatMessage[],
  currentAgent: AIAgent
): ConversationMessage[] {
  const history: ConversationMessage[] = [];

  for (const msg of messages) {
    if (msg.senderId === currentAgent.id) {
      history.push({ role: 'assistant', content: msg.content });
    } else {
      const senderLabel = msg.isAI ? `[${msg.senderName}]` : '[用户]';
      history.push({ role: 'user', content: `${senderLabel}：${msg.content}` });
    }
  }

  return history;
}

async function callOpenAI(
  apiKey: string,
  baseUrl: string,
  modelId: string,
  messages: ConversationMessage[]
): Promise<string> {
  const url = `${baseUrl.replace(/\/+$/, '')}/v1/chat/completions`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelId,
      messages,
      temperature: 0.85,
      max_tokens: 300,
      presence_penalty: 0.6,
      frequency_penalty: 0.3,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API 错误 (${response.status}): ${error}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || '（无回复）';
}

async function callAnthropic(
  apiKey: string,
  baseUrl: string,
  modelId: string,
  messages: ConversationMessage[]
): Promise<string> {
  const url = `${baseUrl.replace(/\/+$/, '')}/v1/messages`;
  const systemMsg = messages.find((m) => m.role === 'system');
  const chatMessages = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: modelId,
      max_tokens: 300,
      system: systemMsg?.content || '',
      messages: chatMessages,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API 错误 (${response.status}): ${error}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text?.trim() || '（无回复）';
}

async function callGoogle(
  apiKey: string,
  baseUrl: string,
  modelId: string,
  messages: ConversationMessage[]
): Promise<string> {
  const systemMsg = messages.find((m) => m.role === 'system');
  const contents = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  const url = `${baseUrl.replace(/\/+$/, '')}/v1beta/models/${modelId}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      systemInstruction: systemMsg ? { parts: [{ text: systemMsg.content }] } : undefined,
      generationConfig: {
        temperature: 0.85,
        maxOutputTokens: 300,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google API 错误 (${response.status}): ${error}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '（无回复）';
}

export async function callAI(
  agent: AIAgent,
  model: AIModel,
  apiKeys: APIKeyConfig,
  topic: string,
  chatHistory: ChatMessage[],
  triggerMessage?: ChatMessage
): Promise<string> {
  const systemPrompt = buildSystemPrompt(agent, topic);
  const history = buildConversationHistory(chatHistory, agent);

  const messages: ConversationMessage[] = [
    { role: 'system', content: systemPrompt },
    ...history,
  ];

  // 如果有触发消息（用户刚发的或另一个AI刚发的），且不在历史中，追加它
  if (triggerMessage && triggerMessage.senderId !== agent.id) {
    const lastHistoryContent = history[history.length - 1]?.content;
    const triggerContent = triggerMessage.isAI
      ? `[${triggerMessage.senderName}]：${triggerMessage.content}`
      : `[用户]：${triggerMessage.content}`;
    if (lastHistoryContent !== triggerContent) {
      messages.push({ role: 'user', content: triggerContent });
    }
  }

  // 如果是第一条消息（无历史），给 AI 一个开场提示
  if (history.length === 0 && !triggerMessage) {
    messages.push({
      role: 'user',
      content: '讨论刚刚开始，请你先介绍一下你对这个话题的初步看法。',
    });
  }

  const provider = model.provider.toLowerCase();

  if (provider === 'openai') {
    return callOpenAI(
      apiKeys.openai,
      apiKeys.openaiBaseUrl,
      model.modelId,
      messages
    );
  }

  if (provider === 'anthropic') {
    return callAnthropic(
      apiKeys.anthropic,
      apiKeys.anthropicBaseUrl,
      model.modelId,
      messages
    );
  }

  if (provider === 'google') {
    return callGoogle(
      apiKeys.google,
      apiKeys.googleBaseUrl,
      model.modelId,
      messages
    );
  }

  throw new Error(`不支持的模型提供商：${model.provider}`);
}

export async function callAIForSummary(
  model: AIModel,
  apiKeys: APIKeyConfig,
  topic: string,
  messages: ChatMessage[]
): Promise<{ important: string[]; secondary: string[] }> {
  const content = messages
    .map((m) => `${m.senderName}：${m.content}`)
    .join('\n');

  const prompt = `请对以下群聊记录进行总结，分为"重要信息"和"次要信息"两部分。
话题：${topic}

聊天记录：
${content}

请严格按照以下 JSON 格式输出，不要输出其他内容：
{
  "important": ["要点1", "要点2", "要点3"],
  "secondary": ["次要信息1", "次要信息2"]
}`;

  const provider = model.provider.toLowerCase();
  let result = '';

  if (provider === 'openai') {
    result = await callOpenAI(apiKeys.openai, apiKeys.openaiBaseUrl, model.modelId, [
      { role: 'system', content: '你是一个专业的会议记录总结助手。请严格按 JSON 格式输出。' },
      { role: 'user', content: prompt },
    ]);
  } else if (provider === 'anthropic') {
    result = await callAnthropic(apiKeys.anthropic, apiKeys.anthropicBaseUrl, model.modelId, [
      { role: 'user', content: prompt },
    ]);
  } else if (provider === 'google') {
    result = await callGoogle(apiKeys.google, apiKeys.googleBaseUrl, model.modelId, [
      { role: 'user', content: prompt },
    ]);
  } else {
    throw new Error(`不支持的模型提供商：${model.provider}`);
  }

  try {
    const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return {
      important: ['总结生成失败，请重试'],
      secondary: [result.substring(0, 200)],
    };
  }
}
