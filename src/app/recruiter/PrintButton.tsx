"use client";

export const PrintButton = () => (
  <button
    onClick={() => window.print()}
    className="font-mono text-xs tracking-[0.2em] uppercase bg-[#16130f] text-[#f4f1ea] rounded-full px-4 py-2 hover:bg-[#b34a1f] transition-colors"
  >
    Print / save as PDF
  </button>
);
