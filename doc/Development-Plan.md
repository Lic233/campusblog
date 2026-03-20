# 校园博客系统 —— 增量开发计划

---

## 一、开发阶段总览

本项目采用 **6 阶段增量开发模型**，每个阶段交付一个可运行、可验证的系统版本，后续阶段在前一阶段基础上叠加功能。

```
阶段 1 → 阶段 2 → 阶段 3 → 阶段 4 → 阶段 5 → 阶段 6
基础设施   内容层     前端门户   认证与发布  互动功能   平台完善
```

| 阶段 | 名称 | 核心交付物 | 预估工作量 |
|------|------|-----------|-----------|
| 阶段 1 | 基础设施与项目骨架 | 单项目可启动、D1 初始化、Wrangler 配置 | 1 周 |
| 阶段 2 | 内容模型建立 | CMS 模型完整、种子数据可查询 | 1 周 |
| 阶段 3 | 前端门户与内容展示 | 全部门户页和文章页可浏览 | 2 周 |
| 阶段 4 | 认证体系与文章发布 | 登录、写作、直接发布闭环 | 2 周 |
| 阶段 5 | 互动功能 | 评论、点赞、收藏、通知 | 1.5 周 |
| 阶段 6 | 管理员 Review + 平台完善 | Review 工作流、搜索、统计、Cloudflare 部署 | 1.5 周 |
| **合计** | | | **约 9 周** |

---

## 二、各阶段详细任务

### 阶段 1：基础设施与项目骨架

**目标**：搭建可运行的本地开发环境，建立单一项目骨架，完成 Cloudflare 本地绑定配置。

**交付物**：
- Next.js + Payload CMS 合并项目可以启动，可访问首页和 `/admin` 后台
- Wrangler 本地 D1、R2、KV 绑定配置完成
- Drizzle ORM 连接 D1 可正常执行查询
- 项目目录结构按架构文档 §9 约定建立完毕

**主要任务**：

1. **环境准备**
   - 安装 Node.js 22、Wrangler CLI（`npm install -g wrangler`）
   - 登录 Cloudflare 账号：`wrangler login`
   - 在 Cloudflare Dashboard 创建 D1 数据库（database name: `campusblog`）
   - 创建 Workers KV Namespace（binding name: `KV`）
   - 创建 R2 Bucket（bucket name: `campusblog`）

2. **前端 + CMS 合并项目初始化（web）**
   - 使用 `create-payload-app --template with-nextjs` 初始化项目
   - 配置 Payload SQLite 适配器（`@payloadcms/db-sqlite`），表前缀设为 `cms_`
   - 配置 Payload R2 存储适配器（`@payloadcms/storage-s3`），填入 R2 的 S3 兼容端点
   - 安装并配置 Tailwind CSS 4.2
   - 安装 shadcn/ui，初始化组件库
   - 创建 Payload 初始管理员账号，验证 `/admin` 可访问

3. **Wrangler 配置（`web/wrangler.toml`）**
   - 声明 D1 binding（`binding = "DB"`）
   - 声明 KV binding（`binding = "KV"`）
   - 声明 R2 binding（`binding = "R2"`）
   - 配置 `compatibility_flags = ["nodejs_compat"]`
   - 本地开发使用 `wrangler pages dev` 启动，验证绑定可访问

4. **Drizzle ORM 配置**
   - 安装 `drizzle-orm`、`drizzle-kit`
   - 创建 `web/drizzle/schema.ts`，定义 `biz_` 业务表 schema
   - 创建 `web/lib/db/index.ts`，初始化 Drizzle client（通过 D1 binding）
   - 运行 `drizzle-kit generate` 生成迁移文件，`wrangler d1 migrations apply` 执行

5. **建立项目目录结构**
   - 按照架构文档 §9.1 建立前端目录结构
   - 创建 `web/app/api/` 下的 Route Handler 骨架文件

