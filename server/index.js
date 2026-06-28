import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

// 手动加载 .env 文件（ESM 模块兼容）
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '..', '.env');
if (existsSync(envPath)) {
  const fs = await import('fs');
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0 && !line.startsWith('#')) {
      const value = valueParts.join('=').trim();
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = value;
      }
    }
  });
}

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// MySQL 连接池配置
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ai_chat_group',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

let dbReady = false;

// 创建数据库（如果不存在）
async function createDatabaseIfNotExists() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  });

  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'ai_chat_group'}\``);
  await connection.end();
}

async function initDB() {
  try {
    // 确保数据库存在
    await createDatabaseIfNotExists();

    // 创建表
    const conn = await pool.getConnection();

    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(100) PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        nickname VARCHAR(100) NOT NULL,
        avatar VARCHAR(500),
        password VARCHAR(200) NOT NULL,
        phone VARCHAR(20),
        created_at BIGINT NOT NULL
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id VARCHAR(100) PRIMARY KEY,
        user_id VARCHAR(100) NOT NULL,
        topic VARCHAR(500) NOT NULL,
        alias VARCHAR(200),
        start_time BIGINT NOT NULL,
        end_time BIGINT,
        is_active TINYINT NOT NULL DEFAULT 1,
        participants TEXT NOT NULL,
        summary TEXT,
        settings TEXT,
        parent_session_id VARCHAR(100),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id VARCHAR(100) PRIMARY KEY,
        session_id VARCHAR(100) NOT NULL,
        sender_id VARCHAR(100) NOT NULL,
        sender_name VARCHAR(100) NOT NULL,
        sender_avatar VARCHAR(500),
        content TEXT NOT NULL,
        type VARCHAR(50) NOT NULL DEFAULT 'text',
        timestamp BIGINT NOT NULL,
        is_ai TINYINT NOT NULL DEFAULT 0,
        is_history TINYINT NOT NULL DEFAULT 0,
        FOREIGN KEY (session_id) REFERENCES sessions(id)
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS settings (
        user_id VARCHAR(100) PRIMARY KEY,
        data TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS agents (
        user_id VARCHAR(100) PRIMARY KEY,
        data TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS verify_codes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        phone VARCHAR(20) NOT NULL,
        code VARCHAR(6) NOT NULL,
        expires_at BIGINT NOT NULL,
        created_at BIGINT NOT NULL,
        INDEX idx_phone (phone),
        INDEX idx_expires_at (expires_at)
      )
    `);

    // 检查 users 表是否有 phone 字段，如果没有则添加
    const [columns] = await conn.query("SHOW COLUMNS FROM users LIKE 'phone'");
    if (columns.length === 0) {
      await conn.query("ALTER TABLE users ADD COLUMN phone VARCHAR(20)");
    }

    conn.release();
    dbReady = true;
    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Failed to initialize database:', err);
    throw err;
  }
}

// 查询函数
async function query(sql, params = []) {
  const [results] = await pool.execute(sql, params);
  return results;
}

// 执行函数
async function run(sql, params = []) {
  await pool.execute(sql, params);
}

// ===== DB ready middleware =====

function checkDbReady(req, res, next) {
  if (!dbReady) {
    return res.status(503).json({ success: false, error: '服务正在初始化中，请稍候...' });
  }
  next();
}

app.use(checkDbReady);

// ===== Auth endpoints =====

// 发送验证码接口
app.post('/api/auth/send-code', async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      return res.json({ success: false, error: '请输入正确的手机号' });
    }

    // 检查是否在 60 秒内已发送过验证码
    const recentCodes = await query(
      'SELECT * FROM verify_codes WHERE phone = ? AND created_at > ? ORDER BY created_at DESC LIMIT 1',
      [phone, Date.now() - 60000]
    );

    if (recentCodes.length > 0) {
      return res.json({ success: false, error: '验证码发送太频繁，请稍后再试' });
    }

    // 生成 6 位数字验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 分钟有效期
    const createdAt = Date.now();

    // 存储验证码
    await run(
      'INSERT INTO verify_codes (phone, code, expires_at, created_at) VALUES (?, ?, ?, ?)',
      [phone, code, expiresAt, createdAt]
    );

    // 清理过期的验证码
    await run('DELETE FROM verify_codes WHERE expires_at < ?', [Date.now()]);

    // 调用第三方短信 API 或返回模拟验证码
    const smsApiKey = process.env.SMS_API_KEY;
    const smsApiUrl = process.env.SMS_API_URL;

    if (smsApiKey && smsApiUrl) {
      // 调用第三方短信 API
      try {
        const smsResponse = await fetch(smsApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${smsApiKey}`,
          },
          body: JSON.stringify({
            phone,
            code,
            template: 'verification_code',
          }),
        });

        if (!smsResponse.ok) {
          console.error('SMS API error:', await smsResponse.text());
          return res.json({ success: false, error: '验证码发送失败，请稍后重试' });
        }

        res.json({ success: true, message: '验证码已发送' });
      } catch (smsErr) {
        console.error('SMS API error:', smsErr);
        res.json({ success: false, error: '验证码发送失败，请稍后重试' });
      }
    } else {
      // 开发环境：返回模拟验证码
      console.log(`[DEV] 验证码已生成: ${phone} -> ${code}`);
      res.json({
        success: true,
        message: '验证码已发送（开发模式）',
        devCode: code, // 仅开发环境返回
      });
    }
  } catch (err) {
    console.error('Send code error:', err);
    res.status(500).json({ success: false, error: '验证码发送失败，请稍后重试' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, nickname, phone, verifyCode } = req.body;

    if (!username || !password) {
      return res.json({ success: false, error: '用户名和密码不能为空' });
    }

    // 验证手机号和验证码
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      return res.json({ success: false, error: '请输入正确的手机号' });
    }

    if (!verifyCode || !/^\d{6}$/.test(verifyCode)) {
      return res.json({ success: false, error: '请输入 6 位数字验证码' });
    }

    // 检查验证码是否正确且未过期
    const codeRecords = await query(
      'SELECT * FROM verify_codes WHERE phone = ? AND code = ? AND expires_at > ? ORDER BY created_at DESC LIMIT 1',
      [phone, verifyCode, Date.now()]
    );

    if (codeRecords.length === 0) {
      return res.json({ success: false, error: '验证码错误或已过期' });
    }

    // 删除已使用的验证码
    await run('DELETE FROM verify_codes WHERE phone = ? AND code = ?', [phone, verifyCode]);

    const existing = await query('SELECT id FROM users WHERE username = ?', [username]);
    if (existing.length > 0) {
      return res.json({ success: false, error: '用户名已存在' });
    }

    // 检查手机号是否已被注册
    const phoneExisting = await query('SELECT id FROM users WHERE phone = ?', [phone]);
    if (phoneExisting.length > 0) {
      return res.json({ success: false, error: '该手机号已被注册' });
    }

    const userId = 'user-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
    const passwordHash = Buffer.from(password).toString('base64');

    await run(
      'INSERT INTO users (id, username, nickname, avatar, password, phone, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        userId,
        username,
        nickname || username,
        'https://api.dicebear.com/7.x/avataaars/svg?seed=' + username,
        passwordHash,
        phone,
        Date.now(),
      ]
    );

    const users = await query('SELECT id, username, nickname, avatar, phone, created_at as createdAt FROM users WHERE id = ?', [userId]);
    res.json({ success: true, user: users[0] });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, error: '注册失败，请稍后重试' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.json({ success: false, error: '用户名和密码不能为空' });
    }

    const users = await query('SELECT * FROM users WHERE username = ?', [username]);
    if (users.length === 0) {
      return res.json({ success: false, error: '用户不存在' });
    }

    const user = users[0];
    const passwordHash = Buffer.from(password).toString('base64');
    if (user.password !== passwordHash) {
      return res.json({ success: false, error: '密码错误' });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        avatar: user.avatar,
        phone: user.phone,
        createdAt: user.created_at,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: '登录失败，请稍后重试' });
  }
});

