import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";

type EventName = "website_visit" | "video_play" | "cv_view" | "cv_download" | "workspace_explore";
const allowed = new Set<EventName>([
  "website_visit",
  "video_play",
  "cv_view",
  "cv_download",
  "workspace_explore",
]);

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== request.nextUrl.origin) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }
  const agent = request.headers.get("user-agent") ?? "";
  if (/bot|crawler|spider|headless|preview|vercel-screenshot/i.test(agent)) {
    return new NextResponse(null, { status: 204 });
  }
  const key = process.env.RESEND_API_KEY;
  const recipient = process.env.FIREOPS_ALERT_TO;
  if (!key || !recipient) {
    return NextResponse.json(
      { ok: false, reason: "Notifications not configured" },
      { status: 503 },
    );
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const input = body as Record<string, unknown>;
  if (
    input.event !== "activity_summary" ||
    !Array.isArray(input.events) ||
    input.events.length > 5
  ) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const events = input.events.filter(
    (event): event is EventName => typeof event === "string" && allowed.has(event as EventName),
  );
  if (!events.includes("website_visit")) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const time = new Intl.DateTimeFormat("en-IE", {
    timeZone: "Europe/Dublin",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());
  const labels: Record<EventName, string> = {
    website_visit: "Website opened",
    video_play: "Introduction film played",
    cv_view: "View CV clicked",
    cv_download: "Download CV clicked",
    workspace_explore: "Workspace explored",
  };
  const device = /Mobile|Android|iPhone/i.test(agent) ? "Mobile" : "Desktop / other";
  const text = [
    "FireOPS Lab | Activity summary",
    "",
    ...Array.from(allowed).map(
      (event) => `${labels[event]}: ${events.includes(event) ? "Yes" : "No"}`,
    ),
    "",
    `Time (Ireland): ${time}`,
    `Device: ${device}`,
    "",
    "Anonymous activity only. Visitor identity is not known.",
    "A video play or CV click does not prove the visitor watched or read the content.",
    "Automated browser activity may not be fully excluded.",
  ].join("\n");
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.FIREOPS_ALERT_FROM || "FireOPS Alerts <onboarding@resend.dev>",
        to: [recipient],
        subject: "FireOPS Lab | Activity summary",
        text,
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) {
      console.error("FireOPS notification provider failed", response.status);
      return NextResponse.json({ ok: false }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 502 });
  }
}
