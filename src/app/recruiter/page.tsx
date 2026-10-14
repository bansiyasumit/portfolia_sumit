import type { Metadata } from "next";
import Link from "next/link";
import profileData from "@/data/profile.json";
import exhibitsData from "@/data/exhibits.json";
import libraryData from "@/data/library.json";
import { PrintButton } from "./PrintButton";

export const metadata: Metadata = {
  title: "Recruiter mode — one-page summary",
  description: "Sumit Bansiya at a glance: AI researcher in computer vision and generative AI, IndiaAI Fellow, M.Tech AI at NIT Jalandhar.",
  alternates: { canonical: "/recruiter" },
};

type Project = {
  id: string;
  title: string;
  institution?: string;
  logline: string;
  metrics: Record<string, string>;
  tags: string[];
};

const H = ({ children }: { children: React.ReactNode }) => (
  <h2 className="font-mono text-[11px] tracking-[0.25em] uppercase text-[#b34a1f] border-b border-[#16130f]/15 pb-2 mb-4 mt-10 print:mt-6">
    {children}
  </h2>
);

/**
 * Recruiter mode: the whole portfolio as a fast, light, printable one-pager —
 * no intro, no 3D, no sound. Everything comes from the same data files as the film.
 */
export default function RecruiterPage() {
  const { profile, achievements, about } = profileData;
  const projects = exhibitsData.exhibits as unknown as Project[];

  return (
    <div className="min-h-screen bg-[#f4f1ea] text-[#16130f] pt-24 pb-24 print:pt-0 print:pb-0 print:bg-white">
      <article className="max-w-[860px] mx-auto px-5 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-10 print:hidden">
          <Link href="/" className="font-mono text-xs tracking-[0.2em] uppercase text-[#16130f]/60 hover:text-[#b34a1f]">
            ▶ Watch the cinematic version
          </Link>
          <PrintButton />
        </div>

        <header>
          <h1 className="font-display uppercase text-5xl md:text-7xl leading-[0.9]">{profile.name}</h1>
          <p className="font-serif italic text-xl md:text-2xl mt-2 text-[#16130f]/80">
            AI Researcher — Computer Vision &amp; Generative AI
          </p>
          <p className="mt-4 text-sm text-[#16130f]/70 flex flex-wrap gap-x-4 gap-y-1">
            <span>{profile.location}</span>
            <a className="underline underline-offset-2" href={`mailto:${profile.contact.email}`}>{profile.contact.email}</a>
            <a className="underline underline-offset-2" href={profile.contact.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
            <a className="underline underline-offset-2 print:hidden" href={profile.resumeUrl} download>Download résumé (PDF)</a>
          </p>
        </header>

        <H>Summary</H>
        <p className="leading-relaxed">{about.summary}</p>
        {achievements.map((a) => (
          <p key={a.title} className="mt-4 border-l-4 border-[#b34a1f] pl-4">
            <strong>{a.title}</strong> — {a.org}. <span className="text-[#16130f]/70">{a.description}</span>
          </p>
        ))}

        <H>Experience</H>
        <div className="flex flex-col gap-5">
          {about.experience.map((e) => (
            <div key={e.role}>
              <div className="flex flex-wrap justify-between gap-2">
                <strong>{e.role} · {e.org}</strong>
                <span className="font-mono text-xs text-[#16130f]/60">{e.period}</span>
              </div>
              <p className="text-sm mt-1 text-[#16130f]/80">{e.description} {e.impact}</p>
            </div>
          ))}
        </div>

        <H>Selected projects</H>
        <div className="flex flex-col gap-6">
          {projects.map((p) => (
            <div key={p.id} className="break-inside-avoid">
              <div className="flex flex-wrap justify-between gap-2">
                <strong>{p.title}</strong>
                {p.institution && <span className="font-mono text-xs text-[#16130f]/60">{p.institution}</span>}
              </div>
              <p className="text-sm mt-1 text-[#16130f]/80">{p.logline}</p>
              <p className="text-sm mt-1">
                {Object.entries(p.metrics)
                  .map(([k, v]) => `${k}: ${v}`)
                  .join(" · ")}
              </p>
              <p className="text-xs mt-1 font-mono text-[#16130f]/60">
                {p.tags.join(" · ")}
                <Link href={`/work/${p.id}`} className="ml-3 underline underline-offset-2 text-[#b34a1f] print:hidden">
                  Case study →
                </Link>
              </p>
            </div>
          ))}
        </div>

        <H>Education</H>
        <div className="flex flex-col gap-3">
          {about.education.map((e) => (
            <div key={e.degree} className="flex flex-wrap justify-between gap-2">
              <span>
                <strong>{e.degree}</strong>, {e.institution} — <span className="text-[#16130f]/70">{e.detail}</span>
              </span>
              <span className="font-mono text-xs text-[#16130f]/60">{e.period}</span>
            </div>
          ))}
        </div>

        <H>Skills</H>
        <dl className="grid sm:grid-cols-[180px_1fr] gap-x-6 gap-y-2 text-sm">
          {Object.entries(about.skills).map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="font-semibold">{k}</dt>
              <dd className="text-[#16130f]/80">{v.join(", ")}</dd>
            </div>
          ))}
        </dl>

        <H>Certifications</H>
        <ul className="text-sm grid sm:grid-cols-2 gap-x-6 gap-y-1">
          {libraryData.library.map((c) => (
            <li key={c.title}>
              {c.title} — <span className="text-[#16130f]/70">{c.issuer}, {c.year}</span>
            </li>
          ))}
        </ul>
      </article>
    </div>
  );
}
