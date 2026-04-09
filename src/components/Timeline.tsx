"use client";

import { motion } from "framer-motion";
import { BookOpen } from "lucide-react";

interface TimelineItem {
  year?: string;
  title: string;
  role: string;
  description: string;
  impact?: string;
}

export const Timeline = ({ items }: { items: TimelineItem[] }) => {
  return (
    <div className="relative border-l border-[#7000ff]/50 ml-4 md:ml-6 space-y-12 pb-8">
      {items.map((item, index) => (
        <motion.div 
          key={index}
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          className="relative pl-8 md:pl-12"
        >
          {/* Node */}
          <div className="absolute left-[-20px] top-1 bg-black border-2 border-[#ff00ff] w-10 h-10 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(255,0,255,0.4)]">
            <BookOpen size={18} className="text-[#ff00ff]" />
          </div>

          <div className="glass-panel p-6 rounded-lg custom-hover">
            {item.year && (
              <span className="inline-block px-2 py-1 mb-3 text-xs font-orbitron text-[#ff00ff] bg-[#ff00ff]/10 border border-[#ff00ff]/30 rounded-sm">
                {item.year}
              </span>
            )}
            <h3 className="text-xl font-bold text-white mb-1 group-hover:text-[#ff00ff] transition-colors">{item.title}</h3>
            <div className="text-sm font-orbitron text-gray-400 mb-4">{item.role}</div>
            <p className="text-gray-300 font-inter text-sm mb-4 border-l-2 border-[#ff00ff]/30 pl-3 py-1">
              "{item.description}"
            </p>
            {item.impact && (
              <div className="text-xs text-[#00f3ff] bg-[#00f3ff]/5 p-2 border border-[#00f3ff]/10 rounded-sm">
                <span className="font-orbitron uppercase opacity-70 block mb-1">Impact //</span>
                {item.impact}
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
};
