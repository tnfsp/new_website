# Session Log

## 2026-01-16 - 概念設計階段

### 討論內容
用戶提出四項新功能需求：
1. 回覆系統
2. 訂閱系統
3. 搜尋系統
4. Google 追蹤與 SEO

### 決策記錄

#### 回覆系統
- **決策**：自建留言系統（使用 Vercel KV）
- **原因**：用戶認為 Giscus 外觀不佳，自建可完全控制風格
- **規格**：訪客暱稱 + Email（選填）+ 留言內容

#### 訂閱系統
- **決策**：RSS 強化 + Email 收集表單
- **原因**：Buttondown 未使用，改為自建簡易方案
- **規格**：Email 存於 Vercel KV，未來可接 Resend

#### 搜尋系統
- **決策**：使用 Pagefind
- **原因**：輕量、免費、支援中文、靜態索引
- **範圍**：全站（Blog + Daily）

#### Analytics & SEO
- **決策**：Vercel Analytics + 完善 SEO
- **原因**：用戶無現有 GA 帳號，Vercel Analytics 最簡單
- **SEO 項目**：sitemap、robots.txt、OG tags、JSON-LD

### 產出文件
- [x] PRD.md - 完整功能需求文件
- [x] TECHSTACK.md - 技術棧說明

### 下一步
1. 用戶確認 PRD 內容
2. 啟動 `/pm` 進行任務拆解
3. 開始實作

### 待辦事項
- [x] 用戶確認 PRD
- [ ] 建立 CLAUDE.md（如需要）
- [ ] PM 拆解開發任務

### 狀態
**概念設計完成**

---

## 2026-01-16 - 開發實作完成

### 完成項目

#### Phase 1: Analytics & SEO (P0)
- 安裝並整合 Vercel Analytics
- 建立動態 sitemap.ts
- 建立 robots.ts
- 文章頁加入 generateMetadata（OG tags、Twitter Card）
- JSON-LD 結構化資料：WebSite（首頁）、Article（文章）、Person（About）

#### Phase 2: 搜尋系統 (P1)
- 安裝 Pagefind
- 修改 build script 自動生成索引
- 建立 SearchBox 元件（支援 Ctrl+K）
- 在 SiteHeader 加入搜尋圖示

#### Phase 3: 訂閱系統 (P2)
- 在 SiteHeader 加入 RSS 圖示
- 建立 /api/subscribe API
- 建立 SubscribeForm 元件
- 在文章頁底部加入訂閱表單

#### Phase 4: 回覆系統 (P3)
- 安裝 nanoid
- 建立 /api/comments API（GET/POST）
- 建立 CommentSection 元件
- Honeypot 防 spam
- XSS 防護
- 在文章頁整合留言區

### 新增檔案
- `app/sitemap.ts`
- `app/robots.ts`
- `app/api/subscribe/route.ts`
- `app/api/comments/route.ts`
- `components/ui/SearchBox.tsx`
- `components/ui/SubscribeForm.tsx`
- `components/ui/CommentSection.tsx`

### 修改檔案
- `app/layout.tsx` - 加入 Analytics
- `app/page.tsx` - 加入 WebSite JSON-LD
- `app/about/page.tsx` - 加入 Person JSON-LD
- `app/blog/[slug]/page.tsx` - 加入 Article JSON-LD、OG tags、Subscribe、Comments
- `components/layout/SiteHeader.tsx` - 加入搜尋、RSS 圖示
- `package.json` - 新增依賴和 postbuild script

### 狀態
**四大功能全部實作完成，準備部署**

---

## 2026-01-16 - 進階功能整合

### 完成項目

#### Umami Analytics 整合
- 整合 Umami Cloud 詳細流量分析
- 在 layout.tsx 加入 Umami script
- Website ID: 3789c7a1-8035-4536-ab99-1c22eac26bfc

#### Resend 歡迎信整合
- 安裝 resend 套件
- 修改 /api/subscribe 發送歡迎信
- 新訂閱者自動收到歡迎郵件

#### 統計 API
- 建立 /api/stats 端點
- 回傳：總瀏覽次數、訂閱者數、留言數、熱門文章

#### 中文化
- SubscribeForm 元件中文化
- CommentSection 元件中文化
- 文章頁訂閱提示中文化

#### site-stats Skill
- 建立 `/site-stats` 指令
- 可快速查看網站統計報告

### 新增檔案
- `app/api/stats/route.ts`
- `.claude/settings.json` - site-stats skill 設定

### 修改檔案
- `app/layout.tsx` - 加入 Umami script
- `app/api/subscribe/route.ts` - 加入 Resend 歡迎信
- `components/ui/SubscribeForm.tsx` - 中文化
- `components/ui/CommentSection.tsx` - 中文化
- `app/blog/[slug]/page.tsx` - 訂閱提示中文化

