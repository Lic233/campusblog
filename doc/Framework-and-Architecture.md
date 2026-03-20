# 校园博客系统项目架构与使用框架文档

## 1. 文档目的

本文档描述校园博客系统的主要架构设计，用于统一后续开发中的技术选型、系统分层、服务边界与核心数据组织方式。

启动模板将 **Next.js** 与 **Payload CMS** 置于**同一 Git 仓库根目录**，并采用 Payload 面向 **Cloudflare D1** 的集成方式：`next.config.ts` 经由 `withPayload` 包装，生产构建通过 **`@opennextjs/cloudflare`** 产出 Workers 可执行产物，绑定关系在根目录 **`wrangler.jsonc`** 中维护。对外站点与本地开发以 `pnpm dev` 等脚本启动，具体步骤见仓库 `README.md`。

前台路由位于 **`src/app/(frontend)`**，统一引入 Tailwind 与（按需添加的）shadcn/ui 组件；**`src/app/(payload)`** 承载 Payload 管理界面与自动生成的 API 路由，使用 Payload 自带样式资源，不参与前台 Tailwind 的 `content` 扫描。

项目技术栈如下：

* 前端框架：Next.js（15.x）
* React：19.x
* UI 组件体系：shadcn/ui（根目录 `components.json`；路径别名 `@/components`、`@/lib` 指向 `src/app/(frontend)` 下目录；组件通过 CLI 按需安装）
* 样式方案：Tailwind CSS（3.x），经 PostCSS 接入；配置文件为根目录 `tailwind.config.ts` 与 `postcss.config.mjs`，全局样式入口为 `src/app/(frontend)/styles.css`
* 富文本编辑器：Tiptap（3.x）（用于前台文章编辑，在写作功能落地时接入，存储约定见 §5.4）
* 视觉增强组件：Aceternity UI（用于门户与展示型页面的动效与视觉强化）
* 内容管理：Payload CMS（3.x）；数据库适配器为 **`@payloadcms/db-d1-sqlite`**，媒体为 **`@payloadcms/storage-r2`**
* 业务 ORM：Drizzle ORM（访问 D1 中 `biz_` 前缀业务表，在互动与用户账号等模块落地时启用）
* JWT 库：`jose`（用于前台注册用户的 JWT 签发与校验，在认证流程落地时启用）
* 部署与运行时：**OpenNext Cloudflare** + Wrangler，目标环境为 **Cloudflare Workers**（静态资源与增量缓存等按模板绑定配置）

本项目目标是构建一个面向校园场景的现代化博客平台，支持分层浏览、分层发布、内容上浮发现与后续业务扩展。

---

## 1.1 基础设施依赖

本项目采用**全 Cloudflare 基础设施**：数据库（D1）、键值存储（Workers KV）、对象存储（R2）均由 Cloudflare 托管。

### 1.1.1 数据库

* 使用 **Cloudflare D1**（SQLite 内核的边缘数据库）
* 所有数据表通过表前缀做逻辑隔离：
  * Payload CMS 内容表使用 `cms_` 前缀（由 **`@payloadcms/db-d1-sqlite`** 适配器配合 D1 管理）
  * 业务表使用 `biz_` 前缀（规划由 Drizzle ORM 管理，通过 D1 binding 访问）
* 开发环境：Wrangler 在本地以 SQLite 文件等方式模拟 D1，状态目录位于仓库根目录下的 **`.wrangler/state/`**（已纳入 `.gitignore`）

### 1.1.2 对象存储

* 使用 **Cloudflare R2**（S3 兼容，零出口流量费用）

作用：

* 存储文章封面、正文图片、用户头像等媒体资源
* Payload CMS 通过 **`@payloadcms/storage-r2`** 将媒体写入 R2，由 Wrangler 中的 `R2` 绑定注入运行时

开发环境：Wrangler 本地 R2 模拟（文件落到 `.wrangler/state/`）

### 1.1.3 邮件服务

* 使用 **Resend**（HTTP API，原生边缘兼容）

作用：

* 注册时向用户邮箱发送验证码
* 后续可扩展用于找回密码、系统通知等场景

