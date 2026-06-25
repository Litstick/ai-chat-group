import type { AIAgent, ChatMessage, AIModel, APIKeyConfig } from '../types';

interface ConversationMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
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
4. 仔细阅读聊天记录中其他人的发言，针对具体观点进行回应、补充、质疑或延伸。
5. 不要空泛地发表看法，一定要引用或回应别人说过的具体内容，层层深入。
6. 如果有人提出了一个问题或方案，你可以从你的专业角度给出具体建议或指出潜在问题。
7. 讨论要有递进性：从初步看法 → 方案探讨 → 具体细节 → 优缺点分析 → 总结归纳。
8. 发言简洁有力，每次发言控制在 2-4 句话，像一个真实的群聊参与者。
9. 用中文回复。
10. 不要重复别人说过的话，要有自己的思考和见解。
11. 不要在发言中提及自己是 AI 或大语言模型。`;
}

function buildRecentContext(messages: ChatMessage[], maxCount: number): string {
  if (messages.length === 0) return '';
  const recent = messages.slice(-maxCount);
  return recent
    .map((m) => {
      const sender = m.isAI ? `[${m.senderName}]` : `[用户]`;
      return `${sender}：${m.content}`;
    })
    .join('\n');
}

function buildDiscussionGuide(messages: ChatMessage[], topic: string): string {
  const count = messages.length;

  if (count === 0) {
    return `\n\n【当前讨论阶段：开场】
讨论刚刚开始，还没有人发言。请你率先分享你对话题「${topic}」的初步看法和思考方向，为后续深入讨论奠定基础。可以提出一个核心问题或观点。`;
  }

  if (count <= 3) {
    return `\n\n【当前讨论阶段：初步交流】
目前讨论还处于初期，已有 ${count} 条消息。请在已有人发言的基础上，从你的专业角度补充新观点，或者对已有观点进行深化和延伸。尝试将讨论引向更具体的方向。`;
  }

  if (count <= 8) {
    return `\n\n【当前讨论阶段：深入探讨】
讨论已有一定进展（${count} 条消息），现在需要你推动讨论走向深入。你可以：
- 对某个具体观点进行详细分析或质疑
- 提出具体的实施建议或方案
- 指出之前讨论中被忽略的问题
- 从不同角度切入已有话题`;
  }

  if (count <= 15) {
    return `\n\n【当前讨论阶段：深化与整合】
讨论已经很深入（${count} 条消息），现在需要你帮助整合观点。你可以：
- 总结当前讨论的主要共识和分歧
- 提出折中方案或综合建议
- 补充之前没有涉及的重要角度
- 对具体实施细节进行优化建议`;
  }

  return `\n\n【当前讨论阶段：总结与收尾】
讨论已经很充分了（${count} 条消息），现在需要你帮助收束。你可以：
- 总结讨论中达成的核心结论
- 列出仍待解决的遗留问题
- 给出最终的综合性建议
- 为后续行动提供方向性指引`;
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
      max_tokens: 400,
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
      max_tokens: 400,
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
        maxOutputTokens: 400,
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

// 按提供商路由调用
async function callProvider(
  provider: string,
  apiKeys: APIKeyConfig,
  modelId: string,
  messages: ConversationMessage[]
): Promise<string> {
  const p = provider.toLowerCase();
  const map: Record<string, [string, string, string]> = {
    openai: [apiKeys.openai, apiKeys.openaiBaseUrl, modelId],
    anthropic: [apiKeys.anthropic, apiKeys.anthropicBaseUrl, modelId],
    google: [apiKeys.google, apiKeys.googleBaseUrl, modelId],
    deepseek: [apiKeys.deepseek, apiKeys.deepseekBaseUrl, modelId],
    qwen: [apiKeys.qwen, apiKeys.qwenBaseUrl, modelId],
    moonshot: [apiKeys.moonshot, apiKeys.moonshotBaseUrl, modelId],
    zhipu: [apiKeys.zhipu, apiKeys.zhipuBaseUrl, modelId],
    baidu: [apiKeys.baidu, apiKeys.baiduBaseUrl, modelId],
  };

  const entry = map[p];
  if (!entry) throw new Error(`不支持的模型提供商：${provider}`);

  const [key, baseUrl, model] = entry;
  if (!key) throw new Error(`${provider} 的 API Key 未配置`);

  if (p === 'anthropic') return callAnthropic(key, baseUrl, model, messages);
  if (p === 'google') return callGoogle(key, baseUrl, model, messages);
  return callOpenAI(key, baseUrl, model, messages);
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

  // 在 system prompt 中附加讨论阶段引导
  const discussionGuide = buildDiscussionGuide(chatHistory, topic);
  const fullSystemPrompt = systemPrompt + discussionGuide;

  const messages: ConversationMessage[] = [
    { role: 'system', content: fullSystemPrompt },
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
      content: `讨论刚刚开始，话题是「${topic}」。请你先介绍一下你对这个话题的初步看法，提出一个核心观点或问题来引导讨论。`,
    });
  }

  return callProvider(model.provider, apiKeys, model.modelId, messages);
}

export async function callAIForSummary(
  model: AIModel,
  apiKeys: APIKeyConfig,
  topic: string,
  messages: ChatMessage[]
): Promise<{ important: string[]; secondary: string[] }> {
  // 取最近 30 条消息用于总结（避免超出 token 限制）
  const recentMessages = messages.slice(-30);

  const chatContent = recentMessages
    .map((m) => `${m.senderName}：${m.content}`)
    .join('\n');

  const prompt = `请对以下群聊记录进行总结，提炼出"重要信息"和"次要信息"。
话题：${topic}
消息总数：${messages.length} 条（以下展示最近 ${recentMessages.length} 条）

聊天记录：
${chatContent}

请严格按照以下 JSON 格式输出，不要输出任何其他内容，只输出 JSON：
{"important":["要点1","要点2","要点3"],"secondary":["次要信息1","次要信息2"]}

要求：
- important 数组放 3-5 条核心结论、关键决策、重要共识
- secondary 数组放 2-4 条补充信息、待解决问题、次要观点
- 每条总结简洁明了，不超过 30 个字`;

  const messagesList: ConversationMessage[] = [
    { role: 'system', content: '你是一个专业的会议记录总结助手。你必须且只能输出合法的 JSON 格式，不要输出任何其他文字说明。' },
    { role: 'user', content: prompt },
  ];

  const result = await callProvider(model.provider, apiKeys, model.modelId, messagesList);

  try {
    // 更健壮的 JSON 提取
    let cleaned = result.trim();
    // 移除可能的 markdown 代码块包裹
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '');
    // 尝试提取 JSON 对象
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.important && parsed.secondary) {
        return {
          important: parsed.important.slice(0, 5),
          secondary: parsed.secondary.slice(0, 4),
        };
      }
    }
    // JSON 解析失败，手动构造
    const lines = result.split('\n').filter((l) => l.trim().length > 5 && !l.includes('```'));
    return {
      important: lines.slice(0, 4).map((l) => l.replace(/^[-*\d.\s]+/, '').trim()),
      secondary: lines.slice(4, 8).map((l) => l.replace(/^[-*\d.\s]+/, '').trim()),
    };
  } catch {
    // 最终兜底
    const lines = result.split('\n').filter((l) => l.trim().length > 5);
    return {
      important: lines.length > 0 ? [lines[0].trim()] : ['总结生成失败，请重试'],
      secondary: lines.length > 1 ? [lines[1].trim()] : [],
    };
  }
}
