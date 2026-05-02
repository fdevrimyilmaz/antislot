import type { FastifyInstance } from "fastify";

import type { BlocklistStorage } from "../storage/blocklist-storage";

jest.setTimeout(30000);

describe("POST /v1/internal/telegram/domains", () => {
  const ingestToken = "telegram-ingest-test-secret-001";
  const existingDomain = "already-listed-telegram-test.com";
  const addedDomain = "fresh-casino-mirror-test.net";
  const dryRunDomain = "dryrun-telegram-bet-test.org";

  let fastify: FastifyInstance;
  let blocklistStorage: BlocklistStorage;

  beforeAll(async () => {
    process.env.TELEGRAM_INGEST_ENABLED = "true";
    process.env.TELEGRAM_INGEST_TOKEN = ingestToken;
    process.env.TELEGRAM_INGEST_MAX_DOMAINS = "10";

    jest.resetModules();
    const serverModule = await import("../server");
    fastify = serverModule.fastify;
    blocklistStorage = serverModule.blocklistStorage;
    await blocklistStorage.initialize();
    await blocklistStorage.removeDomain(existingDomain).catch(() => {});
    await blocklistStorage.removeDomain(addedDomain).catch(() => {});
    await blocklistStorage.removeDomain(dryRunDomain).catch(() => {});
  });

  afterAll(async () => {
    await blocklistStorage.removeDomain(existingDomain).catch(() => {});
    await blocklistStorage.removeDomain(addedDomain).catch(() => {});
    await blocklistStorage.removeDomain(dryRunDomain).catch(() => {});
    delete process.env.TELEGRAM_INGEST_ENABLED;
    delete process.env.TELEGRAM_INGEST_TOKEN;
    delete process.env.TELEGRAM_INGEST_MAX_DOMAINS;
  });

  it("rejects requests without ingest token", async () => {
    const response = await fastify.inject({
      method: "POST",
      url: "/v1/internal/telegram/domains",
      payload: { domains: ["example.com"] },
    });

    expect(response.statusCode).toBe(401);
    const body = JSON.parse(response.body);
    expect(body?.ok).toBe(false);
    expect(body?.error?.code).toBe("UNAUTHORIZED");
  });

  it("adds normalized domains and skips invalid/duplicate/existing entries", async () => {
    await blocklistStorage.addDomain(existingDomain, "pre-seeded for telegram ingest test");

    const response = await fastify.inject({
      method: "POST",
      url: "/v1/internal/telegram/domains",
      headers: {
        authorization: `Bearer ${ingestToken}`,
      },
      payload: {
        domains: [
          existingDomain,
          "https://WWW.FRESH-CASINO-MIRROR-TEST.NET/path?x=1",
          addedDomain,
          "not a domain",
        ],
        source: "telegram-bot-main",
        reason: "auto-detected",
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body?.ok).toBe(true);
    expect(body?.added).toEqual([addedDomain]);
    expect(body?.addedCount).toBe(1);
    expect(body?.received).toBe(4);

    const skippedReasons = (body?.skipped || []).map((item: { reason?: string }) => item.reason);
    expect(skippedReasons).toContain("already_exists");
    expect(skippedReasons).toContain("duplicate_in_request");
    expect(skippedReasons).toContain("invalid_domain");

    const blocklistResponse = await fastify.inject({
      method: "GET",
      url: "/v1/blocklist",
    });
    const blocklistBody = JSON.parse(blocklistResponse.body);
    expect(blocklistBody?.domains).toContain(addedDomain);
  });

  it("supports dryRun without persisting changes", async () => {
    const response = await fastify.inject({
      method: "POST",
      url: "/v1/internal/telegram/domains",
      headers: {
        authorization: `Bearer ${ingestToken}`,
      },
      payload: {
        domain: `https://${dryRunDomain}/track`,
        dryRun: true,
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body?.ok).toBe(true);
    expect(body?.dryRun).toBe(true);
    expect(body?.added).toEqual([dryRunDomain]);

    const blocklistResponse = await fastify.inject({
      method: "GET",
      url: "/v1/blocklist",
    });
    const blocklistBody = JSON.parse(blocklistResponse.body);
    expect(blocklistBody?.domains).not.toContain(dryRunDomain);
  });
});