开发环境：Resend 提供沙箱域名（`onboarding@resend.dev`），邮件不真实外发，可在 Resend 控制台查看。

### 1.1.4 KV 缓存

* 使用 **Cloudflare Workers KV**（键值存储，用于验证码、限流计数、临时计数等）

作用：

* 存储注册验证码（TTL 5 分钟）
* 缓存防刷限流时间戳（同一邮箱 60 秒内不允许重复发送）
* 缓存热门文章阅读计数等高频临时数据

开发环境：Wrangler 本地 KV 模拟（存储于 `.wrangler/state/`）

### 1.1.5 本地开发环境

**日常开发不依赖本机 Docker**；Cloudflare 相关绑定由 Wrangler 与 Next.js 开发服务器协同提供（详见仓库 `README.md`）。

```bash
# 安装依赖后启动 Next.js 开发服务器（模板默认脚本）
pnpm dev
```

Wrangler 可在本地模拟或代理下列能力（具体绑定名称以 `wrangler.jsonc` 为准）：

| 服务 | 本地方案 | 生产方案 |
|------|---------|---------|
| 数据库 | Wrangler 本地 D1（SQLite 文件） | Cloudflare D1 |
| KV 存储 | Wrangler 本地 KV | Cloudflare Workers KV |
| 对象存储 | Wrangler 本地 R2（磁盘文件） | Cloudflare R2 |
| 邮件 | Resend 沙箱（控制台查看） | Resend 真实发送 |

本地 Wrangler 状态位于 **`.wrangler/state/`**，由 `.gitignore` 排除，不进入版本库。

---

## 2. 架构设计原则

本项目采用**单服务架构**，所有功能集中在 Next.js + Payload CMS 合并项目中；构建产物通过 **OpenNext Cloudflare** 发布到 **Cloudflare Workers**，配套 R2、D1 等绑定由 `wrangler.jsonc` 声明。

核心原则如下：

* **Next.js 与 Payload CMS 合并为同一 Node.js 项目**，共享进程，Payload Local API 供 Next.js 服务端直接调用，无需跨进程 HTTP 请求。
* Payload CMS 负责内容建模、内容录入、媒体管理与内容输出。
* **Next.js Server Actions / Route Handlers 承担所有业务后端职责**，包括用户认证、JWT 颁发与校验、评论、点赞、收藏、关注等互动逻辑。
* **单服务部署**：不单独维护与 Next.js 分离的后端进程或端口；业务 API 与页面在同一应用中交付。
* 内容结构必须体现校园组织层级。
* 低层级内容能够被高层级页面聚合、检索和发现。

---

## 2.1 用户与管理员身份

**管理员与前台用户分离**：前台注册用户只存在于 D1 `biz_users`（配合 JWT）。具备管理后台权限的用户仅通过 **Payload 用户体系**（如官方 `users` 集合及 Access Control）登录 `/admin`。`biz_users` 不存放管理员角色或权限标记。

### 前台用户（注册用户）

* 注册后写入 `biz_users`，登录后持有 JWT（Claims 仅含 `userId` 与 `exp` 等必要字段）
* 可阅读所有公开内容
* 可发布文章，自由选择发布至学校、校区或学院任意层级
* 可发表评论、点赞、收藏、关注其他用户
* 可编辑和删除自己发布的内容

### 管理员（仅 Payload）

* 由现有 Payload 管理员在 `/admin` 中创建或调整 Payload 用户账号与权限（遵循 Payload 3 的 Users 与 `access` 配置）
* 通过 Payload CMS Admin 管理所有内容（学校、校区、学院、文章、媒体）
* 可对已发布内容进行 **Review**：隐藏或恢复文章等（所有层级均可操作）；对 `biz_` 评论等互动数据的合规处置，通过 Payload 自定义视图、Hook 或受保护内部接口实现，**不**使用 `biz_users` 中的角色字段（该表无此字段）
* **没有"审核通过才能发布"的前置流程**——用户提交文章后直接发布，管理员事后 Review

---

## 2.2 认证与登录注册流程

### 2.2.1 认证架构总览