**阶段验收标准**：
- [ ] `wrangler pages dev` 启动后，可访问 Next.js 首页（允许为空白页）
- [ ] Payload CMS Admin 后台（`/admin`）可以访问
- [ ] `wrangler d1 execute campusblog --local --command="SELECT 1"` 返回正常
- [ ] Drizzle schema 中的 biz_ 表已通过迁移在本地 D1 中创建
- [ ] `web/.wrangler/state/` 目录已创建，本地绑定状态正常

---

### 阶段 2：内容模型建立与 CMS 数据层

**目标**：在 Payload CMS 中完成所有核心内容模型定义，能够通过 Admin 后台录入数据，并通过 Local API 读取数据。

**交付物**：
- 完整的内容 Collection 定义（School、Campus、College、Post、Tag、Media、UserProfile）
- 可通过 Payload Local API 查询内容数据
- 包含测试种子数据（至少 1 所学校、2 个校区、4 个学院、10 篇文章）

**主要任务**：

1. **定义层级模型**
   - 创建 `School` Collection（名称、描述、Logo、封面图、创建时间）
   - 创建 `Campus` Collection（名称、归属学校、描述、封面图）
   - 创建 `College` Collection（名称、归属校区、归属学校、描述、封面图）

2. **定义文章与内容模型**
   - 创建 `Post` Collection，包含以下字段：
     - 标题、正文（`json` 字段类型，存储 ProseMirror JSON）、封面图
     - `schoolId`（必填关联）、`campusId`（可选关联）、`collegeId`（可选关联）
     - `publishLevel`（枚举：`school` / `campus` / `college`）
     - `status`（枚举：`draft` / `published` / `hidden`）
     - `authorId`（来自 D1 biz_users 的用户 ID）、发布时间、更新时间
   - 创建 `Tag` Collection（标签名、关联文章）
   - 配置 `Media` Collection（支持图片上传，开发环境使用本地 R2 模拟）

3. **定义 UserProfile Collection**
   - 存储公开用户信息：`userId`（来自 D1 biz_users）、昵称、头像、个人简介
   - 此 Collection 作为展示数据，认证由 Next.js Server Actions + D1 负责
   - 注册时由 Next.js Server Action 同步创建

4. **配置 Access Control**
   - 已发布文章、学校/校区/学院信息：`read` 无需认证
   - `hidden` 状态文章：仅管理员可见
   - 内容创建、修改：需要传入有效用户信息
   - Admin 后台：仅 Payload 内置管理员账号可访问

5. **录入种子数据**
   - 通过 Admin 后台手工录入，或编写 `web/scripts/seed.ts` 脚本批量创建

**阶段验收标准**：
- [ ] 所有 Collection 在 Admin 后台均可正常增删改查
- [ ] 通过 Local API 按 `publishLevel` 过滤文章，结果正确
- [ ] 文章 `status` 只有 `draft` / `published` / `hidden` 三个值
- [ ] 媒体文件可上传并通过 URL 访问（本地 R2 模拟）

---

### 阶段 3：前端门户与内容展示

**目标**：完成前端核心展示页面，用户可以浏览学校、校区、学院门户和文章详情。此阶段不需要用户登录，所有页面为公开只读内容。

**交付物**：
- 首页（展示学校列表或推荐内容）
- 学校门户页（`/school/[slug]`）：展示学校信息 + 聚合文章列表
- 校区门户页（`/campus/[slug]`）：展示校区信息 + 聚合文章列表
- 学院门户页（`/college/[slug]`）：展示学院信息 + 文章列表
- 文章详情页（`/post/[slug]`）：展示文章正文内容
- 响应式布局，PC 和移动端均可正常浏览

**主要任务**：

1. **建立 CMS Local API 封装层**
   - 在 `lib/api/cms.ts` 中封装 Payload Local API 调用函数（服务端专用）
   - 定义前端 TypeScript 类型（`types/`，与 CMS 模型对应）

2. **建立公共布局组件**
   - 顶部导航（`components/layout/Header.tsx`）：Logo + 层级导航 + 搜索入口 + 登录按钮
   - 底部页脚（`components/layout/Footer.tsx`）
   - 层级面包屑导航（`components/hierarchy/Breadcrumb.tsx`）

