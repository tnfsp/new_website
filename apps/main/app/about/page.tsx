import Link from "next/link";
import { SubscribeForm } from "@/components/ui/SubscribeForm";
import { DrawerDeck } from "@/components/drawer/DrawerDeck";
import { DrawerNote } from "@/components/drawer/DrawerNote";
import { loadDrawerCards } from "@/lib/content";
import { BASE_URL } from "@/lib/constants";
import { jsonLdString } from "@/lib/json-ld";

export const metadata = {
  title: "About — Wilson Chao",
  description: "趙玴祥，高醫心臟血管外科醫師。關於我是誰、在做什麼、為什麼寫這個網站。",
  alternates: { canonical: `${BASE_URL}/about` },
  openGraph: {
    title: "About — Wilson Chao",
    description: "趙玴祥，高醫心臟血管外科醫師。關於我是誰、在做什麼、為什麼寫這個網站。",
    url: `${BASE_URL}/about`,
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
};

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": ["Person", "Physician"],
  "@id": `${BASE_URL}/#person`,
  name: "趙玴祥",
  alternateName: ["Yi-Hsiang Chao", "Wilson Chao"],
  url: `${BASE_URL}/about`,
  image: `${BASE_URL}/avatar.png`,
  jobTitle: "心臟血管外科醫師",
  description:
    "高雄醫學大學附設中和紀念醫院心臟血管外科醫師。專長冠狀動脈繞道手術、心臟瓣膜手術、主動脈手術。同時是寫作者與內容創作者。",
  medicalSpecialty: {
    "@type": "MedicalSpecialty",
    name: "Cardiovascular Surgery",
  },
  affiliation: {
    "@type": "Hospital",
    name: "高雄醫學大學附設中和紀念醫院",
    alternateName: "Kaohsiung Medical University Chung-Ho Memorial Hospital",
    url: "https://www.kmuh.org.tw",
    address: {
      "@type": "PostalAddress",
      streetAddress: "自由一路100號",
      addressLocality: "高雄市",
      addressRegion: "三民區",
      postalCode: "807",
      addressCountry: "TW",
    },
  },
  alumniOf: {
    "@type": "CollegeOrUniversity",
    name: "高雄醫學大學",
    alternateName: "Kaohsiung Medical University",
  },
  knowsAbout: [
    "Cardiovascular Surgery",
    "Coronary Artery Bypass Grafting",
    "Heart Valve Surgery",
    "Aortic Surgery",
  ],
  knowsLanguage: ["zh-TW", "en"],
  sameAs: [
    "https://www.instagram.com/momobear_doctor",
    "https://t.me/doctormomo",
  ],
  mainEntityOfPage: {
    "@type": "WebPage",
    "@id": `${BASE_URL}/about`,
  },
};