| 身份 | 认证入口 | 认证方式 |
|------|----------|----------|
| 前台用户 | Next.js Route Handler（如 `POST /api/auth/login`） | 邮箱 + 密码，颁发 JWT |
| 前台用户注册 | Next.js Route Handler（两步：发送验证码 + 注册） | 邮箱验证码确认 + 密码 + 昵称 |
| 管理员 | Payload CMS `/admin` | **仅** Payload 用户会话（Payload 自带登录与 Cookie），与前台 JWT 无关 |

* **Next.js + `jose` 仅服务前台注册用户**（`biz_users` + JWT）
* **管理员为 Payload 单一体系**：登录态、权限校验均以 Payload Users 与 Collection `access` 为准；前台账号即使邮箱相同也与 Payload 管理员账号无自动关联，除非项目显式做账号绑定（本架构默认不做绑定）

### 2.2.2 注册流程

注册分为**两步**：先验证邮箱，再提交注册信息。

```
① 用户填写邮箱，点击"发送验证码"
    │
    ▼
Next.js Server Action
    │  生成 6 位数字验证码
    │  写入 Workers KV：key = "verify:{email}"，value = code，TTL = 300s
    │  写入防刷 KV：key = "verify_cooldown:{email}"，TTL = 60s
    │  调用 Resend API 发送验证码邮件
    │
    ▼
② 用户收到邮件，填写验证码 + 昵称 + 密码，点击"完成注册"
    │
    ▼
Next.js Server Action
    │  从 KV 读取验证码，比对是否一致且未过期
    │  验证通过后：
    │    - 写入 D1 biz_users 表（bcrypt 加密密码）
    │    - 从 KV 删除已使用的验证码
    │    - 调用 Payload Local API 创建 UserProfile（cms_ 表）
    │    - 用 jose 签发 JWT（{ userId, exp }）
    │
    ▼
前端将 Token 存入 httpOnly Cookie（access_token）
    │
    ▼
注册完成，用户进入登录态
```

**验证码防刷策略**（阶段 4 实现）：

* 同一邮箱 60 秒内不允许重复发送（KV cooldown key）
* 同一 IP 每小时最多发送 10 次（KV IP 计数，TTL 3600s）
* 验证码错误超过 5 次后该验证码失效

### 2.2.3 登录流程

```
用户填写邮箱 + 密码
    │
    ▼
Next.js Server Action（Route Handler：POST /api/auth/login）
    │
    ▼
从 D1 biz_users 查询用户
bcrypt 验证密码
jose 签发 JWT（{ userId, exp }，有效期 7 天）
    │
    ▼
前端将 Token 存入 httpOnly Cookie（access_token）
    │
    ▼
后续请求，Next.js middleware 从 Cookie 读取并验证 JWT
```

### 2.2.4 Token 流转规则

* **Next.js middleware**：每次请求时调用 `jose.jwtVerify()` 验证 access_token Cookie，解析出 `userId`，注入 request header（`x-user-id`）供 Server Component / Route Handler 读取
* **Server Actions / Route Handlers**：从 request header 读取已验证的 `userId`，无需重复验证 JWT（或按安全要求在敏感操作中二次校验 Cookie）
* **Payload Local API 写操作**：根据业务 Access 规则，使用解析后的 `userId` 构造调用上下文（例如校验 `authorId` 与当前用户一致）；**管理员在 `/admin` 内的操作不经过此前台 JWT**，由 Payload 会话与 `access` 控制

---

## 3. 校园层级结构设计

本系统采用三层校园组织结构：

1. **学校层级**
2. **校区层级**
3. **学院层级**

三层之间形成严格的从属关系：

* 一个学校下可包含多个校区。
* 一个校区下可包含多个学院。
* 一个学院必须归属于某一校区与某一学校。

该层级既用于内容归属，也用于页面浏览。

### 3.1 内容归属原则

每篇文章在发布时必须绑定一个明确的发布层级：

* 发布到学校层级：适用于全校性公告、校园活动、校级专题文章。
* 发布到校区层级：适用于某个校区内部的资讯、活动、生活内容。
* 发布到学院层级：适用于学院新闻、课程经验、专业讨论、学生组织内容。

### 3.2 内容发现原则

系统支持"低层级内容向高层级可见"的发现机制：

