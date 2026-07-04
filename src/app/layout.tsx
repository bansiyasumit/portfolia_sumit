import type { Metadata } from "next";
import { Inter, Orbitron, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/Navigation";
import { NeonCursor } from "@/components/NeonCursor";
import { FloatingIcons } from "@/components/FloatingIcons";
import { ScrollRail } from "@/components/ScrollRail";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const orbitron = Orbitron({ subsets: ["latin"], variable: "--font-orbitron" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

const SITE_URL = "https://portfolia-sumit.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Sumit Bansiya | AI Researcher — Computer Vision & Generative AI",
    template: "%s | Sumit Bansiya",
  },
  description:
    "Portfolio of Sumit Bansiya: M.Tech AI researcher at NIT Jalandhar and IndiaAI Fellow (MeitY, Government of India), building GAN-based medical imaging systems, RAG pipelines, and agentic AI tooling.",
  keywords: [
    "Sumit Bansiya",
    "Sumit Bansiya AI",
    "IndiaAI Fellow",
    "AI Researcher",
    "Computer Vision",
    "Generative AI",
    "GAN",
    "Seg-CycleGAN",
    "NIT Jalandhar",
    "Medical Imaging",
  ],
  authors: [{ name: "Sumit Bansiya", url: SITE_URL }],
  creator: "Sumit Bansiya",
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: "Sumit Bansiya | AI Researcher — Computer Vision & Generative AI",
    description:
      "M.Tech AI researcher and IndiaAI Fellow (MeitY, Government of India) building GAN-based medical imaging systems, RAG pipelines, and agentic AI tooling.",
    siteName: "Sumit Bansiya",
    images: ["/sumit_profile.png"],
  },
  twitter: {
    card: "summary",
    title: "Sumit Bansiya | AI Researcher",
    description:
      "M.Tech AI researcher and IndiaAI Fellow building GAN-based medical imaging systems and agentic AI tooling.",
    images: ["/sumit_profile.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Sumit Bansiya",
  url: SITE_URL,
  image: `${SITE_URL}/sumit_profile.png`,
  jobTitle: "AI Researcher",
  description:
    "AI Researcher and M.Tech Scholar specializing in Computer Vision and Generative AI. IndiaAI Fellow (MeitY, Government of India).",
  affiliation: {
    "@type": "CollegeOrUniversity",
    name: "NIT Jalandhar",
  },
  alumniOf: [
    { "@type": "CollegeOrUniversity", name: "NIT Jalandhar" },
    { "@type": "CollegeOrUniversity", name: "MITS Gwalior" },
  ],
  sameAs: [
    "https://www.linkedin.com/in/sumit-bansiya-patidar-305869213/",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${inter.variable} ${orbitron.variable} ${jetbrainsMono.variable} antialiased bg-[#020202] text-white custom-scrollbar`}
      >
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
        <NeonCursor />
        <FloatingIcons />
        <Navigation />
        <ScrollRail />
        <main className="relative z-10 w-full overflow-hidden">
          {children}
        </main>
      </body>
    </html>
  );
}
