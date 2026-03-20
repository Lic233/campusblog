# 校园博客系统 —— 开发启动前准备清单

> 本文档列出在正式写第一行业务代码之前，必须决策、设计或搭建完成的事项。
>
> 本项目采用**前后端代码分离、开发者不分离**的模式，整个系统为单一 Next.js 项目，部署于 Cloudflare Pages。

---

## 优先级说明

- **P0**：必须在阶段 1 开始前完成，否则第一天就会遇到阻塞
- **P1**：必须在阶段 1 内完成，否则阶段 2 开始时会产生返工
- **P2**：建议尽早完成，缺失时影响开发体验但不会直接阻塞功能

---

## 一、Cloudflare 账号与本地开发环境（P0）⏳ 待完成

本地开发环境由 **Wrangler CLI** 统一管理。

**需要完成的步骤：**

```bash
# 1. 安装 Wrangler CLI
npm install -g wrangler

# 2. 登录 Cloudflare 账号
wrangler login

# 3. 在 Cloudflare Dashboard 创建以下服务（或通过 Wrangler CLI 创建）：
#    - D1 数据库：campusblog
#    - Workers KV Namespace（binding: KV）
#    - R2 Bucket：campusblog

# 4. 在 web/wrangler.toml 中填入上述服务的 ID
```

本地开发时，Wrangler 自动在 `web/.wrangler/state/` 创建本地模拟数据，无需真实 Cloudflare 服务。

| 服务 | 本地方案 | 是否需要 Docker |
|------|---------|----------------|
| 数据库（D1） | Wrangler 本地 SQLite 文件 | ❌ 不需要 |
| KV 缓存 | Wrangler 本地 KV | ❌ 不需要 |
| 对象存储（R2） | Wrangler 本地磁盘文件 | ❌ 不需要 |
| 邮件 | Resend 沙箱 | ❌ 不需要 |

---

## 二、环境变量清单（P0）⏳ 待完成

仓库中提供 `web/.env.example` 作为环境变量模板。

开发时复制为 `web/.env.local` 并填入真实值（`.env.local` 已在 `.gitignore` 中）。

Cloudflare 绑定（D1、R2、KV）通过 `wrangler.toml` 声明，**不在 `.env` 中配置**。

**`.env.local` 中需要填入的值：**