* 学校层级页面可发现本校所有校区与学院的公开文章。
* 校区层级页面可发现本校区及其下属学院的公开文章。
* 学院层级页面主要展示本学院内容。

---

## 4. 总体系统架构

### 4.1 前端 + 内容管理 + 业务后端（单一项目）

本项目是**单一 Node.js 项目**，由 **Next.js + Payload CMS** 构成核心运行时；**Drizzle ORM** 在业务表与互动逻辑接入后与之并列承担数据访问。整体经 OpenNext 部署到 Cloudflare Workers。

其中：

* **Next.js** 负责路由、页面渲染、SSR/SSG、Server Actions、Route Handlers 和中间件
* **Payload CMS** 嵌入 Next.js 项目，提供内容管理后台（`/admin`）与 Local API
* **Drizzle ORM** 负责业务表（`biz_` 前缀）的类型安全数据访问，通过 D1 binding 执行 SQL
* **shadcn/ui** 负责构建现代化且可控的组件体系
* **Tailwind CSS** 负责页面样式、响应式布局和统一设计语言
* **Tiptap** 负责文章编辑器能力
* **Aceternity UI** 负责页面视觉增强与动画效果组件

核心职责包括：

* 学校 / 校区 / 学院三级页面展示
* 文章列表、文章详情、搜索与筛选
* 用户注册、登录、写作、编辑、发布（通过 Payload Local API + Drizzle）
* 评论、点赞、收藏、关注等互动功能（Server Actions / Route Handlers + Drizzle）
* 管理员 Review 后台（`/admin`，Payload CMS Admin UI）

---

## 5. 核心框架职责说明

### 5.1 Next.js

Next.js 是系统统一入口，承担**前端渲染和全部后端逻辑**：

* 构建首页、学校页、校区页、学院页、文章页、用户中心、写作页
* 通过 **Payload Local API** 直接获取和写入内容数据（同进程调用，无 HTTP 开销）
* 通过 **Drizzle ORM** 直接读写业务数据表（D1 binding）
* Server Actions 实现用户认证（注册、登录、登出）
* Route Handlers 实现业务 API（评论、点赞、收藏等互动数据端点）
* `src/middleware.ts`（或仓库根目录同等文件，按 Next.js 约定）实现 JWT 验证与路由保护；该文件在认证阶段落地时加入仓库

### 5.2 shadcn/ui

shadcn/ui 用于建立现代化、可扩展的组件体系，主要承担：

* 顶部导航、侧边栏、卡片、弹窗、表单、分页等公共组件
* 前台内容展示区域的统一风格与交互模式

组件源码放在 **`src/app/(frontend)/components`**（例如 `ui/` 子目录存放 CLI 生成的基础件），工具函数放在 **`src/app/(frontend)/lib`**（如 `cn` 辅助函数）。**Payload `/admin` 管理界面**沿用 Payload 自带 UI，不强制使用 shadcn。

### 5.3 Tailwind CSS

Tailwind CSS 负责：

* 页面布局与样式实现
* 响应式设计
* 主题色、间距、圆角、阴影等设计令牌表达

根目录 **`tailwind.config.ts`** 将 `content` 限定为 **`src/app/(frontend)`** 下源码，使工具类仅针对前台打包；主题扩展与 shadcn 所需的 `theme.extend` 可在后续随设计系统一并补充。

### 5.4 Tiptap

Tiptap 负责文章正文编辑能力，支持：

* 标题、段落、引用、列表、代码块、图片、链接等基础内容编辑

#### 5.4.1 正文存储格式

Tiptap 基于 ProseMirror，编辑器输出 **ProseMirror JSON** 格式的文档树。

> Payload CMS 原生 `richText` 字段使用 **Lexical JSON** 格式，与 Tiptap 不兼容。
> 因此 Post 正文**不使用** `richText` 字段，而是使用 `json` 字段类型，底层对应 D1 中的 `TEXT` 列，直接存储序列化后的 ProseMirror JSON。

**写入链路：**

```
用户在编辑器页面操作（Tiptap）
    │  editor.getJSON() → ProseMirrorJSON
    ▼
Next.js Server Action
    │  调用 Payload Local API
    ▼
payload.create/update({ collection: 'posts', data: { content: <ProseMirrorJSON> } })
    │
    ▼
D1 TEXT 列（cms_posts.content，JSON.stringify 序列化存储）
```

