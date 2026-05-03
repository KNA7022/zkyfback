const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bodyParser = require('body-parser');
const forge = require('node-forge');

// 抖音支付配置
const PAY_CONFIG = {
  appId: 'tt5d0a2bb7c369754e01',
  clientKey: 'tt5d0a2bb7c369754e01',
  clientSecret: 'd68832817673ca73305b162c82b525cdd5784d3b',
  privateKey: `-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEAnP9YUV4K03mgXtOi9DsjHA940YW29FxVvrxKO7KJCFzYUhQ1
9O/dxvj2jbV38sEz0TmIFzQIRXW9qgDidgSxDZLnr6FUd0NrT4S3vGR7TcRgDM0S
/jl1EnZPSEgBX2KAPPYuzB22oKRKpBz2r5jMF5gZmnE5warW0pTxjGqOd3M4UdCn
j7VPGFeVQdkn+QjYM3t+8n3PkR9SOune9TIMNfGhq7TowzVPDyfwQG5aaIkgVBPT
6r+W5jT/2hvzhcePoxxgAEcXOlvTP1yi8t1pkugLqpD4mbp9vv6U7is53FITu5vJ
YfTtOyQ2yyBoxf8/dJbX61e/zgfPR6wG3VFlSwIDAQABAoIBACAfOpHDXRGxw/dC
9AdmhiN6ouyzoCBVOBIDcmjOea0lWflJO1T3Mvg//io2Y+leUFzRmZ+tvLeBhKHg
9nTRNuyhDxhnOOICAFXPwMwh/vyFXmWgG++6D9MMM+KFIQrEG5rdf+uxdKlflAoK
Bwschz2YmDx6SCfw7W0+nkFtl+KmdWdKVGDiNEU4PhLnbQtFRa7k6JUyf4sH/r9D
vjB/5hIRFqj94lRiasYiuZrswt+/irHCqsYDOgpSkOlCkZrveaDYckmFxgRvJEAB
JRfvbIMdPJR9w8x1LG5yGQpgQSIqPOgp2DTOhoJGOzHx9ART86tjPCuUK85PpsXo
+0Ka8zECgYEAyvas+jH7ds/lEofXZSFNgVVDWkpwlLWnUw7Fmx9P95V30fOUKT9L
aFBbbntHsDaegg9um8RgmWYJCchd/UzmaNZKGJo902p9gg5HF3SjGvSBuRY80r2B
z0C5OpckN3oF/FBf8ARRHcDR8XUmh5umd4XpeiiR0475yk1Ir1wuPpkCgYEAxgW/
W10HDG7tIXiNF85tmVeN+Fyedw/xAQARmpBx8cQi0OHe+KHkdQtAXCqPFLd5SB7u
tkaFel5jEwjf1T3D8xzj76dnpMsrOXBdjobxWW72M//xGEglpjvcKu0jscB9BaML
HsBjFW73gAoQmW7Fmnzaxk9vFi50lAVom5y9ZYMCgYBeU4pMtRIDQ9dYZ12JmJKm
uvOUcOgllM7w4Pqhf0nw7LxFDQkcqlfnYQE9NXo5wQiltXpYVkn2wN8OdtqHsEed
DYpeKMD3EpTF7tDHa+Op0VzAoj8eSgicQ55SRpAEYGeLveb4a2kvhL+Nkj6X45TY
E5pQta4gPmCEzqorJZIwcQKBgQDArvMGWbz0EjPXb9AKrCjlHtbcJnNjczWVPZXj
ik31bF5cVox57j24zhvwEtFq3SS8Uq0A3Bohehp5eRckDZfPxfrdRU2Kgs8qcvX2
K8RIu7oB2zej4wAPgwu3EUy8N4rvozi80YMYZgOaqTCBu9G3g2n1sXFsagOxzJl/
YcLBNQKBgBx5udoet+wTOdIphsX0pUSsCjQqLVkVoyY9h/VK1zizwcRbKUkhKMjD
PSZSQy644OP3H0GO9OMw1QZJ99zXwti9F0SGQdAlhOwj+WyHMfT2tktqTvuJP585
7BsNrc/bHrBkAaK+zyg1OiHayrtJVZRQqVSPMe2lLmLL1zIhBRfS
-----END RSA PRIVATE KEY-----`,
  tagGroupId: 'tag_group_7272625659888058380',
};

// 生成随机字符串
function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 生成签名
function generateSignature(privateKeyStr, method, uri, timestamp, nonce, data) {
  const rawStr = method + '\n' + uri + '\n' + timestamp + '\n' + nonce + '\n' + data + '\n';

  // 使用 forge.pki.privateKeyFromPem 直接解析 PKCS1 格式私钥
  const privateKey = forge.pki.privateKeyFromPem(privateKeyStr);

  const md = forge.md.sha256.create();
  md.update(rawStr, 'utf8');
  const signatureBytes = privateKey.sign(md);
  return forge.util.encode64(signatureBytes);
}