### 環境變數
```
KV_REST_API_URL
KV_REST_API_TOKEN
NEXT_PUBLIC_UMAMI_WEBSITE_ID
RESEND_API_KEY
```

### 狀態
**進階功能整合完成**
## Session: 2026-06-07 20:12
**Project**: wilsonchao.com (/now)

### 完成
- /now 頁從 Wilson 真實 journal 蒸餾重寫並上線（commit b072ad3 → main）：Sivers register、平實事實標題、黑字、開場+主題分段+動態 grid
- now.json 新 schema（subtitle/opening/sections/footer）+ page.tsx C 版型 render + lib/now.ts
- 修復 stream→grid 同步（發現 OWL stream-sync 自 5/10 死）：手動補跑 7 貼文（5/18-6/1）、補 #murmur tag、放寬窗口（看/讀 60d、碎片 30d）
- 設 launchd com.wilsonchao.stream-sync（每日 04:30 + 安全閥）取代壞掉的 OWL cron，kickstart 實測通過
- 記憶 now-journal-pipeline.md + MEMORY index

### 決策
- /now 從 journal 蒸餾、不由 AI 重寫（誠實=護城河；原料是真話→AI 味自動消失）
- 聲音定 Sivers register：砍掉「替自己下結論」thesis（最大 AI tell）、標題用平實事實非詩意/科別、body 純報告
- 維護分層：開場月改 / 此刻週改 / grid 自動 → 成本最低
- grid 維持（不砍）；窗口放寬看/讀 60d、碎片 30d
- 未覆蓋 wt context.json（保留 psych #25 的 active 狀態，本 session 是 OWL 交班側任務）

### 待辦
- [ ] /now 每週更新：Wilson 說「更新 /now」→ 從近 7 天 journal 蒸餾草稿 → 過目 → push
- [ ] (低) wilsonchao git remote 是明文 PAT，可改用 credential helper 收緊
- [ ] 發 murmur 記得帶 #murmur tag（否則漏進碎片區）

## Session: 2026-06-13 10:14
**Project**: wilsonchao.com (apps/main 電子報 code review 修復)

### 完成
- 電子報管線 code review 5 項 warning 全修並 merge+push main（commit b9f1480 → merge ba5cec0 → push f9ed823..ba5cec0）
- 訂閱黑洞 rollback、IP rate limit（lib/rate-limit.ts）、共用 escapeHtml（含引號，lib/escape-html.ts）、send-newsletter 寄送防呆（slug/intro split/status 檢查）、SubscribeForm res.ok 檢查 + 中文錯誤
- 驗證 tsc/eslint 全綠、--preview 實測通過、未實際寄信

### 決策
- rate-limit 用標準 @vercel/kv fixed-window（task 指的 apps/teaching/lib/rate-limit.ts 本機不存在）
- 歡迎信失敗不 rollback（contact 已在名單可補寄）；只有 contact 建立失敗才 rollback KV
- rate-limit fail open（KV 故障不擋真訂閱者）

### 待辦
- [ ] 週報 #16 創刊號週末寄出（OWL deadline 6/15，非本 session 範圍）

## Session: 2026-06-15 17:46
**Project**: wilsonchao.com (apps/main — 移除 BLOGROLL)

### 完成
- 全站完整移除 BLOGROLL：SiteHeader 導覽連結、placeholders.ts links 項目、sitemap.ts 條目、public/llms.txt 列舉，並刪除 apps/main/app/blogroll/ 整個頁面
- 驗證：preview dev server 無編譯錯誤，fetch('/blogroll') 回傳 404

### 決策
- IMPROVEMENT-PLAN.md 內兩處把 blogroll 當「現有基建」的敘述屬規劃文件，未動（已告知 Wilson，待指示再清）

### 待辦
- [ ] （無新增）

## Session: 2026-06-15 18:25
**Project**: wilsonchao.com (new_website)
**Branch**: claude/priceless-rosalind-23c137

### 完成
- 新訂閱進來時 email 通知站長：subscribe/route.ts 加 notifyNewSubscriber()
- 訂閱成功後（Resend contact + 歡迎信 OK）以 try/catch 寄通知信，含訂閱者 email/來源/時間/訂閱總數
- 收件人 NOTIFY_EMAIL，未設則 fallback RESEND_REPLY_TO（reply-to 鏈已導 gmail → 零新 env 即生效）
- tsc --noEmit 對該檔無錯；commit 2ab3235