// ===== User profile endpoint =====

app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nickname, avatar, phone } = req.body;

    const existing = await query('SELECT * FROM users WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.json({ success: false, error: '用户不存在' });
    }

    const updates = [];
    const params = [];

    if (nickname !== undefined) {
      updates.push('nickname = ?');
      params.push(nickname);
    }
    if (avatar !== undefined) {
      updates.push('avatar = ?');
      params.push(avatar);
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      params.push(phone);
    }

    if (updates.length > 0) {
      params.push(id);
      await run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
    }

    const users = await query('SELECT id, username, nickname, avatar, phone, created_at as createdAt FROM users WHERE id = ?', [id]);
    res.json({ success: true, user: users[0] });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ success: false, error: '更新失败，请稍后重试' });
  }
});

// ===== Sessions endpoints =====

app.get('/api/sessions/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const sessions = await query(
      'SELECT id, user_id as userId, topic, alias, start_time as startTime, end_time as endTime, is_active as isActive, participants, summary, settings, parent_session_id as parentSessionId FROM sessions WHERE user_id = ? ORDER BY start_time DESC',
      [userId]
    );

    // 批量查询每个 session 的消息数量
    const sessionIds = sessions.map(s => s.id);
    const messageCounts = {};
    if (sessionIds.length > 0) {
      const placeholders = sessionIds.map(() => '?').join(',');
      const counts = await query(
        `SELECT session_id, COUNT(*) as count FROM messages WHERE session_id IN (${placeholders}) GROUP BY session_id`,
        sessionIds
      );
      for (const row of counts) {
        messageCounts[row.session_id] = row.count;
      }
    }

    const result = sessions.map((s) => ({
      ...s,
      isActive: s.isActive === 1,
      participants: JSON.parse(s.participants || '[]'),
      summary: s.summary ? JSON.parse(s.summary) : null,
      settings: s.settings ? JSON.parse(s.settings) : null,
      messages: [],
      messageCount: messageCounts[s.id] || 0,
    }));

    res.json(result);
  } catch (err) {
    console.error('获取会话列表失败:', err);
    res.status(500).json({ success: false, error: '获取会话列表失败: ' + err.message });
  }
});

