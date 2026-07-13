<div align="center">

# Kirameku

**きらめく - 像星光一样闪烁**

一个可自行部署的全栈个人网站。前端使用 Next.js，后端使用 FastAPI，并提供 Vue 3 管理后台。

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61dafb?logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi)
![Vue 3](https://img.shields.io/badge/Vue-3-42b883?logo=vue.js)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06b6d4?logo=tailwindcss)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript)
![License](https://img.shields.io/badge/License-MIT-blue)

</div>

---

## 效果展示

<div align="center">
  <img src="docs/images/首页.png" width="90%" alt="Kirameku 首页" />
  <img src="docs/images/文章.png" width="90%" alt="Kirameku 文章页" />
  <img src="docs/images/说说.png" width="90%" alt="Kirameku 说说页" />
  <img src="docs/images/照片墙.png" width="90%" alt="Kirameku 照片墙" />
  <img src="docs/images/归档.png" width="90%" alt="Kirameku 归档页" />
</div>

## 功能模块

### 网站前台

| 模块 | 路径 | 功能 |
|:---|:---|:---|
| 首页 | `/` | 个人资料、实时统计、音乐播放器、最新文章、说说和照片 |
| 文章 | `/posts` | 分类与标签、Markdown、代码高亮、附件下载 |
| 说说 | `/moments` | 碎片化动态和互动数据 |
| 留言 | `/messages` | 访客留言与回复 |
| ACG | `/acg` | 按年份和状态展示个人番剧收藏 |
| 收藏夹 | `/bookmark` | 分类导航、搜索和站点图标自动读取 |
| 文件下载 | `/downloads` | 分类展示本地文件及外部下载链接 |
| 项目 | `/projects` | 区分个人项目与收藏项目，展示仓库元数据 |
| 友链 | `/friends` | 漂流瓶风格的友链展示 |
| 照片墙 | `/photowall` | 相册与照片瀑布流 |
| 归档 | `/timeline` | 按时间浏览文章 |
| 音乐 | `/music` | 独立音乐文件库、封面与歌词元数据识别 |
| 暗号入口 | `/garden` | 根据后台暗号跳转站内页面、外部网址或下载地址 |
| 小说 | `/novel` | 可选的 Legado/reader 阅读服务前端 |
| 关于 | `/about` | 个人介绍 |

### 管理后台

- 文章、分类、标签、评论、留言、说说、相册和友链管理
- 个人项目与收藏项目分组，输入 GitHub/Gitee 仓库地址后自动读取项目资料
- ACG 收藏搜索与导入，自动读取 Bangumi 标题、封面、年份、评分和标签
- 文件库支持本地上传、Cloudreve、OneDrive 和普通直链
- 音乐文件使用独立分类与存储目录，支持读取音频内嵌封面和歌词
- 暗号支持启停、有效期、最大使用次数、站内/站外/下载目标和使用统计
- 头像、昵称和简介修改后自动同步到首页个人资料卡
- 首页统计直接读取数据库，不使用演示数据

## 技术栈

| 层级 | 技术 |
|:---|:---|
| 前端 | Next.js 16、React 19、TypeScript、Tailwind CSS 4、Framer Motion |
| 后端 | FastAPI、SQLModel、Pydantic、JWT、Pillow、HTTPX |
| 数据库 | PostgreSQL（生产推荐），SQLModel 兼容 SQLite 本地开发 |
| 管理后台 | Vue 3、Element Plus、Pure Admin、Pinia、Vite |
| 文件存储 | 本地上传目录，以及 Cloudreve/OneDrive/HTTP 外部链接 |
| 外部数据 | GitHub API、Gitee API、Bangumi API |

## 项目结构

```text
.
├── Kirameku/                       # Next.js 网站前台
│   ├── app/                        # App Router 页面与服务端路由
│   │   ├── acg/                    # ACG 收藏
│   │   ├── downloads/              # 文件下载
│   │   ├── garden/                 # 暗号入口
│   │   ├── novel/                  # 可选阅读服务
│   │   └── ...
│   ├── components/                 # 页面、布局和交互组件
│   ├── public/                     # 静态资源
│   └── siteConfig.ts               # 前端静态兜底配置
│
└── Kirameku-backend/               # FastAPI 后端
    ├── app/
    │   ├── api/                    # API 路由
    │   ├── models/                 # SQLModel 数据模型
    │   ├── schemas/                # 请求和响应模型
    │   └── services/               # 业务逻辑
    ├── admin/                      # Vue 3 管理后台
    ├── uploads/                    # 本地上传目录（不提交到 Git）
    └── init_db.sql                 # PostgreSQL 初始化脚本
```

## 快速开始

### 环境要求

- Node.js 20.19+ 或 22.13+
- pnpm 9+
- Python 3.11+
- PostgreSQL 14+（也可自行配置 SQLite 用于本地开发）

### 1. 启动后端

```bash
cd Kirameku-backend

python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
# source .venv/bin/activate

pip install -r requirements.txt

# Windows PowerShell
Copy-Item .env.example .env

# macOS / Linux
# cp .env.example .env
```

编辑 `.env`，至少设置 `DATABASE_URL` 和 `SECRET_KEY`。使用 PostgreSQL 时初始化数据库：

```bash
psql -U postgres -d kirameku -f init_db.sql
python -m uvicorn app.main:app --host 127.0.0.1 --port 8080
```

- API 文档：`http://localhost:8080/docs`
- 健康检查：`http://localhost:8080/api/health`

初始化脚本会创建默认管理员 `admin / admin123`，首次登录后请立即修改密码。

### 2. 启动管理后台

```bash
cd Kirameku-backend/admin
pnpm install
pnpm dev -- --port 8851
```

开发地址：`http://localhost:8851`

生产部署时执行 `pnpm build`，FastAPI 会在构建目录存在时将后台挂载到 `/admin`。

### 3. 启动网站前台

```bash
cd Kirameku
pnpm install

# Windows PowerShell
Copy-Item .env.example .env.local

# macOS / Linux
# cp .env.example .env.local
pnpm dev -- --port 3000
```

网站地址：`http://localhost:3000`

前端通过 Next.js rewrite 将 `/api/*` 和 `/uploads/*` 转发到 FastAPI。服务端访问后端的地址由 `BACKEND_URL` 控制。

## 环境变量

### 后端 `Kirameku-backend/.env`

| 变量 | 必填 | 说明 |
|:---|:---:|:---|
| `DATABASE_URL` | 是 | PostgreSQL 或 SQLite 连接地址 |
| `SECRET_KEY` | 是 | JWT 签名密钥 |
| `CORS_ORIGINS` | 是 | 允许访问 API 的前端来源，逗号分隔 |
| `UPLOAD_DIR` | 否 | 本地上传目录，默认 `uploads` |
| `UPLOAD_URL_PREFIX` | 否 | 上传文件访问前缀，默认 `/uploads` |
| `MAX_DOWNLOAD_FILE_SIZE` | 否 | 单个下载文件大小上限，单位字节 |
| `GITHUB_TOKEN` | 否 | 提高 GitHub 项目读取限额 |
| `GITEE_ACCESS_TOKEN` | 否 | 读取 Gitee 项目信息 |
| `BANGUMI_API_URL` | 否 | Bangumi API 地址 |
| `BANGUMI_IMAGE_URL` | 否 | Bangumi 图片代理地址 |

### 前端 `Kirameku/.env.local`

| 变量 | 必填 | 说明 |
|:---|:---:|:---|
| `BACKEND_URL` | 是 | Next.js 服务端访问 FastAPI 的地址 |
| `NEXT_PUBLIC_API_URL` | 否 | 浏览器直连 API 时使用；同源代理可留空 |
| `NOVEL_API_URL` | 否 | 可选阅读服务地址 |
| `NEXT_PUBLIC_NOVEL_API_URL` | 否 | 浏览器访问阅读服务的地址 |

## 文件与音乐

- 普通文件上传到 `uploads/downloads/`。
- 音频文件或“音乐”分类上传到 `uploads/music/`，不会混入公开下载列表。
- Cloudreve、OneDrive 和普通 HTTP 链接以外部资源方式保存，不复制远端文件。
- 音乐播放器优先读取后台音乐文件，也兼容 `siteConfig.ts` 中的直链和网易云配置。
- 音频元数据接口可读取标题、歌手、专辑、内嵌封面和歌词，并对远程地址执行安全检查。

## 可选阅读服务

小说页面依赖兼容 Legado 接口的独立阅读服务。设置 `NOVEL_API_URL` 后，Next.js 会将 `/reader3/*` 请求转发到该服务；未配置或服务未启动时不会影响博客其他模块。

## 设计特点

- 毛玻璃界面、亮色/暗色主题和响应式布局
- Framer Motion 页面过渡与微交互
- 后台数据驱动的首页、项目、ACG、下载和个人资料
- 桌面与移动端导航适配
- Live2D 看板娘和可配置背景效果

## License

MIT
