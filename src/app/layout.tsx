import type { Metadata } from "next";
import { Inter, Anton, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/Navigation";
import { FilmCursor } from "@/components/FilmCursor";
import { FilmOverlay } from "@/components/FilmOverlay";
import { Preloader } from "@/components/Preloader";
import { SmoothScroll } from "@/components/SmoothScroll";
import { AgentSumit } from "@/components/AgentSumit";

const inter = Inter({ subsets: ["latin"], variable: "--nf-inter" });
const anton = Anton({ subsets: ["latin"], weight: "400", variable: "--nf-anton" });
const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--nf-instrument",
});
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--nf-mono" });

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
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${anton.variable} ${instrument.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        {/* Hide the intro before first paint for visitors who already watched it this session. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(sessionStorage.getItem('sb-reel-seen')==='1')document.documentElement.classList.add('reel-seen')}catch(e){}",
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        className="antialiased bg-ink text-paper custom-scrollbar"
      >
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
        <Preloader />
        <SmoothScroll />
        <FilmCursor />
        <FilmOverlay />
        <Navigation />
        <main className="relative z-10 w-full">{children}</main>
        <AgentSumit />
      </body>
    </html>
  );
}