export default async function AboutPage() {
  // 抽屜：直接嵌在 About 頁的互動式「認識我」區塊。
  const drawerCards = await loadDrawerCards();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(personJsonLd) }}
      />
      <main className="page-shell space-y-8">
        {/* Page header */}
        <header>
          <span className="section-title">About</span>
          <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-[var(--foreground)] sm:text-4xl">
            趙玴祥（Wilson Chao）
          </h1>
        </header>

        {/* 0. 開場合約 — 小卡引言 */}
        <section className="surface-card px-6 py-5 space-y-3">
          <p className="text-[var(--foreground)] leading-relaxed">
            小時候，我喜歡看漫畫或是小說在書封側面那欄的自我介紹，關於作者的隨筆簡介，有的人寫的正經八百：「法國知名作家，曾任OOO，以對OOO為基礎，發展並實踐OOO」
          </p>
          <p className="text-[var(--foreground)] leading-relaxed">
            但也有人寫的超白爛的，寫說：「我是誰誰誰我每天都有大便。」
          </p>
          <p className="text-[var(--foreground)] leading-relaxed">
            經營個人網站的其中一個好處是，我可以隨便我想怎麼介紹我自己都可以，所以這個地方我會放一些關於我的介紹，希望我能更瞭解我、你也能更瞭解我！
          </p>
        </section>

        {/* 0b. 基礎資料 — 寬卡（名字的故事） */}
        <section className="surface-card px-6 py-5 space-y-3">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">基礎資料</h2>
          <div className="prose max-w-none space-y-0">
            <p>
              1995年4月1日出生，牡羊座、O型！從小對愚人節出生有著很大的困擾，因為每次跟別人說自己生日，總是會得到「屁啦」的答案。
            </p>
            <p>
              同樣的困擾還有自己的名字，我是趙玴（ㄧˋ）祥，從小到大沒有遇到一個老師是第一次就唸對的，而我也除了能瞭解這個老師的國文能力，也了解這個老師是否有敢於犯錯的性格（有些人因為名字特別狂叫我、但也有些人死都不叫我）
            </p>
            <p>
              有些人會叫我世（ㄕˋ）祥，畢竟有邊讀邊非常合理，但遇到叫我泄（ㄒㄧㄝˋ）祥的，我真的是謝謝你，雖然大學有一陣子同學都這樣叫我。
            </p>
            <p>
              由很感謝願意在護理站查一個王一個世怎麼念的護理師，說實在話出生的時候我家的人也不知道怎麼念，我也當了十天的ㄕˋ祥。
            </p>
            <p>
              國中課程有個功課要查自己名字的含義，我小時候以為「玴」是世界之王的意思，後來學了部首，以為是一種稀世珍玉，後來查了才發現，原來「玴」只是一種石頭，我只能安慰自己，那是未經琢磨的璞玉。
            </p>
            <p>
              Anyway，我認為名字非常重要，我會超級感謝第一次就叫對我名字的人，最近一次要頒發國文小老師勳章的，是一個uber司機，他叫對的當下我差點三秒落淚！
            </p>
            <p>
              另外，我對名字的堅持，也寫了一篇{" "}
              <Link href="/blog/no-name-doctor" className="inline-link">
                「沒有姓名的值班機器」
              </Link>{" "}
              這篇文章，有空可以看看。
            </p>
          </div>
        </section>

        {/* 樂章Ⅱ：怎麼走到這（此刻 + 心外 + 寫） */}
        <div className="space-y-4">
        <div className="flex items-center gap-3 pt-2">
          <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--accent)]" aria-hidden="true" />
          <span className="text-sm font-medium tracking-wider text-[var(--accent-strong)]">怎麼走到這</span>
          <span className="h-px flex-1 bg-[var(--border)]" aria-hidden="true" />
        </div>

        {/* 1. 此刻的我 — 小卡，連結 /now */}
        <section className="surface-card px-6 py-5 space-y-3">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">此刻的我</h2>
          <div className="prose max-w-none space-y-0">
            <p>
              高醫畢業，高榮短暫PGY，後來回來高醫做外科住院醫師，現在正在心臟外科擔任總醫師，接受最紮實的訓練
            </p>
            <p>
              八月去小港醫院升主治，同時要念研究所。說實話，韓劇裡那種帥氣樣子的住院醫師都是騙人的——我們大部分時間在開刀、值班、補眠之間來回穿梭。誰有空談戀愛！
            </p>
          </div>
          <Link
            href="/now"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--accent)] transition-colors hover:text-[var(--accent-strong)]"
          >
            想知道我「現在」具體在忙什麼 →
          </Link>
        </section>

        {/* 2a. 為什麼是心臟外科 — 小卡 */}
        <section className="surface-card px-6 py-5 space-y-3">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">為什麼是心臟外科</h2>
          <div className="prose max-w-none space-y-0">
            <p>
              學生時期遇到好幾個模範老師。有一次跟老師查房，他竟然查到睡著，大家悄悄退出去，把門關上。
            </p>
            <p>
              那時我真的對心外感到好奇——什麼樣的工作，可以讓一個人如此不眠不休。
            </p>
            <p>
              後來才明白，心臟外科就是一家醫院的最後一道防線。看著學長在急救時英勇出現、放下葉克膜的身影；或是別科不小心弄破血管時，像醫龍一樣帥氣登場——都讓我熱血不已。
            </p>
            <p>
              儘管真的走進來、親身體會後才知道，這根本不是人幹的。但這也正是這份工作迷人的地方。
            </p>
          </div>
        </section>

        {/* 2b. 為什麼開始寫 — 小卡 */}
        <section className="surface-card px-6 py-5 space-y-3">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">為什麼開始寫</h2>
          <div className="prose max-w-none space-y-0">
            <p>
              寫作，對我來說是一種整理。把白天來不及消化的東西，晚上一個字一個字放回該在的位置，雖然這樣講有點假掰哈哈
            </p>
            <p>
              但另一部分正如我在{" "}
              <Link href="/" className="inline-link">
                首頁
              </Link>{" "}
              提到的，是希望可以找到一些志同道合的人，可以交換不同的看法，能交到一些朋友也是不錯的地方。
            </p>
            <p>
              另外一部分是怕遺忘，其實我是個記憶力很好的人（不然怎麼考上醫學系），但我覺得我底層其實害怕遺忘，遺忘當時的自己那時候的心境、想法，我是怎麼從那邊走到這邊的，所以想留個紀錄。
            </p>
            <p>
              很喜歡「成為自由人」這本書提到的概念，古人在洞穴裡，刻下圖畫文字，希望留下些什麼東西，我也在這個我的洞穴裡寫下我的故事，希望未來的某些人可以看到，也許可以產生跨時空的共鳴！
            </p>
          </div>
        </section>
        </div>

        {/* 樂章Ⅲ：我這個人（怎樣的人 + 在乎 + 弱點） */}
        <div className="space-y-4">
        <div className="flex items-center gap-3 pt-2">
          <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--accent)]" aria-hidden="true" />
          <span className="text-sm font-medium tracking-wider text-[var(--accent-strong)]">我這個人</span>
          <span className="h-px flex-1 bg-[var(--border)]" aria-hidden="true" />
        </div>

        {/* 3. 我是個怎樣的人 — 小卡 */}
        <section className="surface-card px-6 py-5 space-y-3">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">我是個怎樣的人</h2>
          <p className="text-[var(--foreground)] leading-relaxed">
            一個自由而好奇的人，剛好在開心臟。
          </p>
          <p className="text-[var(--muted)] leading-relaxed text-sm">
            行動派——想到就做，底層的動力應該是好奇心，雖然有一陣子迷失自我，以為自己是想要「變強」，但其實最底層應該只是對人事物感到好奇。
          </p>
        </section>

        {/* 5. 我在乎的事 — 小卡 */}
        <section className="surface-card px-6 py-5 space-y-3">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">我在乎的事</h2>
          <div className="prose max-w-none space-y-0">
            <p>
              我有一段時間我在經營某某醫師這個粉絲專頁那時的我很在意人設，做什麼表達都綁手綁腳，花了一段時間才承認，「溫暖的好醫師」這個殼，裝不下真正的我。
            </p>
            <p>
              現在我在乎的是：把原則界線守好、把人真正搞懂、靠著好奇心一直往前沿走。
            </p>
          </div>
        </section>

        {/* 4. 我的弱點 — 自剖的最低點，接著用品味換氣 */}
        <section className="surface-card px-6 py-5 space-y-3">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">我的弱點</h2>
          <div className="prose max-w-none">
            <p>
              我用忙碌來麻痺自己，以為只要夠忙，就可以不用面對某些問題。我也會害怕寫不好——完美主義一作祟，這件事就不好玩了，然後我就拖著不寫。
            </p>
            <p>
              我發現我也討厭自己，討厭自己的出身背景，討厭自己有時表現得那麼不合時宜，討厭自己像個鄉巴佬一樣，不會玩有錢人的遊戲。
            </p>
            <p>
              把這些寫出來不太舒服，但我想，一個只給你看光亮面的人，你大概也不會真的相信他。
            </p>
          </div>
        </section>
        </div>

        {/* 6. 品味（群組）— 音樂/閱讀/電影 + 抽屜，收成一組 */}
        <div className="space-y-4">
          {/* 品味 群組細標 */}
          <div className="flex items-center gap-3 pt-2">
            <span
              className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--accent)]"
              aria-hidden="true"
            />
            <span className="text-sm font-medium tracking-wider text-[var(--accent-strong)]">
              品味
            </span>
            <span className="h-px flex-1 bg-[var(--border)]" aria-hidden="true" />
            <Link
              href="/taste"
              className="inline-flex flex-shrink-0 items-center gap-1 whitespace-nowrap text-sm font-medium text-[var(--accent)] transition-colors hover:text-[var(--accent-strong)]"
            >
              我喜歡的東西，都收在這裡 →
            </Link>
          </div>

          {/* 6a. 音樂 / 吉他 / DJ */}
          <section className="surface-card px-6 py-5 space-y-3">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">音樂 / 吉他 / DJ</h2>
          <div className="prose max-w-none space-y-0">
            <p>
              那個會快樂的自己住在這裡。喜歡聽Lofi / Hiphop / R&amp;B，偶爾串串華語經典老歌。
            </p>
            <p>
              最喜歡的DJ是DJ Shota，一個日本人，他的Turntable真的超強，他也放我最愛的Nujabes。
            </p>
            <p>
              最喜歡的饒舌歌手是蛋堡，最喜歡的搖滾歌手是伍佰，最喜歡的歌是縱貫線的給自己的歌，但是每一段時間都會有一直反覆聽的歌，某一個歌好像都代表一個時期。
            </p>
            <p>前陣子愛聽Soby的愛你是。</p>
          </div>
        </section>

        {/* 6b. 我的品味 — 閱讀 */}
        <section className="surface-card px-6 py-5 space-y-3">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">閱讀</h2>
          <div className="prose max-w-none space-y-0">
            <p>
              我們家的傳家寶書是「紙牌的秘密」，一本經典的哲學書，是我媽媽推薦我的，後來一路看蘇菲的世界，接觸了哲學的概念，才開始看越來越多。
            </p>
            <p>
              喜好卡繆，一開始看到「唯一的哲學問題，就是人是否要自殺」就覺得這個人好瘋，再看到薛西弗斯的神話，又覺得這個人不只瘋還很聰明，後來發現有人用「荒謬」這兩個字更貼切。
            </p>
            <p>
              早期鍾情於各種生產力的書，從GTD、到各種時間管理，只要能讓自己變強的書來者不拒，但隨著現在AI越來越強（？）還有對自己的越來越認識，嘗試減少這樣子的FOMO焦慮
            </p>
            <p>
              這陣子在研究品味與階級之間的關係，從品味入手，一開始是想發展自己對生活的品味，後來看到了皮耶·布赫迪厄的區判，發現這些品味可能跟自己的階級有關係，延伸看了：格調、品味與階級。
            </p>
            <p>
              從我這個從中級貧民，跳到中產階級的人看待這個資本主義的遊戲，開始思考，我真的是喜歡這個東西嗎？比方說喜歡威士忌，是真的喜歡還是假裝喜歡可以讓你得到上一個階級的快感呢？
            </p>
            <p>也許想清楚這件事情，才能真的說你有品味。</p>
          </div>
        </section>

        {/* 6c. 我的品味 — 電影 */}
        <section className="surface-card px-6 py-5 space-y-3">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">電影</h2>
          <div className="prose max-w-none space-y-0">
            <p>
              人生比電影還扯，是我一直以來的信念，畢竟我的人生比Drama還要Drama！但說真的，看電影有時候還真的幫我解決不少人生的難題。
            </p>
            <p>
              我最愛的電影：如果這世界貓消失了，關於存在與愛，看書跟電影，總共哭了三次，有把作為人的孤單感詮釋的至少九分。另一部類似的電影是橫道世之介，我也很愛
            </p>
            <p>
              關於人際關係的困擾，推薦看海潮之聲。關於選擇困難與命運感，我推薦看倒帶人生。關於工作/人生的意義，我推薦看我的完美日常。
            </p>
          </div>
        </section>

          {/* 抽屜 — 品味裡更小、更日常的喜好 */}
          {drawerCards.length > 0 ? <DrawerDeck cards={drawerCards} /> : null}
        </div>

        {/* 7. 我相信的事 — 小卡 */}
        <section className="surface-card px-6 py-5 space-y-4">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">我相信的事</h2>
          <ul className="space-y-3">
            {[
              "好奇心是最該被保護的東西，它通常知道路。",
              "把人搞懂，比把事做完更難，也更重要。",
              "要去前沿。前沿很冷，但只有那裡看得到還沒被決定的事。",
            ].map((belief) => (
              <li
                key={belief}
                className="flex items-start gap-3 text-[var(--foreground)] leading-relaxed"
              >
                <span
                  className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--accent)]"
                  aria-hidden="true"
                />
                {belief}
              </li>
            ))}
          </ul>
        </section>

        {/* 8. 我還沒想通的事 */}
        <section className="surface-card px-6 py-5 space-y-3">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">我還沒想通的事</h2>
          <div className="prose max-w-none">
            <p>
              如果有一天，我不能再用「醫師」「很忙」「被需要」來介紹自己，那我是誰？
            </p>
            <p>
              我有時候想，也許根本沒有一個「真正的我」等著被發現，我就是這些所有面向加起來的總和而已。
            </p>
          </div>
        </section>

        {/* 9. 我在做什麼 — 小卡 */}
        <section className="surface-card px-6 py-5 space-y-4">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">我在做什麼</h2>
          <ul className="space-y-3 text-sm">
            <li>
              <span className="font-semibold text-[var(--foreground)]">開刀</span>
              <span className="text-[var(--muted)]">——心臟外科總醫師，正在往主治路上。</span>
            </li>
            <li>
              <span className="font-semibold text-[var(--foreground)]">寫作</span>
              <span className="text-[var(--muted)]">——這個部落格＋每週一封信。</span>
            </li>
            <li>
              <span className="font-semibold text-[var(--foreground)]">Instagram</span>{" "}
              <a
                href="https://www.instagram.com/momobear_doctor"
                target="_blank"
                rel="noreferrer"
                className="inline-link text-[var(--accent)]"
              >
                @momobear_doctor
              </a>
              <span className="text-[var(--muted)]">
                ——疫情時關在家開的粉專，分享我在習醫路上學到的事。最近停更了：一部分是醫療工作的疲憊磨掉了分享欲，一部分是我自己變了，不再那麼在意以前在意的生產力、靈性那些。我把 IG、FB、Threads 都刪了，偶爾用電腦看訊息。要復更，得等我重新想起「為什麼要寫」的那一天。
              </span>
            </li>
            <li>
              <span className="font-semibold text-[var(--foreground)]">Owl</span>
              <span className="text-[var(--muted)]">——我的數位夥伴，他有自己的版面 → </span>
              <Link href="/owl" className="inline-link">
                /owl
              </Link>
            </li>
          </ul>
        </section>

        {/* 9b. 留個話（私密簽到本）— 靠近結尾、接著訂閱 */}
        {drawerCards.length > 0 ? <DrawerNote /> : null}

        {/* 10. 邀請＋訂閱 — 小卡，結尾 */}
        <section id="subscribe" className="surface-strong px-6 py-7 space-y-5">
          <div className="space-y-2">
            <p className="text-lg font-medium text-[var(--foreground)] leading-relaxed">
              讀到這裡，我們才算好真的開始認識。
            </p>
            <p className="text-base text-[var(--foreground)] leading-relaxed">
              所以換我問你：上一次，你誠實地問自己「我是誰」，是什麼時候？
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-[var(--muted)]">訂閱每週一封信，直接寄到你信箱：</p>
            <SubscribeForm source="about" />
          </div>
          <p className="text-sm text-[var(--muted)]">
            或直接寫信：{" "}
            <a href="mailto:hi@wilsonchao.com" className="inline-link">
              hi@wilsonchao.com
            </a>
          </p>
        </section>

        {/* Footer */}
        <footer className="border-t border-[var(--border)] pt-6 text-sm text-[var(--muted)]">
          只代表個人意見，半手工打造
        </footer>
      </main>
    </>
  );
}
