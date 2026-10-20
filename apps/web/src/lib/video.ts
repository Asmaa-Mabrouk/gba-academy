/** How to show a lesson video: YouTube and Vimeo links become embedded players, anything else is played as a direct video file. */
export type VideoSource = { kind: "iframe" | "video"; src: string };

export function videoSource(url: string): VideoSource {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return { kind: "iframe", src: `https://www.youtube-nocookie.com/embed/${u.pathname.slice(1)}` };
    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = u.searchParams.get("v") ?? (u.pathname.startsWith("/embed/") ? u.pathname.slice(7) : "");
      if (id) return { kind: "iframe", src: `https://www.youtube-nocookie.com/embed/${id}` };
    }
    if (host === "vimeo.com" && /^\/\d+/.test(u.pathname)) return { kind: "iframe", src: `https://player.vimeo.com/video/${u.pathname.split("/")[1]}` };
  } catch { /* not a URL: treat as a file */ }
  return { kind: "video", src: url };
}
