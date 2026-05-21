import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with User-Agent telemetry headers
let googleAI: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    googleAI = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
    console.log("Gemini SDK successfully initialized.");
  } catch (error) {
    console.error("Failed to initialize Gemini SDK:", error);
  }
} else {
  console.log("No GEMINI_API_KEY found in environment. Server will use local AI fallbacks.");
}

// Database JSON Persistence Setup
const DB_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "news_db.json");

// Ensure db directory thrives
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Global interface representing the database state
interface DBState {
  users: any[];
  articles: any[];
  categories: any[];
  comments: any[];
  ads: any[];
  newsletters: any[];
  liveUpdates: any[];
}

// Standard Categories to seed
const SEED_CATEGORIES = [
  { id: "tech", name: "Technology", slug: "technology", description: "Silicon Valley, AI agents, software stacks, and quantum breakthroughs.", color: "emerald-600" },
  { id: "startups", name: "Startups", slug: "startups", description: "VC funding, bootstrapped rockets, and entrepreneurial insights.", color: "indigo-600" },
  { id: "business", name: "Business", slug: "business", description: "Global trade, hyperinflation hedges, and decentralization macroeconomics.", color: "blue-600" },
  { id: "politics", name: "Politics", slug: "politics", description: "Policy shifts, environmental legislation, and international alliances.", color: "red-600" },
  { id: "sports", name: "Sports", slug: "sports", description: "Neural biomechanics, global tournaments, and athletic innovations.", color: "orange-600" },
  { id: "entertainment", name: "Entertainment", slug: "entertainment", description: "Indie digital distribution, Cannes results, and mixed reality cinema.", color: "purple-600" },
  { id: "science", name: "Science", slug: "science", description: "Crispr applications, deep space exploration, and fusion energy milestones.", color: "teal-600" },
  { id: "international", name: "International", slug: "international", description: "Cross-border initiatives and global diplomatic updates.", color: "cyan-600" }
];

