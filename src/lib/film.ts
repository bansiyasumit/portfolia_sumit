/** Fired by any in-page CTA that should open the floating Agent Sumit terminal. */
export const OPEN_AGENT_EVENT = "agent-sumit:open";

/** Fired once the opening preloader has lifted, so the hero can start its sequence. */
export const FILM_START_EVENT = "film:start";

/** Each page section is a "scene" in the reel; the HUD and nav read from this list. */
export const SCENES = [
  { id: "home", label: "Opening" },
  { id: "origin", label: "Origin" },
  { id: "work", label: "The Work" },
  { id: "path", label: "The Path" },
  { id: "agent", label: "Agent" },
  { id: "credits", label: "Credits" },
] as const;

/** 24 fps film timecode (HH:MM:SS:FF) for a progress value in seconds. */
export const toTimecode = (seconds: number) => {
  const s = Math.max(0, seconds);
  const pad = (n: number) => String(Math.floor(n)).padStart(2, "0");
  return `${pad(s / 3600)}:${pad((s / 60) % 60)}:${pad(s % 60)}:${pad((s % 1) * 24)}`;
};

export const hasFilmStarted = () =>
  typeof window !== "undefined" && (window as unknown as { __filmStarted?: boolean }).__filmStarted === true;

export const markFilmStarted = () => {
  (window as unknown as { __filmStarted?: boolean }).__filmStarted = true;
  window.dispatchEvent(new Event(FILM_START_EVENT));
};

const SOUND_KEY = "sb-sound";

/** Whether the visitor chose "Enter with sound" this session. */
export const soundPreferred = () => {
  try {
    return sessionStorage.getItem(SOUND_KEY) === "1";
  } catch {
    return false;
  }
};

export const setSoundPreferred = (on: boolean) => {
  try {
    sessionStorage.setItem(SOUND_KEY, on ? "1" : "0");
  } catch {}
};

/** The plain, fast "Recruiter mode" page: no intro, grain, custom cursor or 3D. */
export const isRecruiterPath = (pathname: string | null) => !!pathname && pathname.startsWith("/recruiter");