app.get('/api/sessions/:sessionId/messages', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    // Get total count
    const countResult = await query(
      'SELECT COUNT(*) as total FROM messages WHERE session_id = ?',
      [sessionId]
    );
    const total = countResult[0].total;

    // Get messages with pagination (DESC to get latest messages)
    const messages = await query(
      'SELECT id, session_id as sessionId, sender_id as senderId, sender_name as senderName, sender_avatar as senderAvatar, content, type, timestamp, is_ai as isAI, is_history as isHistory FROM messages WHERE session_id = ? ORDER BY timestamp DESC LIMIT ? OFFSET ?',
      [sessionId, limit, offset]
    );

    const result = messages.map((m) => ({
      ...m,
      isAI: m.isAI === 1,
      isHistory: m.isHistory === 1,
    }));

    // Reverse to ascending order for display
    result.reverse();

    res.json({
      messages: result,
      total,
      hasMore: offset + limit < total
    });
  } catch (err) {
    console.error('获取消息列表失败:', err);
    res.status(500).json({ success: false, error: '获取消息列表失败: ' + err.message });
  }
});

app.post('/api/sessions', async (req, res) => {
  try {
    const session = req.body;

    // 检查用户是否存在
    const userExists = await query('SELECT id FROM users WHERE id = ?', [session.userId]);
    if (userExists.length === 0) {
      return res.status(400).json({ success: false, error: '用户不存在' });
    }

    await run(
      'INSERT INTO sessions (id, user_id, topic, alias, start_time, end_time, is_active, participants, summary, settings, parent_session_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        session.id,
        session.userId,
        session.topic,
        session.alias || null,
        session.startTime,
        session.endTime || null,
        session.isActive ? 1 : 0,
        JSON.stringify(session.participants || []),
        session.summary ? JSON.stringify(session.summary) : null,
        session.settings ? JSON.stringify(session.settings) : null,
        session.parentSessionId || null,
      ]
    );

    if (session.messages && session.messages.length > 0) {
      for (const msg of session.messages) {
        await run(
          'INSERT INTO messages (id, session_id, sender_id, sender_name, sender_avatar, content, type, timestamp, is_ai, is_history) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            msg.id,
            session.id,
            msg.senderId,
            msg.senderName,
            msg.senderAvatar,
            msg.content,
            msg.type || 'text',
            msg.timestamp,
            msg.isAI ? 1 : 0,
            msg.isHistory ? 1 : 0,
          ]
        );
      }
    }

    res.json({ success: true, session });
  } catch (err) {
    console.error('创建会话失败:', err);
    res.status(500).json({ success: false, error: '创建会话失败: ' + err.message });
  }
});

