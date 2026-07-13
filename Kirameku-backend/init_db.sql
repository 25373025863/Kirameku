-- Kirameku Blog - PostgreSQL 建表脚本
-- 执行方式: psql -U postgres -d kirameku -f init_db.sql

-- ============================================
-- 1. User（用户/管理员）
-- ============================================
CREATE TABLE IF NOT EXISTS "user" (
    id            SERIAL PRIMARY KEY,
    username      VARCHAR(50)  UNIQUE NOT NULL,
    hashed_password VARCHAR(128) NOT NULL,
    nickname      VARCHAR(50)  DEFAULT '',
    avatar        VARCHAR(500) DEFAULT '',
    email         VARCHAR(100) DEFAULT '',
    bio           VARCHAR(500) DEFAULT '',
    is_admin      BOOLEAN      DEFAULT FALSE,
    created_at    TIMESTAMP    DEFAULT NOW(),
    updated_at    TIMESTAMP    DEFAULT NOW()
);

-- ============================================
-- 2. Category（分类）
-- ============================================
CREATE TABLE IF NOT EXISTS category (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(50)  UNIQUE NOT NULL,
    slug          VARCHAR(50)  UNIQUE NOT NULL,
    description   VARCHAR(200) DEFAULT '',
    sort          INTEGER      DEFAULT 0,
    post_count    INTEGER      DEFAULT 0,
    created_at    TIMESTAMP    DEFAULT NOW(),
    updated_at    TIMESTAMP    DEFAULT NOW()
);

-- ============================================
-- 3. Tag（标签）
-- ============================================
CREATE TABLE IF NOT EXISTS tag (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(50)  UNIQUE NOT NULL,
    slug          VARCHAR(50)  UNIQUE NOT NULL,
    post_count    INTEGER      DEFAULT 0
);