3. **实现首页**
   - 展示平台入口，学校卡片列表
   - 引入 Aceternity UI Hero 区域 / Banner 效果
   - 使用 Next.js SSG 或 ISR 渲染

4. **实现学校 / 校区 / 学院门户页**
   - 门户页顶部：封面图、组织名称、简介（Aceternity UI 视觉增强）
   - 下方：聚合文章列表（`components/article/ArticleCard.tsx`），仅展示 `status = published` 的文章
   - 聚合逻辑：学校页展示所有层级文章，校区页展示校区+学院文章，学院页仅展示学院文章
   - 支持按最新 / 热门排序

5. **实现文章详情页**
   - 展示标题、作者（昵称 + 头像，从 UserProfile 通过 Local API 获取）、发布时间、封面图
   - 渲染富文本正文：从 D1 取出 ProseMirror JSON，服务端调用 `generateHTML()`（`@tiptap/html`）
   - 展示标签、所属层级面包屑
   - 评论区占位（此阶段展示空状态）

6. **建立层级导航组件**
   - `components/hierarchy/HierarchyNav.tsx`：学校 → 校区 → 学院的侧边栏或标签切换

**阶段验收标准**：
- [ ] 所有门户页均可访问，内容从 Payload Local API 实时获取
- [ ] 学校页展示所有层级文章，校区页不显示其他校区的文章
- [ ] `hidden` 状态的文章不出现在任何前台页面
- [ ] 文章详情页 ProseMirror JSON 正确渲染为 HTML
- [ ] 页面在移动端布局正常
- [ ] 首页加载时间 < 3 秒（本地开发环境）

---

### 阶段 4：认证体系与文章发布

**目标**：完成 Next.js Server Actions 用户认证体系，前端集成登录/注册功能，用户可以登录并直接发布文章（无前置审核）。

**交付物**：
- 用户注册（邮箱验证码确认）/ 登录 / 登出
- 前端登录态管理（httpOnly Cookie）
- 用户个人中心页面（`/user/[id]`、`/user/me`）
- 写作页面（`/editor`）：基于 Tiptap 的文章编辑器
- 文章草稿保存与一键发布功能

**主要任务**：

1. **用户认证 Route Handlers**

   - **发送验证码**：`POST /api/auth/send-code`
     - 校验邮箱格式与唯一性（查 D1 biz_users）
     - 生成 6 位随机数字验证码
     - 写入 Workers KV：`verify:{email}` → code，TTL 300s
     - 写入防刷 KV：`verify_cooldown:{email}` → timestamp，TTL 60s
     - 调用 Resend API 发送验证码邮件

   - **注册**：`POST /api/auth/register`（请求体：`email, code, nickname, password`）
     - 从 KV 取出验证码比对，验证通过后立即删除
     - 密码加密存储（bcrypt，在 Workers 中使用 `@node-rs/bcrypt` 或 Web Crypto 替代方案）
     - 通过 Drizzle 写入 D1 `biz_users` 表
     - 调用 Payload Local API 创建 UserProfile
     - 用 `jose.SignJWT()` 颁发 JWT（`{ userId, exp }`，有效期 7 天）

   - **登录**：`POST /api/auth/login`
     - 查 D1 biz_users，验证密码
     - 颁发 JWT，设置 httpOnly Cookie（`access_token`）

   - **登出**：`POST /api/auth/logout`
     - 清除 `access_token` Cookie

2. **JWT 中间件**
   - 在 `web/middleware.ts` 中使用 `jose.jwtVerify()` 验证 Cookie 中的 JWT
   - 将解析出的 `userId` 写入 request header（`x-user-id`）
   - 未登录访问受保护路由时重定向到 `/login`

