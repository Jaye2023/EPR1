const express = require('express');
const router = express.Router();
const db = require('../models/database');

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: '未登录' });
  }
  
  const session = db.getSession(token);
  if (!session) {
    return res.status(401).json({ error: '会话已过期，请重新登录' });
  }
  
  const user = db.getUserById(session.userId);
  if (!user || user.status !== 'active') {
    return res.status(401).json({ error: '用户不存在或已被禁用' });
  }
  
  req.user = user;
  req.token = token;
  next();
};

const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: '需要管理员权限' });
  }
  next();
};

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }
  
  const user = db.getUserByUsername(username);
  if (!user) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }
  
  if (user.password !== password) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }
  
  if (user.status !== 'active') {
    return res.status(401).json({ error: '账户已被禁用' });
  }
  
  db.cleanExpiredSessions();
  const session = db.createSession(user.id);
  
  res.json({
    message: '登录成功',
    token: session.token,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

router.post('/logout', authMiddleware, (req, res) => {
  db.deleteSession(req.token);
  res.json({ message: '已退出登录' });
});

router.get('/me', authMiddleware, (req, res) => {
  res.json({
    id: req.user.id,
    username: req.user.username,
    name: req.user.name,
    email: req.user.email,
    phone: req.user.phone,
    role: req.user.role
  });
});

router.put('/password', authMiddleware, (req, res) => {
  const { oldPassword, newPassword } = req.body;
  
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: '旧密码和新密码不能为空' });
  }
  
  if (req.user.password !== oldPassword) {
    return res.status(400).json({ error: '旧密码错误' });
  }
  
  if (newPassword.length < 6) {
    return res.status(400).json({ error: '新密码长度至少6位' });
  }
  
  db.updateUserPassword(req.user.id, newPassword);
  res.json({ message: '密码修改成功' });
});

router.get('/users', authMiddleware, adminMiddleware, (req, res) => {
  const users = db.readUsers().map(u => ({
    id: u.id,
    username: u.username,
    name: u.name,
    email: u.email,
    role: u.role,
    status: u.status,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt
  }));
  res.json(users);
});

router.post('/users', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { username, password, name, email, role } = req.body;
    
    if (!username || !password || !name) {
      return res.status(400).json({ error: '用户名、密码和姓名为必填项' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: '密码长度至少6位' });
    }
    
    const user = db.createUser({
      username,
      password,
      name,
      email: email || '',
      role: role || 'user'
    });
    
    res.status(201).json({
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/users/:id', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { name, email, role, status } = req.body;
    const user = db.updateUser(req.params.id, { name, email, role, status });
    
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    res.json({
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      updatedAt: user.updatedAt
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/users/:id/password', authMiddleware, adminMiddleware, (req, res) => {
  const { newPassword } = req.body;
  
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: '新密码长度至少6位' });
  }
  
  const success = db.updateUserPassword(req.params.id, newPassword);
  if (!success) {
    return res.status(404).json({ error: '用户不存在' });
  }
  
  res.json({ message: '密码重置成功' });
});

router.delete('/users/:id', authMiddleware, adminMiddleware, (req, res) => {
  try {
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ error: '不能删除自己的账户' });
    }
    
    const success = db.deleteUser(req.params.id);
    if (!success) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    res.json({ message: '用户已删除' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
module.exports.authMiddleware = authMiddleware;
module.exports.adminMiddleware = adminMiddleware;