// 生成 byteAuthorization
function generateByteAuthorization(privateKeyStr, data, appId) {
  const nonceStr = generateRandomString(32);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const keyVersion = '1';

  const signature = generateSignature(privateKeyStr, 'POST', '/requestOrder', timestamp, nonceStr, data);

  const byteAuthorization = `SHA256-RSA2048 appid=${appId},nonce_str=${nonceStr},timestamp=${timestamp},key_version=${keyVersion},signature=${signature}`;

  return { byteAuthorization, timestamp, nonceStr };
}

// 平台公钥（用于验签支付回调）
const PLATFORM_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtshrdzmSBa2orNQ30VJa
Umc6D72sToUjghN5fkZVhOeMsKCHvYJHd5tYNzEU+jbe7sVrdR4QjlIWeguAFF2c
RiryqZyE83LKHZo/rAhDuNaBQ18qwkbcYEw9ICeTkO6gxNWrK83aczS1eGQFMJZj
JKRMfYwPxXbkiHScyiiKI5NLlC/Yjdg84vSK2YPHtVOVbp+6gZFwaNkS+PhbuZu/
WU+FW6uEYYBoQvAEAxlpsnm0DYkNeRKKEha2gN7g8R/HoOJyMXvNJJrvWK82MRCO
PnLabHzT0P+b9nBbp9ZQjjO7+nDZdlFMiPNrIMwqNoBCWu6A4Fis9ArP/OJOdY22
twIDAQAB
-----END PUBLIC KEY-----`;

// 验证支付回调签名
function verifyCallbackSignature(timestamp, nonce, body, signature) {
  try {
    const rawStr = timestamp + '\n' + nonce + '\n' + body + '\n';

    const publicKey = forge.pki.publicKeyFromPem(PLATFORM_PUBLIC_KEY);
    const md = forge.md.sha256.create();
    md.update(rawStr, 'utf8');

    const signatureBytes = forge.util.decode64(signature);
    return publicKey.verify(md, signatureBytes);
  } catch (e) {
    console.error('验签失败:', e);
    return false;
  }
}

// 获取抖音 API access_token (client_token)
let cachedToken = null;
let tokenExpireTime = 0;

async function getAccessToken() {
  // 如果有缓存且未过期，直接返回
  if (cachedToken && Date.now() < tokenExpireTime) {
    return cachedToken;
  }

  try {
    const response = await fetch(`https://open.douyin.com/oauth/client_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_key: PAY_CONFIG.clientKey,
        client_secret: PAY_CONFIG.clientSecret,
        grant_type: 'client_credential',
      }),
    });

    const data = await response.json();

    if (data.data && data.data.access_token) {
      cachedToken = data.data.access_token;
      // 提前5分钟过期
      tokenExpireTime = Date.now() + (data.data.expires_in - 300) * 1000;
      console.log('获取 access_token 成功');
      return cachedToken;
    } else {
      console.error('获取 access_token 失败:', data);
      return null;
    }
  } catch (error) {
    console.error('获取 access_token 异常:', error);
    return null;
  }
}