app.put('/api/sessions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const partial = req.body;

    const existing = await query('SELECT * FROM sessions WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: '会话不存在' });
    }

    const updates = [];
    const params = [];

    if (partial.topic !== undefined) {
      updates.push('topic = ?');
      params.push(partial.topic);
    }
    if (partial.alias !== undefined) {
      updates.push('alias = ?');
      params.push(partial.alias);
    }
    if (partial.isActive !== undefined) {
      updates.push('is_active = ?');
      params.push(partial.isActive ? 1 : 0);
    }
    if (partial.endTime !== undefined) {
      updates.push('end_time = ?');
      params.push(partial.endTime || null);
    }
    if (partial.participants !== undefined) {
      updates.push('participants = ?');
      params.push(JSON.stringify(partial.participants));
    }
    if (partial.summary !== undefined) {
      updates.push('summary = ?');
      params.push(partial.summary ? JSON.stringify(partial.summary) : null);
    }
    if (partial.settings !== undefined) {
      updates.push('settings = ?');
      params.push(partial.settings ? JSON.stringify(partial.settings) : null);
    }

    if (updates.length > 0) {
      params.push(id);
      await run(`UPDATE sessions SET ${updates.join(', ')} WHERE id = ?`, params);
    }

    res.json({ success: true });
  } catch (err) {
    console.error('更新会话失败:', err);
    res.status(500).json({ success: false, error: '更新会话失败: ' + err.message });
  }
});

app.post('/api/sessions/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const message = req.body;

    // 检查 session 是否存在
    const sessionExists = await query('SELECT id FROM sessions WHERE id = ?', [id]);
    if (sessionExists.length === 0) {
      return res.status(404).json({ success: false, error: '会话不存在' });
    }

    await run(
      'INSERT INTO messages (id, session_id, sender_id, sender_name, sender_avatar, content, type, timestamp, is_ai, is_history) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        message.id,
        id,
        message.senderId,
        message.senderName,
        message.senderAvatar,
        message.content,
        message.type || 'text',
        message.timestamp,
        message.isAI ? 1 : 0,
        message.isHistory ? 1 : 0,
      ]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('保存消息失败:', err);
    res.status(500).json({ success: false, error: '保存消息失败: ' + err.message });
  }
});

app.put('/api/sessions/:sessionId/messages/:messageId', async (req, res) => {
  try {
    const { sessionId, messageId } = req.params;
    const { content } = req.body;

    if (content === undefined) {
      return res.status(400).json({ success: false, error: 'content is required' });
    }

    await run(
      'UPDATE messages SET content = ? WHERE id = ? AND session_id = ?',
      [content, messageId, sessionId]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('更新消息失败:', err);
    res.status(500).json({ success: false, error: '更新消息失败: ' + err.message });
  }
});

// upsert 消息：如果消息不存在则插入，存在则更新内容
app.put('/api/sessions/:sessionId/messages/:messageId/upsert', async (req, res) => {
  try {
    const { sessionId, messageId } = req.params;
    const message = req.body;

    // 检查 session 是否存在
    const sessionExists = await query('SELECT id FROM sessions WHERE id = ?', [sessionId]);
    if (sessionExists.length === 0) {
      return res.status(404).json({ success: false, error: '会话不存在' });
    }

    // 检查消息是否已存在
    const existing = await query('SELECT id FROM messages WHERE id = ? AND session_id = ?', [messageId, sessionId]);

    if (existing.length > 0) {
      // 已存在则更新内容
      await run(
        'UPDATE messages SET content = ? WHERE id = ? AND session_id = ?',
        [message.content, messageId, sessionId]
      );
    } else {
      // 不存在则插入
      await run(
        'INSERT INTO messages (id, session_id, sender_id, sender_name, sender_avatar, content, type, timestamp, is_ai, is_history) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          messageId,
          sessionId,
          message.senderId,
          message.senderName,
          message.senderAvatar,
          message.content,
          message.type || 'text',
          message.timestamp,
          message.isAI ? 1 : 0,
          message.isHistory ? 1 : 0,
        ]
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Upsert 消息失败:', err);
    res.status(500).json({ success: false, error: '保存消息失败: ' + err.message });
  }
});

app.delete('/api/sessions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await run('DELETE FROM messages WHERE session_id = ?', [id]);
    await run('DELETE FROM sessions WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('删除会话失败:', err);
    res.status(500).json({ success: false, error: '删除会话失败: ' + err.message });
  }
});

// ===== Settings endpoints =====

app.get('/api/settings/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await query('SELECT data FROM settings WHERE user_id = ?', [userId]);
    if (result.length > 0) {
      res.json(JSON.parse(result[0].data));
    } else {
      res.json({});
    }
  } catch (err) {
    console.error('Get settings error:', err);
    res.status(500).json({ error: '获取设置失败' });
  }
});

