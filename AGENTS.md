# AGENTS – WilsonChao.com

本專案旨在打造 **趙玴祥（Yi-Hsiang Chao, MD）** 的個人網站。  
身份包含：心臟外科醫師、寫作者、思考者、創作者。  

網站定位：  
不是作品集，而是「這個人正在成為誰」的入口 —— 承載專業、故事、思考、價值與生活節奏。

---

# 🎯 Primary Goal

建立一個可長期維護、操作簡單、視覺一致、  
並以 **Notion 作為正式內容 CMS** 的個人網站：

- 主站網址：`https://wilsonchao.com`

內容來源：

- **murmur（腦內記事）**：外部專案  
  - URL：`https://murmur.wilsonchao.com`  
  - Content 來源：Telegram Channel  
  - 本專案 **不重新實作** murmur 系統  

- **Blog / Projects / Homepage 文案**：Notion Database

---

# 🧱 Information Architecture（網站架構）

```
/               → 首頁（品牌總覽 + 部分文字由 Notion 控制）
/blog           → Blog 列表
/blog/[slug]    → 單篇文章
/projects       → 研究 / meta / case 列表
/about          → 敘事式自我介紹
/links          → Link Tree（給 IG / TG 使用）
/now            → optional，目前專注的事
/murmur         → optional，redirect → https://murmur.wilsonchao.com
```

**重要：** murmur 是外部子站，本 repo 不管理 murmur 內容。

---

# 🧠 Design Principles（設計原則）

## 1. **全站視覺與 murmur 一致（關鍵要求）**

網站需採用與 `murmur.wilsonchao.com` 相同的整體風格：

- 白底、留白、窄版心
- 字體清晰、行距舒適
- header / footer 簡潔
- 以文字為主，不堆疊 UI 元件
- 不要使用 Material UI / Shadcn / Radix 等大型 UI 套件
- 風格參考 Planetable/SiteTemplateSepia（murmur 所使用的 template）

> 原則：**主站看起來像 murmur 的哥哥，同一個世界觀。**

---

## 2. 首頁不是 Link Tree  
首頁需呈現：

1. Hero（名字＋身份＋一句話敘事）  
2. 最新 Blog（3 則）  
3. murmur 區塊（前往按鈕即可）  
4. Featured Projects  
5. About preview  
6. Footer（簡潔文字）

---

## 3. 不要增加使用者操作心智負擔  
- murmur → Telegram 自動更新  
- Blog / Projects / Homepage → Notion  
- deploy → git push

不引入新 CMS、不引入控制台、不增加操作步驟。

---

# 🛠 Tech Stack

- Next.js 13+（App Router）或 Astro（擇一）
- TypeScript
- Tailwind CSS or minimal CSS modules
- Cloudflare Pages（或 Zeabur）部署
- 不使用大型 UI Library

---

# 📚 Content Sources（內容來源）

本網站整合三來源：

---

## 1️⃣ Notion Database → Blog（正式文章）

Blog DB Properties：

| Property | Type | 說明 |
|----------|------|-------|
| `Title` | title | 文章標題 |
| `Slug` | rich text | 連結路徑 |
| `Type` | select | Medical / Story / Growth |
| `Status` | select | Draft / Published |
| `PublishedAt` | date | 發布日期 |
| Page content | body | Notion 內文本體 |

同步後輸出至：

```
content/blog/[slug].json
```

---

## 2️⃣ Notion Database → SiteConfig（首頁文案由 Notion 控制）

新增 Notion DB：**SiteConfig**

用途：管理可編輯的「網站文字」，例如首頁 Hero、intro、button 文案…等。

SiteConfig Properties：

| Property | Type | 用途 |
|----------|------|-------|
| `Key` | Title | 例如：HomepageHeroTitle |
| `Value` | Rich text | 實際顯示文字 |
| `Description` | text | 備註，可選 |

建議初始 Keys：

- `HomepageHeroTitle`  
- `HomepageHeroSubtitle`  
- `HomepageIntro`  
- `HomepageCTA`  
- （可擴充 AboutPageIntro / FooterText 等）

