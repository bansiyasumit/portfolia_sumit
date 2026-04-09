"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Award, Book } from "lucide-react";
import libraryData from "../data/library.json";

export const LibrarySearch = () => {
  const [searchTerm, setSearchTerm] = useState("");
  
  const filteredLibrary = libraryData.library.filter((item) => 
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.issuer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full">
      <div className="relative mb-8 max-w-md mx-auto">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="text-[#00f3ff] opacity-70" size={18} />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full glass-panel border-[#00f3ff]/30 text-white font-inter text-sm py-3 pl-10 pr-4 rounded-sm focus:outline-none focus:border-[#00f3ff] transition-colors placeholder:text-gray-600 focus:shadow-[0_0_15px_rgba(0,243,255,0.2)]"
          placeholder="SEARCH ARCHIVES [Ex: Udacity, Generative AI]..."
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-orbitron text-gray-500 uppercase">
          INDEX_{libraryData.library.length}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredLibrary.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="group relative h-32 [perspective:1000px]"
          >
            {/* Card Content */}
            <div className="w-full h-full relative border border-white/10 rounded-sm bg-black/40 p-5 flex flex-col justify-between hover:border-[#00f3ff]/50 transition-colors">
              <div className="flex justify-between items-start">
                <h4 className="font-bold text-white text-sm line-clamp-2 pr-4">{item.title}</h4>
                {item.type === "Certification" ? (
                  <Award size={16} className="text-[#00f3ff] shrink-0" />
                ) : (
                  <Book size={16} className="text-[#7000ff] shrink-0" />
                )}
              </div>
              
              <div className="flex justify-between items-end mt-4">
                <span className="text-xs text-gray-400 font-inter">{item.issuer}</span>
                <span className="text-[10px] font-orbitron text-gray-500 border border-gray-700 px-1.5 py-0.5 rounded-xs">
                  {item.year}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
        
        {filteredLibrary.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500 font-orbitron text-sm">
            NO RECORDS FOUND FOR "{searchTerm}"
          </div>
        )}
      </div>
    </div>
  );
};
