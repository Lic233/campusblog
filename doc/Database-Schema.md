# 校园博客系统 —— 数据库表结构设计（业务层）

> 本文档仅涵盖 Drizzle ORM 管理的业务表（`biz_` 前缀），存储于 Cloudflare D1。  
> 用户与评论不再落在 `biz_` 表，统一由 Payload 管理：
> - 用户：`cms_users`（Payload Auth）
> - 评论：`cms_comments`（支持 `published` / `hidden`）

---

## 1. 关键设计决策

| 项目 | 决策 |
|------|------|
| 主键 | `TEXT`（应用层 `crypto.randomUUID()`） |
| 时间字段 | `TEXT`（ISO 8601 UTC，`new Date().toISOString()`） |
| 删除策略 | 业务数据采用硬删除；删除即回收配额，不提供恢复 |
| 跨服务关联 | 以 `TEXT` ID 存储，不对 Payload 表建立数据库外键 |
| 验证码存储 | **仅使用 Workers KV**，不建 D1 降级表 |
| 用户认证 | 统一使用 Payload `users` 集合 |
| 评论模型 | 统一使用 Payload `comments` 集合，并支持隐藏 |
| 用户默认发布配额 | `104857600` bytes（100MB，文字+图片） |

---

## 2. 配额核算策略（关键）

为保证“配额回收简单且一致”，采用以下规则：

1. 用户删除文章或附件时，硬删除对应 `biz_upload_usage_records` 记录。  
2. 删除动作与配额回收必须在同一事务完成：`users.usedBytes -= totalBytes`（下限为 0）。  
3. 删除后不提供恢复流程；恢复需求需走重新发布。  
4. `users.usedBytes` 作为快速读取缓存值，权威值可通过 `SUM(total_bytes)` 对账修正。  

---

## 3. Drizzle 目录约定

- Schema：`drizzle/schema.ts`
- Migrations：`drizzle/migrations/`

---

## 4. 表结构定义（`biz_`）

### 4.1 `biz_like_records` — 点赞记录

> `user_id` 对应 Payload `users.id`（`TEXT`，不建外键）。  
> `post_id` 对应 Payload `posts.id`（`TEXT`，不建外键）。

```sql
CREATE TABLE biz_like_records (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  post_id    TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  UNIQUE (user_id, post_id)
);

CREATE INDEX idx_biz_likes_post_id ON biz_like_records (post_id);
CREATE INDEX idx_biz_likes_user_id ON biz_like_records (user_id);
```

---

### 4.2 `biz_favorite_records` — 收藏记录

> `user_id` 对应 Payload `users.id`。  
> `post_id` 对应 Payload `posts.id`。

```sql
CREATE TABLE biz_favorite_records (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  post_id    TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  UNIQUE (user_id, post_id)
);

CREATE INDEX idx_biz_favorites_user_id ON biz_favorite_records (user_id);
CREATE INDEX idx_biz_favorites_post_id ON biz_favorite_records (post_id);
```

---

### 4.3 `biz_follow_records` — 关注关系

> `follower_id` / `following_id` 均对应 Payload `users.id`。

```sql
CREATE TABLE biz_follow_records (
  id           TEXT PRIMARY KEY,
  follower_id  TEXT NOT NULL,
  following_id TEXT NOT NULL,
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  UNIQUE (follower_id, following_id),
  CHECK  (follower_id != following_id)
);

CREATE INDEX idx_biz_follows_follower  ON biz_follow_records (follower_id);
CREATE INDEX idx_biz_follows_following ON biz_follow_records (following_id);
```

---

### 4.4 `biz_school_subscriptions` — 学校订阅

> `user_id` 对应 Payload `users.id`。  
> `school_id` 对应 Payload `schools.id`。

```sql
CREATE TABLE biz_school_subscriptions (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  school_id  TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  UNIQUE (user_id, school_id)
);

CREATE INDEX idx_biz_school_subs_user   ON biz_school_subscriptions (user_id);
CREATE INDEX idx_biz_school_subs_school ON biz_school_subscriptions (school_id);
```

---

### 4.5 `biz_subchannel_subscriptions` — 子频道订阅

> `user_id` 对应 Payload `users.id`。  
> `school_id` 对应 Payload `schools.id`。  
> `subchannel_id` 对应 Payload `school-sub-channels.id`。

```sql
CREATE TABLE biz_subchannel_subscriptions (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL,
  school_id     TEXT NOT NULL,
  subchannel_id TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  UNIQUE (user_id, subchannel_id)
);

CREATE INDEX idx_biz_subchannel_subs_user       ON biz_subchannel_subscriptions (user_id);
CREATE INDEX idx_biz_subchannel_subs_school     ON biz_subchannel_subscriptions (school_id);
CREATE INDEX idx_biz_subchannel_subs_subchannel ON biz_subchannel_subscriptions (subchannel_id);
```

业务约束：

- 写入前需校验 `subchannel_id` 属于 `school_id`。
- 取消学校订阅时可级联删除该学校下子频道订阅。

---

### 4.6 `biz_upload_usage_records` — 上传用量记录

> `user_id` 对应 Payload `users.id`。  
> `post_id` 对应 Payload `posts.id`。

```sql
CREATE TABLE biz_upload_usage_records (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL,
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
- 删除文章或附件时硬删除记录并回收 `users.usedBytes`
- 删除后不提供恢复流程；恢复需重新发布
- 定期对账建议使用 `SUM(total_bytes)` 修正偏差

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
Payload users / posts / comments
  ↑
  ├── biz_like_records.user_id / post_id
  ├── biz_favorite_records.user_id / post_id
  ├── biz_follow_records.follower_id / following_id
  ├── biz_school_subscriptions.user_id
  ├── biz_subchannel_subscriptions.user_id
  └── biz_upload_usage_records.user_id / post_id

Payload School(TEXT id)            ←── biz_school_subscriptions.school_id
Payload SchoolSubChannel(TEXT id)  ←── biz_subchannel_subscriptions.subchannel_id
```
