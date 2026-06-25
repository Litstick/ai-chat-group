import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// ===== Data helpers =====

const DATA_DIR = path.join(__dirname, 'data');

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJSON(filename, defaultVal) {
  const filePath = path.join(DATA_DIR, filename);
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    // 防止空数组覆盖对象
    if (defaultVal !== undefined && typeof defaultVal === 'object' && !Array.isArray(defaultVal) && Array.isArray(parsed)) {
      return defaultVal;
    }
    return parsed;
  } catch {
    return defaultVal !== undefined ? defaultVal : [];
  }
}

function writeJSON(filename, data) {
  const filePath = path.join(DATA_DIR, filename);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Failed to write ${filename}:`, err.message);
  }
}

// 深度合并对象
function deepMerge(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key]) &&
      target[key] &&
      typeof target[key] === 'object' &&
      !Array.isArray(target[key])
    ) {
      result[key] = deepMerge(target[key], source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

// ===== Auth endpoints =====

app.post('/api/auth/register', (req, res) => {
  const { username, password, nickname } = req.body;

  if (!username || !password) {
    return res.json({ success: false, error: '用户名和密码不能为空' });
  }

  const users = readJSON('users.json');
  if (users.find((u) => u.username === username)) {
    return res.json({ success: false, error: '用户名已存在' });
  }

  const userId = 'user-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
  const user = {
    id: userId,
    username,
    nickname: nickname || username,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + username,
    createdAt: Date.now(),
  };

  users.push(user);
  writeJSON('users.json', users);

  const passwords = readJSON('passwords.json', {});
  passwords[userId] = Buffer.from(password).toString('base64');
  writeJSON('passwords.json', passwords);

  res.json({ success: true, user });
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.json({ success: false, error: '用户名和密码不能为空' });
  }

  const users = readJSON('users.json');
  const user = users.find((u) => u.username === username);
  if (!user) {
    return res.json({ success: false, error: '用户不存在' });
  }

  const passwords = readJSON('passwords.json', {});
  const storedHash = passwords[user.id];
  if (storedHash !== Buffer.from(password).toString('base64')) {
    return res.json({ success: false, error: '密码错误' });
  }

  res.json({ success: true, user });
});

// ===== Sessions endpoints =====

app.get('/api/sessions/:userId', (req, res) => {
  const { userId } = req.params;
  const sessions = readJSON('sessions.json');
  const filtered = sessions.filter((s) => s.userId === userId);
  res.json(filtered);
});

app.post('/api/sessions', (req, res) => {
  const session = req.body;
  const sessions = readJSON('sessions.json');
  sessions.push(session);
  writeJSON('sessions.json', sessions);
  res.json({ success: true, session });
});

app.put('/api/sessions/:id', (req, res) => {
  const { id } = req.params;
  const partial = req.body;
  const sessions = readJSON('sessions.json');
  const idx = sessions.findIndex((s) => s.id === id);
  if (idx >= 0) {
    sessions[idx] = deepMerge(sessions[idx], partial);
    writeJSON('sessions.json', sessions);
    return res.json({ success: true });
  }
  res.json({ success: false, error: '会话不存在' });
});

app.delete('/api/sessions/:id', (req, res) => {
  const { id } = req.params;
  const sessions = readJSON('sessions.json');
  const filtered = sessions.filter((s) => s.id !== id);
  writeJSON('sessions.json', filtered);
  res.json({ success: true });
});

// ===== Settings endpoints =====

app.get('/api/settings', (req, res) => {
  // settings 是对象，不是数组
  const settings = readJSON('settings.json', {});
  res.json(settings);
});

app.put('/api/settings', (req, res) => {
  // 使用深度合并，确保 apiKeys 等嵌套对象正确更新
  const existing = readJSON('settings.json', {});
  const merged = deepMerge(existing, req.body);
  writeJSON('settings.json', merged);
  res.json({ success: true });
});

// ===== Agents endpoints =====

app.get('/api/agents', (req, res) => {
  const agents = readJSON('agents.json');
  res.json(agents);
});

app.put('/api/agents', (req, res) => {
  writeJSON('agents.json', req.body);
  res.json({ success: true });
});

// ===== Start server =====

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