**读取链路（SSR）：**

```
Next.js Server Component
    │  Payload Local API 取出 ProseMirrorJSON（JSON.parse 反序列化）
    ▼
import { generateHTML } from '@tiptap/html'
generateHTML(json, extensions)   ← 服务端执行，无浏览器依赖
    │
    ▼
HTML 字符串 → DOMPurify 清洗（防 XSS）→ 注入页面
```

**正文中的图片：**
通过 Tiptap Image 扩展插入。用户粘贴/上传图片时，前端先调用 Payload Media API 上传至 R2，取回 URL 后写入 ProseMirror `image` 节点的 `src` 属性。

#### 5.4.2 管理端与前台调用方式（实现约定）

**管理端 `/admin`：用 Tiptap 接管某个 `json` 字段的编辑与列表摘要**

正文类数据在集合中应使用 **`type: 'json'`**（存 ProseMirror JSON 对象），**不要**使用 Payload 默认的 **`richText`（Lexical）** 承载同一内容。在字段的 `admin` 上挂载统一导出：

```typescript
import type { CollectionConfig } from 'payload'
import { tiptapJsonAdminComponents } from '../fields/tiptapJsonAdmin'

// 示例：任意集合中的字段片段
{
  name: 'body', // 或 content、description 等，按模型命名
  type: 'json',
  label: 'Body',
  admin: {
    description: 'Edited with Tiptap; stored as ProseMirror JSON.',
    components: tiptapJsonAdminComponents,
  },
}
```

* **`tiptapJsonAdminComponents`** 定义于 **`src/fields/tiptapJsonAdmin.ts`**，内部指向：
  * **`TiptapPayloadJsonField`**：编辑表单中的 Tiptap 编辑器；只读场景下使用 **`TiptapReadOnly`**。
  * **`TiptapPayloadJsonCell`**：列表视图中对 JSON 正文的纯文本摘要（避免每行挂载完整编辑器）。
* 组件实现位于 **`src/app/(frontend)/components/editor/`**，路径需与 Payload **`admin.importMap.baseDir`（`src/`）** 及 **`components.json`** 中的约定一致。
* 若新增或重命名上述 Admin 自定义组件路径，需执行 **`pnpm exec cross-env NODE_OPTIONS=--no-deprecation payload generate:importmap`** 更新 **`src/app/(payload)/admin/importMap.js`**。
* 根目录 **`next.config.ts`** 中为 Webpack 配置了 **`resolve.alias.app` → `src/app`**，以便构建期解析 importMap 中的 `app/(frontend)/...` 模块路径。

**扩展列表（编辑 / 只读 / 将来服务端 HTML 需一致）**

* 公共扩展数组在 **`src/app/(frontend)/lib/tiptap-extensions.ts`**（当前为 **StarterKit**）。增加 **Image、Link** 等扩展时，只改此文件，并保证 Admin 与前台使用同一套扩展，避免 JSON 与 schema 不一致。

**前台站点（`src/app/(frontend)`）**

* **`TiptapEditor`**（Client）：可编辑；通过 **`content`**、**`onChange`** 与表单或 Server Action 对接；内部已设置 **`immediatelyRender: false`** 以适配 Next.js App Router。
* **`TiptapReadOnly`**（Client）：根据已存储的 JSON 做只读渲染，适合边缘部署下的详情页。
* 全局样式与 ProseMirror 基础排版见 **`src/app/(frontend)/styles.css`** 中 **`.tiptap-editor`** 相关规则。

**与全局 `editor` / Lexical 的关系**

* 本仓库未在 **`payload.config.ts`** 中配置 **`editor: lexicalEditor()`**。若日后为其它字段单独启用 **`richText`**，需自行配置 Lexical **`editor`**；**Tiptap 正文字段仍应保持 `type: 'json'` + 上述 `components`**，二者勿混用同一存储格式。

### 5.5 Payload CMS

Payload CMS **与 Next.js 合并为同一项目**，负责：

