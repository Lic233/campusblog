# 校园博客系统 —— 数据库表结构设计

> 本文档仅涵盖 Drizzle ORM 管理的业务表（`biz_` 前缀），存储于 Cloudflare D1（SQLite 内核）。
> Payload CMS 管理的内容表（`cms_` 前缀）由 Payload SQLite 适配器自动生成，无需手动设计。

---

## 设计原则

| 原则 | 决策 |
|------|------|
| 主键类型 | `TEXT`，应用层使用 `crypto.randomUUID()` 生成 UUID 字符串 |
| 软删除 | 关键实体（用户、评论）增加 `deleted_at TEXT` 字段；`NULL` 表示未删除 |
| 时间字段 | 全部使用 `TEXT`，存储 ISO 8601 格式 UTC 时间（`new Date().toISOString()`） |
| 外键 | 业务表内部声明外键；SQLite 外键约束默认关闭，需在每次连接时执行 `PRAGMA foreign_keys = ON` |
| 跨服务引用 | CMS 的 Post ID 等存为 `TEXT`，不建外键 |
| 通知表 | 暂不实现，后续版本添加 |

---

## Drizzle Schema 定义（`web/drizzle/schema.ts`）

以下为完整的 Drizzle ORM Schema 定义文件，同时提供等效的原生 SQLite DDL 供参考。

---

### `biz_users` — 用户账号

**Drizzle Schema：**

```typescript
import { sqliteTable, text, index, uniqueIndex } from 'drizzle-orm/sqlite-core'

export const bizUsers = sqliteTable('biz_users', {
  id:           text('id').primaryKey(),                         // crypto.randomUUID()
  email:        text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  nickname:     text('nickname', { length: 100 }).notNull(),
  createdAt:    text('created_at').notNull()
                  .$defaultFn(() => new Date().toISOString()),
  updatedAt:    text('updated_at').notNull()
                  .$defaultFn(() => new Date().toISOString()),
  deletedAt:    text('deleted_at'),                              // NULL 表示正常
}, (table) => ({
  emailActiveIdx: uniqueIndex('idx_biz_users_email_active').on(table.email),
}))
```

**等效 SQLite DDL：**

```sql
CREATE TABLE biz_users (
    id            TEXT PRIMARY KEY,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    nickname      TEXT NOT NULL,
    created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    updated_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    deleted_at    TEXT                          -- NULL 表示正常
);

CREATE UNIQUE INDEX idx_biz_users_email_active ON biz_users (email)
    WHERE deleted_at IS NULL;
```

**说明**：
- `nickname` 冗余存储一份，便于业务查询；与 CMS `UserProfile` 保持同步
- `password_hash` 使用 bcrypt 加密存储（在 Cloudflare Workers 中使用 `@node-rs/bcrypt` 或 `bcryptjs`）
- **管理员身份不在本表维护**：仅 Payload Users（`/admin`）表示管理员
- 软删除后 email 唯一索引通过条件索引保留，不影响新注册同邮箱

---

### `biz_email_codes` — 注册验证码（KV 降级方案）

> **说明**：首选使用 Workers KV 存储验证码（TTL 300s）。若 KV 不可用，使用此表作为降级存储。

**Drizzle Schema：**

```typescript
export const bizEmailCodes = sqliteTable('biz_email_codes', {
  id:        text('id').primaryKey(),
  email:     text('email').notNull(),
  code:      text('code', { length: 6 }).notNull(),
  createdAt: text('created_at').notNull()
               .$defaultFn(() => new Date().toISOString()),
  expiresAt: text('expires_at').notNull()
               .$defaultFn(() => new Date(Date.now() + 300_000).toISOString()),
  usedAt:    text('used_at'),                                    -- NULL 表示未使用
}, (table) => ({
  emailExpiresIdx: index('idx_biz_email_codes_email').on(table.email, table.expiresAt),
}))
```

**说明**：
- 需要定期清理过期记录：`DELETE FROM biz_email_codes WHERE expires_at < datetime('now')`
- 使用 KV 后此表可停用，保留备用

---

### `biz_comments` — 评论

**Drizzle Schema：**

```typescript
import { sqliteTable, text, index } from 'drizzle-orm/sqlite-core'

export const bizComments = sqliteTable('biz_comments', {
  id:        text('id').primaryKey(),
  postId:    text('post_id').notNull(),                          // CMS Post ID（TEXT）
  authorId:  text('author_id').notNull()
               .references(() => bizUsers.id),
  parentId:  text('parent_id')
               .references((): AnySQLiteColumn => bizComments.id),  // NULL = 一级评论
  content:   text('content').notNull(),
  createdAt: text('created_at').notNull()
               .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull()
               .$defaultFn(() => new Date().toISOString()),
  deletedAt: text('deleted_at'),
}, (table) => ({
  postIdx:   index('idx_biz_comments_post').on(table.postId, table.createdAt),
  parentIdx: index('idx_biz_comments_parent').on(table.parentId),
}))
```

