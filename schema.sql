-- 知客有方数据库表结构
-- 在云MySQL中执行此SQL

CREATE DATABASE IF NOT EXISTS zhikeyoufang DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE zhikeyoufang;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    open_id VARCHAR(128) NOT NULL UNIQUE COMMENT '抖音OpenID',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    vip_is_vip BOOLEAN DEFAULT FALSE COMMENT '是否VIP',
    vip_type VARCHAR(32) COMMENT 'VIP类型 monthly/180days',
    vip_start_time DATETIME COMMENT 'VIP开始时间',
    vip_expire_time DATETIME COMMENT 'VIP到期时间',
    free_times INT DEFAULT 0 COMMENT '免费次数',
    weekly_is_active BOOLEAN DEFAULT FALSE COMMENT '周卡是否生效',
    weekly_expire_time DATETIME COMMENT '周卡到期时间',
    disclaimer_agreed BOOLEAN DEFAULT FALSE COMMENT '是否同意免责声明',
    INDEX idx_open_id (open_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 客户档案表
CREATE TABLE IF NOT EXISTS customers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(128) NOT NULL COMMENT '用户OpenID',
    customer_name VARCHAR(64) COMMENT '客户备注名',
    answers JSON COMMENT '8道题答案',
    result_code VARCHAR(8) COMMENT '人格代码如INTJ',
    personality_name VARCHAR(32) COMMENT '人格名称',
    theme_color VARCHAR(16) COMMENT '主题色 blue/red/orange/green',
    tags JSON COMMENT '人物标签数组',
    advice JSON COMMENT '沟通建议对象',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='客户档案表';

-- 自我评估表
CREATE TABLE IF NOT EXISTS self_evaluations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(128) NOT NULL,
    answers JSON COMMENT '5道题答案',
    energy_score DOUBLE COMMENT '能量分',
    strategy_score DOUBLE COMMENT '策略分',
    mode VARCHAR(32) COMMENT '模式 hunter/connection/precision/energy_saving',
    mode_name VARCHAR(32) COMMENT '模式名称',
    target_customers JSON COMMENT '宜争取的客户类型',
    avoid_customers JSON COMMENT '应规避的客户类型',
    evaluated_at DATE NOT NULL COMMENT '评估日期',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_evaluated_at (user_id, evaluated_at),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='自我评估表';

-- 订单表
CREATE TABLE IF NOT EXISTS orders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id VARCHAR(64) NOT NULL UNIQUE COMMENT '内部订单号',
    douyin_order_id VARCHAR(128) COMMENT '抖音订单号',
    user_id VARCHAR(128) NOT NULL COMMENT '用户OpenID',
    product_type VARCHAR(32) NOT NULL COMMENT '产品类型 once/weekly/monthly/180days',
    amount INT COMMENT '金额（分）',
    status VARCHAR(16) DEFAULT 'pending' COMMENT '状态 pending/paid/closed/refunded',
    paid_at DATETIME COMMENT '支付时间',
    refunded_at DATETIME COMMENT '退款时间',
    refund_reason VARCHAR(256) COMMENT '退款原因',
    expire_time DATETIME COMMENT '服务到期时间',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_order_id (order_id),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单表';

-- 反馈表
CREATE TABLE IF NOT EXISTS feedbacks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(128) NOT NULL COMMENT '用户OpenID',
    content TEXT NOT NULL COMMENT '反馈内容',
    contact VARCHAR(128) COMMENT '联系方式',
    status VARCHAR(16) DEFAULT 'pending' COMMENT '状态 pending/processed',
    processed_at DATETIME COMMENT '处理时间',
    processed_note VARCHAR(512) COMMENT '处理备注',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='反馈表';
