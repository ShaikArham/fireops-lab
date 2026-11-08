import { afterEach, expect, test, vi } from "vitest";
import { requestJson } from "./api";

afterEach(() => vi.unstubAllGlobals());
test("HTML service failures return an actionable error", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response("<html>Unavailable</html>", { status: 503 })),
  );
  await expect(requestJson("https://example.test")).rejects.toThrow("error (503)");
});
test("structured validation errors show their messages", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ detail: [{ msg: "A reason is required" }] }), {
        status: 422,
      }),
    ),
  );
  await expect(requestJson("https://example.test")).rejects.toThrow("A reason is required");
});
test("timeouts do not imply that a write was rolled back", async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new DOMException("Timeout", "TimeoutError")));
  await expect(requestJson("https://example.test")).rejects.toThrow(
    "Refresh the records before retrying a write action",
  );
});
