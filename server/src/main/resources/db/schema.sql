-- 青创通招新系统 数据库结构（与 uniCloud 集合对齐）
-- 时间字段统一使用 BIGINT 毫秒时间戳

CREATE TABLE IF NOT EXISTS users (
    id               VARCHAR(40)  NOT NULL PRIMARY KEY,
    openid           VARCHAR(128) NULL,
    nickname         VARCHAR(128) NULL,
    name             VARCHAR(64)  NULL,
    student_id       VARCHAR(32)  NULL,
    avatar           VARCHAR(512) NULL,
    gender           VARCHAR(8)   NULL,
    phone            VARCHAR(20)  NULL,
    password_hash    VARCHAR(256) NULL,
    session_key      VARCHAR(128) NULL,
    last_login_time  BIGINT       NULL,
    last_logout_time BIGINT       NULL,
    created_at       BIGINT       NOT NULL,
    updated_at       BIGINT       NOT NULL,
    UNIQUE KEY uk_users_student_id (student_id),
    UNIQUE KEY uk_users_phone (phone),
    KEY idx_users_openid (openid)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- 兼容已初始化的数据库：应用启动时补充密码登录所需字段与索引。
SET @add_password_hash = (
    SELECT IF(COUNT(*) = 0,
        'ALTER TABLE users ADD COLUMN password_hash VARCHAR(256) NULL AFTER phone',
        'SELECT 1')
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'password_hash'
);
PREPARE add_password_hash_statement FROM @add_password_hash;
EXECUTE add_password_hash_statement;
DEALLOCATE PREPARE add_password_hash_statement;

SET @add_users_phone_index = (
    SELECT IF(COUNT(*) = 0,
        'ALTER TABLE users ADD UNIQUE INDEX uk_users_phone (phone)',
        'SELECT 1')
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND INDEX_NAME = 'uk_users_phone'
);
PREPARE add_users_phone_index_statement FROM @add_users_phone_index;
EXECUTE add_users_phone_index_statement;
DEALLOCATE PREPARE add_users_phone_index_statement;

CREATE TABLE IF NOT EXISTS admins (
    id               VARCHAR(40)  NOT NULL PRIMARY KEY,
    username         VARCHAR(64)  NOT NULL,
    password         VARCHAR(128) NOT NULL,
    name             VARCHAR(64)  NULL,
    user_id          VARCHAR(64)  NULL,
    role             VARCHAR(32)  NULL,
    status           VARCHAR(16)  NOT NULL DEFAULT 'active',
    permissions      JSON         NULL,
    last_login_time  BIGINT       NULL,
    created_at       BIGINT       NOT NULL,
    updated_at       BIGINT       NOT NULL,
    UNIQUE KEY uk_admins_username (username)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS applications (
    id               VARCHAR(40)  NOT NULL PRIMARY KEY,
    user_id          VARCHAR(64)  NOT NULL,
    name             VARCHAR(64)  NULL,
    student_id       VARCHAR(32)  NULL,
    phone            VARCHAR(20)  NULL,
    email            VARCHAR(128) NULL,
    college          VARCHAR(64)  NULL,
    major            VARCHAR(128) NULL,
    grade            VARCHAR(32)  NULL,
    gender           VARCHAR(8)   NULL,
    dormitory        VARCHAR(64)  NULL,
    departments      JSON         NULL,
    introduction     TEXT         NULL,
    experience       TEXT         NULL,
    motivation       TEXT         NULL,
    status           VARCHAR(32)  NOT NULL DEFAULT 'waiting_first',
    first_interview  JSON         NULL,
    second_interview JSON         NULL,
    final_department VARCHAR(64)  NULL,
    admin_notes      TEXT         NULL,
    apply_time       BIGINT       NULL,
    rejected_at      BIGINT       NULL,
    created_at       BIGINT       NOT NULL,
    updated_at       BIGINT       NOT NULL,
    UNIQUE KEY uk_applications_student_id (student_id),
    KEY idx_applications_user_id (user_id),
    KEY idx_applications_status (status),
    KEY idx_applications_created (created_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notifications (
    id             VARCHAR(40)  NOT NULL PRIMARY KEY,
    title          VARCHAR(256) NOT NULL,
    content        TEXT         NULL,
    type           VARCHAR(32)  NULL,
    target_ids     JSON         NULL,
    selected_users JSON         NULL,
    status         VARCHAR(32)  NULL,
    created_at     BIGINT       NOT NULL,
    updated_at     BIGINT       NOT NULL,
    KEY idx_notifications_created (created_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_notifications (
    id              VARCHAR(40)  NOT NULL PRIMARY KEY,
    user_id         VARCHAR(64)  NOT NULL,
    notification_id VARCHAR(64)  NULL,
    title           VARCHAR(256) NULL,
    content         TEXT         NULL,
    type            VARCHAR(32)  NULL,
    is_read         TINYINT      NOT NULL DEFAULT 0,
    created_at      BIGINT       NOT NULL,
    KEY idx_un_user_id (user_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS system_config (
    id                       VARCHAR(40) NOT NULL PRIMARY KEY,
    recruitment_time         JSON        NULL,
    department_details       JSON        NULL,
    interview_config         JSON        NULL,
    system_settings          JSON        NULL,
    application_start_time   VARCHAR(64) NULL,
    application_end_time     VARCHAR(64) NULL,
    edit_deadline            VARCHAR(64) NULL,
    created_at               BIGINT      NOT NULL,
    updated_at               BIGINT      NOT NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
