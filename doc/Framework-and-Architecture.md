# 校园博客系统项目架构与使用框架文档

## 1. 文档目的

本文档用于统一校园博客系统的技术选型、系统分层、服务边界、内容模型与核心业务规则。

本项目基于 Payload Cloudflare 快速开始模板，采用 **Next.js + Payload CMS 单仓库单应用** 形态，运行在 Cloudflare Workers。

---

## 2. 确定依赖版本（基于当前已安装环境）

以下版本来自当前项目 `pnpm list --depth 0`：

- Next.js：`16.2.1`
- React：`19.2.4`
- React DOM：`19.2.4`
- Payload CMS：`3.80.0`
- `@payloadcms/next`：`3.80.0`
- `@payloadcms/db-d1-sqlite`：`3.80.0`
- `@payloadcms/storage-r2`：`3.80.0`
- `@payloadcms/ui`：`3.80.0`
- Tailwind CSS：`3.4.19`
- shadcn CLI：`4.1.0`
- Tiptap：`3.20.4`（`@tiptap/core/react/html/starter-kit`）
- OpenNext Cloudflare：`1.17.3`
- Wrangler：`4.76.0`
- TypeScript：`5.9.3`
- jose：当前项目后续接入时固定到实现版本（本仓库尚未安装）

代码编写时注意使用Next.js 16 与 React 19 的新特性（如 Server Actions、Server Components、React 18+ API 等），并确保与 Payload CMS 3.80.0 的兼容性。

说明：Aceternity UI 为组件拷贝式使用，不依赖固定 npm 包版本。

---

## 3. 基础设施依赖

本项目采用全 Cloudflare 基础设施：

- 数据库：Cloudflare D1
- 键值缓存：Cloudflare Workers KV
- 对象存储：Cloudflare R2
- 部署运行时：Cloudflare Workers（OpenNext 产物）

### 3.1 KV 使用策略

- 认证限流、发送冷却、热点计数均直接写入 `KV`。
- **不实现 KV 的 D1 降级表，不实现 KV 失效回退路径**。
- 若 KV 不可用，接口返回错误并提示重试，保障一致性与实现简洁。

---

## 4. 身份体系与权限边界

### 4.1 统一用户体系（Payload Users）

- 前台用户与管理员统一存于 Payload `users` 集合
- 登录/注册/会话统一走 Payload Auth 体系（含 JWT / Cookie）
- 通过 `roles` 字段区分权限：`admin`、`editor`、`user`
- 用户可发布文章、发表评论、点赞、收藏、关注、订阅频道

### 4.2 管理权限（基于角色）

- 管理员与编辑通过 `/admin` 进行内容运营
- 文章与评论均支持 `published` / `hidden` 管理
- 配额管理（单用户与全量）由管理员角色执行

---

## 5. 频道结构设计（由三级改为两级）

系统采用两级频道结构：

1. **学校（School）**
2. **学校子频道（SchoolSubChannel）**

关系约束：

- 一个学校下可配置多个子频道
- 子频道必须归属于且仅归属于一个学校
- 文章发布绑定 `schoolId`，可选绑定 `subChannelId`

### 5.1 内容归属与发现

- 学校页聚合该学校全部公开文章
- 子频道页展示该子频道公开文章
- 学校页可按子频道筛选

### 5.2 频道后台管理（管理员）

学校与子频道均由 Payload Admin 后台维护：

- 新增、编辑、禁用、排序
- 子频道与学校归属校验
- 控制是否在前台展示

---

## 6. 订阅模型

前台用户可订阅：

1. 学校频道（School）
2. 学校内子频道（SchoolSubChannel）

行为规则：

- 订阅学校后，用户可进一步订阅该学校下子频道
- 取消学校订阅时，可级联取消该学校下子频道订阅
- 子频道订阅必须校验与学校归属一致

---

## 7. 用户发布限额

### 7.1 基础配额规则

- 默认每个用户可上传总量：`100MB`（`104857600` bytes）
- 统计口径：**文字 + 图片**
  - 文字：正文、标题、摘要等 UTF-8 字节数
  - 图片：上传到 R2 的文件字节数

### 7.2 管理员可调配额

管理员后台支持两类操作：

1. 修改单用户配额（覆盖默认值）
2. 全量修改所有用户配额（批量更新）

### 7.3 执行时机

- 创建/更新文章时先计算增量，再校验是否超配额
- 超限则拒绝发布并返回剩余额度提示

---

## 8. 系统职责分层

### 8.1 Next.js