3. **前端认证集成**
   - 实现注册页（`/register`）：两步表单（同一路由内状态切换）
     - 第一步：填写邮箱，点击"发送验证码"，按钮进入 60 秒倒计时冷却
     - 第二步：填写验证码、昵称、密码，提交注册
   - 实现登录页（`/login`）
   - 实现 `lib/auth/getUser.ts`：从 request header 读取中间件注入的用户信息
   - 顶部导航根据登录态显示用户头像或登录按钮

4. **写作页面**
   - 实现 `/editor` 路由，受中间件保护（未登录重定向到 `/login`）
   - 封装 `components/editor/TiptapEditor.tsx`，支持标题、段落、图片上传（调用 Payload Media API 写入 R2）、链接、代码块
   - 实现文章元信息表单：标题、封面图、标签选择、层级选择
   - 层级选择器：调用 Payload Local API 获取所有 School / Campus / College 列表

5. **文章发布流程**
   - 草稿保存：Server Action 调用 Payload Local API，`status = draft`
   - 直接发布：Server Action 调用 Payload Local API，`status = published`
   - 发布成功后跳转到对应文章详情页

6. **用户中心页**
   - `/user/[id]`：展示用户公开信息（头像、昵称、简介、已发布文章列表）
   - `/user/me`：当前用户的草稿列表、已发布文章列表、文章管理（编辑、删除）

**阶段验收标准**：
- [ ] 注册时点击"发送验证码"，可在 Resend 控制台或测试收件箱看到邮件
- [ ] 填写正确验证码可完成注册，填写错误验证码注册失败并提示
- [ ] 验证码 5 分钟后过期，过期后无法使用
- [ ] 60 秒内重复点击"发送验证码"按钮前端禁用，接口层也拒绝重复发送
- [ ] 用户可以注册、登录、登出，JWT 正确写入 Cookie
- [ ] 注册后 UserProfile 在 CMS 中同步创建
- [ ] 登录后可进入写作页，编辑器功能正常
- [ ] 发布文章后立即在对应层级页面可见（`status = published`）
- [ ] 未登录用户访问 `/editor` 时重定向到 `/login`
- [ ] 用户中心展示其文章列表，可区分草稿和已发布

---

### 阶段 5：互动功能

**目标**：完成评论、点赞、收藏、关注等互动功能，文章详情页变为完整交互页面。

**交付物**：
- 评论列表与发表评论（支持二级回复）
- 文章点赞 / 取消点赞
- 文章收藏 / 取消收藏
- 用户关注 / 取消关注
- 站内消息通知（评论通知、点赞通知）

**主要任务**：

1. **评论系统**（通过 Drizzle 操作 D1 `biz_comments` 表）
   - `POST /api/comments`：发表评论（需登录，从 header 读取 userId）
   - `GET /api/comments?postId=xxx`：获取文章评论列表
   - `DELETE /api/comments/:id`：删除自己的评论（软删除，`deleted_at`）
   - 支持二级评论（回复），`parent_id` 关联父评论
   - 前端实现 `components/article/CommentSection.tsx`

2. **点赞功能**（Drizzle + `biz_like_records`）
   - `POST /api/likes`：点赞（需登录）
   - `DELETE /api/likes/:postId`：取消点赞
   - `GET /api/likes/count?postId=xxx`：获取点赞数
   - 可选：在 Workers KV 中缓存点赞计数，减少 D1 读次数

3. **收藏功能**（Drizzle + `biz_favorite_records`）
   - 实现收藏 / 取消收藏 Route Handler
   - 用户中心增加"我的收藏"列表页（`/user/me/favorites`）

4. **关注功能**（Drizzle + `biz_follow_records`）
   - 实现关注 / 取消关注 Route Handler
   - 用户中心增加"我的关注"和"关注者"列表

5. **站内通知**（Drizzle + `biz_notifications` 表）
   - 当文章被评论 / 点赞时，向文章作者写入通知记录
   - 前端顶部导航增加通知图标，展示未读数
   - 通知列表页（`/user/me/notifications`）

