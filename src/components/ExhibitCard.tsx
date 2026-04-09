"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Code2 } from "lucide-react";

interface ExhibitProps {
  id: string;
  title: string;
  description?: string;
  metrics?: Record<string, string>;
  tech_stack?: string[];
  tags?: string[];
  institution?: string;
  role?: string;
  children?: React.ReactNode;
}

export const ExhibitCard = ({
  id, title, description, metrics, tech_stack, tags, institution, role, children
}: ExhibitProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div 
      layout
      className="glass-panel rounded-lg overflow-hidden group hover:shadow-[0_0_20px_rgba(0,243,255,0.15)] transition-all duration-300"
    >
      <div 
        className="p-6 cursor-pointer relative"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-[#00f3ff] to-[#7000ff] opacity-50 group-hover:opacity-100 transition-opacity"></div>
        
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[#00f3ff] text-xs font-orbitron tracking-widest uppercase">[{id}]</span>
              {(institution || role) && (
                <span className="text-gray-500 text-xs uppercase bg-white/5 px-2 py-0.5 rounded-sm">
                  {institution || role}
                </span>
              )}
            </div>
            <h3 className="text-2xl font-bold font-inter text-white mb-2 group-hover:text-[#00f3ff] transition-colors">
              {title}
            </h3>
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            className="text-[#7000ff]"
          >
            <ChevronDown />
          </motion.div>
        </div>

        <p className="text-gray-400 font-inter line-clamp-2">
          {description}
        </p>

        {(tags || tech_stack) && (
          <div className="flex flex-wrap gap-2 mt-4">
            {(tags || tech_stack || []).map((tag, i) => (
              <span key={i} className="text-xs font-orbitron text-[#00f3ff] border border-[#00f3ff]/30 px-2 py-1 rounded-sm bg-[#00f3ff]/5">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-[#00f3ff]/10 bg-black/40"
          >
            <div className="p-6">
              {metrics && (
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {Object.entries(metrics).map(([key, value]) => (
                    <div key={key} className="glass-panel p-3 text-center border-t-2 border-t-[#7000ff]">
                      <div className="text-xs text-gray-400 font-orbitron uppercase mb-1">{key}</div>
                      <div className="text-lg font-bold text-white">{value}</div>
                    </div>
                  ))}
                </div>
              )}

              {children && (
                <div className="mt-4">
                  {children}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