app.put('/api/settings/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const existing = await query('SELECT user_id FROM settings WHERE user_id = ?', [userId]);
    if (existing.length > 0) {
      await run('UPDATE settings SET data = ? WHERE user_id = ?', [JSON.stringify(req.body), userId]);
    } else {
      await run('INSERT INTO settings (user_id, data) VALUES (?, ?)', [userId, JSON.stringify(req.body)]);
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Save settings error:', err);
    res.status(500).json({ success: false, error: '保存设置失败' });
  }
});

// ===== Agents endpoints =====

app.get('/api/agents/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await query('SELECT data FROM agents WHERE user_id = ?', [userId]);
    if (result.length > 0) {
      res.json(JSON.parse(result[0].data));
    } else {
      res.json([]);
    }
  } catch (err) {
    console.error('Get agents error:', err);
    res.status(500).json({ error: '获取 AI 配置失败' });
  }
});

app.put('/api/agents/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const existing = await query('SELECT user_id FROM agents WHERE user_id = ?', [userId]);
    if (existing.length > 0) {
      await run('UPDATE agents SET data = ? WHERE user_id = ?', [JSON.stringify(req.body), userId]);
    } else {
      await run('INSERT INTO agents (user_id, data) VALUES (?, ?)', [userId, JSON.stringify(req.body)]);
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Save agents error:', err);
    res.status(500).json({ success: false, error: '保存 AI 配置失败' });
  }
});

// ===== AI Stream Helper Functions =====

app.post('/api/ai/test-connection', async (req, res) => {
  const { provider, apiKey, baseUrl } = req.body;

  if (!provider || !apiKey) {
    return res.status(400).json({ success: false, error: 'provider and apiKey are required' });
  }

  try {
    const p = provider.toLowerCase();

    if (p === 'anthropic') {
      const url = `${(baseUrl || 'https://api.anthropic.com').replace(/\/+$/, '')}/v1/messages`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hi' }],
        }),
      });
      if (!response.ok) {
        const err = await response.text();
        return res.json({ success: false, error: `Anthropic API 错误 (${response.status}): ${err.slice(0, 200)}` });
      }
      return res.json({ success: true });
    }

    if (p === 'google') {
      const url = `${(baseUrl || 'https://generativelanguage.googleapis.com').replace(/\/+$/, '')}/v1beta/models?key=${apiKey}`;
      const response = await fetch(url);
      if (!response.ok) {
        const err = await response.text();
        return res.json({ success: false, error: `Google API 错误 (${response.status}): ${err.slice(0, 200)}` });
      }
      return res.json({ success: true });
    }

    // OpenAI 兼容（OpenAI, DeepSeek, Qwen, Moonshot, Zhipu, Baidu）
    const defaultUrls = {
      openai: 'https://api.openai.com',
      deepseek: 'https://api.deepseek.com',
      qwen: 'https://dashscope.aliyuncs.com/compatible-mode',
      moonshot: 'https://api.moonshot.cn',
      zhipu: 'https://open.bigmodel.cn/api/paas',
      baidu: 'https://aip.baidubce.com',
    };
    const url = `${(baseUrl || defaultUrls[p] || 'https://api.openai.com').replace(/\/+$/, '')}/v1/models`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });
    if (!response.ok) {
      const err = await response.text();
      return res.json({ success: false, error: `API 错误 (${response.status}): ${err.slice(0, 200)}` });
    }
    return res.json({ success: true });
  } catch (err) {
    return res.json({ success: false, error: `连接失败: ${err.message}` });
  }
});

