export type BlogPost = {
  slug: string;
  title: string;
  type: "Medical" | "Story" | "Growth";
  publishedAt: string;
  excerpt: string;
  readingTime?: string;
};

export const defaultSiteCopy = {
  heroTitle: "Yi-Hsiang Chao, MD",
  heroSubtitle: "Cardiac surgeon ・ writer ・ slow thinker",
  heroIntro:
    "Medicine is technique and also story. This site gathers notes from the operating room and the writing desk.",
  heroCTA: "Read the latest →",
  footerText: "wilsonchao.com — handwritten in small batches.",
  murmurIntro: "Daily fragments and half sentences live in murmur. It is a lighter, quicker feed.",
  murmurCTA: "Visit murmur →",
  aboutIntro:
    "I split time between the operating room, writing desk, and long walks with a notebook.",
  aboutBody:
    "This site holds stories, questions, and unfinished threads. Long-form posts come from Notion; everyday fragments live in murmur.",
  aboutImage: "",
  blogTitle: "Articles & notes",
  blogIntro: "Long-form writing on medicine, stories from the ward, and how to keep a craft humane.",
  projectsTitle: "Daily notes",
  projectsIntro: "Short daily entries — fragments, drafts, and small observations."
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

export const featuredProjects: {
  title: string;
  description: string;
  href: string;
  type?: string;
  date?: string;
  status?: string;
  slug?: string;
}[] = [
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
