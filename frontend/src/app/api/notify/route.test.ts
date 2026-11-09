import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";

describe("FireOPS activity notification", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("rejects cross-origin requests", async () => {
    const request = new NextRequest("https://fireops-lab.vercel.app/api/notify", {
      method: "POST",
      headers: { origin: "https://untrusted.example" },
      body: JSON.stringify({ event: "activity_summary", events: ["website_visit"] }),
    });
    expect((await POST(request)).status).toBe(403);
  });

  it("fails closed when Resend is not configured", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("FIREOPS_ALERT_TO", "");
    const request = new NextRequest("https://fireops-lab.vercel.app/api/notify", {
      method: "POST",
      headers: { origin: "https://fireops-lab.vercel.app" },
      body: JSON.stringify({ event: "activity_summary", events: ["website_visit"] }),
    });
    expect((await POST(request)).status).toBe(503);
  });
});