**等效 SQLite DDL：**

```sql
CREATE TABLE biz_comments (
    id         TEXT PRIMARY KEY,
    post_id    TEXT NOT NULL,
    author_id  TEXT NOT NULL REFERENCES biz_users (id),
    parent_id  TEXT REFERENCES biz_comments (id),
    content    TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    deleted_at TEXT
);

CREATE INDEX idx_biz_comments_post   ON biz_comments (post_id, created_at)
    WHERE deleted_at IS NULL;
CREATE INDEX idx_biz_comments_parent ON biz_comments (parent_id)
    WHERE parent_id IS NOT NULL AND deleted_at IS NULL;
```

**说明**：
- 只支持二级嵌套（一级评论 + 回复），`parent_id` 指向一级评论 ID
- 软删除后前台展示"该评论已删除"占位，保留回复结构不断层

---

### `biz_like_records` — 点赞记录

**等效 SQLite DDL：**

```sql
CREATE TABLE biz_like_records (
    id         TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL REFERENCES biz_users (id),
    post_id    TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),

    UNIQUE (user_id, post_id)
);

CREATE INDEX idx_biz_likes_post_id ON biz_like_records (post_id);
```

---

### `biz_favorite_records` — 收藏记录

```sql
CREATE TABLE biz_favorite_records (
    id         TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL REFERENCES biz_users (id),
    post_id    TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),

    UNIQUE (user_id, post_id)
);

CREATE INDEX idx_biz_favorites_user_id ON biz_favorite_records (user_id);
```

---

### `biz_follow_records` — 关注关系

```sql
CREATE TABLE biz_follow_records (
    id           TEXT PRIMARY KEY,
    follower_id  TEXT NOT NULL REFERENCES biz_users (id),
    following_id TEXT NOT NULL REFERENCES biz_users (id),
    created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),

    UNIQUE (follower_id, following_id),
    CHECK  (follower_id != following_id)
);

CREATE INDEX idx_biz_follows_follower  ON biz_follow_records (follower_id);
CREATE INDEX idx_biz_follows_following ON biz_follow_records (following_id);
```

---

## 暂不实现的表

| 表名 | 原因 |
|------|------|
| `biz_notifications` | 通知功能在阶段 5 实现；当前 Schema 草稿预留，阶段 5 添加 |

---

## D1 / SQLite 约定速查

| 约定项 | 本项目做法 |
|--------|------------|
| 主键 / UUID | `TEXT`，应用层 `crypto.randomUUID()` |
| 时间戳 | `TEXT`（ISO 8601 UTC），`new Date().toISOString()` |
| JSON 文档 | `TEXT` 存 `JSON.stringify` 结果；Payload `json` 字段由适配器处理 |
| 默认时间（DDL） | `strftime('%Y-%m-%dT%H:%M:%SZ', 'now')` 等 SQLite 函数 |
| 外键 | SQLite 外键默认关闭；连接需 `PRAGMA foreign_keys = ON`；Drizzle D1 驱动按项目配置处理 |
| 部分（条件）索引 | SQLite 支持带 `WHERE` 的索引定义 |

---

## Drizzle Kit 迁移工作流

业务表迁移脚本通过 Drizzle Kit 生成，存放于 `web/drizzle/migrations/`：

```bash
# 生成迁移文件（基于 schema.ts 变更）
npx drizzle-kit generate

# 应用迁移到本地 D1（开发环境）
npx wrangler d1 migrations apply campusblog --local

# 应用迁移到生产 D1
npx wrangler d1 migrations apply campusblog --remote
```

迁移文件命名格式（Drizzle Kit 自动生成）：

```
web/drizzle/migrations/
  0000_create_users.sql
  0001_create_email_codes.sql
  0002_create_comments.sql
  0003_create_like_favorite_follow.sql
```

---

## 实体关系概览

```
biz_users ──┬── biz_comments           (一用户，多评论)
            ├── biz_like_records       (一用户，多点赞)
            ├── biz_favorite_records   (一用户，多收藏)
            ├── biz_follow_records     (follower_id，关注关系)
            └── biz_follow_records     (following_id，被关注关系)

biz_comments ── biz_comments (parent_id 自引用，支持二级回复)

CMS Post (TEXT id) ←── biz_comments         (post_id)
                   ←── biz_like_records      (post_id)
                   ←── biz_favorite_records  (post_id)
```

---
