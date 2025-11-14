const DEFAULT_API_URL = "https://max-hackathon-c3tg.vercel.app/";

export const API_BASE_URL =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_URL) ||
  DEFAULT_API_URL;
