"use client";

import { useEffect } from "react";

type Activity = "website_visit" | "video_play" | "cv_view" | "cv_download" | "workspace_explore";
const storageKey = "fireops-activity-v1";
const sentKey = "fireops-activity-sent-v1";

export default function ReviewActivityTracker() {
  useEffect(() => {
    if (navigator.webdriver || /bot|crawler|spider|headless|preview/i.test(navigator.userAgent))
      return;
    const endpoint = process.env.NEXT_PUBLIC_REVIEW_ALERT_ENDPOINT;
    if (!endpoint) return;
    if (sessionStorage.getItem(sentKey)) return;
    const activity = new Set<Activity>(["website_visit"]);
    try {
      const saved = JSON.parse(sessionStorage.getItem(storageKey) || "[]") as Activity[];
      for (const event of saved) activity.add(event);
    } catch {
      // Invalid session state is ignored.
    }
    let timer: ReturnType<typeof setTimeout> | undefined;
    let sent = false;
    const flush = () => {
      if (sent) return;
      sent = true;
      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "activity_summary", events: Array.from(activity) }),
        keepalive: true,
        credentials: "same-origin",
      })
        .then((response) => {
          if (response.ok) sessionStorage.setItem(sentKey, "1");
          else sent = false;
        })
        .catch(() => {
          sent = false;
        });
    };
    const schedule = (delay = 8_000) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(flush, delay);
    };
    const mark = (event: Activity) => {
      if (sent) return;
      activity.add(event);
      sessionStorage.setItem(storageKey, JSON.stringify(Array.from(activity)));
      schedule(event === "cv_download" ? 1000 : 8_000);
    };
    const onPlay = (event: Event) => {
      if (event.target instanceof HTMLVideoElement) mark("video_play");
    };
    const onClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const link = event.target.closest("a[href]");
      if (!link) return;
      const href = (link.getAttribute("href") || "").toLowerCase();
      if (href.includes("/cv/") || href.includes(".pdf")) {
        mark(
          link.hasAttribute("download") || /download/i.test(link.textContent || "")
            ? "cv_download"
            : "cv_view",
        );
      } else if (href.includes("/workspace/")) {
        mark("workspace_explore");
      }
    };
    document.addEventListener("play", onPlay, true);
    document.addEventListener("click", onClick);
    window.addEventListener("pagehide", flush);
    schedule();
    return () => {
      if (timer) clearTimeout(timer);
      document.removeEventListener("play", onPlay, true);
      document.removeEventListener("click", onClick);
      window.removeEventListener("pagehide", flush);
    };
  }, []);
  return null;
}