-- ============================================
-- 4. Post（文章）
-- ============================================
CREATE TABLE IF NOT EXISTS post (
    id            SERIAL PRIMARY KEY,
    title         VARCHAR(200) NOT NULL,
    slug          VARCHAR(200) UNIQUE NOT NULL,
    description   VARCHAR(500) DEFAULT '',
    content       TEXT         DEFAULT '',
    cover         VARCHAR(500) DEFAULT '',
    category_id   INTEGER      REFERENCES category(id) ON DELETE SET NULL,
    status        VARCHAR(20)  DEFAULT 'draft',
    is_pinned     BOOLEAN      DEFAULT FALSE,
    views         INTEGER      DEFAULT 0,
    likes         INTEGER      DEFAULT 0,
    word_count    INTEGER      DEFAULT 0,
    reading_time  INTEGER      DEFAULT 0,
    published_at  TIMESTAMP,
    created_at    TIMESTAMP    DEFAULT NOW(),
    updated_at    TIMESTAMP    DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_post_slug ON post(slug);
CREATE INDEX IF NOT EXISTS idx_post_status ON post(status);
CREATE INDEX IF NOT EXISTS idx_post_category ON post(category_id);

-- ============================================
-- 5. PostTag（文章-标签 中间表）
-- ============================================
CREATE TABLE IF NOT EXISTS post_tag (
    post_id       INTEGER NOT NULL REFERENCES post(id) ON DELETE CASCADE,
    tag_id        INTEGER NOT NULL REFERENCES tag(id)  ON DELETE CASCADE,
    PRIMARY KEY (post_id, tag_id)
);

-- ============================================
-- 6. GitHubUser（GitHub 登录用户）
-- ============================================
CREATE TABLE IF NOT EXISTS github_user (
    id            SERIAL PRIMARY KEY,
    github_id     INTEGER      UNIQUE NOT NULL,
    login         VARCHAR(100) NOT NULL,
    avatar        VARCHAR(500) DEFAULT '',
    bio           VARCHAR(500) DEFAULT '',
    created_at    TIMESTAMP    DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_github_user_id ON github_user(github_id);

-- ============================================
-- 7. Comment（文章评论 — GitHub 登录）
-- ============================================
CREATE TABLE IF NOT EXISTS comment (
    id              SERIAL PRIMARY KEY,
    post_id         INTEGER      NOT NULL REFERENCES post(id) ON DELETE CASCADE,
    parent_id       INTEGER      REFERENCES comment(id) ON DELETE CASCADE,
    github_user_id  INTEGER      REFERENCES github_user(id) ON DELETE SET NULL,
    content         TEXT         NOT NULL,
    likes           INTEGER      DEFAULT 0,
    ip              VARCHAR(45)  DEFAULT '',
    status          VARCHAR(20)  DEFAULT 'approved',
    created_at      TIMESTAMP    DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comment_post ON comment(post_id);
CREATE INDEX IF NOT EXISTS idx_comment_status ON comment(status);
CREATE INDEX IF NOT EXISTS idx_comment_github_user ON comment(github_user_id);

-- ============================================
-- 8. Message（留言板/杂谈）
-- ============================================
CREATE TABLE IF NOT EXISTS message (
    id              SERIAL PRIMARY KEY,
    github_user_id  INTEGER      REFERENCES github_user(id) ON DELETE SET NULL,
    parent_id       INTEGER      REFERENCES message(id) ON DELETE CASCADE,
    content         TEXT         NOT NULL,
    ip              VARCHAR(45)  DEFAULT '',
    status          VARCHAR(20)  DEFAULT 'approved',
    likes           INTEGER      DEFAULT 0,
    created_at      TIMESTAMP    DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_message_status ON message(status);
CREATE INDEX IF NOT EXISTS idx_message_parent ON message(parent_id);
CREATE INDEX IF NOT EXISTS idx_message_github_user ON message(github_user_id);

-- ============================================
-- 9. Chatter（说说/微语）
-- ============================================
CREATE TABLE IF NOT EXISTS chatter (
    id              SERIAL PRIMARY KEY,
    content         TEXT         NOT NULL,
    images          TEXT         DEFAULT '[]',
    mood            VARCHAR(20)  DEFAULT '',
    likes           INTEGER      DEFAULT 0,
    comments_count  INTEGER      DEFAULT 0,
    status          VARCHAR(20)  DEFAULT 'draft',
    created_at      TIMESTAMP    DEFAULT NOW(),
    updated_at      TIMESTAMP    DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chatter_status ON chatter(status);

-- ============================================
-- 10. ChatterComment（说说评论 — GitHub 登录）
-- ============================================
CREATE TABLE IF NOT EXISTS chatter_comment (
    id              SERIAL PRIMARY KEY,
    chatter_id      INTEGER      NOT NULL REFERENCES chatter(id) ON DELETE CASCADE,
    parent_id       INTEGER      REFERENCES chatter_comment(id) ON DELETE CASCADE,
    github_user_id  INTEGER      REFERENCES github_user(id) ON DELETE SET NULL,
    content         TEXT         NOT NULL,
    ip              VARCHAR(45)  DEFAULT '',
    likes           INTEGER      DEFAULT 0,
    status          VARCHAR(20)  DEFAULT 'approved',
    created_at      TIMESTAMP    DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chatter_comment_chatter ON chatter_comment(chatter_id);
CREATE INDEX IF NOT EXISTS idx_chatter_comment_status ON chatter_comment(status);
CREATE INDEX IF NOT EXISTS idx_chatter_comment_github_user ON chatter_comment(github_user_id);

-- ============================================
-- 11. Album（相册）
-- ============================================
CREATE TABLE IF NOT EXISTS album (
    id            SERIAL PRIMARY KEY,
    title         VARCHAR(100) NOT NULL,
    description   VARCHAR(500) DEFAULT '',
    cover         VARCHAR(500) DEFAULT '',
    photo_count   INTEGER      DEFAULT 0,
    sort          INTEGER      DEFAULT 0,
    created_at    TIMESTAMP    DEFAULT NOW(),
    updated_at    TIMESTAMP    DEFAULT NOW()
);

-- ============================================
-- 12. Photo（照片）
-- ============================================
CREATE TABLE IF NOT EXISTS photo (
    id            SERIAL PRIMARY KEY,
    album_id      INTEGER      NOT NULL REFERENCES album(id) ON DELETE CASCADE,
    url           VARCHAR(500) NOT NULL,
    caption       VARCHAR(200) DEFAULT '',
    orientation   VARCHAR(20)  DEFAULT 'landscape',
    sort          INTEGER      DEFAULT 0,
    created_at    TIMESTAMP    DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_photo_album ON photo(album_id);

-- ============================================
-- 13. Project（项目展示）
-- ============================================
CREATE TABLE IF NOT EXISTS project (
    id               SERIAL PRIMARY KEY,
    name             VARCHAR(100) NOT NULL,
    slug             VARCHAR(100) UNIQUE NOT NULL,
    description      VARCHAR(500) DEFAULT '',
    long_description TEXT         DEFAULT '',
    cover_image      VARCHAR(500) DEFAULT '',
    tech_stack       TEXT         DEFAULT '[]',
    link_github      VARCHAR(300) DEFAULT '',
    link_gitee       VARCHAR(300) DEFAULT '',
    link_live        VARCHAR(300) DEFAULT '',
    link_docs        VARCHAR(300) DEFAULT '',
    project_type     VARCHAR(20)  DEFAULT 'own' NOT NULL,
    status           VARCHAR(20)  DEFAULT 'developing',
    status_label     VARCHAR(20)  DEFAULT '',
    is_featured      BOOLEAN      DEFAULT FALSE,
    sort             INTEGER      DEFAULT 0,
    created_at       TIMESTAMP    DEFAULT NOW(),
    updated_at       TIMESTAMP    DEFAULT NOW()
);

-- ============================================
-- 14. FriendLink（友情链接）
-- ============================================
CREATE TABLE IF NOT EXISTS friend_link (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    url           VARCHAR(300) NOT NULL,
    avatar        VARCHAR(500) DEFAULT '',
    description   VARCHAR(300) DEFAULT '',
    sort          INTEGER      DEFAULT 0,
    is_approved   BOOLEAN      DEFAULT FALSE,
    created_at    TIMESTAMP    DEFAULT NOW(),
    updated_at    TIMESTAMP    DEFAULT NOW()
);

-- ============================================
-- 15. BookmarkCategory（收藏夹分类）
-- ============================================
CREATE TABLE IF NOT EXISTS bookmark_category (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(50)  NOT NULL,
    icon          VARCHAR(50)  DEFAULT '',
    description   VARCHAR(200) DEFAULT '',
    sort          INTEGER      DEFAULT 0,
    created_at    TIMESTAMP    DEFAULT NOW(),
    updated_at    TIMESTAMP    DEFAULT NOW()
);

-- ============================================
-- 16. BookmarkSite（收藏站点）
-- ============================================
CREATE TABLE IF NOT EXISTS bookmark_site (
    id            SERIAL PRIMARY KEY,
    category_id   INTEGER      NOT NULL REFERENCES bookmark_category(id) ON DELETE CASCADE,
    name          VARCHAR(100) NOT NULL,
    url           VARCHAR(300) NOT NULL,
    icon          VARCHAR(500) DEFAULT '',
    description   VARCHAR(300) DEFAULT '',
    platforms     TEXT         DEFAULT '[]',
    sort          INTEGER      DEFAULT 0,
    created_at    TIMESTAMP    DEFAULT NOW(),
    updated_at    TIMESTAMP    DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookmark_site_category ON bookmark_site(category_id);

-- ============================================
-- 17. SiteConfig（站点配置）
-- ============================================
CREATE TABLE IF NOT EXISTS site_config (
    id            SERIAL PRIMARY KEY,
    key           VARCHAR(100) UNIQUE NOT NULL,
    value         TEXT         DEFAULT '',
    description   VARCHAR(200) DEFAULT '',
    updated_at    TIMESTAMP    DEFAULT NOW()
);

-- ============================================
-- 18. Visitor（访客记录）
-- ============================================
CREATE TABLE IF NOT EXISTS visitor (
    id            SERIAL PRIMARY KEY,
    ip            VARCHAR(45)  NOT NULL,
    path          VARCHAR(500) DEFAULT '',
    user_agent    TEXT         DEFAULT '',
    city          VARCHAR(100) DEFAULT '',
    region        VARCHAR(100) DEFAULT '',
    country       VARCHAR(100) DEFAULT '',
    district      VARCHAR(100) DEFAULT '',
    org           VARCHAR(200) DEFAULT '',
    asn           VARCHAR(50)  DEFAULT '',
    is_mobile     BOOLEAN      DEFAULT FALSE,
    is_proxy      BOOLEAN      DEFAULT FALSE,
    is_hosting    BOOLEAN      DEFAULT FALSE,
    browser       VARCHAR(50)  DEFAULT '',
    os            VARCHAR(50)  DEFAULT '',
    device_type   VARCHAR(20)  DEFAULT '',
    created_at    TIMESTAMP    DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_visitor_ip ON visitor(ip);
CREATE INDEX IF NOT EXISTS idx_visitor_created ON visitor(created_at DESC);

-- ============================================
-- 19. DownloadFile
-- ============================================
CREATE TABLE IF NOT EXISTS download_file (
    id                SERIAL PRIMARY KEY,
    title             VARCHAR(200) NOT NULL,
    description       VARCHAR(1000) DEFAULT '',
    category          VARCHAR(80)  DEFAULT '',
    source_type       VARCHAR(30)  DEFAULT 'local',
    original_filename VARCHAR(255) DEFAULT '',
    stored_filename   VARCHAR(255) DEFAULT '',
    storage_path      VARCHAR(500) DEFAULT '',
    external_url      VARCHAR(1000) DEFAULT '',
    file_size         BIGINT       DEFAULT 0,
    mime_type         VARCHAR(120) DEFAULT '',
    is_public         BOOLEAN      DEFAULT TRUE,
    download_count    INTEGER      DEFAULT 0,
    sort              INTEGER      DEFAULT 0,
    created_at        TIMESTAMP    DEFAULT NOW(),
    updated_at        TIMESTAMP    DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_download_file_public ON download_file(is_public);
CREATE INDEX IF NOT EXISTS idx_download_file_category ON download_file(category);

-- ============================================
-- 20. AcgItem
-- ============================================
CREATE TABLE IF NOT EXISTS acg_item (
    id                SERIAL PRIMARY KEY,
    bangumi_id        INTEGER UNIQUE NOT NULL,
    name              VARCHAR(200) NOT NULL,
    name_cn           VARCHAR(200) DEFAULT '',
    cover_url         VARCHAR(1000) DEFAULT '',
    summary           TEXT DEFAULT '',
    air_date          VARCHAR(20) DEFAULT '',
    year              INTEGER DEFAULT 0,
    total_episodes    INTEGER DEFAULT 0,
    bangumi_score     DOUBLE PRECISION DEFAULT 0,
    bangumi_rank      INTEGER DEFAULT 0,
    tags              TEXT DEFAULT '[]',
    source_url        VARCHAR(500) DEFAULT '',
    status            VARCHAR(20) DEFAULT 'watched',
    progress          INTEGER DEFAULT 0,
    personal_score    DOUBLE PRECISION DEFAULT 0,
    review            TEXT DEFAULT '',
    watched_at        VARCHAR(20) DEFAULT '',
    favorite          BOOLEAN DEFAULT FALSE,
    is_public         BOOLEAN DEFAULT TRUE,
    sort              INTEGER DEFAULT 0,
    created_at        TIMESTAMP DEFAULT NOW(),
    updated_at        TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_acg_item_status ON acg_item(status);
CREATE INDEX IF NOT EXISTS idx_acg_item_public ON acg_item(is_public);
CREATE INDEX IF NOT EXISTS idx_acg_item_year ON acg_item(year);

-- ============================================
-- 21. SecretCode
-- ============================================
CREATE TABLE IF NOT EXISTS secret_code (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(100)  NOT NULL,
    code          VARCHAR(100)  UNIQUE NOT NULL,
    description   VARCHAR(500)  DEFAULT '',
    target_type   VARCHAR(20)   DEFAULT 'internal' NOT NULL,
    target_url    VARCHAR(2000) NOT NULL,
    is_active     BOOLEAN       DEFAULT TRUE,
    expires_at    TIMESTAMP,
    max_uses      INTEGER       DEFAULT 0,
    use_count     INTEGER       DEFAULT 0,
    last_used_at  TIMESTAMP,
    created_at    TIMESTAMP     DEFAULT NOW(),
    updated_at    TIMESTAMP     DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_secret_code_active ON secret_code(is_active);

-- ============================================
-- 插入默认管理员账号（密码: admin123）
-- bcrypt hash of "admin123"
-- ============================================
INSERT INTO "user" (username, hashed_password, nickname, is_admin)
VALUES (
    'admin',
    '$2b$12$LJ3m4ys4Pz0C5eK8rZqYaOzLiGh5v1DmdMFRnDvMQfLpUfKlPu5S.',
    '管理员',
    TRUE
) ON CONFLICT (username) DO NOTHING;

-- ============================================
-- 插入默认站点配置
-- ============================================
INSERT INTO site_config (key, value, description) VALUES
    ('site_title',      '"Kirameku"',           '站点标题'),
    ('site_description', '"煌めく — 一个个人博客"', '站点描述'),
    ('icp_number',      '""',                    'ICP备案号'),
    ('icp_link',        '""',                    'ICP备案链接'),
    ('profile_name',    '"树下树"',               '首页展示名称'),
    ('profile_bio',     '"乐乐来了"',             '首页个人介绍'),
    ('profile_avatar',  '"/images/lucy.jpg"',    '首页头像地址')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- 插入默认暗号
-- ============================================
INSERT INTO secret_code (
    name,
    code,
    description,
    target_type,
    target_url,
    is_active
) VALUES (
    '星港入口',
    '5201314',
    '进入星港工具子站',
    'internal',
    '/garden',
    TRUE
) ON CONFLICT (code) DO NOTHING;