**阶段验收标准**：
- [ ] 登录用户可以对文章发表评论，评论列表正确展示
- [ ] 点赞、收藏功能正常，刷新页面后状态保持
- [ ] 关注用户功能正常
- [ ] 收到评论后通知中心有新消息提示
- [ ] 未登录用户尝试互动时弹出登录提示

---

### 阶段 6：管理员 Review 与平台完善

**目标**：完成管理员内容 Review 工作流、搜索功能、阅读量统计，并完成 Cloudflare 生产环境部署，使系统达到可运营状态。

**交付物**：
- 管理员通过 Payload CMS Admin 对已发布内容进行 Review（隐藏/恢复）
- 全文搜索（文章标题、正文摘要、标签）
- 阅读量统计
- 生产环境部署至 Cloudflare Pages

**主要任务**：

1. **管理员内容 Review**
   - 管理员登录 Payload CMS Admin（`/admin`）
   - 在 Post Collection 列表页可以看到所有 `published` 和 `hidden` 文章
   - 对问题文章执行 Review 操作：将 `status` 改为 `hidden`
   - 配置 Payload Admin 自定义视图，优化 Review 工作流体验

2. **Payload 管理员账号管理**
   - 新增或撤销具备 `/admin` 权限的用户：**仅在 Payload Admin** 中操作 Payload Users（或项目采用的官方管理员集合），**禁止**在 `biz_users` 中维护管理员身份

3. **全文搜索**
   - 方案 A（简单）：基于 D1（SQLite）的 FTS5 全文搜索扩展，对文章标题和摘要建索引
   - 方案 B（可扩展）：引入 Cloudflare Workers AI 的向量搜索或外部 Meilisearch Cloud
   - 建议阶段 6 先实现方案 A，前端搜索结果页（`/search?q=xxx`）支持按层级筛选

4. **阅读量统计**
   - 每次访问文章详情页，Server Component 通过 Workers KV 增加计数
   - KV key 格式：`view_count:{postId}`，定期通过 Cron Trigger 回写 D1
   - 文章卡片和详情页展示阅读量数字

5. **生产环境 Cloudflare Pages 部署**
   - 连接 GitHub 仓库到 Cloudflare Pages，配置自动部署
   - 在 Cloudflare Pages 控制台绑定生产 D1、R2、KV
   - 在 Pages 控制台配置环境变量（`PAYLOAD_SECRET`、`JWT_SECRET`、`RESEND_API_KEY` 等）
   - 运行生产环境 Drizzle 迁移：`wrangler d1 migrations apply campusblog --remote`
   - 验证自定义域名、HTTPS 证书（Cloudflare 自动签发）
   - 性能测试：Core Web Vitals 达标（LCP < 2.5s）

6. **Payload CMS + D1 生产兼容性评估**
   - 验证 `@payloadcms/db-sqlite` 在 Cloudflare Pages Workers 中是否正常运行
   - 如遇兼容性问题，切换备选方案：Neon Serverless PostgreSQL（通过 `@payloadcms/db-postgres`）仅供 CMS 表；业务表继续使用 D1 + Drizzle

**阶段验收标准**：
- [ ] 管理员登录 `/admin` 后可将问题文章设为 `hidden`，该文章从前台立即消失
- [ ] `hidden` 文章可被管理员恢复为 `published`
- [ ] 搜索功能返回相关文章，支持层级过滤
- [ ] 阅读量数据在文章页正确显示
- [ ] Cloudflare Pages 生产部署成功，所有核心页面可通过自定义域名访问
- [ ] 生产环境 D1 数据库已完成迁移，种子数据可查询

---

## 三、各阶段依赖关系图

```
阶段 1（基础设施）
    │
    ▼
阶段 2（CMS 内容模型）
    │
    ▼
阶段 3（前端展示）──────────────────────────────┐
    │                                           │
    ▼                                           │
阶段 4（认证与发布）                            │
    │                                           │
    ▼                                           │
阶段 5（互动功能）                              │
    │                                           │
    ▼                                           ▼
阶段 6（管理员 Review + 平台完善）── 整合全部阶段成果，上线运营
```

