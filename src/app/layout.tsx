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

export const metadata: Metadata = {
  title: "Sumit Bansiya | AI Researcher — Computer Vision & Generative AI",
  description:
    "Portfolio of Sumit Bansiya: M.Tech AI researcher building GAN-based medical imaging systems, RAG pipelines, and agentic AI tooling.",
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
