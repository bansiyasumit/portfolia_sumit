"use client";

import { useState, useRef, useEffect } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";

export const GanSlider = () => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    
    let clientX;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
    } else {
      clientX = e.clientX;
    }

    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.max(0, Math.min((x / rect.width) * 100, 100));
    setSliderPosition(percent);
  };

  return (
    <div className="mt-6 flex flex-col gap-4">
      <div className="flex justify-between items-center text-xs font-orbitron uppercase text-[#00f3ff] mb-2">
        <span>Low-Energy Input</span>
        <span>GAN Synth Output</span>
      </div>
      
      <div 
        ref={containerRef}
        className="relative w-full h-[300px] md:h-[400px] rounded-lg overflow-hidden cursor-ew-resize glass-panel"
        onMouseMove={handleMouseMove}
        onTouchMove={handleMouseMove}
      >
        {/* Abstract representation of images since we don't have real medical ones */}
        {/* Base Image (Result) */}
        <div className="absolute inset-0 bg-[#0a0a1a] flex items-center justify-center">
          <img 
            src="/gan_output.jpg" 
            alt="Enhanced DES Phantom" 
            className="w-full h-full object-cover"
          />
          <div className="absolute font-orbitron text-[#00f3ff]/80 font-bold bg-black/60 px-2 py-1 rounded text-xs bottom-4 right-4 tracking-widest">
            ENHANCED DES PHANTOM
          </div>
        </div>

        {/* Overlay Image (Source) */}
        <div 
          className="absolute inset-0 bg-[#050505] flex items-center justify-center overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
        >
          <img 
            src="/low_energy.jpg" 
            alt="Low-Energy Source" 
            className="w-full h-full object-cover"
          />
          <div className="absolute font-orbitron text-gray-300 font-bold bg-black/60 px-2 py-1 rounded text-xs bottom-4 left-4 tracking-widest">
            LOW-ENERGY SOURCE
          </div>
        </div>

        {/* Slider Divider */}
        <div 
          className="absolute top-0 bottom-0 w-1 bg-[#00f3ff] shadow-[0_0_15px_#00f3ff] flex items-center justify-center"
          style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
        >
          <div className="w-6 h-10 bg-black border border-[#00f3ff] flex items-center justify-center rounded-sm">
            <div className="flex gap-1">
              <div className="w-0.5 h-4 bg-[#00f3ff]"></div>
              <div className="w-0.5 h-4 bg-[#00f3ff]"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
