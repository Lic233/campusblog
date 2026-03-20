# 校园博客系统项目架构与使用框架文档

## 1. 文档目的

本文档保留项目的主要架构设计，用于统一后续开发中的技术选型、系统分层、服务边界与核心数据组织方式。

项目技术栈如下：

* 前端框架：Next.js（15.x）
* React：18.x
* UI 组件体系：shadcn/ui
* 样式方案：Tailwind CSS（4.2）
* 富文本编辑器：Tiptap（3.x）
* 视觉增强组件：Aceternity UI
* 内容管理：Payload CMS（3.x，与 Next.js 合并为同一项目）
* 业务 ORM：Drizzle ORM（访问 D1 业务表）
* JWT 库：`jose`（边缘兼容）
* 部署平台：Cloudflare Pages + Workers

本项目目标是构建一个面向校园场景的现代化博客平台，支持分层浏览、分层发布、内容上浮发现与后续业务扩展。

---

## 1.1 基础设施依赖

本项目采用**全 Cloudflare 基础设施**：数据库（D1）、键值存储（Workers KV）、对象存储（R2）均由 Cloudflare 托管。

### 1.1.1 数据库

* 使用 **Cloudflare D1**（SQLite 内核的边缘数据库）
* 所有数据表通过表前缀做逻辑隔离：
  * Payload CMS 内容表使用 `cms_` 前缀（由 Payload SQLite 适配器自动管理）
  * 业务表使用 `biz_` 前缀（由 Drizzle ORM 管理，通过 D1 binding 访问）
* 开发环境：Wrangler 自动在本地创建 SQLite 文件模拟 D1（存储于 `web/.wrangler/state/`）

### 1.1.2 对象存储

* 使用 **Cloudflare R2**（S3 兼容，零出口流量费用）

作用：

* 存储文章封面、正文图片、用户头像等媒体资源
* Payload CMS 通过 S3 适配器对接 R2（R2 完全兼容 S3 API）

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

**本地开发通过 Wrangler CLI 统一管理，不依赖本机 Docker。**

```bash
# 启动带 CF 绑定的本地开发服务器
npx wrangler pages dev
```

Wrangler 自动在本地模拟所有 Cloudflare 服务：

| 服务 | 本地方案 | 生产方案 |
|------|---------|---------|
| 数据库 | Wrangler 本地 D1（SQLite 文件） | Cloudflare D1 |
| KV 存储 | Wrangler 本地 KV | Cloudflare Workers KV |
| 对象存储 | Wrangler 本地 R2（磁盘文件） | Cloudflare R2 |
| 邮件 | Resend 沙箱（控制台查看） | Resend 真实发送 |

本地状态目录 `web/.wrangler/state/` 已加入 `.gitignore`，不提交仓库。

---

## 2. 架构设计原则

本项目采用**单服务架构**，所有功能集中在 Next.js + Payload CMS 合并项目中，部署于 Cloudflare Pages。

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

本项目是**单一 Node.js 项目**，由 **Next.js + Payload CMS + Drizzle ORM** 组成，部署在 Cloudflare Pages。

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
* middleware.ts 实现 JWT 验证与路由保护

### 5.2 shadcn/ui

shadcn/ui 用于建立现代化、可扩展的组件体系，主要承担：

* 顶部导航、侧边栏、卡片、弹窗、表单、分页等公共组件
* 前台内容展示与后台交互界面的统一风格

### 5.3 Tailwind CSS

Tailwind CSS 负责：

* 页面布局与样式实现
* 响应式设计
* 主题色、间距、圆角、阴影等设计令牌表达

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

### 5.5 Payload CMS

Payload CMS **与 Next.js 合并为同一项目**，负责：

* 学校、校区、学院等层级内容模型定义
* 文章内容和媒体资源管理（媒体存储于 R2）
* 提供 `/admin` 管理后台，供管理员进行内容 Review 和数据维护
* 通过 **Local API** 供 Next.js 服务端直接调用，是内容读写的主要路径
* 文章与层级归属关系维护

**合并方式**：使用 Payload CMS 官方提供的 `withPayload` Next.js 集成方案（`create-payload-app --template with-nextjs`），Payload 配置文件（`payload.config.ts`）与 `next.config.ts` 共存于项目根目录。

**数据库适配器**：使用 `@payloadcms/db-sqlite`，通过 D1 binding 访问 Cloudflare D1。

**存储适配器**：使用 `@payloadcms/storage-s3`，配置 R2 的 S3 兼容端点。

### 5.6 Drizzle ORM

Drizzle ORM 负责业务表（`biz_` 前缀）的数据访问：

* 完全类型安全的 SQL 查询构建器，原生支持 D1（SQLite 方言）
* 在边缘运行时（Cloudflare Workers）中零依赖原生模块
* 通过 Cloudflare D1 binding 执行查询
* Schema 定义文件位于 `web/drizzle/`
* 迁移脚本通过 Drizzle Kit 生成，存放于 `web/drizzle/migrations/`

### 5.7 jose（JWT 库）

