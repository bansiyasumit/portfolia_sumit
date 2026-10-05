import type { Metadata } from "next";
import { notFound } from "next/navigation";
import exhibitsData from "@/data/exhibits.json";
import { ProjectFilm, type Project } from "@/components/project/ProjectFilm";

const projects = exhibitsData.exhibits as unknown as Project[];

export const dynamicParams = false;

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const project = projects.find((p) => p.id === slug);
  if (!project) return {};
  return {
    title: project.title,
    description: `${project.logline} ${project.description}`.slice(0, 300),
    alternates: { canonical: `/work/${project.id}` },
    openGraph: { title: `${project.title} | Sumit Bansiya`, description: project.logline },
  };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const index = projects.findIndex((p) => p.id === slug);
  if (index === -1) notFound();

  return (
    <ProjectFilm
      project={projects[index]}
      index={index}
      total={projects.length}
      next={projects[(index + 1) % projects.length]}
    />
  );
}
