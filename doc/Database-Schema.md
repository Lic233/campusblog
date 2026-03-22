# 校园博客系统 —— 数据库表结构设计（业务层）

> 本文档仅涵盖 Drizzle ORM 管理的业务表（`biz_` 前缀），存储于 Cloudflare D1。
> Payload CMS 内容表（`cms_` 前缀）由 Payload 适配器生成。

---

## 1. 关键设计决策

| 项目 | 决策 |
|------|------|
| 主键 | `TEXT`（应用层 `crypto.randomUUID()`） |
| 时间字段 | `TEXT`（ISO 8601 UTC，`new Date().toISOString()`） |
| 删除策略 | 业务数据采用硬删除；删除即回收配额，不提供删除恢复 |
| 外键 | 业务表内部用外键；跨服务 ID（如 School/SubChannel/Post）仅保存 `TEXT` |
| 验证码存储 | **仅使用 Workers KV**，不建 D1 降级表 |
| 用户默认发布配额 | `104857600` bytes（100MB，文字+图片） |

---

### 1.1 硬删除与配额核算策略（关键）

为保证“配额回收简单且一致”，采用以下规则：

1. 用户删除文章或附件时，硬删除对应 `biz_upload_usage_records` 记录。
2. 删除动作与配额回收必须在同一事务完成：`biz_users.used_bytes -= total_bytes`（下限为 0）。
3. 删除后不可恢复，不再设计“恢复后重新占用配额”流程。
4. `biz_users.used_bytes` 作为快速读取缓存值，权威值可通过 `SUM(total_bytes)` 对账修正。

---

## 2. Drizzle 目录约定

- Schema：`drizzle/schema.ts`
- Migrations：`drizzle/migrations/`

---

## 3. 表结构定义

### 3.1 `biz_users` — 前台用户

```typescript
import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core'

export const bizUsers = sqliteTable('biz_users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  nickname: text('nickname', { length: 100 }).notNull(),

  // 发布限额（字节）
  quotaBytes: integer('quota_bytes').notNull().default(104857600), // 100MB
  usedBytes: integer('used_bytes').notNull().default(0), // 当前上传总字节（缓存）

  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  emailActiveIdx: uniqueIndex('idx_biz_users_email_active').on(table.email),
}))
```

说明：

- `quota_bytes` 可按用户覆盖，管理员可在后台修改。
- 全量配额调整通过后台批量更新 `quota_bytes` 完成。

---

### 3.2 `biz_comments` — 评论

```sql
CREATE TABLE biz_comments (
  id         TEXT PRIMARY KEY,
  post_id    TEXT NOT NULL,
  author_id  TEXT NOT NULL REFERENCES biz_users (id),
  parent_id  TEXT REFERENCES biz_comments (id),
  content    TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX idx_biz_comments_post   ON biz_comments (post_id, created_at);
CREATE INDEX idx_biz_comments_parent ON biz_comments (parent_id)
  WHERE parent_id IS NOT NULL;
```

---

### 3.3 `biz_like_records` — 点赞记录

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

### 3.4 `biz_favorite_records` — 收藏记录

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

### 3.5 `biz_follow_records` — 关注关系

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

### 3.6 `biz_school_subscriptions` — 学校订阅（新增）

> `school_id` 对应 Payload 的 `School` 文档 ID（`TEXT`，不建外键）。

```sql
CREATE TABLE biz_school_subscriptions (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES biz_users (id),
  school_id  TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  UNIQUE (user_id, school_id)
);

CREATE INDEX idx_biz_school_subs_user   ON biz_school_subscriptions (user_id);
CREATE INDEX idx_biz_school_subs_school ON biz_school_subscriptions (school_id);
```

---

### 3.7 `biz_subchannel_subscriptions` — 子频道订阅（新增）

> `subchannel_id` 对应 Payload 的 `SchoolSubChannel` 文档 ID。

```sql
CREATE TABLE biz_subchannel_subscriptions (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES biz_users (id),
  school_id     TEXT NOT NULL,
  subchannel_id TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  UNIQUE (user_id, subchannel_id)
);

CREATE INDEX idx_biz_subchannel_subs_user      ON biz_subchannel_subscriptions (user_id);
CREATE INDEX idx_biz_subchannel_subs_school    ON biz_subchannel_subscriptions (school_id);
CREATE INDEX idx_biz_subchannel_subs_subchannel ON biz_subchannel_subscriptions (subchannel_id);
```

业务约束：

- 写入前需校验 `subchannel_id` 属于 `school_id`。
- 取消学校订阅时可级联删除该学校下子频道订阅。

---

### 3.8 `biz_upload_usage_records` — 上传用量记录（新增）

```sql
CREATE TABLE biz_upload_usage_records (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES biz_users (id),
  post_id     TEXT NOT NULL,
  text_bytes  INTEGER NOT NULL DEFAULT 0,
  media_bytes INTEGER NOT NULL DEFAULT 0,
  total_bytes INTEGER NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE UNIQUE INDEX idx_biz_upload_usage_user_post
  ON biz_upload_usage_records (user_id, post_id);

CREATE INDEX idx_biz_upload_usage_user ON biz_upload_usage_records (user_id);
```

说明：

- `text_bytes + media_bytes = total_bytes`
- 删除文章或附件时硬删除记录并回收 `biz_users.used_bytes`
- 删除后不提供恢复流程；恢复需求需走重新发布
- 定期对账任务建议使用 `SUM(total_bytes)` 修正 `used_bytes` 偏差

---

## 5. KV 约定（认证与限流）

验证码与限流仅使用 KV：

- `verify:{email}`：验证码，TTL 300s
- `verify_cooldown:{email}`：发送冷却，TTL 60s
- `verify_ip_count:{ip}:{hour}`：IP 每小时发送计数，TTL 3600s

---

## 6. 迁移工作流

```bash
# 生成迁移
pnpm drizzle-kit generate

# 应用到本地 D1
pnpm wrangler d1 migrations apply D1 --local

# 应用到远程 D1
pnpm wrangler d1 migrations apply D1 --remote
```

---

## 7. 关系概览

```text
biz_users
  ├── biz_comments
  ├── biz_like_records
  ├── biz_favorite_records
  ├── biz_follow_records
  ├── biz_school_subscriptions
  ├── biz_subchannel_subscriptions
  └── biz_upload_usage_records

Payload School(TEXT id)      ←── biz_school_subscriptions.school_id
Payload SchoolSubChannel(id) ←── biz_subchannel_subscriptions.subchannel_id
Payload Post(TEXT id)        ←── comments/likes/favorites/upload_usage.post_id
```
