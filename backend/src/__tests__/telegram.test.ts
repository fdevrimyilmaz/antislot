/**
 * Telegram admin bot unit tests.
 *
 * These tests mock global.fetch so we can simulate Telegram API responses
 * without hitting the network, and use a fresh BlocklistStorage in a temp dir.
 */

import fs from 'fs/promises';
import os from 'os';
import path from 'path';

import { config } from '../config';
import { BlocklistStorage } from '../storage/blocklist-storage';
import { handleTelegramUpdate } from '../services/telegram';

type WriteableConfig = {
  telegramBotToken: string;
  telegramWebhookSecret: string;
  telegramAdminChatIds: number[];
  dataDir: string;
  blocklistFile: string;
};

const ADMIN_CHAT = 1234567;
const NON_ADMIN_CHAT = 999;

function buildUpdate(chatId: number, text: string) {
  return {
    message: {
      chat: { id: chatId },
      text,
      from: { username: 'admin', first_name: 'Admin' },
    },
  };
}

describe('handleTelegramUpdate', () => {
  let tempDir: string;
  let storage: BlocklistStorage;
  let sendMock: jest.Mock;
  const originalFetch = global.fetch;
  const original: WriteableConfig = {
    telegramBotToken: config.telegramBotToken,
    telegramWebhookSecret: config.telegramWebhookSecret,
    telegramAdminChatIds: [...config.telegramAdminChatIds],
    dataDir: config.dataDir,
    blocklistFile: config.blocklistFile,
  };

  beforeAll(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'antislot-telegram-test-'));
    (config as unknown as WriteableConfig).dataDir = tempDir;
    (config as unknown as WriteableConfig).blocklistFile = path.join(tempDir, 'blocklist.json');
    (config as unknown as WriteableConfig).telegramBotToken = 'test-bot-token';
    (config as unknown as WriteableConfig).telegramWebhookSecret = 'test-secret';
    (config as unknown as WriteableConfig).telegramAdminChatIds = [ADMIN_CHAT];
    storage = new BlocklistStorage();
    await storage.initialize();
  });

  beforeEach(() => {
    sendMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
      text: async () => '',
    });
    global.fetch = sendMock as unknown as typeof fetch;
  });

  afterAll(async () => {
    global.fetch = originalFetch;
    (config as unknown as WriteableConfig).telegramBotToken = original.telegramBotToken;
    (config as unknown as WriteableConfig).telegramWebhookSecret = original.telegramWebhookSecret;
    (config as unknown as WriteableConfig).telegramAdminChatIds = original.telegramAdminChatIds;
    (config as unknown as WriteableConfig).dataDir = original.dataDir;
    (config as unknown as WriteableConfig).blocklistFile = original.blocklistFile;
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('refuses non-admin chats silently', async () => {
    const result = await handleTelegramUpdate(
      buildUpdate(NON_ADMIN_CHAT, '/list'),
      storage
    );
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('not_admin');
    // No sendMessage call (silent drop).
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('returns help text on /help', async () => {
    const result = await handleTelegramUpdate(
      buildUpdate(ADMIN_CHAT, '/help'),
      storage
    );
    expect(result.ok).toBe(true);
    expect(sendMock).toHaveBeenCalled();
    const body = JSON.parse(sendMock.mock.calls[0][1].body as string);
    expect(body.chat_id).toBe(ADMIN_CHAT);
    expect(body.text).toMatch(/Antislot Admin Bot/);
  });

  it('refuses invalid domains on /block', async () => {
    const result = await handleTelegramUpdate(
      buildUpdate(ADMIN_CHAT, '/block not a domain'),
      storage
    );
    expect(result.ok).toBe(true);
    const body = JSON.parse(sendMock.mock.calls[0][1].body as string);
    expect(body.text).toMatch(/Geçersiz alan adı/);
  });

  it('adds an alive domain to the blocklist on /block', async () => {
    const before = await storage.getDomains();
    expect(before).not.toContain('example.com');

    // Mock probe HTTP path (DNS will be best-effort; for example.com it should resolve).
    sendMock.mockImplementation(async (url: string) => {
      if (typeof url === 'string' && url.startsWith('https://example.com')) {
        return { ok: true, status: 200 } as unknown as Response;
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({ ok: true }),
        text: async () => '',
      } as unknown as Response;
    });

    const result = await handleTelegramUpdate(
      buildUpdate(ADMIN_CHAT, '/block example.com'),
      storage
    );
    expect(result.ok).toBe(true);
    const domains = await storage.getDomains();
    expect(domains).toContain('example.com');
  });

  it('removes a domain on /unblock', async () => {
    await storage.addDomain('test-remove.example', 'unit-test');
    expect(await storage.getDomains()).toContain('test-remove.example');

    const result = await handleTelegramUpdate(
      buildUpdate(ADMIN_CHAT, '/unblock test-remove.example'),
      storage
    );
    expect(result.ok).toBe(true);
    expect(await storage.getDomains()).not.toContain('test-remove.example');
  });

  it('reports unknown commands with help text', async () => {
    const result = await handleTelegramUpdate(
      buildUpdate(ADMIN_CHAT, '/unknowncmd'),
      storage
    );
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('unknown_command');
    const body = JSON.parse(sendMock.mock.calls[0][1].body as string);
    expect(body.text).toMatch(/Bilinmeyen komut/);
  });

  it('returns 503-equivalent (no_bot_token) when token missing', async () => {
    const previousToken = config.telegramBotToken;
    (config as unknown as WriteableConfig).telegramBotToken = '';
    try {
      const result = await handleTelegramUpdate(
        buildUpdate(ADMIN_CHAT, '/help'),
        storage
      );
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('no_bot_token');
    } finally {
      (config as unknown as WriteableConfig).telegramBotToken = previousToken;
    }
  });
});