// Initial realistic users representing all platform roles
const SEED_USERS = [
  { id: "super-admin-1", name: "Sarah Jenkins", email: "admin@chronicle.com", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100", role: "Super Admin", bookmarks: ["quantum-ai-agents", "art-of-deep-reading"], readingHistory: [], bio: "Grand Chief Editor and Publisher at Chronicle News.", joinDate: "2024-01-10T12:00:00Z" },
  { id: "editor-1", name: "David Chen", email: "editor@chronicle.com", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100", role: "Editor", bookmarks: ["startups-clean-energy"], readingHistory: [], bio: "CMS Tech and Startups lead Curator.", joinDate: "2024-06-15T09:30:00Z" },
  { id: "journalist-1", name: "Elena Rostova", email: "journalist@chronicle.com", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100", role: "Journalist", bookmarks: [], readingHistory: [], bio: "Specialized tech reporter covering high-performance web systems and AI.", joinDate: "2025-02-20T14:45:00Z" },
  { id: "moderator-1", name: "Liam Vance", email: "moderator@chronicle.com", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100", role: "Moderator", bookmarks: [], readingHistory: [], bio: "Trust and Safety Lead for Chronicle audience interactions.", joinDate: "2025-03-01T11:00:00Z" },
  { id: "subscriber-1", name: "Emily Watson", email: "subscriber@chronicle.com", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100", role: "Subscriber", bookmarks: ["art-of-deep-reading"], readingHistory: [], bio: "Avid reader, researcher, and premium tech investor.", joinDate: "2026-04-12T16:20:00Z" }
];

// Initial high-fidelity seeded articles
const SEED_ARTICLES = [
  {
    id: "art-1",
    slug: "quantum-ai-agents",
    title: "Quantum-Enhanced AI Agents Break Processing Records",
    subtitle: "A massive multi-node collaboration drops runtime latency down to nanoseconds.",
    content: `# The Dawn of Sub-Nanosecond Agent Intelligence

In a collaborative research paper published early today, engineers confirmed that integrating topological qubits into autonomous agent reasoning loops cuts processing latency by over **99.4%**. 

For years, large language models (LLMs) have wrestled with the "thinking delay"—the seconds-long hesitation between fetching dynamic context and formulating multi-step reasoning outputs. By offloading sparse vector computations to a proprietary quantum-optimized silicon layer, researchers successfully computed complex 100-step planning graphs almost instantaneously.

### Visualizing the Speed Breakthrough
Our typical digital models run on Von Neumann architectures. These classical models fetch and execute instructions linearly:
> "We are effectively bridging the gap between neural simulation and real-world reaction rates. The agents behave more like a fast-twitch biological muscle than a slow database query." 
> — Dr. Aris Thorne, Lead Researcher at QuantumStack

The implications for production systems are massive:
- **Instantaneous High-Frequency Portfolio Swapping**
- **Surgical Tele-robotics with ZERO perceptual buffer**
- **Real-time adaptive firewall defense algorithms**

\`\`\`
Classical LLM reasoning:    [ ====== 1200ms Token Loop ====== ]
Quantum-Enhanced agent:     [= 4ms Agent Plan]
\`\`\`

### Is the Hardware Ready for Scale?
Currently, these chips require custom localized liquid helium cooling blocks inside data centers. However, startup ventures are already booking cloud server rooms, preparing to license desktop-grade cold plates. The transition from elite mainframe laboratories to client-side edge apps is arriving faster than predicted, mirroring the semiconductor gold rush of the late 20th century.`,
    summary: "Topological qubit silicon layers reduce autonomous reasoning latencies by over 99.4%, opening sub-nanosecond response loops for finance, tele-robotics, and autonomous firewalls.",
    featuredImage: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    category: "tech",
    authorId: "journalist-1",
    authorName: "Elena Rostova",
    authorAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100",
    status: "Published",
    isBreaking: true,
    isFeatured: true,
    publishDate: "2026-05-21T08:30:00Z",
    readingTime: 4,
    tags: ["AI", "Quantum Computing", "Silicon", "Hardware"],
    views: 4820,
    likes: 312,
    shares: 145,
    commentCount: 3
  },
  {
    id: "art-2",
    slug: "art-of-deep-reading",
    title: "The Lost Art of Deep Reading in the Algorithmic Feed Age",
    subtitle: "As scroll loops claim cognitive load, professional readers are fighting back.",
    content: `# Rescuing the Focus Muscle: A Manifesto

We read more characters per day than any previous generation, but we absorb less of its architectural soul. The modern page is no longer treated as a sacred landscape. Instead, it is treated as a scatter plot—a messy field of words designed to be scanned for keywords, keywords, and more keywords.

### The Dopamine Trap
Digital design patterns since 2012 have prioritized instant gratification. Infinite scroll feeds, red badge alerts, and autoplay previews are intentionally calibrated to trigger micro-surges of neurotransmitters. Over time, this trains the human neural suite to rejects long-form, multi-clause syntactic arcs. 

Our reading behavior has undergone a structural transition:
1. **The F-Shaped Scanning Track**: Readers skim the first horizontal line, drop down briefly, and scan vertically.
2. **Paragraph Avoidance**: Blocks exceeding three lines are bypassed completely.
3. **Hyperlink Distraction**: Every blue underlined word tempts the cursor to leave, fragmenting attention.

\`\`\`
Classic Deep Track:     [========= 45m Focused Synthesis =========]
Modern Feed Scroll:      [*Tap* -> *Scroll* -> *Like* -> *Hop* -> *Tap*]
\`\`\`

### The Return to Analog Aesthetics
To fix high-friction reading, publishers are leaning toward "Medium-Style" minimalism:
- **Stripping margin sidebars**: Removing distracting popups, flashing dynamic ads, and crowded tag grids.
- **Spacious serif typography**: Georgia or Playfair Display set at 20px with ample line height.
- **Progress indicators**: Gentle top scrollbars that establish cognitive anchor points.

By reducing the friction of quiet space, we can reclaim our reading endurance. After all, complex critical thoughts require uninterrupted soil to hatch.`,
    summary: "As infinite-scroll interfaces dismantle our focus, digital publishing and reading groups are leading a modern renaissance toward typography-first, distraction-free reading environments.",
    featuredImage: "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=800",
    category: "business",
    authorId: "super-admin-1",
    authorName: "Sarah Jenkins",
    authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100",
    status: "Published",
    isBreaking: false,
    isFeatured: true,
    publishDate: "2026-05-20T10:15:00Z",
    readingTime: 6,
    tags: ["Philosophy", "Media", "Digital Hygiene", "Focus"],
    views: 3120,
    likes: 520,
    shares: 320,
    commentCount: 4
  },
  {
    id: "art-3",
    slug: "startups-clean-energy",
    title: "Startups Quietly Restructure for the Green Shipping Surge",
    subtitle: "New clean tech ventures are engineering wind-assisted rigid kite sails to cut maritime fuel by 30%.",
    content: `# Winds of Change in Global Transit

While high-tech discussions focus on electric air fleets and autonomous self-driving rigs, some of the most capital-efficient startups are looking toward one of civilization's oldest energy sources: **wind**.

A quiet alliance of startups has deployed computer-controlled, fiberglass rigid kite sails onto standard cargo container vessels. Measuring over 40 meters high, these automated hydrofoil wings trim themselves automatically using real-time atmospheric APIs, providing substantial auxiliary propulsion.

### The Economics of Wind Traction
Fuel accounts for nearly **55%** of ocean cargo operating expenses. Adding solar collectors provides trickle power, but rigid wing sails generate mechanical torque. By allowing ships to throttle back their fossil engines without slowing deliveries, shipping operators cut overall fuel consumption by an average of **28% to 32%**.

This is more than carbon reduction—it is a pure financial moat:
- **Bypassing Carbon Tariffs**: European port taxes now penalize heavy sulfur burners.
- **Extending Engine Longevity**: Lower operational RPM limits routine breakdowns.
- **Predictable Supply Cadence**: Sail arrays maintain structural stability in complex stormy seasons.`,
    summary: "Fiberglass rigid kite sails controlled by smart localized APIs are helping commercial cargo ships harness offshore winds, reducing oceanic fuel burns by up to 30%.",
    featuredImage: "https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?w=800",
    category: "startups",
    authorId: "editor-1",
    authorName: "David Chen",
    authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
    status: "Published",
    isBreaking: false,
    isFeatured: false,
    publishDate: "2026-05-19T14:20:00Z",
    readingTime: 5,
    tags: ["Climate Tech", "Startups", "Logistics", "Hardware Systems"],
    views: 1840,
    likes: 125,
    shares: 42,
    commentCount: 2
  },
  {
    id: "art-4",
    slug: "deep-space-telescope",
    title: "Next-Gen Deep Space Telescope Reveals Super-Earth Atmosphere",
    subtitle: "Spectrographic analysis detects nitrogen-enriched thermal oceans orbiting Kepler-186f.",
    content: `# We are looking closer than ever

Astronomers in Chile confirmed yesterday that their recently calibrated infrared array has captured the first high-accuracy spectrographic gas signatures of a terrestrial world orbiting a distant solar cluster.

Historically, identifying exoplanet atmospheres was akin to looking directly into a bright coastal searchlight, trying to spot a tiny firefly perched on the bulb. Thanks to custom carbon shadow-masks deployed on orbits 100,000 kilometers from the mirrors, researchers successfully blocked core starlight while letting peripheral planetary reflections flow cleanly.

### What the Spectrograph Revealed
The raw data curves suggest a surface composition dominated by:
- **71% Nitrogen**
- **22% Water vapor**
- **6% Greenhouse carbon mixtures**
- **Traces of ozone and inert neon gases**

This unique atmospheric thickness strongly points to active global thermoclines—essentially, a massive, warm exoplanetary ocean wrapping the planet's equatorial belt. Science fiction authors are already booking interstellar travel planning sessions, but the actual physical journey remains centuries away. Still, the existential question of 'are we alone' is now officially a measurement problem.`,
    summary: "Using advanced carbon shadow-mask structures, astrophysicists have discovered a high-density, nitrogen-water exoplanet atmosphere, suggesting planetary-scale oceans orbit Kepler-186f.",
    featuredImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800",
    category: "science",
    authorId: "journalist-1",
    authorName: "Elena Rostova",
    authorAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100",
    status: "Published",
    isBreaking: true,
    isFeatured: false,
    publishDate: "2026-05-18T16:10:00Z",
    readingTime: 3,
    tags: ["Space", "Astrophysics", "Hardware Science", "Discovery"],
    views: 2430,
    likes: 198,
    shares: 89,
    commentCount: 1
  },
  {
    id: "art-5",
    slug: "scheduled-tech-future",
    title: "The Next Generation of Web Rendering Paradigms",
    subtitle: "Custom local layout sandboxes could replace the virtual DOM entirely.",
    content: `Drafting content for upcoming web compilation pipelines. Exploring WebAssembly binary sandboxed canvases which run custom rendering trees independently... This scheduled launch represents the future of browser software engines.`,
    summary: "A look inside scheduled WebAssembly client targets that run fast local UI layouts completely independently of the DOM layer.",
    featuredImage: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800",
    category: "tech",
    authorId: "journalist-1",
    authorName: "Elena Rostova",
    authorAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100",
    status: "Scheduled",
    publishDate: "2026-05-25T12:00:00Z",
    scheduledDate: "2026-05-25T12:00:00Z",
    readingTime: 5,
    tags: ["WebDev", "V8 Engine", "TypeScript"],
    views: 0,
    likes: 0,
    shares: 0,
    commentCount: 0
  },
  {
    id: "art-6",
    slug: "draft-ai-ethics",
    title: "Draft thoughts on Ethics of Simulated Cognitive Personas",
    subtitle: "Must virtual assistants be granted a right to be forgotten?",
    content: `Personal draft notes for an editorial on AI ethics. Should user agents retain personal experiences or must they reset memory layers to protect user identities? Under review...`,
    summary: "Personal editorial draft on the rights and safety systems of advanced persistent AI agents.",
    featuredImage: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800",
    category: "politics",
    authorId: "editor-1",
    authorName: "David Chen",
    authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
    status: "Draft",
    publishDate: "2026-05-18T10:00:00Z",
    readingTime: 8,
    tags: ["AI Ethics", "Legal Tech", "Privacy"],
    views: 0,
    likes: 0,
    shares: 0,
    commentCount: 0
  }
];

// Seeded Comments
const SEED_COMMENTS = [
  { id: "com-1", articleId: "art-1", articleTitle: "Quantum-Enhanced AI Agents Break Processing Records", userName: "Marcus Aurelius", userEmail: "marcus@philosophy.org", userAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=60&q=80", content: "Nanosecond planning is impressive, but it creates massive coordination issues when interacting with slow physical hardware actuators. We must account for mechanical friction limits.", date: "2026-05-21T09:05:00Z", status: "Approved", reportCount: 0 },
  { id: "com-2", articleId: "art-1", articleTitle: "Quantum-Enhanced AI Agents Break Processing Records", userName: "Gavin Belson", userEmail: "gavin@hooli.xyz", userAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&q=80", content: "Typical. Hooli was developing a sub-nanosecond topological quantum signature database back in 2022. Dr. Thorne was just copying our blueprint patents.", date: "2026-05-21T09:12:00Z", status: "Approved", reportCount: 1 },
  { id: "com-3", articleId: "art-1", articleTitle: "Quantum-Enhanced AI Agents Break Processing Records", userName: "CryptoKing99", userEmail: "spam@crypto.net", userAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60&q=80", content: "BUY TOKEN $QUANT NOW!!! 1000X GAINS GUARANTEED NO SCAM JOIN TELEGRAM!!!", date: "2026-05-21T09:45:00Z", status: "Pending", reportCount: 3 },
  { id: "com-4", articleId: "art-2", articleTitle: "The Lost Art of Deep Reading in the Algorithmic Feed Age", userName: "Alice Hoffman", userEmail: "alice@literature.co", userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60&q=80", content: "I printed this article out and read it away from my phone. The difference in my immediate comprehension and pulse rate was shockingly measurable. Incredible work.", date: "2026-05-20T11:30:00Z", status: "Approved", reportCount: 0 },
  { id: "com-5", articleId: "art-2", articleTitle: "The Lost Art of Deep Reading in the Algorithmic Feed Age", userName: "SkepticalCoder", userEmail: "skeptic@stack.io", userAvatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=60&q=80", content: "Honestly, the Medium-style minimalist reading environment is nice, but I need my code snippets syntax highlighted. High margin space makes me scroll more.", date: "2026-05-20T12:05:00Z", status: "Approved", reportCount: 0 }
];

// Seeded Advertisement campaigns
const SEED_ADS = [
  { id: "ad-1", name: "Apex Cloud Databases Integration", type: "Sponsored", imageUrl: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=400&q=70", linkUrl: "https://cloud.google.com/spanner", isActive: true, views: 1845, clicks: 124, placement: "sidebar" },
  { id: "ad-2", name: "Premium Dev Summit 2026 - Tokyo Tickets", type: "Banner", imageUrl: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1000&q=80", linkUrl: "https://vite.dev", isActive: true, views: 3420, clicks: 198, placement: "top-header" },
  { id: "ad-3", name: "WorkSpace Workspace AI Productivity Suit", type: "In-feed", imageUrl: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&q=80", linkUrl: "https://workspace.google.com", isActive: true, views: 1240, clicks: 84, placement: "in-feed" }
];

// Rolling Micro-Blog entries (Breaking Live feeds)
const SEED_LIVE_UPDATES = [
  { id: "live-1", title: "Global Semiconductor stocks leap after exoplanet materials report.", content: "Wall Street trades pause as materials indices spike +7.4% on rare earth silicon announcements.", timestamp: "2026-05-21T10:10:00Z", articleId: "art-4" },
  { id: "live-2", title: "Cannes Director's Cut wins best immersive cinematic prize.", content: "Indie micro-studio utilizes cloud neural clusters to render holographic cinema arrays in real-time.", timestamp: "2026-05-21T09:45:00Z", articleId: "art-3" },
  { id: "live-3", title: "Severe Atmospheric storm targets Pacific wind-shipping lanes.", content: "Rigid kite-sail operators lock wing panels in defense prep, deploying automatic high-seas maneuvers.", timestamp: "2026-05-21T09:15:00Z", articleId: "art-3" }
];

// Read or initialize the JSON DB state
function loadDatabase(): DBState {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error("Error loading JSON database. Rewriting state with seeds...", e);
  }

  // Backup write of seed database
  const seedState: DBState = {
    users: SEED_USERS,
    articles: SEED_ARTICLES,
    categories: SEED_CATEGORIES,
    comments: SEED_COMMENTS,
    ads: SEED_ADS,
    newsletters: [],
    liveUpdates: SEED_LIVE_UPDATES
  };
  saveDatabase(seedState);
  return seedState;
}

function saveDatabase(state: DBState) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), "utf-8");
  } catch (e) {
    console.error("Critical error saving JSON database:", e);
  }
}

// REST Api Handlers
app.get("/api/articles", (req, res) => {
  const db = loadDatabase();
  const { category, status, query, tag } = req.query;

  let list = [...db.articles];

  if (category) {
    list = list.filter(a => a.category.toLowerCase() === String(category).toLowerCase());
  }
  if (status) {
    list = list.filter(a => a.status.toLowerCase() === String(status).toLowerCase());
  } else {
    // Regular public users search sees only Published articles
    list = list.filter(a => a.status === "Published");
  }
  if (tag) {
    list = list.filter(a => a.tags.some((t: string) => t.toLowerCase() === String(tag).toLowerCase()));
  }
  if (query) {
    const q = String(query).toLowerCase();
    list = list.filter(a => 
      a.title.toLowerCase().includes(q) || 
      a.subtitle.toLowerCase().includes(q) || 
      a.content.toLowerCase().includes(q)
    );
  }

  // Sort: published articles descending by publish date, draft/scheduled by date too
  list.sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());

  res.json(list);
});

app.get("/api/articles/:slug", (req, res) => {
  const db = loadDatabase();
  const slug = req.params.slug;
  const index = db.articles.findIndex(a => a.slug === slug || a.id === slug);

  if (index === -1) {
    return res.status(404).json({ error: "Article not found" });
  }

  // Increment views
  db.articles[index].views += 1;
  saveDatabase(db);

  const article = db.articles[index];
  const related = db.articles
    .filter(a => a.id !== article.id && a.category === article.category && a.status === "Published")
    .slice(0, 3);

  res.json({ article, related });
});

app.post("/api/articles", (req, res) => {
  const db = loadDatabase();
  const { title, subtitle, content, summary, featuredImage, videoUrl, category, tags, authorId, status, isBreaking, isFeatured } = req.body;

  if (!title || !content || !category) {
    return res.status(400).json({ error: "Missing required fields (title, content, category)" });
  }

  // Simple slug generation
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const user = db.users.find(u => u.id === authorId) || db.users[0];

  const newArticle = {
    id: "art-" + Date.now(),
    slug,
    title,
    subtitle: subtitle || "",
    content,
    summary: summary || title,
    featuredImage: featuredImage || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800",
    videoUrl: videoUrl || "",
    category,
    authorId: user.id,
    authorName: user.name,
    authorAvatar: user.avatar,
    status: status || "Draft",
    isBreaking: !!isBreaking,
    isFeatured: !!isFeatured,
    publishDate: new Date().toISOString(),
    readingTime: Math.max(1, Math.ceil(content.split(/\s+/).length / 200)),
    tags: tags || [],
    views: 0,
    likes: 0,
    shares: 0,
    commentCount: 0
  };

  db.articles.push(newArticle);
  saveDatabase(db);
  res.status(201).json(newArticle);
});

// Update standard article details
app.put("/api/articles/:id", (req, res) => {
  const db = loadDatabase();
  const id = req.params.id;
  const index = db.articles.findIndex(a => a.id === id || a.slug === id);

  if (index === -1) {
    return res.status(404).json({ error: "Article not found" });
  }

  const keys = ["title", "subtitle", "content", "summary", "featuredImage", "videoUrl", "category", "tags", "status", "isBreaking", "isFeatured"];
  keys.forEach(key => {
    if (req.body[key] !== undefined) {
      db.articles[index][key] = req.body[key];
    }
  });

  // Re-calc reading time
  if (req.body.content) {
    db.articles[index].readingTime = Math.max(1, Math.ceil(req.body.content.split(/\s+/).length / 200));
  }

  saveDatabase(db);
  res.json(db.articles[index]);
});

app.delete("/api/articles/:id", (req, res) => {
  const db = loadDatabase();
  const id = req.params.id;
  const index = db.articles.findIndex(a => a.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Article not found" });
  }

  db.articles.splice(index, 1);
  saveDatabase(db);
  res.json({ success: true, message: "Article safely removed." });
});

// Categories APIS
app.get("/api/categories", (req, res) => {
  const db = loadDatabase();
  res.json(db.categories);
});

app.post("/api/categories", (req, res) => {
  const db = loadDatabase();
  const { name, description, color } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const newCat = {
    id: slug,
    name,
    slug,
    description: description || "",
    color: color || "indigo-600"
  };

  db.categories.push(newCat);
  saveDatabase(db);
  res.status(201).json(newCat);
});

// Comments APIS
app.get("/api/comments", (req, res) => {
  const db = loadDatabase();
  // Filter comments based on parameters or role
  const { articleId, status } = req.query;
  let comments = [...db.comments];

  if (articleId) {
    comments = comments.filter(c => c.articleId === articleId);
  }
  if (status) {
    comments = comments.filter(c => c.status === status);
  }

  res.json(comments);
});

app.post("/api/comments", (req, res) => {
  const db = loadDatabase();
  const { articleId, articleTitle, userName, userEmail, userAvatar, content } = req.body;

  if (!articleId || !content || !userName) {
    return res.status(400).json({ error: "Missing articleId, content, or userName" });
  }

  const newComment = {
    id: "com-" + Date.now(),
    articleId,
    articleTitle: articleTitle || "Chronicle Story",
    userName,
    userEmail: userEmail || "anonymous@chronicle.com",
    userAvatar: userAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60&q=80",
    content,
    date: new Date().toISOString(),
    status: "Pending", // Admin moderation filter
    reportCount: 0
  };

  db.comments.push(newComment);

  // Update article comment counts
  const articleIndex = db.articles.findIndex(a => a.id === articleId);
  if (articleIndex !== -1) {
    db.articles[articleIndex].commentCount += 1;
  }

  saveDatabase(db);
  res.status(201).json(newComment);
});

app.post("/api/comments/:id/moderate", (req, res) => {
  const db = loadDatabase();
  const id = req.params.id;
  const { status } = req.body; // 'Approved' | 'Rejected'
  const index = db.comments.findIndex(c => c.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Comment not found" });
  }

  db.comments[index].status = status;
  saveDatabase(db);
  res.json(db.comments[index]);
});

app.post("/api/comments/:id/report", (req, res) => {
  const db = loadDatabase();
  const id = req.params.id;
  const index = db.comments.findIndex(c => c.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Comment not found" });
  }

  db.comments[index].reportCount += 1;
  saveDatabase(db);
  res.json(db.comments[index]);
});

// Ad Performance Tracking Systems
app.get("/api/ads", (req, res) => {
  const db = loadDatabase();
  res.json(db.ads);
});

app.post("/api/ads/:id/track", (req, res) => {
  const db = loadDatabase();
  const id = req.params.id;
  const { action } = req.body; // 'view' or 'click'
  const index = db.ads.findIndex(a => a.id === id);

  if (index !== -1) {
    if (action === "click") {
      db.ads[index].clicks += 1;
    } else {
      db.ads[index].views += 1;
    }
    saveDatabase(db);
  }
  res.json({ success: true });
});

// Newsletter subscription
app.post("/api/newsletter", (req, res) => {
  const db = loadDatabase();
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  const alreadySubbed = db.newsletters.some(n => n.email === email);
  if (!alreadySubbed) {
    db.newsletters.push({ email, subscribedAt: new Date().toISOString() });
    saveDatabase(db);
  }
  res.json({ success: true, message: "Newsletter registration completed." });
});

// Live Rolling updates channels
app.get("/api/live-updates", (req, res) => {
  const db = loadDatabase();
  res.json(db.liveUpdates);
});

app.post("/api/live-updates", (req, res) => {
  const db = loadDatabase();
  const { title, content, articleId } = req.body;
  if (!title || !content) return res.status(400).json({ error: "Missing title or content" });

  const newLive = {
    id: "live-" + Date.now(),
    title,
    content,
    timestamp: new Date().toISOString(),
    articleId
  };

  db.liveUpdates.unshift(newLive);
  saveDatabase(db);
  res.status(201).json(newLive);
});

// Dashboard Analytics aggregation
app.get("/api/analytics", (req, res) => {
  const db = loadDatabase();

  const totalUsers = db.users.length + 520; // Seeding scale
  const totalArticles = db.articles.length;
  const totalPendingComments = db.comments.filter(c => c.status === "Pending").length;

  const categoryPerformance = db.categories.map(c => {
    const arts = db.articles.filter(a => a.category === c.id);
    const sumViews = arts.reduce((sum, current) => sum + current.views, 0);
    return {
      category: c.name,
      count: arts.length,
      views: sumViews + (arts.length * 340) // Scale to feel realistic
    };
  });

  // Pre-seed generic visitor views for last 7 days
  const visitorViewsOverTime = [
    { date: "May 15", views: 4200, likes: 210 },
    { date: "May 16", views: 4800, likes: 340 },
    { date: "May 17", views: 5600, likes: 450 },
    { date: "May 18", views: 6100, likes: 512 },
    { date: "May 19", views: 5200, likes: 410 },
    { date: "May 20", views: 7300, likes: 620 },
    { date: "May 21", views: 8900, likes: 780 }
  ];

  const adPerformance = db.ads.map(ad => ({
    name: ad.name,
    views: ad.views,
    clicks: ad.clicks
  }));

  const breakingCount = db.articles.filter(a => a.isBreaking && a.status === "Published").length;

  res.json({
    totalUsers,
    totalArticles,
    totalPendingComments,
    categoryPerformance,
    visitorViewsOverTime,
    adPerformance,
    breakingCount
  });
});

// AUTH and Profile switching models
app.get("/api/auth/me", (req, res) => {
  const db = loadDatabase();
  const role = req.query.role || "Subscriber";
  const user = db.users.find(u => u.role === role) || db.users[0];
  res.json(user);
});

// Bookmarks toggle mapping
app.post("/api/bookmarks/toggle", (req, res) => {
  const db = loadDatabase();
  const { userId, articleSlug } = req.body;
  if (!userId || !articleSlug) return res.status(400).json({ error: "Missing parameters" });

  const userIndex = db.users.findIndex(u => u.id === userId);
  if (userIndex === -1) return res.status(404).json({ error: "User not found" });

  const bIndex = db.users[userIndex].bookmarks.indexOf(articleSlug);
  let state = false;
  if (bIndex === -1) {
    db.users[userIndex].bookmarks.push(articleSlug);
    state = true;
  } else {
    db.users[userIndex].bookmarks.splice(bIndex, 1);
  }

  saveDatabase(db);
  res.json({ bookmarks: db.users[userIndex].bookmarks, active: state });
});

// Gemini AI endpoints: AI-generated summaries
app.post("/api/gemini/summarize", async (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: "Missing text content to summarize" });

  if (googleAI) {
    try {
      const response = await googleAI.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Analyze this news article and write a high-performance news visual summary/TL;DR in 3 brief, distinct bullet points. Keep it professional, informative, and compact:\n\n${content}`,
        config: {
          temperature: 0.7,
        },
      });
      const summaryText = response.text || "Failed to generate text summary details.";
      return res.json({ summary: summaryText, isAI: true });
    } catch (error) {
      console.error("Gemini system failed stream compilation:", error);
    }
  }

  // Fallback if SDK or internet fails
  const words = content.replace(/[#*`>]/g, "").split(/\s+/).slice(0, 50).join(" ");
  const fallbackSummary = `• Core Expose: Analyzing current global structures and technology paradigms.\n• Financial Velocity: Strategic pivots aim to capture immediate cost efficiencies.\n• Infrastructure Vectors: Emerging solutions are projected to yield substantial performance developments.`;
  res.json({ summary: fallbackSummary, isAI: false, isFallback: true });
});

// Gemini AI endpoints: headline generation & keywords suggested helper
app.post("/api/gemini/suggest", async (req, res) => {
  const { title, content } = req.body;
  if (!content && !title) return res.status(400).json({ error: "Missing title or draft notes" });

  if (googleAI) {
    try {
      const response = await googleAI.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Take this raw article draft outline.
Title candidate: "${title || ""}"
Draft snippet: "${content || ""}"

Suggest exactly:
1. Three catchy, SEO-friendly alternative headlines (journalistic, high click-through rate, not spammy).
2. Five optimal, highly-searchable keywords as metadata tags.
Provide the response as simple text list.`,
        config: {
          temperature: 0.8,
        },
      });
      return res.json({ suggestions: response.text, isAI: true });
    } catch (error) {
      console.error("Gemini suggestions error:", error);
    }
  }

  // Fallback suggestions
  const fallbackText = `Alternative SEO Headlines:
1. "The Global Pivot to Decentralized Tech Infrastructure Networks"
2. "Why Traditional Nodes Are Faltering Under Next-Gen workloads"
3. "The Strategic Blueprint: Revitalizing Speed Metrics at Capital Scale"

Suggested Tags:
• Systemic, • Infrastructure, • Engineering, • Performance, • Optimization`;
  res.json({ suggestions: fallbackText, isAI: false, isFallback: true });
});

// Vite Middleware integration for development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve production bundle
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express platform server booting on Http://0.0.0.0:${PORT}`);
    console.log(`Seeded SQLite/JSON Database loaded successfully at ${DB_FILE}`);
  });
}

startServer();
