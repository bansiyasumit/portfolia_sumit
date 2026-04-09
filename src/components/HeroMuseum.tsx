"use client";

import { motion, Variants } from "framer-motion";
import { Terminal, ArrowRight } from "lucide-react";
import Image from "next/image";
import profileData from "../data/profile.json";

export const HeroMuseum = () => {
  const { name, title, bio } = profileData.profile;

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 px-6 z-10 w-full overflow-hidden">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <motion.div 
          className="w-full"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="flex items-center gap-3 mb-6">
            <Terminal className="text-[#00f3ff]" size={20} />
            <span className="font-orbitron text-[#00f3ff] text-sm tracking-[0.2em] uppercase">
              System Initialization // 2026
            </span>
          </motion.div>

          <motion.h1 
            variants={itemVariants}
            className="text-5xl md:text-7xl lg:text-8xl font-black mb-4 uppercase tracking-tighter"
          >
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500">
              {name}
            </span>
          </motion.h1>

          <motion.div 
            variants={itemVariants}
            className="inline-block border-l-4 border-[#7000ff] pl-4 mb-8"
          >
            <h2 className="text-xl md:text-3xl font-orbitron text-gray-300 tracking-wider">
              {title}
            </h2>
          </motion.div>

          <motion.p 
            variants={itemVariants}
            className="text-gray-400 max-w-2xl text-lg md:text-xl leading-relaxed mb-12 font-inter"
          >
            {bio}
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-wrap gap-6">
            <a href="#research" className="group relative px-6 py-3 font-orbitron text-sm uppercase tracking-widest overflow-hidden">
              <span className="relative z-10 text-white group-hover:text-[#020202] transition-colors duration-300">
                Enter Museum
              </span>
              <div className="absolute inset-0 border border-[#00f3ff] glow-border transition-all duration-300"></div>
              <div className="absolute inset-0 bg-[#00f3ff] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-0"></div>
            </a>
            
            <a href="https://www.linkedin.com/in/sumit-bansiya-patidar-305869213/" target="_blank" rel="noreferrer" className="flex items-center gap-2 group px-6 py-3 font-orbitron text-sm text-[#7000ff] uppercase tracking-widest hover:text-white transition-colors duration-300">
              <span className="border-b border-[#7000ff] group-hover:border-white transition-colors">Neural Sync</span>
              <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
            </a>
          </motion.div>
        </motion.div>

        {/* Profile Image Node */}
        <motion.div 
          className="hidden lg:flex justify-center relative"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.5, type: "spring", stiffness: 100 }}
        >
          <div className="relative w-[380px] h-[480px] glass-panel rounded-lg overflow-hidden group">
            {/* Cyberpunk Scanline */}
            <div className="absolute inset-0 z-20 pointer-events-none opacity-20 hidden group-hover:block" 
                 style={{ background: 'linear-gradient(to bottom, transparent, #00f3ff, transparent)', height: '20px', animation: 'scan 2s linear infinite' }}>
            </div>
            
            <Image 
              src="/sumit_profile.png" 
              alt="Sumit Bansiya" 
              fill
              sizes="(max-width: 768px) 100vw, 380px"
              className="object-cover object-center grayscale group-hover:grayscale-0 transition-all duration-700"
              priority
            />
            
            {/* HUD Overlays */}
            <div className="absolute bottom-4 left-4 z-20 font-orbitron text-[10px] text-[#00f3ff] tracking-widest bg-black/50 px-2 py-1 border border-[#00f3ff]/30">
              STATUS: ONLINE
            </div>
            <div className="absolute top-4 right-4 z-20 w-8 h-8 border-t-2 border-r-2 border-[#ff00ff] opacity-70"></div>
            <div className="absolute bottom-4 right-4 z-20 w-8 h-8 border-b-2 border-r-2 border-[#ff00ff] opacity-70"></div>
          </div>
        </motion.div>
      </div>
      
      <style jsx global>{`
        @keyframes scan {
          0% { top: -20px; }
          100% { top: 100%; }
        }
      `}</style>
    </section>
  );
};
