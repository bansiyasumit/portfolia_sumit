"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Code2, Cpu, Database, Network, Binary, Shield, BrainCircuit } from "lucide-react";

export const FloatingIcons = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const icons = [
    { Icon: BrainCircuit, color: "#00f3ff", x: "10%", y: "20%", delay: 0 },
    { Icon: Code2, color: "#7000ff", x: "85%", y: "15%", delay: 1 },
    { Icon: Cpu, color: "#ff00ff", x: "75%", y: "75%", delay: 2 },
    { Icon: Database, color: "#00f3ff", x: "15%", y: "80%", delay: 1.5 },
    { Icon: Network, color: "#7000ff", x: "50%", y: "10%", delay: 0.5 },
    { Icon: Binary, color: "#00f3ff", x: "90%", y: "50%", delay: 2.5 },
    { Icon: Shield, color: "#ff00ff", x: "5%", y: "50%", delay: 0.8 },
  ];

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Background dark grid */}
      <div 
        className="absolute inset-0 opacity-[0.03]" 
        style={{
          backgroundImage: 'linear-gradient(#00f3ff 1px, transparent 1px), linear-gradient(90deg, #00f3ff 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }}
      />
      
      {/* Floating Icons */}
      {icons.map((item, i) => (
        <motion.div
          key={i}
          className="absolute opacity-20"
          style={{ left: item.x, top: item.y }}
          animate={{
            y: [0, -30, 0],
            rotate: [0, 10, -10, 0],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: 8 + Math.random() * 4,
            repeat: Infinity,
            delay: item.delay,
            ease: "easeInOut",
          }}
        >
          <item.Icon size={48} color={item.color} strokeWidth={1} />
        </motion.div>
      ))}
      
      {/* Center glowing orb */}
      <motion.div 
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-[#7000ff] blur-[150px] opacity-10"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.05, 0.15, 0.05],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </div>
  );
};
