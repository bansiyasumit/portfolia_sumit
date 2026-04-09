import type { Metadata } from "next";
import { Inter, Orbitron } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/Navigation";
import { NeonCursor } from "@/components/NeonCursor";
import { FloatingIcons } from "@/components/FloatingIcons";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const orbitron = Orbitron({ subsets: ["latin"], variable: "--font-orbitron" });

export const metadata: Metadata = {
  title: "Sumit Bansiya | AI Maven & Creative Technologist",
  description: "Senior Full-Stack Developer & AI Researcher Portfolio - 2026 Cyberpunk Edition",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${inter.variable} ${orbitron.variable} antialiased bg-[#020202] text-white custom-scrollbar`}
      >
        <NeonCursor />
        <FloatingIcons />
        <Navigation />
        <main className="relative z-10 w-full overflow-hidden">
          {children}
        </main>
      </body>
    </html>
  );
}