`jose` 是一个 Web Standards 兼容的 JWT 库，在 Node.js 和 Cloudflare Workers 边缘运行时均可使用：

* 用于注册/登录时签发 JWT
* 用于 middleware.ts 中验证 JWT
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

本项目采用**单一 Git 仓库（Monorepo）**，整个系统只有一个子项目 `web/`。

### 9.0 仓库根目录结构

```text
CampusBlog/                        ← Git 仓库根目录
  web/                             ← 唯一子项目：Next.js + Payload CMS + 所有业务逻辑
  doc/                             ← 项目文档
  .gitignore
  README.md
```

### 9.1 前端 + CMS + 业务后端合并项目（web）

```text
web/
  app/
    (public)/                      ← 无需登录的公开页面
      page.tsx                     ← 首页
      school/[slug]/page.tsx
      campus/[slug]/page.tsx
      college/[slug]/page.tsx
      post/[slug]/page.tsx
      search/page.tsx
    (auth)/                        ← 登录注册页（无 Layout Header）
      login/page.tsx
      register/page.tsx
    (user)/                        ← 需要登录的用户页面
      user/[id]/page.tsx
      user/me/page.tsx
      editor/page.tsx
    api/
      auth/
        login/route.ts             ← POST 登录（Route Handler）
        register/route.ts          ← POST 注册
        send-code/route.ts         ← POST 发送验证码
        logout/route.ts            ← POST 登出
      comments/route.ts            ← GET/POST 评论
      likes/route.ts               ← POST/DELETE 点赞
      favorites/route.ts           ← POST/DELETE 收藏
      follows/route.ts             ← POST/DELETE 关注
    (payload)/                     ← Payload CMS 路由（自动生成，勿手动修改）
      admin/[[...segments]]/
      api/[...slug]/
  collections/                     ← Payload CMS Collection 定义
    School.ts
    Campus.ts
    College.ts
    Post.ts
    Tag.ts
    Media.ts
    UserProfile.ts
  drizzle/                         ← Drizzle ORM（业务表）
    schema.ts                      ← biz_ 表的 Drizzle schema 定义
    migrations/                    ← Drizzle Kit 生成的迁移 SQL 文件
  globals/                         ← Payload CMS Global 定义
  hooks/                           ← Payload CMS Hooks
  access/                          ← Payload CMS Access Control 函数
  components/
    ui/                            ← shadcn/ui 基础组件
    layout/                        ← 全局布局：Header、Footer、Sidebar
    article/                       ← 文章相关：ArticleCard、CommentSection 等
    hierarchy/                     ← 层级导航：HierarchyNav、Breadcrumb 等
    editor/                        ← Tiptap 编辑器封装：TiptapEditor
  lib/
    api/
      cms.ts                       ← Payload Local API 封装（仅服务端调用）
    auth/
      getUser.ts                   ← 从 middleware 注入的 header 或 Cookie 解析 JWT，返回 `userId`
    db/
      index.ts                     ← Drizzle client 初始化（通过 D1 binding）
  middleware.ts                    ← JWT 验证、路由保护
  types/                           ← 全局 TypeScript 类型定义
  payload.config.ts                ← Payload CMS 配置入口
  next.config.ts                   ← Next.js 配置（含 withPayload 包装）
  wrangler.toml                    ← Cloudflare 绑定配置（D1、R2、KV 名称）
  package.json
  .env.example                     ← 环境变量模板（提交 Git）
  .env.local                       ← 本地真实环境变量（在 .gitignore 中）
```

### 9.2 `wrangler.toml` 绑定配置示例

```toml
name = "campusblog"
compatibility_date = "2025-01-01"
compatibility_flags = ["nodejs_compat"]

[[d1_databases]]
binding = "DB"
database_name = "campusblog"
database_id = "your-d1-database-id"

[[kv_namespaces]]
binding = "KV"
id = "your-kv-namespace-id"

[[r2_buckets]]
binding = "R2"
bucket_name = "campusblog"

[vars]
NEXT_PUBLIC_APP_URL = "http://localhost:3000"
```

---

## 10. 架构结论

本项目采用 **Next.js + Payload CMS（合并部署）+ Cloudflare 全栈基础设施** 的单服务架构，具备以下特征：

* **单一部署单元**：页面、业务 Route Handlers / Server Actions 与 CMS 同应用交付；对外 API 与前端同源，无单独后端部署项。
* **边缘数据面**：D1、R2、Workers KV 为 Cloudflare 托管服务，与 Pages / Workers 部署模型一致。
* **Local API**：Next.js 与 Payload 同进程，内容读写通过 Local API，无额外 HTTP 环回。
* **类型安全**：Drizzle ORM + TypeScript 覆盖 `biz_` 业务表访问。
* **本地开发**：Wrangler 模拟 D1、KV、R2 绑定，与生产配置对齐。
* **学校—校区—学院**三层结构承担内容归属、浏览聚合与发布层级。
* **低层级内容向高层级可发现**，兼顾组织性与传播。
* **用户直接发布，管理员事后 Review**（Payload `/admin` 调整 `status` 等）。