- 前台页面、SSR/ISR、Server Actions、Route Handlers
- 调用 Payload Local API 获取内容模型数据
- 调用 Drizzle 处理 `biz_` 业务数据

### 8.2 Payload CMS

- 学校、子频道、文章、评论、标签、媒体、用户等内容管理
- 管理后台 `/admin`
- 频道管理、内容 Review、配额管理入口

### 8.3 Drizzle ORM

- `biz_` 表类型安全访问
- 订阅关系、互动关系（点赞/收藏/关注）等业务数据落库

### 8.4 R2 / KV / D1

- R2：图片与媒体文件
- KV：验证码、冷却、限流、热点缓存
- D1：业务主数据与 Payload 内容表

---

## 9. 主要数据模型

### 9.1 Payload（`cms_`）

- School
- SchoolSubChannel
- Post
- Comment
- Tag
- Media
- User
- PlatformSettings（可选，管理端策略项）

### 9.2 Business（`biz_`）

- LikeRecord
- FavoriteRecord
- FollowRecord
- SchoolSubscription
- SubChannelSubscription
- UploadUsageRecord

---

## 10. 服务边界与访问路径

| 调用方 | 被调用方 | 方式 | 场景 |
|--------|----------|------|------|
| Next.js Server Component | Payload | Local API | 学校/子频道/文章读取 |
| Next.js Server Action | Payload | Local API | 文章发布、频道列表、评论写入 |
| Next.js Server Action | Drizzle | 直接调用 | 订阅写入、配额校验、互动写入 |
| Next.js Route Handler | Drizzle | 直接调用 | 点赞、收藏、关注 |
| Next.js Server Action | KV | Cloudflare binding | 冷却、限流、热点缓存 |
| Next.js Server Action | Resend | HTTP API | 通知邮件（可选） |
| 管理员浏览器 | Payload Admin | HTTP | 频道管理、配额调整、内容 Review |

---

## 11. 典型流程

### 11.1 订阅流程

1. 用户进入学校页并点击“订阅学校”
2. 前端调用订阅接口写入 `biz_school_subscriptions`
3. 用户可在学校内勾选子频道，写入 `biz_subchannel_subscriptions`

### 11.2 发布流程（含配额）

1. 用户进入写作页并选择学校/子频道
2. 服务端计算本次文字与图片总字节
3. 校验 `used_bytes + delta <= quota_bytes`
4. 校验通过后写入文章并更新使用量记录
5. 文章状态为 `published`，管理员可事后 Review 为 `hidden`

---

## 12. 当前模板对应目录结构

```text
campusblog/
  doc/
  public/
  src/
    app/
      (frontend)/
      (payload)/
    collections/
    components/
    fields/
    migrations/
    payload.config.ts
    payload-types.ts
  components.json
  tailwind.config.ts
  postcss.config.mjs
  next.config.ts
  wrangler.jsonc
  package.json
  .env
  .env.example
```

说明：

- 绑定配置文件为根目录 `wrangler.jsonc`。
- 业务 Route Handlers 建议位于 `src/app/api/`（后续按阶段创建）。
- Drizzle 建议目录为根目录 `drizzle/`（后续创建 `schema.ts` 与 `migrations/`）。

---

## 13. 架构结论

本项目在当前版本下采用：

- 两级频道模型（学校 + 子频道）
- 用户可订阅学校与子频道
- 默认 100MB 发布总配额（文字 + 图片）
- 管理员后台可调整单用户与全量配额
- KV 直接使用，无降级策略
- 文档路径与目录结构对齐当前快速开始模板
- 项目从开发期即按中英双语规范建设（至少 `zh-CN` 与 `en-US`）

---

## 14. 多语言开发规范

### 14.1 语言范围（最低要求）

1. 必须支持中文（`zh-CN`）与英文（`en-US`）。
2. 任一新功能上线时，两个语言版本必须同时可用。

### 14.2 开发约束

1. 前台与管理端自定义 UI 文案禁止硬编码在组件中，统一走 i18n 资源文件。
2. 日期、时间、数字与容量显示必须使用 locale-aware 格式化。
3. 与 Payload 内容相关的对外展示字段，应在模型层预留多语言能力（如本地化字段或双语字段结构）。

### 14.3 工程建议路径

1. 前台翻译资源：`src/app/(frontend)/locales/zh-CN.json`、`src/app/(frontend)/locales/en-US.json`
2. i18n 工具层：`src/app/(frontend)/lib/i18n/`
3. 语言切换组件：`src/app/(frontend)/components/layout/LanguageSwitcher.tsx`