### 決策
- 選 email 而非 Telegram（Wilson 指定）
- 守 memory 兩條硬規則：serverless 必 await、通知失敗只 log 不害訂閱（與歡迎信一致）
- 不跑 live 測試：該 route 會建真 Resend contact + 寄真信，有不可逆副作用

### 待辦
- [ ] push → PR → 部署後通知才生效（目前在 worktree branch，未 push/merge）
- [ ] 未來訂閱量大時，考慮改「每日彙整一封」避免灌爆收件匣


## Session: 2026-06-15 19:30
**Project**: wilsonchao.com (new_website)
**Branch**: claude/focused-jang-38e86a

### 完成
- 評估 Leonxlnx/taste-skill：判斷其高 variance+motion 預設適合作品集/landing，閱讀型部落格要「反過來調」（克制 > 驚艷）
- 關鍵發現並修復：blog 文章頁巨型 inline className 蓋掉 globals.css 的 .prose 規則 → 還原中文閱讀節奏（段距 12→24px、行高 26→30.4px）
- blog 正文字級 16→17px（新增 scoped .prose-blog，grep 確認不波及首頁/about/owl）
- blog 文章 header 改 kicker(橘)→大標→meta 階層
- 首頁重排漏斗：Hero→intro→如何逛(入口)→精選→最近寫的→訂閱CTA(頁尾)→footer
- hero 對句 h1 去 tracking-tight（負字距不適合大號中文）+ leading 1.25→1.15 收成塊
- intro「寄信給我」加 mailto 連結
- 新增 apps/main/DESIGN.md 設計守則
- rebase 上 origin/main 最新 → 本機 build 通過 → push origin HEAD:main（468c1a7..cceac78）→ Vercel 部署
- （session-end review 跟進）補 `.prose h1` 規則：移除 inline override 後 globals 只剩 h2/h3，Notion heading_1 內文會 fall back 到 plugin 預設；補一條對齊階層，守單一真相來源

### 決策
- taste-skill 只借「方法論」不借「預設值」：閱讀站要低 variance / 極低 motion / 寬鬆 density
- 排版規則單一真相來源放 globals.css；元件不放 inline override 與之打架
- 不靠 utility 贏 cascade，要覆蓋就加自己的 scoped class（.prose-blog）
- 訂閱/邀請 CTA 收頁尾（證據先於要求）
- 直接 push main：符合 Wilson commit→main→Vercel 工作流，且每步截圖核准過；push 前跑 build 當關卡

### 待辦
- [ ] 線上實機確認 blog 閱讀節奏 + 首頁新順序
- [ ] (可選) blog 列表頁 + 上下篇導覽視覺對齊 owl 工藝水準

## Session: 2026-07-02 14:06
**Session ID**: wilsonchao-review-20260702
**Project**: wilsonchao.com (apps/main)

### 完成
- 全站 code review：4 並行 agent 分區審查（API+lib / pages+routes / React components / sync scripts）+ 主 loop tsc/eslint/build 基線 → 4 Critical、9 High、~25 Medium/Low
- 修 4 Critical：comments GET 洩漏 email、sync:notion 誤刪 vault 文章、Notion query 無分頁靜默刪文、sync-vault find shell injection
- 修 9 High：時區統一 Asia/Taipei（lib/date.ts）、KV 清單改 Redis list 原子寫入（lib/kv-list.ts）、/api/stats 加 Bearer token、likes/views 驗證+rate limit、sanitizeHtml 換 sanitize-html、build-search-index 失敗擋 build
- 修 ~25 Medium/Low：/feed.xml 真聚合、/owl 無 JS fallback、a11y（focus trap/inert/aria-live/鍵盤）、hydration mismatch、scripts 韌性（原子寫入/lock heartbeat/newsletter --send-existing）、JSON-LD escape
- STATS_SECRET 透過 Vercel CLI 設 prod+preview（值在 apps/main/.env.local）
- merge 回 main + push + Vercel 部署 Ready + production 端點實測全過

### 決策
- 修法收斂成共用 helper（date/kv-list/json-ld/sanitize），而非逐點打補丁 → 未來一致
- sync:notion 改 legacy 定位：cleanup 改 --prune opt-in + 刪 >10 需 --force（vault 才是 source of truth）
- API 錯誤語意分離：壞輸入 400、KV 故障 503（不再假裝回 0 讓前端歸零）
- /api/stats fail-closed：沒設 STATS_SECRET 一律 401
- 2 個 <img> lint warning 刻意保留（非 LCP 關鍵路徑）

### 待辦
- [ ] （可選）審查清單本來未列的更大重構：CodeHighlight 移到 build time、表單抽共用 hook、loadBlogEntries 包 React cache()
- [ ] （提醒）電子報之後用 --send-existing <id> 寄，勿重跑 --send 產生第二份 broadcast
