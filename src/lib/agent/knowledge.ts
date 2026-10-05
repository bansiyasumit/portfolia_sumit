import profileData from "@/data/profile.json";
import exhibitsData from "@/data/exhibits.json";
import libraryData from "@/data/library.json";
import chatData from "@/data/chatResponses.json";

/**
 * Everything the agent is allowed to know. It answers only from these records,
 * so the portfolio data files stay the single source of truth.
 */

type Chunk = { id: string; source: string; text: string; personal?: boolean };

const { profile, achievements, about } = profileData;

const projects = exhibitsData.exhibits.map((e) => ({
  id: e.id,
  title: e.title,
  institution: "institution" in e ? e.institution : undefined,
  logline: e.logline,
  description: e.description,
  pipeline: e.pipeline,
  metrics: e.metrics,
  tags: e.tags,
  tech_stack: "tech_stack" in e ? e.tech_stack : undefined,
  page: `/work/${e.id}`,
}));

const PERSONAL_KEYWORDS = new Set(["family", "friends", "journey", "hobbies", "/lore"]);

const chunks: Chunk[] = [
  { id: "bio", source: "profile", text: `${profile.name} — ${profile.title}. ${profile.bio} Location: ${profile.location}.` },
  { id: "summary", source: "profile", text: about.summary },
  ...achievements.map((a, i) => ({ id: `achievement-${i}`, source: "achievements", text: `${a.title} (${a.org}): ${a.description}` })),
  ...about.education.map((e, i) => ({ id: `education-${i}`, source: "education", text: `${e.degree}, ${e.institution} (${e.period}). ${e.detail}` })),
  ...about.experience.map((e, i) => ({ id: `experience-${i}`, source: "experience", text: `${e.role} at ${e.org} (${e.period}). ${e.description} Impact: ${e.impact}` })),
  ...Object.entries(about.skills).map(([k, v]) => ({ id: `skills-${k}`, source: "skills", text: `${k}: ${v.join(", ")}` })),
  ...projects.map((p) => ({
    id: `project-${p.id}`,
    source: "projects",
    text: `${p.title}. ${p.description} Steps: ${p.pipeline.map((s) => `${s.label}: ${s.text}`).join("; ")}. Metrics: ${Object.entries(p.metrics).map(([k, v]) => `${k} ${v}`).join(", ")}. Tags: ${p.tags.join(", ")}.`,
  })),
  ...libraryData.library.map((c, i) => ({ id: `cert-${i}`, source: "certifications", text: `${c.title} — ${c.issuer} (${c.year})` })),
  ...chatData.responses
    .filter((r) => !r.keywords.some((k) => k.startsWith("/")) || r.keywords.includes("/lore"))
    .map((r, i) => ({
      id: `note-${i}`,
      source: "notes",
      personal: r.keywords.some((k) => PERSONAL_KEYWORDS.has(k)),
      text: `[${r.keywords.join(", ")}] ${r.response.replace(/^\[[A-Z .]+\]\s*/, "")}`,
    })),
];

const tokenize = (s: string): string[] => s.toLowerCase().match(/[a-z0-9+#.-]{2,}/g) ?? [];

/** Small BM25-style keyword search over the knowledge chunks. */
export const searchKnowledge = (query: string, k = 4) => {
  const q = tokenize(query);
  const docs = chunks.map((c) => ({ c, toks: tokenize(c.text) }));
  const avg = docs.reduce((a, d) => a + d.toks.length, 0) / docs.length;
  const df = (t: string) => docs.filter((d) => d.toks.includes(t)).length;

  return docs
    .map(({ c, toks }) => {
      let score = 0;
      for (const t of q) {
        const tf = toks.filter((x) => x === t || x.startsWith(t)).length;
        if (!tf) continue;
        const idf = Math.log(1 + (docs.length - df(t) + 0.5) / (df(t) + 0.5));
        score += idf * ((tf * 2.2) / (tf + 1.2 * (0.25 + 0.75 * (toks.length / avg))));
      }
      return { ...c, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map(({ id, source, text, personal }) => ({ id, source, text, personal: !!personal }));
};

export const getProfile = () => ({
  name: profile.name,
  headline: profile.title,
  location: profile.location,
  bio: profile.bio,
  summary: about.summary,
  achievements,
  education: about.education,
  experience: about.experience,
  skills: about.skills,
});

export const listProjects = () => projects.map(({ id, title, logline, page }) => ({ id, title, logline, page }));

export const getProject = (id: string) => {
  const needle = id.toLowerCase();
  return (
    projects.find((p) => p.id === needle) ??
    projects.find((p) => p.id.includes(needle) || p.title.toLowerCase().includes(needle)) ??
    null
  );
};

export const listCertifications = () => libraryData.library;

export const getContact = () => ({
  email: profile.contact.email,
  linkedin: profile.contact.linkedin,
  resume: profile.resumeUrl,
});

/** Places the agent may send the visitor to. */
export const NAV_TARGETS: Record<string, string> = {
  home: "/#home",
  origin: "/#origin",
  about: "/#origin",
  work: "/#work",
  projects: "/#work",
  path: "/#path",
  experience: "/#path",
  certifications: "/#path",
  agent: "/#agent",
  contact: "/#credits",
  credits: "/#credits",
  resume: profile.resumeUrl,
  ...Object.fromEntries(projects.map((p) => [p.id, p.page])),
};
