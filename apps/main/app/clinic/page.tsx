import type { Metadata } from "next";
import Image from "next/image";
import { jsonLdString } from "@/lib/json-ld";

const BASE_URL = "https://wilsonchao.com";

export const metadata: Metadata = {
  title: "趙玴祥醫師｜心臟血管外科｜高雄醫學大學附設中和紀念醫院",
  description:
    "趙玴祥醫師，高雄醫學大學附設中和紀念醫院心臟血管外科醫師。專長冠狀動脈繞道手術（CABG）、心臟瓣膜修補及置換手術、主動脈手術。門診時間與預約資訊。",
  alternates: { canonical: `${BASE_URL}/clinic` },
  openGraph: {
    title: "趙玴祥醫師｜心臟血管外科門診",
    description:
      "高雄醫學大學附設中和紀念醫院心臟血管外科醫師。專長冠狀動脈繞道手術、心臟瓣膜手術、主動脈手術。",
    url: `${BASE_URL}/clinic`,
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
};

const physicianJsonLd = {
  "@context": "https://schema.org",
  "@type": "Physician",
  "@id": `${BASE_URL}/#person`,
  name: "趙玴祥",
  alternateName: ["Yi-Hsiang Chao", "Wilson Chao"],
  url: `${BASE_URL}/clinic`,
  // image: `${BASE_URL}/images/dr-chao-portrait.jpg`, // TODO: 放上專業照片後啟用
  description:
    "高雄醫學大學附設中和紀念醫院心臟血管外科醫師，專長冠狀動脈繞道手術、心臟瓣膜手術、主動脈手術。", // TODO: 八月後加「主治」
  medicalSpecialty: {
    "@type": "MedicalSpecialty",
    name: "Cardiovascular Surgery",
  },
  jobTitle: "心臟血管外科醫師", // TODO: 八月升主治後改為「主治醫師」
  affiliation: {
    "@type": "Hospital",
    "@id": "https://www.kmuh.org.tw",
    name: "高雄醫學大學附設中和紀念醫院",
    alternateName: "Kaohsiung Medical University Chung-Ho Memorial Hospital",
    address: {
      "@type": "PostalAddress",
      streetAddress: "自由一路100號",
      addressLocality: "高雄市",
      addressRegion: "三民區",
      postalCode: "807",
      addressCountry: "TW",
    },
    telephone: "+886-7-3121101",
  },
  alumniOf: {
    "@type": "CollegeOrUniversity",
    name: "高雄醫學大學",
    alternateName: "Kaohsiung Medical University",
  },
  availableService: [
    {
      "@type": "MedicalProcedure",
      name: "冠狀動脈繞道手術",
      alternateName: "CABG",
    },
    {
      "@type": "MedicalProcedure",
      name: "心臟瓣膜修補及置換手術",
    },
    {
      "@type": "MedicalProcedure",
      name: "主動脈手術",
    },
  ],
  sameAs: [
    "https://www.instagram.com/momobear_doctor",
  ],
  knowsLanguage: ["zh-TW", "en"],
  areaServed: {
    "@type": "City",
    name: "高雄市",
  },
};

const medicalWebPageJsonLd = {
  "@context": "https://schema.org",
  "@type": "MedicalWebPage",
  name: "趙玴祥醫師 — 心臟血管外科門診",
  url: `${BASE_URL}/clinic`,
  about: { "@id": `${BASE_URL}/#person` },
  specialty: "Cardiovascular Surgery",
  lastReviewed: "2026-03-08",
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "趙玴祥醫師的專長是什麼？",
      acceptedAnswer: {
        "@type": "Answer",
        text: "趙玴祥醫師專長冠狀動脈繞道手術（CABG）、心臟瓣膜修補及置換手術、以及主動脈手術（主動脈瘤、主動脈剝離等）。",
      },
    },
    {
      "@type": "Question",
      name: "趙玴祥醫師在哪裡看診？",
      acceptedAnswer: {
        "@type": "Answer",
        text: "趙玴祥醫師任職於高雄醫學大學附設中和紀念醫院心臟血管外科，地址為高雄市三民區自由一路100號，總機電話 (07) 312-1101。門診時間將於 2026 年八月主治醫師到任後公布。",
      },
    },
    {
      "@type": "Question",
      name: "心臟手術前需要準備什麼？",
      acceptedAnswer: {
        "@type": "Answer",
        text: "心臟手術前，醫療團隊會安排完整的術前檢查，包含心臟超音波、心導管、抽血等。病人及家屬可以在門診時提出任何疑問，醫師會用易懂的方式說明每一個檢查結果和治療選項，協助做出最適合的決定。",
      },
    },
    {
      "@type": "Question",
      name: "趙玴祥醫師的學經歷？",
      acceptedAnswer: {
        "@type": "Answer",
        text: "趙玴祥醫師畢業於高雄醫學大學醫學系，現為高雄醫學大學附設中和紀念醫院心臟血管外科總醫師，具外科專科醫師資格。",
      },
    },
  ],
};

