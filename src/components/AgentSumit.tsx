"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowUp, X, RotateCcw } from "lucide-react";
import { OPEN_AGENT_EVENT } from "@/lib/film";

type Action = { type: "navigate"; href: string; label: string };
type Message = { role: "user" | "agent"; content: string; steps?: string[]; actions?: Action[]; error?: boolean };

const SUGGESTIONS = [
  "Summarize your research in 3 bullets",
  "Which project best shows LLM engineering?",
  "Take me to the thesis",
  "How can I contact you?",
];

const STEP_LABELS: Record<string, string> = {
  get_profile: "Read profile",
  list_projects: "Listed projects",
  get_project: "Opened project file",
  search_knowledge: "Searched knowledge",
  list_certifications: "Checked certifications",
  get_contact: "Fetched contact",
  navigate: "Navigated",
};

const THINKING = ["Thinking", "Looking it up", "Checking the record", "Writing the answer"];

const Markdown = ({ text }: { text: string }) => (
  <div className="agent-md text-[14px] leading-relaxed text-paper/90">
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a: ({ href, children }) => (
          <a href={href} target={href?.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="text-teal underline underline-offset-2">
            {children}
          </a>
        ),
      }}
    >
      {text}
    </ReactMarkdown>
  </div>
);

export const AgentSumit = () => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [thinkingIdx, setThinkingIdx] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Any CTA can open the agent, optionally with a pre-filled { prompt }.
  useEffect(() => {
    const handleOpen = (e: Event) => {
      setIsOpen(true);
      const prompt = (e as CustomEvent<{ prompt?: string }>).detail?.prompt;
      if (prompt) setInput(prompt);
      setTimeout(() => inputRef.current?.focus(), 250);
    };
    window.addEventListener(OPEN_AGENT_EVENT, handleOpen);
    return () => window.removeEventListener(OPEN_AGENT_EVENT, handleOpen);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (!loading) return;
    const t = setInterval(() => setThinkingIdx((i) => (i + 1) % THINKING.length), 1400);
    return () => clearInterval(t);
  }, [loading]);

  const runActions = (actions: Action[] = []) => {
    const nav = actions.find((a) => a.type === "navigate");
    if (!nav) return;
    setTimeout(() => {
      if (nav.href.endsWith(".pdf")) {
        window.open(nav.href, "_blank");
      } else if (nav.href.startsWith("/#") && window.location.pathname === "/") {
        document.getElementById(nav.href.slice(2))?.scrollIntoView({ behavior: "smooth" });
      } else {
        router.push(nav.href);
      }
      if (window.innerWidth < 640) setIsOpen(false);
    }, 700);
  };

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || loading) return;
    const next: Message[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setLoading(true);
    setThinkingIdx(0);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.filter((m) => !m.error).map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setMessages((m) => [...m, { role: "agent", content: data.error ?? "Something went wrong.", error: true }]);
      } else {
        setMessages((m) => [...m, { role: "agent", content: data.reply, steps: data.steps, actions: data.actions }]);
        runActions(data.actions);
      }
    } catch {
      setMessages((m) => [...m, { role: "agent", content: "Connection lost. Please try again.", error: true }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            aria-label="Open Agent Sumit"
            className="fixed bottom-6 right-6 z-[150] w-14 h-14 rounded-full p-[2px] bg-gradient-to-br from-ember to-teal shadow-[0_0_30px_rgba(255,107,53,0.35)] group"
          >
            <span className="block relative w-full h-full rounded-full overflow-hidden bg-ink">
              <Image src="/sumit_portrait.webp" alt="" fill sizes="56px" className="object-cover object-top group-hover:scale-110 transition-transform" />
            </span>
            <span className="absolute top-0.5 right-0.5 w-3 h-3 rounded-full bg-teal border-2 border-ink" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="fixed z-[150] inset-0 sm:inset-auto sm:bottom-6 sm:right-6 sm:w-[420px] sm:h-[min(640px,85vh)] bg-ink-2/95 backdrop-blur-xl sm:border border-paper/15 sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            role="dialog"
            aria-label="Agent Sumit chat"
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-paper/10">
              <div className="relative w-9 h-9 rounded-full overflow-hidden shrink-0">
                <Image src="/sumit_portrait.webp" alt="" fill sizes="36px" className="object-cover object-top" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-paper text-sm font-medium">Agent Sumit</div>
                <div className="hud !text-[9px] text-paper/40 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal" /> AI twin · grounded in my portfolio
                </div>
              </div>
              {messages.length > 0 && (
                <button onClick={() => setMessages([])} className="p-2 text-paper/40 hover:text-paper transition-colors" aria-label="New chat">
                  <RotateCcw size={16} />
                </button>
              )}
              <button onClick={() => setIsOpen(false)} className="p-2 text-paper/40 hover:text-ember transition-colors" aria-label="Close">
                <X size={18} />
              </button>
            </div>

            {/* Conversation */}
            <div ref={scrollRef} data-lenis-prevent className="flex-1 overflow-y-auto custom-scrollbar px-4 py-5">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col justify-end gap-5">
                  <div>
                    <div className="font-serif italic text-3xl text-paper leading-tight">Hi, I&apos;m Sumit&apos;s AI twin.</div>
                    <p className="text-paper/50 text-sm mt-2 leading-relaxed">
                      Ask about my research, projects, skills or experience. I answer only from my real record, and I can take you to any part of the site.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="text-left text-sm text-paper/80 border border-paper/10 hover:border-ember/60 hover:text-paper rounded-xl px-4 py-2.5 transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  {messages.map((m, i) =>
                    m.role === "user" ? (
                      <div key={i} className="self-end max-w-[85%] bg-paper/10 text-paper rounded-2xl rounded-br-md px-4 py-2.5 text-[14px] whitespace-pre-wrap">
                        {m.content}
                      </div>
                    ) : (
                      <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-2">
                        {m.steps && m.steps.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {[...new Set(m.steps)].map((s) => (
                              <span key={s} className="hud !text-[8.5px] !tracking-[0.15em] text-teal/80 border border-teal/20 rounded-full px-2 py-1">
                                ✓ {STEP_LABELS[s] ?? s}
                              </span>
                            ))}
                          </div>
                        )}
                        {m.error ? <p className="text-ember text-sm">{m.content}</p> : <Markdown text={m.content} />}
                      </motion.div>
                    )
                  )}
                  {loading && (
                    <div className="flex items-center gap-3 text-paper/50 text-sm">
                      <span className="flex gap-1">
                        {[0, 1, 2].map((d) => (
                          <motion.span
                            key={d}
                            className="w-1.5 h-1.5 rounded-full bg-ember"
                            animate={{ opacity: [0.2, 1, 0.2] }}
                            transition={{ duration: 1, repeat: Infinity, delay: d * 0.15 }}
                          />
                        ))}
                      </span>
                      {THINKING[thinkingIdx]}…
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Composer */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="p-3 border-t border-paper/10"
            >
              <div className="flex items-end gap-2 bg-ink border border-paper/15 focus-within:border-paper/40 rounded-xl px-3 py-2 transition-colors">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send(input);
                    }
                  }}
                  rows={1}
                  maxLength={2000}
                  placeholder="Ask me anything…"
                  className="flex-1 resize-none bg-transparent outline-none text-paper text-sm placeholder:text-paper/30 max-h-32 py-1.5"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="w-8 h-8 shrink-0 rounded-lg bg-ember text-ink flex items-center justify-center disabled:opacity-30 transition-opacity"
                  aria-label="Send"
                >
                  <ArrowUp size={16} />
                </button>
              </div>
              <p className="text-center text-[10px] text-paper/30 mt-2">AI twin — can be wrong. For anything important, email me directly.</p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
