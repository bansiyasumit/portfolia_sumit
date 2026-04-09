"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export const NeonCursor = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseOver = (e: MouseEvent) => {
      if ((e.target as HTMLElement).tagName.toLowerCase() === "a" || 
          (e.target as HTMLElement).tagName.toLowerCase() === "button" ||
          (e.target as HTMLElement).closest("a") || 
          (e.target as HTMLElement).closest("button")) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener("mousemove", updateMousePosition);
    window.addEventListener("mouseover", handleMouseOver);

    return () => {
      window.removeEventListener("mousemove", updateMousePosition);
      window.removeEventListener("mouseover", handleMouseOver);
    };
  }, []);

  // Hide default cursor globally
  useEffect(() => {
    document.body.style.cursor = "none";
    return () => {
      document.body.style.cursor = "auto";
    };
  }, []);

  return (
    <>
      <motion.div
        className="fixed top-0 left-0 w-4 h-4 rounded-full bg-[#00f3ff] mix-blend-screen pointer-events-none z-[100] transform -translate-x-1/2 -translate-y-1/2"
        style={{
          boxShadow: "0 0 10px #00f3ff, 0 0 20px #00f3ff",
        }}
        animate={{
          x: mousePosition.x - 8,
          y: mousePosition.y - 8,
          scale: isHovering ? 0 : 1,
        }}
        transition={{ type: "tween", ease: "backOut", duration: 0.1 }}
      />
      <motion.div
        className="fixed top-0 left-0 border border-[#7000ff] rounded-sm pointer-events-none z-[99] transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
        animate={{
          x: mousePosition.x - 16,
          y: mousePosition.y - 16,
          width: isHovering ? 48 : 32,
          height: isHovering ? 48 : 32,
          rotate: isHovering ? 45 : 0,
          borderColor: isHovering ? "#00f3ff" : "#7000ff"
        }}
        transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.5 }}
      >
        {isHovering && (
          <span className="font-orbitron text-[8px] text-[#00f3ff] opacity-80" style={{ transform: 'rotate(-45deg)' }}>
            EXE
          </span>
        )}
      </motion.div>
    </>
  );
};
