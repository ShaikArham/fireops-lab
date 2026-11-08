import { ApiError, requestJson } from "./api";
const API = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "/backend";
let preparation: Promise<void> | null = null;

export function prepareDemo(retry = false): Promise<void> {
  if (retry) preparation = null;
  if (!preparation) {
    preparation = (async () => {
      try {
        await requestJson(`${API}/api/v1/demo/session`);
      } catch (error) {
        if (!(error instanceof ApiError) || ![401, 409].includes(error.status)) throw error;
        await requestJson(`${API}/api/v1/demo/session`, { method: "POST" });
      }
      const data = await requestJson<{ scenarios: { reconciliation_run_id: string | null }[] }>(
        `${API}/api/v1/demo/scenarios`,
      );
      if (!data.scenarios?.length || data.scenarios.some((item) => !item.reconciliation_run_id)) {
        await requestJson(`${API}/api/v1/demo/load`, { method: "POST" });
      }
    })().catch((error) => {
      preparation = null;
      throw error;
    });
  }
  return preparation;
}

export async function resetDemo(): Promise<void> {
  await requestJson(`${API}/api/v1/demo/reset`, { method: "POST" });
  preparation = null;
  await prepareDemo();
}