> 阶段 3 可以在阶段 4 并行推进部分工作（纯展示功能不依赖认证体系），但前端登录态集成和文章发布功能必须等阶段 4 的认证接口完成后才能合并。

---

## 四、技术约定备忘

### 4.1 邮件服务约定

- 开发环境：配置 Resend 沙箱模式，使用 Resend 控制台 "Logs" 页面查看发送记录
- 生产环境：通过环境变量注入 `RESEND_API_KEY` 和真实发件地址
- 邮件模板维护在 `web/lib/email/` 目录，使用 React Email 或纯 HTML 字符串
- 发件人地址格式：`noreply@your-domain.com`（需在 Resend 控制台验证域名）

### 4.2 认证约定

**普通用户认证（Next.js + jose JWT）：**

- 认证入口：Next.js Route Handlers（`/api/auth/login`、`/api/auth/register`、`/api/auth/send-code`）
- JWT Payload 格式：`{ userId: string, exp: number }`（前台用户；**不含**管理员角色，管理员仅使用 Payload 会话）
- 前端存储：**httpOnly Cookie**（名称 `access_token`），避免 XSS 风险
- 服务端读取：`middleware.ts` 验证并将 `userId` 注入 request header（`x-user-id`）
- Server Components / Route Handlers 通过 `lib/auth/getUser.ts` 从 header 读取用户信息

**管理员认证（Payload 唯一管理员体系）：**

- 管理员**仅**通过 Payload Users（及 Collection `access`）登录 `/admin`，与前台 JWT、`biz_users` 无角色对应关系
- 首个管理员在项目初始化时通过 Payload 引导或 Admin UI 创建；后续管理员由现有 Payload 管理员在 `/admin` 中创建/授权

### 4.3 数据库约定

- Payload CMS 表前缀：`cms_`（通过 Payload SQLite 适配器 `tablePrefix` 配置）
- Drizzle 业务表前缀：`biz_`（在 Drizzle schema 中显式指定表名）
- 迁移工具：Payload CMS 使用内置迁移机制（`payload migrate`），业务表使用 Drizzle Kit
- **禁止在 Drizzle 中直接操作 `cms_` 前缀的表**，内容读写必须通过 Payload Local API

### 4.4 前端 API 约定

- CMS 内容数据（服务端）：封装在 `lib/api/cms.ts`，调用 Payload Local API
- 业务数据（服务端）：通过 `lib/db/index.ts` 的 Drizzle client 直接查询
- 客户端互动数据（点赞、评论状态）：客户端组件调用 `/api/*` Route Handlers
- **禁止**在页面/组件中直接裸写 `fetch` 调用后端接口，必须通过 `lib/` 中的封装函数
- 接口错误统一在 `lib/` 层处理，页面层只处理业务逻辑

### 4.5 Cloudflare 绑定访问约定

- D1 binding：通过 `getRequestContext().env.DB` 或 `process.env.DB` 在 Route Handlers 中访问
- KV binding：通过 `getRequestContext().env.KV` 访问
- R2 binding：通过 `getRequestContext().env.R2` 访问（Payload Media 上传由 S3 适配器处理，一般不直接操作）
- Wrangler 本地开发时绑定通过 `.wrangler/state/` 自动注入，无需手动配置
- 生产环境绑定在 Cloudflare Pages 控制台配置，密钥类环境变量使用 "Secrets" 而非 "Variables"

### 4.6 组件职责约定

- `components/ui/`：纯 shadcn/ui 基础组件，无业务逻辑
- `components/layout/`：全局布局组件（导航、页脚、侧边栏）
- `components/article/`：文章相关展示组件（卡片、列表、详情、评论区）
- `components/hierarchy/`：层级导航与聚合展示组件
- `components/editor/`：写作编辑器相关组件（TiptapEditor 封装）
- Aceternity UI 组件：仅允许在 `components/ui/` 或页面层直接使用，不封装进业务组件

---