* 学校、校区、学院等层级内容模型定义
* 文章内容和媒体资源管理（媒体存储于 R2）
* 提供 `/admin` 管理后台，供管理员进行内容 Review 和数据维护
* 通过 **Local API** 供 Next.js 服务端直接调用，是内容读写的主要路径
* 文章与层级归属关系维护

**合并方式**：使用 Payload CMS 官方提供的 **`withPayload`**（`@payloadcms/next`）包装 Next 配置；启动模板对应 **Cloudflare D1** 场景，应用源码位于 **`src/`** 下，其中 **`src/payload.config.ts`** 为 Payload 配置入口，**`src/collections/`** 等目录承载集合定义。

**数据库适配器**：**`@payloadcms/db-d1-sqlite`**，通过 Wrangler 注入的 D1 绑定访问 Cloudflare D1。

**存储适配器**：**`@payloadcms/storage-r2`**，媒体文件写入与 R2 绑定 `R2` 对应。

### 5.6 Drizzle ORM

Drizzle ORM 负责业务表（`biz_` 前缀）的数据访问：

* 完全类型安全的 SQL 查询构建器，原生支持 D1（SQLite 方言）
* 在边缘运行时（Cloudflare Workers）中零依赖原生模块
* 通过 Cloudflare D1 binding 执行查询
* Schema 与迁移文件规划放在仓库根目录下的 **`drizzle/`**（如 `schema.ts`、`migrations/`，具体以接入 Drizzle Kit 时的目录为准）

### 5.7 jose（JWT 库）

`jose` 是一个 Web Standards 兼容的 JWT 库，在 Node.js 和 Cloudflare Workers 边缘运行时均可使用：

* 用于注册/登录时签发 JWT
* 用于 `src/middleware.ts`（或 Next.js 约定的根级 `middleware.ts`）中验证 JWT
* 签发算法：`HS256`，密钥从 `JWT_SECRET` 环境变量读取

### 5.8 Aceternity UI

Aceternity UI 用于在前端进行视觉增强，主要承担：

* 首页、门户页（学校/校区）中的 Banner、Hero 区域与动态背景
* 卡片 hover 动效、光效边框、渐变标题等展示效果
* 提升整体 UI 的现代感与视觉吸引力

使用原则：

* 仅用于展示层（首页、门户页、内容卡片等）
* 不用于后台表单、写作页等功能性强的界面
* 与 shadcn/ui 配合使用，保持组件体系稳定与可维护性

---

## 6. 主要内容模型

### 6.1 Payload CMS 中的内容模型（`cms_` 前缀，D1 存储）

* **School**：学校
* **Campus**：校区
* **College**：学院
* **Post**：文章（正文以 ProseMirror JSON 存储于 `json` 字段）
* **Tag**：标签
* **Media**：媒体资源（文件存于 R2，元数据存于 D1）
* **UserProfile**：公开用户资料（注册时由 Next.js Server Action 同步创建）

其中关键关系为：

* Campus 属于 School
* College 属于 Campus，同时间接属于 School
* Post 必须绑定 School，并可进一步绑定 Campus 或 College

建议文章模型中至少包含以下层级字段：

* `schoolId`
* `campusId`（可选）
* `collegeId`（可选）
* `publishLevel`（school / campus / college）
* `status`（draft / published / hidden）— `hidden` 由管理员 Review 时设置

### 6.2 Drizzle ORM 业务模型（`biz_` 前缀，D1 存储）

* **User**：用户账号（邮箱、密码哈希等）
* **Comment**：评论
* **LikeRecord**：点赞记录
* **FavoriteRecord**：收藏记录
* **FollowRecord**：关注记录

任何已登录前台用户均可自由选择发布层级；**全局内容管理与 Review 权限仅存在于 Payload 管理员会话**，由 Payload `access` 与 Users 配置维护；`biz_` 侧不设独立权限绑定表。

---

## 7. 服务边界与数据访问路径

本架构为单服务，所有操作均在 Next.js 进程内完成：

### 7.1 Payload CMS 负责

* 学校、校区、学院基础信息
* 文章正文与元数据（含 `status` 字段管理）
* 媒体资源（文件写入 R2）
* 标签和基础内容分类
* 通过 Local API 对 Next.js 提供内容读写能力
* `/admin` 后台供管理员管理内容和进行 Review

