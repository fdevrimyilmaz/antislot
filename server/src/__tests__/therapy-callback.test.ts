import { promises as fs } from "fs";
import os from "os";
import path from "path";
import {
  enqueueTherapyCallback,
  getQueuedTherapyCallbackCount,
  getTherapyCallbackHistory,
  initializeTherapyCallbackStore,
  listTherapyCallbackQueue,
  updateTherapyCallbackStatus,
} from "../therapy-callback";

describe("therapy callback queue", () => {
  let tempDir = "";
  let statePath = "";

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "therapy-callback-"));
    statePath = path.join(tempDir, "therapy-callback-state.json");
    await initializeTherapyCallbackStore(statePath);
  });

  afterEach(async () => {
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  it("queues callback request and returns queue metadata", async () => {
    const result = await enqueueTherapyCallback(
      "user-a",
      {
        phone: "+1 (415) 555-0100",
        name: "User A",
        preferredTime: "Weekdays 18:00-21:00",
        note: "Need gambling-focused support",
        locale: "en",
      },
      "support@antislot.app"
    );

    expect(result.requestId).toMatch(/^tcb_/);
    expect(result.status).toBe("queued");
    expect(result.queueDepth).toBe(1);
    expect(result.supportEmail).toBe("support@antislot.app");
  });

  it("increases queue depth with new records", async () => {
    await enqueueTherapyCallback(
      "user-a",
      { phone: "+1 (415) 555-0100", locale: "en" },
      "support@antislot.app"
    );
    const second = await enqueueTherapyCallback(
      "user-b",
      { phone: "+90 532 123 45 67", locale: "tr" },
      "support@antislot.app"
    );

    expect(second.queueDepth).toBe(2);
  });

  it("normalizes locale variants to tr/en", async () => {
    await enqueueTherapyCallback(
      "user-tr",
      { phone: "+90 532 123 45 67", locale: "tr-TR" },
      "support@antislot.app"
    );
    await enqueueTherapyCallback(
      "user-en",
      { phone: "+1 (415) 555-0100", locale: "de" },
      "support@antislot.app"
    );

    const queue = await listTherapyCallbackQueue("all", 10);
    const trRecord = queue.find((item) => item.userId === "user-tr");
    const enRecord = queue.find((item) => item.userId === "user-en");

    expect(trRecord?.locale).toBe("tr");
    expect(enRecord?.locale).toBe("en");
  });

  it("lists queue by status and updates request status", async () => {
    const first = await enqueueTherapyCallback(
      "user-a",
      { phone: "+1 (415) 555-0100", locale: "en" },
      "support@antislot.app"
    );
    await enqueueTherapyCallback(
      "user-b",
      { phone: "+90 532 123 45 67", locale: "tr" },
      "support@antislot.app"
    );

    const queuedBefore = await listTherapyCallbackQueue("queued", 10);
    expect(queuedBefore.map((item) => item.requestId)).toContain(first.requestId);
    expect(await getQueuedTherapyCallbackCount()).toBe(2);

    const updated = await updateTherapyCallbackStatus(
      first.requestId,
      "contacted",
      "Reached via phone"
    );
    expect(updated?.status).toBe("contacted");
    expect(updated?.adminNote).toBe("Reached via phone");

    const queuedAfter = await listTherapyCallbackQueue("queued", 10);
    expect(queuedAfter.map((item) => item.requestId)).not.toContain(first.requestId);
    expect(await getQueuedTherapyCallbackCount()).toBe(1);

    const contacted = await listTherapyCallbackQueue("contacted", 10);
    expect(contacted.map((item) => item.requestId)).toContain(first.requestId);
  });

  it("returns user-specific history sorted by latest first", async () => {
    await enqueueTherapyCallback(
      "user-a",
      { phone: "+1 (415) 555-0100", note: "First" },
      "support@antislot.app"
    );
    await enqueueTherapyCallback(
      "user-b",
      { phone: "+1 (415) 555-0101", note: "Other user" },
      "support@antislot.app"
    );
    await enqueueTherapyCallback(
      "user-a",
      { phone: "+1 (415) 555-0102", note: "Second" },
      "support@antislot.app"
    );

    const history = await getTherapyCallbackHistory("user-a", 10);
    expect(history).toHaveLength(2);
    expect(history[0]?.note).toBe("Second");
    expect(history[1]?.note).toBe("First");
  });

  it("rejects invalid phone", async () => {
    await expect(
      enqueueTherapyCallback(
        "user-a",
        { phone: "12345", locale: "en" },
        "support@antislot.app"
      )
    ).rejects.toThrow("invalid_phone");
  });

  it("rejects invalid status update", async () => {
    const queued = await enqueueTherapyCallback(
      "user-a",
      { phone: "+1 (415) 555-0100", locale: "en" },
      "support@antislot.app"
    );

    await expect(
      updateTherapyCallbackStatus(queued.requestId, "wrong-status")
    ).rejects.toThrow("invalid_status");
  });
});
