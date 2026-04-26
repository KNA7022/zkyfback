const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// MySQL连接池
const pool = mysql.createPool({
  host: 'mysqlc1ace1c8e577.rds.ivolces.com',
  port: 3306,
  user: 'zkyf',      // TODO: 替换为你的MySQL用户名
  password: 'XiEhjsa3Ps5aaK',    // TODO: 替换为你的MySQL密码
  database: 'zhikeyoufang',
  waitForConnections: true,
  connectionLimit: 10,
});

// 中间件：从请求头获取openId
const getOpenId = (req, res, next) => {
  req.openId = req.headers['x-tt-openid'] || 'test_openid_123';
  next();
};

app.use(getOpenId);

// 工具函数
const isVipValid = (vipExpireTime) => {
  if (!vipExpireTime) return false;
  return new Date() < new Date(vipExpireTime);
};

const calculateDaysRemaining = (expireTime) => {
  if (!expireTime) return 0;
  return Math.max(0, Math.ceil((new Date(expireTime) - new Date()) / (1000 * 60 * 60 * 24)));
};

const genResult = (code, message, data) => ({ code, message, data });

// ============== 用户模块 ==============

// POST /api/user/login
app.post('/api/user/login', async (req, res) => {
  try {
    const { openId } = req;
    const [rows] = await pool.query('SELECT * FROM users WHERE open_id = ?', [openId]);

    if (rows.length > 0) {
      const user = rows[0];
      return res.json(genResult(0, '登录成功', {
        openId: user.open_id,
        isNewUser: false,
        vipStatus: {
          isVip: isVipValid(user.vip_expire_time),
          vipType: user.vip_type,
          expireTime: user.vip_expire_time,
          daysRemaining: calculateDaysRemaining(user.vip_expire_time),
        },
        freeTimes: user.free_times,
      }));
    }

    // 创建新用户
    await pool.query(
      'INSERT INTO users (open_id, free_times, vip_is_vip, weekly_is_active) VALUES (?, 1, 0, 0)',
      [openId]
    );

    res.json(genResult(0, '注册成功', {
      openId,
      isNewUser: true,
      vipStatus: { isVip: false, vipType: null, expireTime: null, daysRemaining: 0 },
      freeTimes: 1,
    }));
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json(genResult(500, '服务器错误', null));
  }
});

// GET /api/user/vipStatus
app.get('/api/user/vipStatus', async (req, res) => {
  try {
    const { openId } = req;
    const [rows] = await pool.query('SELECT * FROM users WHERE open_id = ?', [openId]);

    if (rows.length === 0) {
      return res.json(genResult(404, '用户不存在', null));
    }

    const user = rows[0];
    const weeklyValid = user.weekly_is_active && new Date() < new Date(user.weekly_expire_time);

    res.json(genResult(0, '查询成功', {
      vipStatus: {
        isVip: isVipValid(user.vip_expire_time),
        vipType: user.vip_type,
        expireTime: user.vip_expire_time,
        daysRemaining: calculateDaysRemaining(user.vip_expire_time),
      },
      weeklyCard: {
        isActive: weeklyValid,
        expireTime: user.weekly_expire_time,
        daysRemaining: calculateDaysRemaining(user.weekly_expire_time),
      },
      freeTimes: user.free_times,
      canAnswerCustomer: weeklyValid || user.free_times > 0,
      canAnswerSelfEvaluation: isVipValid(user.vip_expire_time),
    }));
  } catch (error) {
    console.error('GetVipStatus error:', error);
    res.status(500).json(genResult(500, '服务器错误', null));
  }
});

// ============== 健康检查 ==============
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
