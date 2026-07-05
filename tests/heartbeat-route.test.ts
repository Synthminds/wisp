import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { POST } from "../app/api/cron/heartbeat/route";

const SECRET = "test-cron-secret";
const url = "https://wisp.test/api/cron/heartbeat";

describe("POST /api/cron/heartbeat", () => {
  beforeEach(() => {
    process.env.CRON_SECRET = SECRET;
  });
  afterEach(() => {
    delete process.env.CRON_SECRET;
  });

  it("401s without a valid cron secret", async () => {
    const res = await POST(new Request(url, { method: "POST" }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.code).toBe("UNAUTHORIZED");
  });

  it("200s with the correct Bearer secret and never runs an LLM", async () => {
    const res = await POST(
      new Request(url, { method: "POST", headers: { authorization: `Bearer ${SECRET}` } }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.llm).toBe(false);
  });
});