// 查询抖音订单状态
async function queryDouyinOrderStatus(outOrderNo) {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      return { err_no: 1, err_msg: '获取access_token失败' };
    }

    const response = await fetch(`https://open.douyin.com/api/trade_basic/v1/developer/order_query/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access-token': accessToken,
      },
      body: JSON.stringify({
        out_order_no: outOrderNo,
      }),
    });

    const data = await response.json();
    console.log('查询抖音订单状态:', outOrderNo, data);

    return data;
  } catch (error) {
    console.error('查询抖音订单异常:', error);
    return { err_no: 1, err_msg: '查询异常' };
  }
}

const app = express();
app.use(cors());
app.use(bodyParser.json());

// MySQL连接池
const pool = mysql.createPool({
  host: 'mysqlc1ace1c8e577.rds.ivolces.com',
  port: 3306,
  user: 'zkyf',
  password: 'XiEhjsa3Ps5aaK',
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
const safeJson = (val, fallback) => {
  if (val == null) return fallback;
  if (typeof val === 'object') return val;
  try { return JSON.parse(val); } catch { return fallback; }
};

// 8题计分配置
const CUSTOMER_SCORE_MAP = {
  1: { 1: {E:1,T:1}, 2: {E:1,F:1}, 3: {I:1}, 4: {I:1,T:1} },
  2: { 1: {E:2}, 2: {E:1}, 3: {I:1}, 4: {I:2} },
  3: { 1: {S:2}, 2: {S:1}, 3: {N:1}, 4: {N:2} },
  4: { 1: {S:2}, 2: {N:1}, 3: {I:1}, 4: {N:2} },
  5: { 1: {T:2}, 2: {T:1}, 3: {F:1}, 4: {N:1} },
  6: { 1: {J:2}, 2: {J:1}, 3: {P:1}, 4: {P:2} },
  7: { 1: {J:2}, 2: {J:1}, 3: {P:1}, 4: {P:2} },
  8: { 1: {T:2}, 2: {F:1}, 3: {F:2}, 4: {T:1} },
};

const calculatePersonality = (answers) => {
  let E=0,I=0,S=0,N=0,T=0,F=0,J=0,P=0;
  answers.forEach((a, i) => {
    const scores = CUSTOMER_SCORE_MAP[i+1]?.[a] || {};
    E+=scores.E||0; I+=scores.I||0; S+=scores.S||0; N+=scores.N||0;
    T+=scores.T||0; F+=scores.F||0; J+=scores.J||0; P+=scores.P||0;
  });
  return (E>I?'E':'I') + (S>N?'S':'N') + (T>F?'T':'F') + (J>P?'J':'P');
};

// 16种人格配置
const PERSONALITY_DATA = {
  INTJ: {name:'智囊型',themeColor:'blue',tags:['高冷挑剔','完美主义','逻辑缜密','独立深刻'],advice:{mindset:'用专业和数据说话',avoid:['不要强行推销'],scripts:{iceBreak:'听说您眼光精准...',attack:'如果能帮您提升20%...',close:'基于您的要求...'}}},
  INTP: {name:'思考型',themeColor:'blue',tags:['理性分析','沉默内敛','逻辑优先','追求真理'],advice:{mindset:'给他思考空间',avoid:['不要催他'],scripts:{iceBreak:'我整理了一些数据...',attack:'这个逻辑您觉得...',close:'不着急考虑...'}}},
  ENTJ: {name:'统帅型',themeColor:'gold',tags:['强势果断','目标导向','掌控全局','效率至上'],advice:{mindset:'直接说重点',avoid:['不要绕弯子'],scripts:{iceBreak:'直接切入主题...',attack:'机会窗口只有两周...',close:'合同已准备好...'}}},
  ENTP: {name:'挑战型',themeColor:'orange',tags:['创新思维','能言善辩','精力充沛','挑战权威'],advice:{mindset:'和他辩论',avoid:['不要打击他'],scripts:{iceBreak:'我有个大胆想法...',attack:'方案有个漏洞...',close:'您觉得升级版...'}}},
  INFJ: {name:'倡导型',themeColor:'green',tags:['理想主义','洞察人心','轻声细语','坚持原则'],advice:{mindset:'展示真诚',avoid:['不要欺骗'],scripts:{iceBreak:'您的项目有意义...',attack:'这不只是生意...',close:'我相信您...'}}},
  INFP: {name:'文艺型',themeColor:'green',tags:['内心敏感','追求独特','理想化','善解人意'],advice:{mindset:'尊重感受',avoid:['不要批评'],scripts:{iceBreak:'您之前做过...',attack:'您的选择会影响...',close:'不着急...'}}},
  ENFJ: {name:'演说家型',themeColor:'orange',tags:['热情洋溢','善于交际','富有感染力','关心他人'],advice:{mindset:'建立情感连接',avoid:['不要冷场'],scripts:{iceBreak:'和您聊天很开心...',attack:'您团队一定能...',close:'您人脉广...'}}},
  ENFP: {name:'热情型',themeColor:'orange',tags:['充满想象','乐观积极','社交能力强','容易分心'],advice:{mindset:'跟随热情',avoid:['不要打击'],scripts:{iceBreak:'我有超棒想法...',attack:'会非常激动人心...',close:'感觉对就干...'}}},
  ISTJ: {name:'管家型',themeColor:'blue',tags:['尽职尽责','注重细节','脚踏实地','传统保守'],advice:{mindset:'展示专业可靠',avoid:['不要夸大'],scripts:{iceBreak:'20年行业经验...',attack:'这是服务清单...',close:'按流程办事...'}}},
  ISFJ: {name:'守护者型',themeColor:'green',tags:['忠诚可靠','耐心细致','默默付出','善于照顾人'],advice:{mindset:'表达感激认可',avoid:['不要逼太紧'],scripts:{iceBreak:'感谢您支持...',attack:'帮您减轻负担...',close:'先和家人商量...'}}},
  ESTJ: {name:'管理型',themeColor:'blue',tags:['务实果断','组织能力强','注重规则','执行高效'],advice:{mindset:'直接给结果',avoid:['不要拖拉'],scripts:{iceBreak:'KPI分解已准备好...',attack:'按您方式推进...',close:'签个季度合同...'}}},
  ESFJ: {name:'主人型',themeColor:'orange',tags:['热情友好','乐于助人','注重和谐','善于协调'],advice:{mindset:'帮他解决问题',avoid:['不要制造冲突'],scripts:{iceBreak:'帮您团队省30%时间...',attack:'您团队用了一定会...',close:'帮您安排试用...'}}},
  ISTP: {name:'探险型',themeColor:'red',tags:['冷静观察','动手能力强','喜欢摸索','独立自主'],advice:{mindset:'给他空间尝试',avoid:['不要过度规划'],scripts:{iceBreak:'这是样品先试试...',attack:'哪里不合理可以改...',close:'好不好用您说了算...'}}},
  ISFP: {name:'艺术家型',themeColor:'red',tags:['敏感细腻','审美独特','追求自由','享受当下'],advice:{mindset:'尊重审美',avoid:['不要强迫'],scripts:{iceBreak:'设计很有您味道...',attack:'和您气质很搭...',close:'不强求喜欢再买...'}}},
  ESTP: {name:'明星型',themeColor:'orange',tags:['大胆灵活','善于社交','喜欢刺激','活在当下'],advice:{mindset:'给紧迫感',avoid:['不要拖延'],scripts:{iceBreak:'限时优惠过期不候...',attack:'窗口很短最大折扣...',close:'别犹豫今天还是明天...'}}},
  ESFP: {name:'气氛型',themeColor:'red',tags:['活泼开朗','善于调节气氛','喜欢分享','容易受影响'],advice:{mindset:'让他开心',avoid:['不要压抑'],scripts:{iceBreak:'今天气氛很好体验一下...',attack:'您朋友都买了...',close:'今天不买交个朋友...'}}},
};

// 自评5题计分
const EVAL_SCORE_MAP = { 1:[4,4], 2:[3,2], 3:[2,1], 4:[3,3] };
const MODE_CONFIG = {
  hunter: {name:'猎手模式',description:'高能量+高策略，适合主动出击',icon:'🏹',targetCustomers:['统帅型','管家型','辩手型','挑战型'],avoidCustomers:['奉献型','文艺型']},
  connection: {name:'连接模式',description:'高能量+中策略，适合建立关系',icon:'🔗',targetCustomers:['演说家型','热情型','明星型','气氛型'],avoidCustomers:['守护者型','智囊型']},
  precision: {name:'精准模式',description:'中能量+高策略，适合精准突破',icon:'🎯',targetCustomers:['智囊型','探险型','专家型','管家型'],avoidCustomers:['热情型','明星型']},
  energy_saving: {name:'节能模式',description:'中能量+中策略，适合保守策略',icon:'🔋',targetCustomers:['奉献型','文艺型','艺术家型','守护者型'],avoidCustomers:['统帅型','挑战型']},
};

const calculateSelfEval = (answers) => {
  let totalEnergy=0,totalStrategy=0;
  answers.forEach(a => { totalEnergy+=EVAL_SCORE_MAP[a]?.[0]||0; totalStrategy+=EVAL_SCORE_MAP[a]?.[1]||0; });
  const energyValue = Math.round((totalEnergy/5)*10)/10;
  const strategyValue = Math.round((totalStrategy/5)*10)/10;
  let mode = energyValue>=3.5&&strategyValue>=3.5?'hunter':energyValue>=3.5?'connection':strategyValue>=3.5?'precision':'energy_saving';
  const cfg = MODE_CONFIG[mode];
  return {...cfg, mode, energyScore:energyValue, strategyScore:strategyValue};
};

// ============== 用户模块 ==============
app.post('/api/user/login', async (req, res) => {
  try {
    const { openId } = req;
    const [rows] = await pool.query('SELECT * FROM users WHERE open_id = ?', [openId]);
    if (rows.length > 0) {
      const user = rows[0];
      return res.json(genResult(0, '登录成功', {
        openId: user.open_id,
        isNewUser: false,
        vipStatus: { isVip: isVipValid(user.vip_expire_time), vipType: user.vip_type, expireTime: user.vip_expire_time, daysRemaining: calculateDaysRemaining(user.vip_expire_time) },
        freeTimes: user.free_times,
      }));
    }
    await pool.query('INSERT INTO users (open_id, free_times, vip_is_vip, weekly_is_active) VALUES (?, 1, 0, 0)', [openId]);
    res.json(genResult(0, '注册成功', { openId, isNewUser: true, vipStatus: { isVip: false, vipType: null, expireTime: null, daysRemaining: 0 }, freeTimes: 1 }));
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json(genResult(500, '服务器错误', null));
  }
});

app.get('/api/user/vipStatus', async (req, res) => {
  try {
    const { openId } = req;
    const [rows] = await pool.query('SELECT * FROM users WHERE open_id = ?', [openId]);
    if (rows.length === 0) return res.json(genResult(404, '用户不存在', null));
    const user = rows[0];
    const weeklyValid = user.weekly_is_active && new Date() < new Date(user.weekly_expire_time);
    res.json(genResult(0, '查询成功', {
      vipStatus: { isVip: isVipValid(user.vip_expire_time), vipType: user.vip_type, expireTime: user.vip_expire_time, daysRemaining: calculateDaysRemaining(user.vip_expire_time) },
      weeklyCard: { isActive: weeklyValid, expireTime: user.weekly_expire_time, daysRemaining: calculateDaysRemaining(user.weekly_expire_time) },
      freeTimes: user.free_times,
      canAnswerCustomer: weeklyValid || user.free_times > 0,
      canAnswerSelfEvaluation: isVipValid(user.vip_expire_time),
    }));
  } catch (error) {
    console.error('GetVipStatus error:', error);
    res.status(500).json(genResult(500, '服务器错误', null));
  }
});

// ============== 客户模块 ==============
app.post('/api/customer/create', async (req, res) => {
  try {
    const { openId } = req;
    const { customerName, answers } = req.body;

    if (!answers || answers.length !== 8) {
      return res.json(genResult(400, '请提供完整的8道题答案', null));
    }

    // 检查用户状态
    const [users] = await pool.query('SELECT * FROM users WHERE open_id = ?', [openId]);
    if (users.length === 0) return res.json(genResult(404, '用户不存在', null));
    const user = users[0];
    const weeklyValid = user.weekly_is_active && new Date() < new Date(user.weekly_expire_time);

    if (!weeklyValid && user.free_times <= 0 && !isVipValid(user.vip_expire_time)) {
      return res.json(genResult(403, '免费次数已用完', null));
    }

    // 计算人格
    const resultCode = calculatePersonality(answers);
    const personality = PERSONALITY_DATA[resultCode] || PERSONALITY_DATA.INTJ;

    // 扣减次数
    if (!weeklyValid && !isVipValid(user.vip_expire_time) && user.free_times > 0) {
      await pool.query('UPDATE users SET free_times = free_times - 1 WHERE open_id = ?', [openId]);
    }

    // 保存客户
    const [result] = await pool.query(
      'INSERT INTO customers (user_id, customer_name, answers, result_code, personality_name, theme_color, tags, advice) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [openId, customerName || '未命名客户', JSON.stringify(answers), resultCode, personality.name, personality.themeColor, JSON.stringify(personality.tags), JSON.stringify(personality.advice)]
    );

    res.json(genResult(0, '分析完成', {
      customerId: result.insertId,
      resultCode,
      personalityName: personality.name,
      themeColor: personality.themeColor,
      tags: personality.tags,
      advice: personality.advice,
    }));
  } catch (error) {
    console.error('Customer create error:', error);
    res.status(500).json(genResult(500, '服务器错误', null));
  }
});

app.get('/api/customer/list', async (req, res) => {
  try {
    const { openId } = req;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const offset = (page - 1) * pageSize;

    const [rows] = await pool.query('SELECT * FROM customers WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?', [openId, pageSize, offset]);
    const [[total]] = await pool.query('SELECT COUNT(*) as count FROM customers WHERE user_id = ?', [openId]);

    const list = rows.map(c => ({
      id: c.id,
      customerName: c.customer_name,
      resultCode: c.result_code,
      personalityName: c.personality_name,
      themeColor: c.theme_color,
      createdAt: c.created_at,
    }));

    res.json(genResult(0, '查询成功', { list, total: total.count, page, pageSize }));
  } catch (error) {
    console.error('Customer list error:', error);
    res.status(500).json(genResult(500, '服务器错误', null));
  }
});

app.get('/api/customer/get', async (req, res) => {
  try {
    const { openId } = req;
    const customerId = req.query.customerId;

    if (!customerId) return res.json(genResult(400, '客户ID不能为空', null));

    const [rows] = await pool.query('SELECT * FROM customers WHERE id = ?', [customerId]);
    if (rows.length === 0) return res.json(genResult(404, '客户不存在', null));
    const c = rows[0];
    if (c.user_id !== openId) return res.json(genResult(403, '无权访问', null));

    res.json(genResult(0, '查询成功', {
      id: c.id,
      customerName: c.customer_name,
      answers: safeJson(c.answers, []),
      resultCode: c.result_code,
      personalityName: c.personality_name,
      themeColor: c.theme_color,
      tags: safeJson(c.tags, []),
      advice: safeJson(c.advice, {}),
      createdAt: c.created_at,
    }));
  } catch (error) {
    console.error('Customer get error:', error);
    res.status(500).json(genResult(500, '服务器错误', null));
  }
});

app.post('/api/customer/update', async (req, res) => {
  try {
    const { openId } = req;
    const { customerId, customerName } = req.body;

    if (!customerId) return res.json(genResult(400, '客户ID不能为空', null));

    const [rows] = await pool.query('SELECT * FROM customers WHERE id = ?', [customerId]);
    if (rows.length === 0) return res.json(genResult(404, '客户不存在', null));
    if (rows[0].user_id !== openId) return res.json(genResult(403, '无权修改', null));

    await pool.query('UPDATE customers SET customer_name = ? WHERE id = ?', [customerName, customerId]);
    res.json(genResult(0, '更新成功', { customerId }));
  } catch (error) {
    console.error('Customer update error:', error);
    res.status(500).json(genResult(500, '服务器错误', null));
  }
});

app.post('/api/customer/delete', async (req, res) => {
  try {
    const { openId } = req;
    const { customerId } = req.body;

    if (!customerId) return res.json(genResult(400, '客户ID不能为空', null));

    const [rows] = await pool.query('SELECT * FROM customers WHERE id = ?', [customerId]);
    if (rows.length === 0) return res.json(genResult(404, '客户不存在', null));
    if (rows[0].user_id !== openId) return res.json(genResult(403, '无权删除', null));

    await pool.query('DELETE FROM customers WHERE id = ?', [customerId]);
    res.json(genResult(0, '删除成功', { customerId }));
  } catch (error) {
    console.error('Customer delete error:', error);
    res.status(500).json(genResult(500, '服务器错误', null));
  }
});

// ============== 评估模块 ==============
app.post('/api/evaluation/selfSubmit', async (req, res) => {
  try {
    const { openId } = req;
    const { answers } = req.body;

    if (!answers || answers.length !== 5) {
      return res.json(genResult(400, '请提供完整的5道题答案', null));
    }

    // 检查VIP
    const [users] = await pool.query('SELECT * FROM users WHERE open_id = ?', [openId]);
    if (users.length === 0) return res.json(genResult(404, '用户不存在', null));
    if (!isVipValid(users[0].vip_expire_time)) {
      return res.json(genResult(403, 'VIP会员专属功能', null));
    }

    // 计算结果
    const today = new Date().toISOString().split('T')[0];
    const result = calculateSelfEval(answers);

    // INSERT 或 UPDATE（同一天重复评估会更新结果）
    const placeholders = [openId, JSON.stringify(answers), result.energyScore, result.strategyScore, result.mode, result.modeName, JSON.stringify(result.targetCustomers), JSON.stringify(result.avoidCustomers), today];
    const [insertResult] = await pool.query(
      `INSERT INTO self_evaluations (user_id, answers, energy_score, strategy_score, mode, mode_name, target_customers, avoid_customers, evaluated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE answers=VALUES(answers), energy_score=VALUES(energy_score), strategy_score=VALUES(strategy_score), mode=VALUES(mode), mode_name=VALUES(mode_name), target_customers=VALUES(target_customers), avoid_customers=VALUES(avoid_customers)`,
      placeholders
    );

    res.json(genResult(0, '评估完成', { evaluationId: insertResult.insertId, ...result }));
  } catch (error) {
    console.error('Self eval submit error:', error);
    res.status(500).json(genResult(500, '服务器错误', null));
  }
});

app.get('/api/evaluation/selfToday', async (req, res) => {
  try {
    const { openId } = req;
    const today = new Date().toISOString().split('T')[0];

    const [rows] = await pool.query('SELECT * FROM self_evaluations WHERE user_id = ? AND evaluated_at = ?', [openId, today]);
    if (rows.length === 0) return res.json(genResult(404, '今日尚未评估', null));

    const e = rows[0];
    res.json(genResult(0, '查询成功', {
      evaluationId: e.id,
      mode: e.mode,
      modeName: e.mode_name,
      energyScore: e.energy_score,
      strategyScore: e.strategy_score,
      targetCustomers: safeJson(e.target_customers, []),
      avoidCustomers: safeJson(e.avoid_customers, []),
      evaluatedAt: e.evaluated_at,
    }));
  } catch (error) {
    console.error('Self today error:', error);
    res.status(500).json(genResult(500, '服务器错误', null));
  }
});

// ============== 订单模块 ==============
const PRODUCT_CONFIG = {
  once: { name: '次卡', price: 9.9, priceCent: 990 },
  weekly: { name: '周卡', price: 29, priceCent: 2900 },
  monthly: { name: '月卡VIP', price: 69, priceCent: 6900 },
  '180days': { name: '180天VIP', price: 199, priceCent: 19900 },
  test1fen: { name: '测试卡', price: 0.01, priceCent: 1 },
};
const DURATION_MAP = { once: 0, weekly: 7, monthly: 30, '180days': 180, test1fen: 0 };

app.post('/api/order/create', async (req, res) => {
  try {
    const { openId } = req;
    const { productType } = req.body;

    if (!PRODUCT_CONFIG[productType]) {
      return res.json(genResult(400, '无效的产品类型', null));
    }

    const product = PRODUCT_CONFIG[productType];
    const orderId = 'ORDER' + Date.now() + Math.floor(Math.random() * 10000);

    await pool.query(
      'INSERT INTO orders (order_id, user_id, product_type, amount, status) VALUES (?, ?, ?, ?, ?)',
      [orderId, openId, productType, product.priceCent, 'pending']
    );

    res.json(genResult(0, '订单创建成功', { orderId, productName: product.name, amount: product.price, amountCent: product.priceCent }));
  } catch (error) {
    console.error('Order create error:', error);
    res.status(500).json(genResult(500, '服务器错误', null));
  }
});

// 获取支付下单参数 (data 和 byteAuthorization)
app.post('/api/order/getPayParams', async (req, res) => {
  try {
    const { openId } = req;
    const { productType } = req.body;

    if (!PRODUCT_CONFIG[productType]) {
      return res.json(genResult(400, '无效的产品类型', null));
    }

    const product = PRODUCT_CONFIG[productType];
    const outOrderNo = 'ORDER' + Date.now() + Math.floor(Math.random() * 10000);

    // 保存订单到数据库
    await pool.query(
      'INSERT INTO orders (order_id, user_id, product_type, amount, status) VALUES (?, ?, ?, ?, ?)',
      [outOrderNo, openId, productType, product.priceCent, 'pending']
    );

    // 构造 data 参数
    const data = JSON.stringify({
      skuList: [{
        skuId: productType,
        price: product.priceCent,
        quantity: 1,
        title: product.name,
        imageList: ['https://xxx.com/images/vip.png'], // 需要替换为实际图片
        type: 301, // 虚拟商品
        tagGroupId: PAY_CONFIG.tagGroupId,
      }],
      outOrderNo: outOrderNo,
      totalAmount: product.priceCent,
      orderEntrySchema: {
        path: 'pages/orderDetail/orderDetail',
        params: `{"orderId":"${outOrderNo}"}`,
      },
      payNotifyUrl: 'https://1ly0nidlhtk52-env-qBqHYksp5g.service.douyincloud.run/api/order/callback', // 需要替换为实际回调地址
      payExpireSeconds: 1800, // 30分钟
    });

    // 生成 byteAuthorization
    const { byteAuthorization, timestamp, nonceStr } = generateByteAuthorization(
      PAY_CONFIG.privateKey,
      data,
      PAY_CONFIG.appId
    );

    console.log('生成支付参数:', { outOrderNo, productType, amount: product.priceCent });
    console.log('data字符串:', data);
    console.log('byteAuthorization:', byteAuthorization);

    res.json(genResult(0, '获取成功', {
      data,
      byteAuthorization,
      outOrderNo,
      timestamp,
      nonceStr,
    }));
  } catch (error) {
    console.error('GetPayParams error:', error);
    res.status(500).json(genResult(500, '服务器错误', null));
  }
});

app.post('/api/order/callback', async (req, res) => {
  try {
    // 抖音支付回调格式
    // Header: Byte-Timestamp, Byte-Nonce-Str, Byte-Signature
    const timestamp = req.headers['byte-timestamp'];
    const nonceStr = req.headers['byte-nonce-str'];
    const signature = req.headers['byte-signature'];

    // 获取原始 body 字符串用于验签
    const rawBody = JSON.stringify(req.body);
    const { msg, type, version } = req.body;

    console.log('支付回调:', { timestamp, nonceStr, signature, msg, type, version });

    // 验签
    if (!verifyCallbackSignature(timestamp, nonceStr, rawBody, signature)) {
      console.error('签名验证失败');
      return res.status(401).json({ err_no: 1, err_tips: '签名验证失败' });
    }

    // 解析 msg
    let msgData;
    try {
      msgData = JSON.parse(msg);
    } catch (e) {
      console.error('解析msg失败:', e);
      return res.json({ err_no: 1, err_tips: 'parse error' });
    }

    const { out_order_no, order_id, status, total_amount, discount_amount, pay_channel, channel_pay_id, merchant_uid, message, event_time, user_bill_pay_id } = msgData;

    if (!out_order_no) {
      return res.json({ err_no: 1, err_tips: '缺少订单号' });
    }

    const [orders] = await pool.query('SELECT * FROM orders WHERE order_id = ?', [out_order_no]);
    if (orders.length === 0) {
      console.error('订单不存在:', out_order_no);
      return res.json({ err_no: 404, err_tips: '订单不存在' });
    }

    const order = orders[0];
    if (order.status === 'paid') {
      return res.json({ err_no: 0, err_tips: 'success' });
    }

    // 更新订单状态（只更新表中存在的字段）
    await pool.query('UPDATE orders SET status = ?, douyin_order_id = ?, paid_at = ? WHERE order_id = ?',
      [status === 'SUCCESS' ? 'paid' : status, order_id, new Date(event_time), out_order_no]);

    // 开通服务
    if (status === 'SUCCESS') {
      const duration = DURATION_MAP[order.product_type] || 0;
      const expireTime = duration > 0 ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000) : null;

      switch (order.product_type) {
        case 'once':
        case 'test1fen':
          await pool.query('UPDATE users SET free_times = free_times + 1 WHERE open_id = ?', [order.user_id]);
          break;
        case 'weekly':
          await pool.query('UPDATE users SET weekly_is_active = 1, weekly_expire_time = ? WHERE open_id = ?', [expireTime, order.user_id]);
          break;
        case 'monthly':
        case '180days':
          await pool.query('UPDATE users SET vip_is_vip = 1, vip_type = ?, vip_start_time = ?, vip_expire_time = ? WHERE open_id = ?',
            [order.product_type, new Date(), expireTime, order.user_id]);
          break;
      }
    }

    res.json({ err_no: 0, err_tips: 'success' });
  } catch (error) {
    console.error('Order callback error:', error);
    res.status(500).json({ err_no: 500, err_tips: '服务器错误' });
  }
});

// 前端主动查询订单状态（支付成功后调用）
app.post('/api/order/checkStatus', async (req, res) => {
  try {
    const { openId } = req;
    const { outOrderNo } = req.body;

    if (!outOrderNo) {
      return res.json(genResult(400, '订单号不能为空'));
    }

    // 先查询本地订单
    const [orders] = await pool.query('SELECT * FROM orders WHERE order_id = ?', [outOrderNo]);
    if (orders.length === 0) {
      return res.json(genResult(404, '订单不存在'));
    }

    const order = orders[0];
    if (order.user_id !== openId) {
      return res.json(genResult(403, '无权访问'));
    }

    // 如果本地订单已支付，直接返回
    if (order.status === 'paid') {
      return res.json(genResult(0, '已支付', {
        orderId: order.order_id,
        productType: order.product_type,
        amount: order.amount / 100,
        status: 'paid',
        paidAt: order.paid_at,
      }));
    }

    // 查询抖音订单状态
    const douyinResult = await queryDouyinOrderStatus(outOrderNo);

    if (douyinResult.err_no !== 0) {
      return res.json(genResult(1, douyinResult.err_msg || '查询失败'));
    }

    const { pay_status, trade_time, channel_pay_id } = douyinResult.data;

    // 如果支付成功，更新本地订单并开通服务
    if (pay_status === 'SUCCESS') {
      await pool.query(
        'UPDATE orders SET status = ?, douyin_order_id = ?, paid_at = ? WHERE order_id = ?',
        ['paid', douyinResult.data.order_id, new Date(trade_time), outOrderNo]
      );

      // 开通服务
      const duration = DURATION_MAP[order.product_type] || 0;
      const expireTime = duration > 0 ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000) : null;

      switch (order.product_type) {
        case 'once':
        case 'test1fen':
          await pool.query('UPDATE users SET free_times = free_times + 1 WHERE open_id = ?', [order.user_id]);
          break;
        case 'weekly':
          await pool.query('UPDATE users SET weekly_is_active = 1, weekly_expire_time = ? WHERE open_id = ?', [expireTime, order.user_id]);
          break;
        case 'monthly':
        case '180days':
          await pool.query('UPDATE users SET vip_is_vip = 1, vip_type = ?, vip_start_time = ?, vip_expire_time = ? WHERE open_id = ?',
            [order.product_type, new Date(), expireTime, order.user_id]);
          break;
      }

      return res.json(genResult(0, '支付成功', {
        orderId: outOrderNo,
        productType: order.product_type,
        amount: order.amount / 100,
        status: 'paid',
        paidAt: new Date(trade_time).toISOString(),
      }));
    }

    // 支付未完成，返回当前状态
    return res.json(genResult(0, '查询成功', {
      orderId: outOrderNo,
      productType: order.product_type,
      amount: order.amount / 100,
      status: pay_status === 'PROCESS' ? 'pending' : pay_status.toLowerCase(),
    }));
  } catch (error) {
    console.error('Check order status error:', error);
    res.status(500).json(genResult(500, '服务器错误'));
  }
});

app.get('/api/order/query', async (req, res) => {
  try {
    const { openId } = req;
    const { orderId } = req.query;
    if (!orderId) return res.json(genResult(400, '订单号不能为空'));

    const [rows] = await pool.query('SELECT * FROM orders WHERE order_id = ?', [orderId]);
    if (rows.length === 0) return res.json(genResult(404, '订单不存在'));
    const order = rows[0];
    if (order.user_id !== openId) return res.json(genResult(403, '无权访问'));

    res.json(genResult(0, '查询成功', { orderId: order.order_id, productType: order.product_type, amount: order.amount / 100, status: order.status, paidAt: order.paid_at, createdAt: order.created_at }));
  } catch (error) {
    console.error('Order query error:', error);
    res.status(500).json(genResult(500, '服务器错误'));
  }
});

// ============== 反馈模块 ==============
app.post('/api/feedback/submit', async (req, res) => {
  try {
    const { openId } = req;
    const { content, contact } = req.body;

    if (!content || content.trim().length === 0) {
      return res.json(genResult(400, '反馈内容不能为空', null));
    }
    if (content.length > 500) {
      return res.json(genResult(400, '反馈内容不能超过500字', null));
    }

    const [result] = await pool.query(
      'INSERT INTO feedbacks (user_id, content, contact, status) VALUES (?, ?, ?, ?)',
      [openId, content.trim(), contact?.trim() || null, 'pending']
    );

    res.json(genResult(0, '反馈提交成功', { feedbackId: result.insertId }));
  } catch (error) {
    console.error('Feedback submit error:', error);
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