| 变量 | 说明 | 获取方式 |
|------|------|---------|
| `PAYLOAD_SECRET` | Payload CMS 内部签名密钥 | 随机生成 32 位字符串 |
| `JWT_SECRET` | 用户 JWT 签名密钥 | 随机生成 32 位字符串 |
| `RESEND_API_KEY` | Resend 邮件服务 API Key | [resend.com](https://resend.com) 注册后获取 |
| `MAIL_FROM` | 发件人地址 | Resend 控制台验证的域名邮箱 |

---

## 三、数据库表结构设计（P1）✅ 已完成（D1/SQLite 版本）

详见 `doc/Database-Schema.md`，所有 `biz_` 表的 Drizzle Schema 草稿已完成。

**确认的设计决策：**
- 主键：`TEXT`（应用层 `crypto.randomUUID()` 生成）
- 软删除：`deleted_at TEXT`，`NULL` 表示正常（适用于 User、Comment）
- 时间字段：ISO 8601 字符串（UTC）
- `biz_user_role_bindings` 表：**不创建**；`biz_users` **无角色字段**，管理员**仅**通过 Payload Users（`/admin`）体系维护
- 通知表（`biz_notifications`）：暂不实现
- 验证码：优先 Workers KV，降级使用 `biz_email_codes` 表

---

## 四、JWT 完整生命周期策略（P0）✅ 已确认

**选择方案 A（单 Token）**：JWT 有效期 7 天，到期重新登录。

- 实现最简单，适合 MVP 阶段
- 使用 `jose` 库（Web Standards，边缘兼容）签发与校验 JWT
- Token 泄露无法主动吊销（当前阶段可接受的风险权衡）
- 若后续需要，可升级为 Access Token + Refresh Token 方案

---

## 五、Git 仓库结构（P0）✅ 已确认

**选择单一仓库（Monorepo）**：单一子项目 `web/` 与文档共存于同一 Git 仓库。

```
CampusBlog/
  web/          ← Next.js + Payload CMS + 所有业务逻辑
  doc/          ← 项目文档
  .gitignore
  README.md
```

详细目录结构见 `Framework-and-Architecture.md §9`。本地 Cloudflare 绑定见 `web/wrangler.toml`。

**分支策略**：`main` + `feat/*` 轻量分支，单人开发无需集成分支。

**Commit 格式**：Conventional Commits（`feat:`、`fix:`、`chore:` 等前缀）。

---

## 六、关键页面 UI 线框图（P1）⏳ 待完成

架构文档定义了页面路由，但尚无 UI 层面的布局决策。在开始编写前端页面前，需对以下关键页面出低保真线框图：

| 页面 | 需要确认的布局决策 |
|------|------------------|
| 首页 | Hero 区域与学校卡片列表的比例；是否有推荐文章区域 |
| 学校/校区/学院门户页 | 顶部封面区 + 文章列表 + 层级导航的布局（三栏/双栏） |
| 文章详情页 | 正文宽度、目录栏位置、互动按钮（点赞/收藏）的摆放 |
| 写作编辑器页 | 编辑区与元信息表单的分割方式（左右分栏 vs 顶部折叠） |
| 注册页 | 两步表单的呈现方式（同页状态切换 vs 独立步骤组件） |

**建议**：保存为 `doc/wireframes/` 目录，与其他文档一起纳入版本控制。

> 暂不涉及，开发阶段 3 前补充。

---

## 七、CORS 配置策略（P0）✅ 已确认

**无需单独配置 CORS**：业务端点为同域 Next.js Route Handlers，与页面同源。

客户端组件调用 `/api/*` 与前端同源，无跨域场景。

---

## 八、编码规范与 Lint 配置（P1）⏳ 待完成

暂不涉及，在阶段 1 项目骨架搭建时一并完成。

**待做清单**：
- 配置 ESLint（`eslint-config-next`）+ Prettier + `husky` + `lint-staged`
- `.editorconfig` 提交至仓库

---

## 九、`wrangler.toml` 绑定 ID 收集（P0）⏳ 待完成

在 Cloudflare Dashboard 创建服务后，需将真实 ID 填入 `web/wrangler.toml`：

| 配置项 | 说明 | 状态 |
|--------|------|------|
| D1 `database_id` | D1 数据库 ID | ⏳ 待填入 |
| KV `id` | KV Namespace ID | ⏳ 待填入 |
| R2 `bucket_name` | R2 Bucket 名称 | ⏳ 待填入 |
| Resend `RESEND_API_KEY` | 邮件 API 密钥（填入 .env.local） | ⏳ 待获取 |

> 开发期间可以不填真实 ID，Wrangler 会自动创建本地模拟绑定。真实 ID 在阶段 6 部署时必须填入。

---

## 十、启动前决策汇总

| 编号 | 决策项 | 决策结果 | 状态 |
|------|--------|----------|------|
| D1 | 主键类型 | TEXT（`crypto.randomUUID()`） | ✅ |
| D2 | 软删除策略 | User、Comment 使用 `deleted_at` 软删除 | ✅ |
| D3 | JWT 策略 | 单 Token，有效期 7 天，`jose` 库 | ✅ |
| D4 | 客户端 API 调用方式 | 同域 Route Handlers，无 CORS 问题 | ✅ |
| D5 | 仓库结构 | 单一仓库，单一子项目 `web/` | ✅ |
| D6 | KV 引入时机 | 阶段 1 即配置（Wrangler 自动本地模拟） | ✅ |
| D7 | 分页参数格式 | `page`（从 1 开始）+ `pageSize` | ✅ |
| D8 | 时间字段格式 | ISO 8601 字符串（UTC，`toISOString()`） | ✅ |
| D9 | 注册两步表单形式 | 同一路由内状态切换（`/register`） | ✅ |
| D10 | 邮件服务 | Resend HTTP API | ✅ |
| D11 | 本地开发环境 | Wrangler CLI + `wrangler pages dev` | ✅ |
| D12 | 数据库 | Cloudflare D1 | ✅ |
| D13 | 对象存储 | Cloudflare R2 | ✅ |
| D14 | 业务与页面承载 | Next.js 单应用（无独立后端仓库/进程） | ✅ |

---

## 优先级执行顺序

```
阶段 1 开始前（P0，需要完成）：
  ⏳ 一、Cloudflare 账号注册 + Wrangler CLI 安装 + 服务创建
  ⏳ 二、.env.local 填入 PAYLOAD_SECRET、JWT_SECRET、RESEND_API_KEY
  ✅ 四、JWT 策略明确记录
  ✅ 五、Git 仓库建立 + 分支策略确定
  ✅ 七、CORS 策略确认（无需配置）
  ⏳ 九、wrangler.toml 绑定 ID 收集（开发期可用本地模拟）
  ✅ D1–D14 决策项全部确认

阶段 1 内完成（P1）：
  ✅ 三、biz_ 表 Drizzle Schema 草稿
  ⏳ 八、Lint 规范与 Prettier 配置

阶段 3 前完成（P2）：
  ⏳ 六、关键页面线框图
```

---

*文档版本：v2.1 | 更新日期：2026-03-20*
