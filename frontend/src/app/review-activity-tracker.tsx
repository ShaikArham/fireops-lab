"use client";

import { useEffect } from "react";

type Activity = "website_visit" | "video_play" | "cv_view" | "cv_download" | "workspace_explore";
const storageKey = "fireops-activity-v1";
const sentKey = "fireops-activity-sent-v1";

export default function ReviewActivityTracker() {
  useEffect(() => {
    if (navigator.webdriver || /bot|crawler|spider|headless|preview/i.test(navigator.userAgent))
      return;
    const agent = navigator.userAgent;
    const browser = /Edg\//.test(agent)
      ? "Edge"
      : /CriOS|Chrome\//.test(agent)
        ? "Chrome"
        : /FxiOS|Firefox\//.test(agent)
          ? "Firefox"
          : /Safari\//.test(agent)
            ? "Safari"
            : "Other";
    const device = /iPad|Tablet/i.test(agent)
      ? "Tablet"
      : /iPhone|Android.*Mobile|Mobile/i.test(agent)
        ? "Mobile"
        : "Desktop";
    const endpoint = process.env.NEXT_PUBLIC_REVIEW_ALERT_ENDPOINT;
    if (!endpoint) return;
    // Continue collecting activity after the first successful summary.
    const activity = new Set<Activity>(["website_visit"]);
    try {
      const saved = JSON.parse(sessionStorage.getItem(storageKey) || "[]") as Activity[];
      for (const event of saved) activity.add(event);
    } catch {
      // Invalid session state is ignored.
    }
    const timeline: Array<{ at: string; section: string; action: string }> = [];
    const record = (
      action: string,
      section = window.location.pathname.split("/").filter(Boolean).pop() || "home",
    ) => {
      timeline.push({
        at: new Date().toISOString(),
        section: section.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40),
        action,
      });
      if (timeline.length > 30) timeline.shift();
    };
    record("website_visit");
    let timer: ReturnType<typeof setTimeout> | undefined;
    let sending = false;
    let lastSent = sessionStorage.getItem(sentKey) || "";
    const flush = () => {
      if (sending) return;
      const snapshot = JSON.stringify({ events: Array.from(activity).sort(), timeline });
      if (snapshot === lastSent) return;
      sending = true;
      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "activity_summary",
          events: Array.from(activity),
          timeline,
          browser,
          device,
        }),
        keepalive: true,
        credentials: "same-origin",
      })
        .then(async (response) => {
          if (response.ok) {
            const result = (await response.json().catch(() => ({}))) as { status?: string };
            if (result.status !== "rate_limited") {
              lastSent = snapshot;
              sessionStorage.setItem(sentKey, snapshot);
            }
          }
          sending = false;
        })
        .catch(() => {
          sending = false;
        });
    };
    const schedule = (delay = 3_000) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(flush, delay);
    };
    const mark = (event: Activity) => {
      activity.add(event);
      record(event);
      sessionStorage.setItem(storageKey, JSON.stringify(Array.from(activity)));
      schedule(event === "cv_download" ? 1000 : 3_000);
    };
    const onRoute = () => {
      if (window.location.pathname.startsWith("/workspace/")) mark("workspace_explore");
    };
    const onPlay = (event: Event) => {
      if (event.target instanceof HTMLVideoElement && !activity.has("video_play"))
        mark("video_play");
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
        activity.add("workspace_explore");
        record(
          "section_open",
          href
            .split("/")
            .filter(Boolean)
            .pop()
            ?.replace(/[^a-z0-9_-]/g, "") || "workspace",
        );
        sessionStorage.setItem(storageKey, JSON.stringify(Array.from(activity)));
        schedule();
      }
    };
    onRoute();
    window.addEventListener("popstate", onRoute);
    document.addEventListener("play", onPlay, true);
    document.addEventListener("click", onClick);
    window.addEventListener("pagehide", flush);
    schedule();
    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener("popstate", onRoute);
      document.removeEventListener("play", onPlay, true);
      document.removeEventListener("click", onClick);
      window.removeEventListener("pagehide", flush);
    };
  }, []);
  return null;
}
