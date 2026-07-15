import { describe, expect, it } from "vitest";
import {
  createTelegramAdapter,
  toRawCaptures,
} from "../src/lib/adapters/telegram";

const textUpdate = {
  update_id: 100,
  message: {
    message_id: 42,
    from: { id: 555 },
    chat: { id: 999 },
    date: 1_752_000_000, // 2025-07-08T18:40:00Z
    text: "we're low on milk",
  },
};

describe("toRawCaptures", () => {
  it("normalizes a text message into one RawCapture", () => {
    expect(toRawCaptures(textUpdate)).toEqual([
      {
        text: "we're low on milk",
        capturedBy: "unknown",
        capturedAt: "2025-07-08T18:40:00.000Z",
        deviceRef: "telegram:999:42",
      },
    ]);
  });

  it("resolves capturedBy from the user map", () => {
    const map = new Map<number, "wes" | "ria">([[555, "ria"]]);
    expect(toRawCaptures(textUpdate, map)[0]?.capturedBy).toBe("ria");
  });

  it("returns [] for a non-text or non-message update", () => {
    expect(toRawCaptures({ update_id: 1 })).toEqual([]);
    expect(
      toRawCaptures({ update_id: 2, message: { message_id: 1, chat: { id: 9 }, date: 1 } }),
    ).toEqual([]);
    expect(toRawCaptures({ garbage: true })).toEqual([]);
  });
});

describe("createTelegramAdapter", () => {
  it("exposes the telegram source and ingests via the normalizer", async () => {
    const adapter = createTelegramAdapter();
    expect(adapter.source).toBe("telegram");
    const captures = await adapter.ingest(textUpdate);
    expect(captures).toHaveLength(1);
    expect(captures[0]?.deviceRef).toBe("telegram:999:42");
  });
});