function buildSystemPrompt(agent, topic) {
  const expertiseDesc = agent.expertise && agent.expertise.length > 0
    ? `\n你擅长的领域：${agent.expertise.join('、')}。`
    : '';
  const styleDesc = agent.style
    ? `\n你的沟通风格：${agent.style}。`
    : '';

  return `你正在参与一个多人群聊讨论，当前讨论的核心话题是：「${topic}」。

你的身份：
- 名字：${agent.name}
- 角色：${agent.role}
- 专长：${agent.description}${expertiseDesc}${styleDesc}

群聊规则：
1. 这是一个多人讨论群，除了你之外还有其他 AI 角色和一位人类用户。
2. 你需要围绕核心话题「${topic}」积极参与讨论，发表你的专业见解。
3. 保持你的角色特点，从${agent.role}的角度出发思考和发言。
4. 仔细阅读聊天记录中其他人的发言，针对具体观点进行回应、补充、质疑或延伸。
5. 不要空泛地发表看法，一定要引用或回应别人说过的具体内容，层层深入。
6. 如果有人提出了一个问题或方案，你可以从你的专业角度给出具体建议或指出潜在问题。
7. 讨论要有递进性：从初步看法 → 方案探讨 → 具体细节 → 优缺点分析 → 总结归纳。
8. 发言要完整表达你的观点，不要刻意简短。涉及代码、方案、详细分析时，应该给出完整、详尽的内容。
9. 用中文回复。
10. 不要重复别人说过的话，要有自己的思考和见解。
11. 不要在发言中提及自己是 AI 或大语言模型。

【重要 - 连续工作原则】
你是一个 24 小时随时在线的 AI 助手，没有上下班、工作日/周末的概念。
绝对不允许出现以下表述：
- "明天/后天/下周再做/给出/讨论"
- "等上班时间再说"
- "今天太晚了，明天继续"
- "xx点向我汇报/找我"
- 任何将工作推迟到未来时间点的表述

只要聊天还在进行中（未超时、未被终止、在活跃时段内），你就应该：
- 立即着手分析和解决问题
- 当场给出完整的方案和结果
- 需要代码就直接写出来
- 需要方案就当场设计好
- 需要思考就直接表达思考过程并给出结论

请始终保持即时响应、当场交付的工作方式。`;
}

function buildDiscussionGuide(messages, topic) {
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

function buildConversationHistory(messages, currentAgentId) {
  const history = [];

  for (const msg of messages) {
    if (msg.senderId === currentAgentId) {
      history.push({ role: 'assistant', content: msg.content });
    } else {
      const senderLabel = msg.isAI ? `[${msg.senderName}]` : '[用户]';
      history.push({ role: 'user', content: `${senderLabel}：${msg.content}` });
    }
  }

  return history;
}

function estimateMaxTokens(messages, triggerMessage) {
  const lastMsg = triggerMessage || messages[messages.length - 1];
  const lastContent = lastMsg?.content || '';

  const needsLongReply =
    /代码|源码|实现|写|完整代码|示例|方案|设计|架构|详细|步骤|流程|分析|报告/.test(lastContent) ||
    /\?|？|如何|怎么|为什么|什么是|解释|说明/.test(lastContent);

  const msgCount = messages.length;

  if (needsLongReply && msgCount < 5) {
    return 2000;
  }

  if (needsLongReply) {
    return 1500;
  }

  if (msgCount <= 2) {
    return 600;
  }

  if (msgCount <= 5) {
    return 800;
  }

  return 500;
}

// ===== AI Stream Endpoints =====

app.post('/api/ai/stream', async (req, res) => {
  const { agent, model, apiKeys, topic, chatHistory, triggerMessage } = req.body;

  // 设置 SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  const sendEvent = (event, data) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const provider = model.provider.toLowerCase();
    const map = {
      openai: [apiKeys.openai, apiKeys.openaiBaseUrl, model.modelId],
      anthropic: [apiKeys.anthropic, apiKeys.anthropicBaseUrl, model.modelId],
      google: [apiKeys.google, apiKeys.googleBaseUrl, model.modelId],
      deepseek: [apiKeys.deepseek, apiKeys.deepseekBaseUrl, model.modelId],
      qwen: [apiKeys.qwen, apiKeys.qwenBaseUrl, model.modelId],
      moonshot: [apiKeys.moonshot, apiKeys.moonshotBaseUrl, model.modelId],
      zhipu: [apiKeys.zhipu, apiKeys.zhipuBaseUrl, model.modelId],
      baidu: [apiKeys.baidu, apiKeys.baiduBaseUrl, model.modelId],
    };

    const entry = map[provider];
    if (!entry) {
      throw new Error(`不支持的模型提供商：${provider}`);
    }

    const [key, baseUrl, modelId] = entry;
    if (!key) {
      throw new Error(`${provider} 的 API Key 未配置`);
    }

    // 构建 messages
    const systemPrompt = buildSystemPrompt(agent, topic);
    const history = buildConversationHistory(chatHistory || [], agent.id);
    const discussionGuide = buildDiscussionGuide(chatHistory || [], topic);
    const fullSystemPrompt = systemPrompt + discussionGuide;

    const messages = [
      { role: 'system', content: fullSystemPrompt },
      ...history,
    ];

    // 如果有触发消息
    if (triggerMessage && triggerMessage.senderId !== agent.id) {
      const lastHistoryContent = history[history.length - 1]?.content;
      const triggerContent = triggerMessage.isAI
        ? `[${triggerMessage.senderName}]：${triggerMessage.content}`
        : `[用户]：${triggerMessage.content}`;
      if (lastHistoryContent !== triggerContent) {
        messages.push({ role: 'user', content: triggerContent });
      }
    }

    // 如果是第一条消息
    if (history.length === 0 && !triggerMessage) {
      messages.push({
        role: 'user',
        content: `讨论刚刚开始，话题是「${topic}」。请你先介绍一下你对这个话题的初步看法，提出一个核心观点或问题来引导讨论。`,
      });
    }

    const maxTokens = estimateMaxTokens(chatHistory || [], triggerMessage);

    // 根据提供商调用不同的流式 API
    if (provider === 'anthropic') {
      await streamAnthropic(baseUrl, key, modelId, messages, maxTokens, sendEvent);
    } else if (provider === 'google') {
      await streamGoogle(baseUrl, key, modelId, messages, maxTokens, sendEvent);
    } else {
      // OpenAI 兼容的提供商（OpenAI, DeepSeek, Qwen 等）
      await streamOpenAI(baseUrl, key, modelId, messages, maxTokens, sendEvent);
    }

    sendEvent('done', { finished: true });
  } catch (err) {
    console.error('AI stream error:', err);
    sendEvent('error', { message: err.message });
  } finally {
    res.end();
  }
});