### 7.2 Drizzle ORM + Next.js 负责

* 用户注册、登录、JWT 颁发与校验（jose）
* 前台用户身份标识
* 评论、点赞、收藏、关注等互动逻辑
* 行为统计与平台数据

### 7.3 数据访问路径一览

| 调用方 | 被调用方 | 方式 | 场景 |
|--------|----------|------|------|
| Next.js Server Component | Payload CMS | Local API（同进程） | 内容读取、文章写入 |
| Next.js Server Action | Payload CMS | Local API（同进程） | 文章发布、UserProfile 创建 |
| Next.js Server Action | Drizzle ORM | 直接方法调用 | 注册、登录、互动写操作 |
| Next.js Route Handler | Drizzle ORM | 直接方法调用 | 评论、点赞等 API 端点 |
| Next.js Server Action | Workers KV | CF binding | 验证码读写、限流计数 |
| Next.js Server Action | Resend | HTTP API | 发送验证码邮件 |
| 管理员浏览器 | Payload CMS Admin | HTTP | 内容 Review、数据维护 |

---

## 8. 典型访问与发布流程

### 8.1 分层浏览流程

1. 用户进入某个学校页面。
2. Next.js Server Component 通过 Payload Local API 拉取该学校范围内的已发布文章。
3. 查询结果中可包含学校级、校区级、学院级的公开内容（`status = published`）。
4. 前端按推荐、最新、热门等方式展示聚合内容。

### 8.2 发布流程（无前置审核，管理员事后 Review）

```
1. 用户进入写作页，JWT 有效
    │
    ▼
2. 用户自由选择发布层级（学校 / 校区 / 学院），填写文章内容
   层级列表由 Payload CMS Local API 提供
    │
    ▼
3. 用户点击"发布"，Next.js Server Action 调用 Payload Local API
   payload.create({ collection: 'posts', data: { ...文章内容, status: 'published' } })
    │
    ▼
4. 文章立即上线，在对应层级页面可见
    │
    ▼
5. 管理员可随时登录 /admin 对文章进行 Review
   如内容不当，将 status 改为 hidden，文章从前台下架
```

---

## 9. 推荐项目结构

本项目采用**单一 Git 仓库、单包应用**：Next.js、Payload 与（后续接入的）业务代码共享仓库根目录下的 `package.json`，源码主目录为 **`src/`**。对外门户、认证与用户区等页面按 Next.js 路由组逐步展开，优先落在 **`src/app/(frontend)`** 及其子目录中。

### 9.0 仓库根目录结构

```text
CampusBlog/                        ← Git 仓库根目录
  doc/                             ← 项目文档（本文件所在目录）
  src/                             ← 应用源码（Next.js App Router + Payload）
  public/                          ← 静态资源
  tests/                           ← 测试（如 Playwright、Vitest）
  components.json                  ← shadcn/ui 配置
  tailwind.config.ts
  postcss.config.mjs
  next.config.ts
  wrangler.jsonc                   ← Cloudflare Workers / D1 / R2 等绑定
  package.json
  .env / .env.example
  .gitignore
  README.md
```

### 9.1 前端 + CMS + 业务后端（`src/`）

启动模板当前已包含 `(frontend)` 与 `(payload)` 路由组；下列树状结构描述校园博客全量落地时的推荐布局，其中标注为规划的目录与文件可在对应功能开发阶段按需创建。