// 專長項目
const specialties = [
  {
    title: "冠狀動脈繞道手術",
    subtitle: "Coronary Artery Bypass Grafting (CABG)",
    description: "針對冠狀動脈嚴重狹窄或阻塞的病人，透過繞道手術恢復心臟的血流供應。",
  },
  {
    title: "心臟瓣膜手術",
    subtitle: "Heart Valve Surgery",
    description: "心臟瓣膜狹窄或閉鎖不全的修補與置換手術，包含主動脈瓣、二尖瓣等。",
  },
  {
    title: "主動脈手術",
    subtitle: "Aortic Surgery",
    description: "主動脈瘤、主動脈剝離等主動脈疾病的手術治療。",
  },
];

// 學經歷
const credentials = [
  "高雄醫學大學 醫學系",
  "高雄醫學大學附設中和紀念醫院 心臟血管外科 住院醫師",
  "高雄醫學大學附設中和紀念醫院 心臟血管外科 總醫師",
  "外科專科醫師",
  // TODO: 升主治後更新
];

export default function ClinicPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(physicianJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(medicalWebPageJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(faqJsonLd) }}
      />

      <main className="clinic-page">
        {/* Hero */}
        <section className="space-y-4 pb-8 border-b border-[var(--border)]">
          <div className="flex items-center gap-5">
            <Image
              src="/hero.jpg"
              alt="趙玴祥醫師"
              width={112}
              height={112}
              className="h-20 w-20 sm:h-28 sm:w-28 rounded-xl border border-[var(--border)] flex-shrink-0 object-cover"
            />
            <div className="space-y-0.5">
              <h1 className="text-3xl font-bold text-[var(--foreground)]">
                趙玴祥<span className="text-lg font-normal text-[var(--muted)] ml-2">醫師</span>
              </h1>
              <p className="text-lg text-[var(--muted)]">
                心臟血管外科
              </p>
              <p className="text-base text-[var(--muted)]">
                高雄醫學大學附設中和紀念醫院
              </p>
            </div>
          </div>
        </section>

        {/* 專長領域 */}
        <section className="py-8 space-y-5 border-b border-[var(--border)]">
          <h2 className="text-xl font-semibold text-[var(--foreground)]">專長領域</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {specialties.map((s) => (
              <div
                key={s.title}
                className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 space-y-2"
              >
                <h3 className="font-semibold text-[var(--foreground)]">{s.title}</h3>
                <p className="text-xs text-[var(--muted)] tracking-wide">{s.subtitle}</p>
                <p className="text-sm text-[var(--muted)] leading-relaxed">{s.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 學經歷 */}
        <section className="py-8 space-y-4 border-b border-[var(--border)]">
          <h2 className="text-xl font-semibold text-[var(--foreground)]">學經歷</h2>
          <ul className="space-y-2 text-[var(--muted)]">
            {credentials.map((c) => (
              <li key={c} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[var(--accent)] flex-shrink-0" />
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* 門診時間 */}
        <section className="py-8 space-y-4 border-b border-[var(--border)]">
          <h2 className="text-xl font-semibold text-[var(--foreground)]">門診時間</h2>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 space-y-3">
            <p className="text-[var(--muted)]">
              門診時間將於 2026 年八月主治醫師到任後公布，敬請期待。
            </p>
            <div className="text-sm text-[var(--muted)] space-y-1">
              <p>📍 高雄醫學大學附設中和紀念醫院</p>
              <p>📞 總機：(07) 312-1101</p>
              <p>🏠 807 高雄市三民區自由一路 100 號</p>
            </div>
          </div>
        </section>

        {/* 給病人的話 */}
        <section className="py-8 space-y-4">
          <h2 className="text-xl font-semibold text-[var(--foreground)]">給您的話</h2>
          <div className="rounded-lg bg-[var(--surface-strong)] p-5">
            <p className="text-[var(--foreground)] leading-relaxed">
              面對心臟手術，緊張是正常的。我會用您聽得懂的方式，說明每一個檢查結果和治療選項，讓您和家人一起做出最適合的決定。
            </p>
            <p className="mt-3 text-[var(--foreground)] leading-relaxed">
              如果您有任何問題，歡迎在門診時提出，我會盡力為您解答。
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