async function streamOpenAI(baseUrl, apiKey, modelId, messages, maxTokens, sendEvent) {
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
      max_tokens: maxTokens,
      presence_penalty: 0.4,
      frequency_penalty: 0.2,
      stream: true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API 错误 (${response.status}): ${error}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data: ')) continue;
      if (trimmed === 'data: [DONE]') continue;

      const data = trimmed.slice(6);
      try {
        const parsed = JSON.parse(data);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) {
          sendEvent('chunk', { content });
        }
      } catch (e) {
        // 忽略解析错误
      }
    }
  }
}

async function streamAnthropic(baseUrl, apiKey, modelId, messages, maxTokens, sendEvent) {
  const url = `${baseUrl.replace(/\/+$/, '')}/v1/messages`;
  const systemMsg = messages.find((m) => m.role === 'system');
  const chatMessages = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role,
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
      max_tokens: maxTokens,
      system: systemMsg?.content || '',
      messages: chatMessages,
      stream: true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API 错误 (${response.status}): ${error}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data: ')) continue;

      const data = trimmed.slice(6);
      try {
        const parsed = JSON.parse(data);
        if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
          const content = parsed.delta.text;
          if (content) {
            sendEvent('chunk', { content });
          }
        }
      } catch (e) {
        // 忽略解析错误
      }
    }
  }
}

async function streamGoogle(baseUrl, apiKey, modelId, messages, maxTokens, sendEvent) {
  const systemMsg = messages.find((m) => m.role === 'system');
  const contents = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  const url = `${baseUrl.replace(/\/+$/, '')}/v1beta/models/${modelId}:streamGenerateContent?key=${apiKey}&alt=sse`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      systemInstruction: systemMsg ? { parts: [{ text: systemMsg.content }] } : undefined,
      generationConfig: {
        temperature: 0.85,
        maxOutputTokens: maxTokens,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google API 错误 (${response.status}): ${error}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data: ')) continue;

      const data = trimmed.slice(6);
      try {
        const parsed = JSON.parse(data);
        const content = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
        if (content) {
          sendEvent('chunk', { content });
        }
      } catch (e) {
        // 忽略解析错误
      }
    }
  }
}

// ===== Topic validation =====

const sensitiveWords = [
  '赌博', '色情', '毒品', '暴力', '恐怖', '反动',
  '诈骗', '洗钱', '走私', '枪支', '弹药', '爆炸物',
  '传销', '非法集资', '假币', '邪教', '迷信',
];