同步後輸出至：

```
content/site/config.json
```

---

## 3️⃣ Telegram + murmur.wilsonchao.com（外部 murmur）

- murmur 子站是獨立專案  
- 本 repo 不同步 murmur  
- 只需在首頁 / 導覽列 / links 提供入口  

### Optional（第二階段）

若 murmur 子站提供 RSS / feed，可加入：

```
const ENABLE_MURMUR_FEED = false;
```

開啟後可在首頁顯示 murmur 最新 3 則 —— 非必做。

---

# 🔁 Sync Script（同步腳本）

檔案位置：

```
scripts/sync-notion.ts
```

執行：

```
npm run sync:notion
```

需做兩件事：

---

## A. 同步 Blog DB → content/blog/

輸出格式建議：

```json
{
  "id": "xxxx",
  "slug": "my-post",
  "title": "文章標題",
  "type": "Medical",
  "publishedAt": "2025-01-01",
  "content": "<html or markdown>"
}
```

---

## B. 同步 SiteConfig → content/site/config.json

範例：

```json
{
  "HomepageHeroTitle": "趙玴祥 Yi-Hsiang Chao, MD",
  "HomepageHeroSubtitle": "心臟外科醫師・寫作者・思考者",
  "HomepageIntro": "我相信醫療不只是技術，也包含故事與人的重量。",
  "HomepageCTA": "閱讀最新文章 →"
}
```

前端首頁需依此渲染文字。

**若某 key 缺失，不可 build fail，需 fallback。**

---

# 🧩 UI Specification（給前端 Agent）

首頁區塊：

1. **Hero（Notion 控制文字）**  
2. **Latest Blog（3 則）**  
3. **murmur 區塊（按鈕 → murmur 子站）**  
4. **Featured Projects（可 local JSON / Notion / 硬編）**  
5. **About Preview（Notion 控制文字 optional）**  
6. **Footer（簡單文字連結）**

風格要求：

- 字體、間距、版面盡量模仿 murmur  
- 可直接參考 Planetable/SiteTemplateSepia  
- 手機版需保持閱讀舒適

---

# 📂 Project Structure（建議）

```
/
├─ app
│  ├─ page.tsx             # 首頁
│  ├─ blog
│  │  ├─ page.tsx
│  │  └─ [slug]/page.tsx
│  ├─ projects/page.tsx
│  ├─ about/page.tsx
│  ├─ links/page.tsx
│  ├─ now/page.tsx
│  └─ murmur/route.ts      # optional redirect
├─ content
│  ├─ blog/*.json
│  └─ site/config.json
├─ scripts/sync-notion.ts
├─ components
│  ├─ layout/
│  ├─ sections/
│  └─ ui/
└─ AGENTS.md
```

---

# 🧑‍💻 Agent Roles（Codex 角色分工）

## architect-agent
- 決定 Next.js / Astro
- 建立初始架構
- 撰寫 README

## frontend-agent
- 實作頁面元件
- 嚴格遵守 murmur（Sepia）視覺風格
- 使用 tailwind / minimal CSS

## content-sync-agent
- 實作 `scripts/sync-notion.ts`
- 處理 Blog DB + SiteConfig DB
- 生成正確 JSON 格式

## devops-agent
- 設定 deploy（Cloudflare / Zeabur）
- 建立自動部署流程（git push → build）

---

# 📌 Interaction Rules（Codex 必須遵守）

- 不得增加使用者操作成本  
- 不得重建 murmur 系統（它是外部子站）  
- 不得引入沉重 UI library  
- 若新增功能需更新 README  
- SiteConfig 缺 key 時不可 build fail  
- optional 功能不得影響主要流程（如 murmur feed）

---

# 🌱 Optional Function – murmur feed integration

若 murmur.wilsonchao.com 未來提供 feed，可啟用：

```
ENABLE_MURMUR_FEED = true
```

行為：

- 首頁顯示 murmur 最新 3 則（摘要）  
- feed 抓不到不可 build fail  
- 須可完全關閉  

**第一階段維持 disabled。**

---

# End of AGENTS.md
