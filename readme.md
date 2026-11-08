# YinXue Milayer · 音乐播放器

> 一款视觉唯美、功能强大的纯前端音乐播放器，支持网易云在线音乐与本地音乐播放。

---

## 项目简介

YinXue Milayer 是一个基于原生 HTML / CSS / JavaScript 开发的音乐播放器 Web 应用，无任何框架依赖、无构建步骤。项目以单个 `index.html` 为入口，配合 22 个按功能拆分的 JS 模块文件组成。通过对接网易云音乐 API 实现在线音乐搜索、播放、歌词同步等功能，同时支持本地音频文件导入。

**作者主页**：[yinxue.wuaze.com](http://yinxue.wuaze.com)

---

## 目录结构

```
beta/
├── index.html              # 主页面（HTML 结构 + 全部 CSS 样式）
└── js/
    ├── core.js             # 全局变量、状态管理、工具函数、图标定义
    ├── store.js            # localStorage 持久化（播放列表、设置）
    ├── api.js              # 网易云 API 封装（fetch 代理、榜单、推荐）
    ├── fluid.js            # WebGL 流体背景引擎
    ├── media-session.js    # 系统媒体控制集成（锁屏播放控制）
    ├── ui-views.js         # 视图切换、底部导航 Tab
    ├── settings.js         # 设置面板（背景、主题色、歌词样式）
    ├── lyrics-parser.js    # 歌词解析（LRC 逐行 / YRC 逐字）
    ├── lyrics-sync.js      # 歌词同步高亮渲染 ★性能优化文件
    ├── render.js           # 卡片 & 列表渲染
    ├── search.js           # 搜索 & 联想建议
    ├── queue.js            # 播放队列管理
    ├── home.js             # 首页数据加载（榜单、推荐歌单）
    ├── artist-detail.js    # 歌手详情页（歌曲/专辑/MV）
    ├── player.js           # 播放核心逻辑（playSong、播放控制）
    ├── play-controls.js    # 播放控制条（模式切换、进度条、音量）
    ├── audio-events.js     # audio 元素事件 & 全屏控制
    ├── mv-player.js        # MV 视频播放器
    ├── import-local.js     # 本地音乐导入（音频/歌词/封面）
    ├── login-qrcode.js     # 网易云扫码登录
    ├── hotkeys.js          # 键盘快捷键 & 窗口事件
    └── boot.js             # 启动初始化（天气、问候语、恢复播放）
```

---

## 功能特性

### 在线音乐

| 功能 | 说明 |
|---|---|
| 首页推荐 | 官方榜单（飙升榜/新歌榜/热歌榜/原创榜）+ 推荐歌单 |
| 多类型搜索 | 支持单曲、歌单、专辑、歌手、MV 五种搜索，带实时联想建议 |
| 歌单/专辑详情 | 查看歌曲列表，支持播放全部 |
| 歌手详情页 | Apple Music 风格，展示热门歌曲、代表专辑、音乐视频 |
| MV 播放 | 独立视频播放器，支持进度控制、音量、全屏 |
| 扫码登录 | 网易云音乐二维码登录，支持 Cookie 持久化 |
| 歌词同步 | 支持 LRC（逐行）和 YRC（逐字卡拉OK）两种歌词格式 |

### 本地音乐

| 功能 | 说明 |
|---|---|
| 音频导入 | 支持 MP3 / FLAC / WAV / OGG / M4A / AAC / OPUS 等格式 |
| 歌词导入 | 支持 .lrc 歌词文件，按文件名自动匹配 |
| 封面导入 | 支持自定义封面图片，留空时自动从音频内嵌标签读取 |
| 拖拽导入 | 支持拖拽文件到导入弹窗 |

### 播放控制

| 功能 | 说明 |
|---|---|
| 播放模式 | 列表循环、单曲循环、随机播放 |
| 进度控制 | 拖拽进度条跳转，实时显示当前时间/总时长 |
| 音量控制 | 滑块调节，静音切换 |
| 播放队列 | 查看队列、删除单曲、清空队列、点击切歌 |
| 迷你播放条 | 非播放器界面时显示底部迷你控制条 |
| 继续播放 | 重启页面后恢复上次播放位置 |
| 系统媒体控制 | MediaSession API，锁屏/通知栏控制播放 |

### 视觉与交互

| 功能 | 说明 |
|---|---|
| 动态背景 | 四种模式：封面背景、WebGL 流体背景、随机图片、自定义上传 |
| 主题色 | 6 种预设色 + 封面主题色自动提取 |
| 歌词 3D 倾斜 | 透视效果，可开关 |
| YRC 逐字动画 | 卡拉OK式逐字高亮，带渐变过渡带和放大效果 |
| 歌词样式自定义 | 字体大小、行间距、高亮放大度可调 |
| 背景参数调节 | 模糊度、黑色遮罩不透明度可调 |
| 天气问候 | 根据IP定位显示城市天气，随机问候语 |
| 全屏模式 | 支持浏览器全屏播放 |
| 键盘快捷键 | 空格播放/暂停、左右切换歌曲、ESC 返回 |

---

## 技术架构

### 技术栈

```
HTML5 + CSS3 + 原生 JavaScript（ES5/ES6 混用）
无框架、无构建工具、无依赖包
```

### 核心技术

| 技术 | 用途 | 对应文件 |
|---|---|---|
| CSS Custom Properties | 主题色、歌词样式等动态样式控制 | `index.html` |
| CSS `background-clip: text` | YRC 逐字歌词渐变高亮 | `index.html` + `lyrics-sync.js` |
| CSS `filter: blur()` | 歌词行远近模糊渐隐效果 | `index.html` + `lyrics-sync.js` |
| CSS 3D Transform | 封面3D倾斜、歌词3D透视 | `index.html` |
| WebGL (GLSL Shader) | 流体色彩背景渲染引擎 | `fluid.js` |
| `requestAnimationFrame` | 歌词同步、进度更新（节流） | `audio-events.js` |
| MediaSession API | 系统锁屏媒体控制 | `media-session.js` |
| localStorage | 播放列表、设置、Cookie 持久化 | `store.js` |
| File API | 本地音频/歌词/封面导入 | `import-local.js` |
| Canvas API | 封面主题色提取、自定义背景压缩 | `settings.js` |
| AbortController | 搜索联想请求取消 | `search.js` |

### 数据流

```
用户操作
  → playSong() (player.js)
    → API.fetch() (api.js) 获取播放链接
    → loadNeteaseLyric() (lyrics-parser.js) 获取歌词
    → renderLyrics() (lyrics-sync.js) 渲染歌词DOM
    → audio.play() 开始播放
      → timeupdate 事件 (audio-events.js)
        → requestAnimationFrame 节流
          → updateProgress() (player.js) 更新进度条
          → updateLyric() (lyrics-sync.js) 同步歌词高亮
            → 每帧更新正在唱的字符渐变位置
```

### API 对接

项目通过网易云音乐 API 获取数据，默认 API 地址为 `https://api.replow.org`，可在设置中自定义。

| 接口 | 用途 |
|---|---|
| `/toplist` | 获取官方榜单列表 |
| `/personalized` | 获取推荐歌单 |
| `/search` | 搜索歌曲/歌单/专辑/歌手/MV |
| `/search/suggest` | 搜索联想建议 |
| `/song/url/v1` | 获取歌曲播放链接 |
| `/lyric/new` | 获取歌词（LRC + YRC） |
| `/playlist/track/all` | 获取歌单内歌曲列表 |
| `/album` | 获取专辑详情 |
| `/artists` | 获取歌手详情 |
| `/artist/songs` | 获取歌手歌曲 |
| `/artist/album` | 获取歌手专辑 |
| `/mv/url` | 获取 MV 播放链接 |
| `/login/qr/*` | 扫码登录相关 |

所有 API 请求通过 `API.fetch()` 统一封装，自动附加 Cookie 和时间戳参数。

---

## 页面结构

应用包含四个主要视图（View），通过 `setView()` 切换：

```
┌─────────────────────────────────────────────┐
│  首页 (libView)                              │
│  ┌───────────┬───────────┬───────────┐      │
│  │ Tab: 首页  │ Tab: 搜索  │ Tab: 设置  │      │
│  │           │           │           │      │
│  │ • 天气问候 │ • 搜索栏   │ • API设置  │      │
│  │ • 上次播放 │ • 联想建议  │ • 背景模式  │      │
│  │ • 官方榜单 │ • 五类搜索  │ • 主题色   │      │
│  │ • 推荐歌单 │ • 结果展示  │ • 歌词设置  │      │
│  │           │           │ • 关于     │      │
│  └───────────┴───────────┴───────────┘      │
├─────────────────────────────────────────────┤
│  歌单/专辑详情 (detailView)                   │
│  • 封面 + 标题 + 描述                          │
│  • 歌曲列表                                    │
├─────────────────────────────────────────────┤
│  歌手详情 (artistView)                        │
│  • Hero 区（头像 + 名称 + 统计）               │
│  • 热门歌曲 / 代表专辑 / 音乐视频              │
├─────────────────────────────────────────────┤
│  播放器 (playerView)                          │
│  ┌──────────────┬──────────────────┐         │
│  │ 左侧           │ 右侧              │         │
│  │ • 3D封面       │ • 歌词区          │         │
│  │ • 歌曲信息     │   • 逐字高亮       │         │
│  │ • 进度条       │   • 行滚动         │         │
│  │ • 播放控制     │   • 模糊渐隐       │         │
│  │   (模式/上下   │   • 间奏动画       │         │
│  │    /播放/音量) │   • 尾奏字幕       │         │
│  └──────────────┴──────────────────┘         │
└─────────────────────────────────────────────┘
```

### 弹窗与浮层

| 组件 | 触发方式 | 功能 |
|---|---|---|
| 播放队列 | 点击队列按钮 | 查看/删除/清空播放列表 |
| 导入弹窗 | 点击导入按钮 | 选择音频/歌词/封面文件 |
| 登录弹窗 | 点击登录按钮 | 网易云扫码登录 |
| MV 播放器 | 点击 MV 卡片 | 全屏视频播放 |
| 歌手模态 | 点击"查看全部" | 展示歌手全部歌曲/专辑/MV |
| 设置面板 | 设置 Tab | 实时预览歌词效果 |
| 迷你播放条 | 非播放器界面 | 底部浮动控制条 |

---

## 键盘快捷键

| 快捷键 | 功能 | 条件 |
|---|---|---|
| `Space` | 播放 / 暂停 | 非输入框聚焦时 |
| `→` | 下一首 | 播放器界面 |
| `←` | 上一首 | 播放器界面 |
| `Esc` | 返回 / 关闭弹窗 | 逐层关闭弹窗和视图 |

---

## 设置项

### 网络 / 接口

| 设置 | 说明 | 默认值 |
|---|---|---|
| 自定义 API 地址 | 网易云 API 代理地址 | `https://api.replow.org` |

### 外观

| 设置 | 说明 | 默认值 | 范围 |
|---|---|---|---|
| 背景模式 | 封面 / 流体 / 随机 / 自定义 | 封面 | — |
| 主题色 | 6 预设色 + 封面提取 | 白色 `#ffffff` | — |
| 背景模糊度 | 背景图 blur 值 | 50px | 0-200px |
| 黑色遮罩不透明度 | 背景遮罩 | 25% | 0-100% |

### 歌词

| 设置 | 说明 | 默认值 | 范围 |
|---|---|---|---|
| 歌词 3D 倾斜效果 | 开关 | 开 | — |
| YRC 逐字动画效果 | 开关 | 开 | — |
| 歌词字体大小 | CSS `--lyric-size` | 32px | 16-48px |
| 歌词行间距 | CSS `--lyric-spacing` | 1.5 | 1.0-2.5 |
| 歌词高亮放大度 | CSS `--lyric-scale` | 1.05 | 1.0-1.5 |

所有设置通过 `localStorage` 持久化，键名前缀 `yin_`。

---

## 歌词系统

### 歌词格式

| 格式 | 说明 | 解析文件 |
|---|---|---|
| **LRC** | 传统逐行歌词，`[mm:ss.xxx]` 时间戳 | `lyrics-parser.js` → `parseLrc()` |
| **YRC** | 网易云逐字歌词，`[start,dur](start,dur,type)text` 格式 | `lyrics-parser.js` → `parseYRC()` |

### 歌词渲染流程

```
1. loadNeteaseLyric()    获取歌词数据
2. parseYRC() / parseLrc()  解析为结构化数据
3. renderLyrics()         创建 DOM 元素
   ├── YRC 模式：每字一个 <span class="char">，使用 background-clip:text
   └── LRC 模式：整行 textContent
4. updateLyric()          每帧同步
   ├── 查找当前行索引
   ├── 行切换 → applyLineEffects() + scrollToLine()
   └── YRC 逐字 → 更新正在唱字符的 CSS 变量渐变位置
```

### YRC 逐字渐变原理

每个字符是一个 `<span class="char">`，通过 `background-clip: text` 配合 `linear-gradient` 实现卡拉OK效果：

```
未唱：    全白色半透明
正在唱：   accent色 ──渐变带(30%)──→ 白色  （渐变位置随播放进度移动）
已唱完：   全 accent 色
```

---

## 性能优化（lyrics-sync.js）

针对 A12 Bionic CPU 60 FPS 目标进行的优化，详见 [逐字歌词性能优化说明文档](逐字歌词性能优化说明文档.md)。

### 优化概要

| 优化项 | 类型 | 效果 |
|---|---|---|
| 预缓存字符数据 | JS 逻辑 | 消除每帧 `querySelectorAll` + `parseFloat` |
| 索引追踪替代全量遍历 | JS 逻辑 | 每帧从遍历 N 个字符降为操作 1 个 |
| 行切换只重置脏行 | JS 逻辑 | 行切换 DOM 操作减少约 30 倍 |
| 移除 char 的 will-change | CSS | 消除数百个 GPU 合成层 |
| CSS 变量替代字符串拼接 | CSS + JS | 避免每帧 CSS 解析器重新解析 linear-gradient |
| pct 量化到 1% + 跳过无变化帧 | JS | 约 50% 的帧跳过 DOM 写入和 paint |
| 远处行不 blur | JS | GPU blur 计算量减少约 80% |
| 降低 text-shadow + 明确 transition | CSS | 减少 paint 开销和合成层管理 |

---

## 本地运行

### 方式一：直接打开

由于项目使用 fetch 请求外部 API，需要通过 HTTP 服务器运行（不能直接双击打开 HTML 文件）。

### 方式二：本地服务器

```bash
# Python
python3 -m http.server 8080

# Node.js
npx serve

# 然后浏览器访问 http://localhost:8080
```

### 方式三：部署到服务器

将 `beta/` 目录整体上传到任意 Web 服务器即可。

---

## 浏览器兼容性

| 特性 | Chrome | Safari | Firefox | iOS Safari |
|---|---|---|---|---|
| 基础功能 | ✅ | ✅ | ✅ | ✅ |
| WebGL 流体背景 | ✅ | ✅ | ✅ | ✅ |
| YRC 逐字渐变 | ✅ | ✅ | ✅ | ✅ |
| MediaSession | ✅ | ✅ | ⚠️ | ✅ |
| 全屏 API | ✅ | ✅ | ✅ | ✅ |
| CSS backdrop-filter | ✅ | ✅ | ⚠️ | ✅ |

> 推荐使用 Chrome 或 Safari 获得最佳体验。