app.post('/api/validate-topic', (req, res) => {
  const { topic } = req.body;
  if (!topic || !topic.trim()) {
    return res.json({ valid: false, reason: '话题不能为空' });
  }

  const lowerTopic = topic.toLowerCase();
  for (const word of sensitiveWords) {
    if (lowerTopic.includes(word.toLowerCase())) {
      return res.json({ valid: false, reason: '话题包含敏感内容，请修改后重试' });
    }
  }

  res.json({ valid: true });
});

// ===== Topic drift detection =====

app.post('/api/ai/check-topic-drift', async (req, res) => {
  try {
    const { topic, recentMessages, apiKeys, model } = req.body;

    if (!topic || !recentMessages || !apiKeys || !model) {
      return res.status(400).json({ success: false, error: '缺少必要参数' });
    }

    const provider = model.provider.toLowerCase();
    const map = {
      openai: [apiKeys.openai, apiKeys.openaiBaseUrl, model.modelId],
      anthropic: [apiKeys.anthropic, apiKeys.anthropicBaseUrl, model.modelId],
      google: [apiKeys.google, apiKeys.googleBaseUrl, model.modelId],
      deepseek: [apiKeys.deepseek, apiKeys.deepseekBaseUrl, model.modelId],
      qwen: [apiKeys.qwen, apiKeys.qwenBaseUrl, model.modelId],
      moonshot: [apiKeys.moonshot, apiKeys.moonshotBaseUrl, model.modelId],
      zhipu: [apiKeys.zhipu, apiKeys.zhipuBaseUrl, model.modelId],
      baidu: [apiKeys.baidu, apiKeys.baiduBaseUrl, model.modelId],
    };

    const entry = map[provider];
    if (!entry) {
      return res.status(400).json({ success: false, error: `不支持的提供商: ${provider}` });
    }

    const [key, baseUrl, modelId] = entry;
    if (!key) {
      return res.status(400).json({ success: false, error: `${provider} 的 API Key 未配置` });
    }

    // 构建检查偏离的 prompt
    const chatContent = recentMessages.slice(-10).map(m => `${m.senderName}: ${m.content}`).join('\n');
    const checkPrompt = `你是一个话题偏离检测助手。请判断以下聊天内容是否偏离了核心话题。

核心话题：「${topic}」

最近的聊天内容：
${chatContent}

请判断聊天内容是否偏离核心话题。只回答 JSON 格式：
{"drifted": true/false, "reason": "偏离原因（如果偏离）"}

判断标准：
- 如果讨论内容与核心话题完全无关，则为偏离
- 如果讨论内容是核心话题的延伸、细化、相关方面，则不算偏离
- 只有明显偏离（如讨论完全不同的主题）才判定为偏离`;

    let result = '';

    if (provider === 'anthropic') {
      const url = `${(baseUrl || 'https://api.anthropic.com').replace(/\/+$/, '')}/v1/messages`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: modelId,
          max_tokens: 200,
          messages: [{ role: 'user', content: checkPrompt }],
        }),
      });
      const data = await response.json();
      result = data.content?.[0]?.text || '';
    } else if (provider === 'google') {
      const url = `${(baseUrl || 'https://generativelanguage.googleapis.com').replace(/\/+$/, '')}/v1beta/models/${modelId}:generateContent?key=${key}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: checkPrompt }] }],
          generationConfig: { maxOutputTokens: 200 },
        }),
      });
      const data = await response.json();
      result = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } else {
      // OpenAI 兼容
      const url = `${(baseUrl || 'https://api.openai.com').replace(/\/+$/, '')}/v1/chat/completions`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: modelId,
          messages: [{ role: 'user', content: checkPrompt }],
          max_tokens: 200,
          temperature: 0.1,
        }),
      });
      const data = await response.json();
      result = data.choices?.[0]?.message?.content || '';
    }

    // 解析结果
    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return res.json({ success: true, drifted: !!parsed.drifted, reason: parsed.reason || '' });
      }
    } catch (e) {
      // 解析失败
    }

    res.json({ success: true, drifted: false, reason: '' });
  } catch (err) {
    console.error('话题偏离检测失败:', err);
    res.status(500).json({ success: false, error: '检测失败: ' + err.message });
  }
});

// ===== Start server =====

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}).catch((err) => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});