```text
src/
  app/
    (frontend)/                    ← 对外站点：Tailwind + shadcn 作用域
      layout.tsx
      page.tsx                     ← 首页（可随门户改版替换）
      styles.css                   ← Tailwind 入口与全局样式
      components/                  ← 前台组件（shadcn `ui/`、布局与业务块）
        ui/                        ← CLI 生成的基础组件
        layout/                    ← Header、Footer、Sidebar 等
        article/                   ← ArticleCard、CommentSection 等
        hierarchy/                 ← 层级导航、面包屑等
        editor/                    ← Tiptap 编辑器封装（写作功能阶段）
      lib/                         ← 工具函数（如 `utils.ts` 中的 `cn`）
      (public)/                    ← 规划：无需登录的门户子路由（可选路由组）
        school/[slug]/page.tsx
        campus/[slug]/page.tsx
        college/[slug]/page.tsx
        post/[slug]/page.tsx
        search/page.tsx
      (auth)/                      ← 规划：登录、注册
      (user)/                      ← 规划：用户中心、写作台
    (payload)/                     ← Payload 管理端与 API（模板生成，勿手改结构）
      admin/[[...segments]]/
      api/[...slug]/
    api/                           ← 规划：业务 Route Handlers
      auth/
        login/route.ts
        register/route.ts
        send-code/route.ts
        logout/route.ts
      comments/route.ts
      likes/route.ts
      favorites/route.ts
      follows/route.ts
  collections/                     ← Payload Collections（当前含 Users、Media 等）
  migrations/                      ← Payload 数据库迁移
  payload.config.ts                ← Payload 配置入口
  payload-types.ts                 ← 由 `generate:types` 生成
  middleware.ts                    ← 规划：JWT 与路由保护（认证阶段添加）
  hooks/                           ← Payload Hooks（按需）
  access/                          ← Payload Access 函数（按需）
  globals/                         ← Payload Globals（按需）
```

**Drizzle 与共享库（规划路径）：**

```text
drizzle/                           ← 仓库根目录：biz_ 业务表 schema 与 Drizzle Kit 迁移
  schema.ts
  migrations/
src/lib/                           ← 规划：服务端共享模块（若创建）
  api/cms.ts                       ← Payload Local API 封装
  auth/getUser.ts                  ← 从 Cookie / header 解析前台用户
  db/index.ts                      ← Drizzle 客户端（D1 binding）
```

TypeScript 路径别名在根目录 **`tsconfig.json`** 中维护：除 `@/*` → `./src/*` 与 `@payload-config` 外，**`@/components`**、**`@/lib`** 已指向前台目录，便于 shadcn CLI 与业务代码一致引用。

### 9.2 Cloudflare 绑定配置（`wrangler.jsonc`）

绑定声明位于仓库根目录的 **`wrangler.jsonc`**（JSON with Comments），与 OpenNext 构建产物路径（如 `.open-next/worker.js`、`.open-next/assets`）配套使用。下列片段展示**典型结构**；`database_id`、存储桶名等需替换为你在 Cloudflare 控制台中的实际资源标识。

```jsonc
{
  "name": "campusblog",
  "compatibility_date": "2025-08-15",
  "compatibility_flags": ["nodejs_compat", "global_fetch_strictly_public"],
  "main": ".open-next/worker.js",
  "assets": {
    "directory": ".open-next/assets",
    "binding": "ASSETS"
  },
  "d1_databases": [
    {
      "binding": "D1",
      "database_name": "campusblog",
      "database_id": "your-d1-database-id"
    }
  ],
  "r2_buckets": [
    {
      "binding": "R2",
      "bucket_name": "campusblog"
    }
  ]
}
```

若后续启用 Workers KV（验证码、限流等），在同一文件中增加 `kv_namespaces` 数组即可；具体键名与绑定名须与运行时读取环境变量的代码一致。

---

## 10. 架构结论

本项目采用 **Next.js + Payload CMS（合并部署）+ Cloudflare 全栈基础设施** 的单服务架构，具备以下特征：

* **单一部署单元**：页面、业务 Route Handlers / Server Actions 与 CMS 同应用交付；对外 API 与前端同源，无单独后端部署项。
* **边缘数据面**：D1、R2、Workers KV 为 Cloudflare 托管服务，与 Workers 及 OpenNext 资源绑定模型一致。
* **Local API**：Next.js 与 Payload 同进程，内容读写通过 Local API，无额外 HTTP 环回。
* **类型安全**：Drizzle ORM + TypeScript 覆盖 `biz_` 业务表访问。
* **本地开发**：Wrangler 模拟 D1、KV、R2 绑定，与生产配置对齐。
* **学校—校区—学院**三层结构承担内容归属、浏览聚合与发布层级。
* **低层级内容向高层级可发现**，兼顾组织性与传播。
* **用户直接发布，管理员事后 Review**（Payload `/admin` 调整 `status` 等）。
