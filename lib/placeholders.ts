export type BlogPost = {
  slug: string;
  title: string;
  type: "Medical" | "Story" | "Growth";
  publishedAt: string;
  excerpt: string;
  readingTime?: string;
};

export const defaultSiteCopy = {
  heroTitle: "趙玴祥 Yi-Hsiang Chao, MD",
  heroSubtitle: "心臟外科醫師・寫作者・思考者",
  heroIntro:
    "我相信醫療不只是技術，也包含故事與人的重量。這裡紀錄我在手術房與書桌之間的所見所思。",
  heroCTA: "閱讀最新文章 →",
  footerText: "wilsonchao.com — handwritten in small batches.",
  aboutIntro:
    "I split time between the operating room, writing desk, and long walks with a notebook.",
  aboutBody:
    "This site holds stories, questions, and unfinished threads. Long-form posts come from Notion; everyday fragments live in murmur."
};

export const placeholderBlogs: BlogPost[] = [
  {
    slug: "mending-hearts",
    title: "Mending hearts, collecting stories",
    type: "Medical",
    publishedAt: "2024-10-12",
    excerpt:
      "A short reflection on how surgery, writing, and listening can share the same rhythm.",
    readingTime: "5 min"
  },
  {
    slug: "quiet-rounds",
    title: "Quiet rounds before dawn",
    type: "Story",
    publishedAt: "2024-09-03",
    excerpt:
      "Walking the ward while the city sleeps, gathering voices that rarely make it to charts.",
    readingTime: "4 min"
  },
  {
    slug: "slow-practice",
    title: "Practicing medicine slowly",
    type: "Growth",
    publishedAt: "2024-07-22",
    excerpt:
      "Keeping a craft humane means pacing, resting, and choosing conversations over speed.",
    readingTime: "6 min"
  }
];

export const featuredProjects = [
  {
    title: "Valve atlas notes",
    description: "Sketches and micro-essays on the craft of valve repair.",
    href: "/projects"
  },
  {
    title: "Night shift letters",
    description: "Fragments written between cases — published as a small zine.",
    href: "/blog/night-shift-letters"
  },
  {
    title: "Cardiac care pathways",
    description: "Working on clearer patient handoffs and bedside language.",
    href: "/projects"
  }
];

export const aboutPreview =
  "I split time between the operating room, writing desk, and long walks with a notebook. This site holds the stories, questions, and unfinished threads.";

export const linkItems = [
  { label: "Blog", href: "/blog" },
  { label: "Projects", href: "/projects" },
  { label: "About", href: "/about" },
  { label: "Murmur", href: "/murmur", external: true },
  { label: "Telegram", href: "https://t.me/wilsonchao", external: true }
];
