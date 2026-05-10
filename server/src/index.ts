import "dotenv/config";
import cors from "cors";
import express from "express";
import OpenAI from "openai";
import { config, type AiProvider } from "./config";

type ClientMessage = {
  role?: string;
  content?: string;
};

type ChatRole = "system" | "user" | "assistant";
type ChatMessage = { role: ChatRole; content: string };

type GeminiPart = { text: string };
type GeminiContent = { role: "user" | "model"; parts: GeminiPart[] };

const SYSTEM_PROMPT = [
  "You are YAPAY ANTI, a Turkish-speaking support assistant.",
  "Give short, practical, and empathetic guidance for gambling urges and stress moments.",
  "Do not provide medical diagnosis, legal advice, or financial advice.",
  "If user mentions immediate danger, self-harm, or crisis, direct them to emergency services (112).",
].join(" ");

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const openai = new OpenAI({ apiKey: config.openAiApiKey });

async function sendOperationalAlert(
  title: string,
  payload: Record<string, unknown> = {}
): Promise<void> {
  if (!config.alertWebhookUrl) return;
  try {
    await fetch(config.alertWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: "antislot-chat-server",
        title,
        payload,
        aiProvider: config.aiProvider,
        nodeEnv: config.nodeEnv,
        ts: new Date().toISOString(),
      }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Operational alert failed:", message);
  }
}

function sanitizeMessages(raw: unknown): ChatMessage[] {
  if (!Array.isArray(raw)) return [];
  return (raw as ClientMessage[])
    .filter((item) => item && typeof item.content === "string" && typeof item.role === "string")
    .map((item) => ({ role: item.role as ChatRole, content: item.content as string }))
    .filter((item): item is ChatMessage => ["user", "assistant", "system"].includes(item.role))
    .slice(-16);
}

function normalizeGeminiContents(messages: ChatMessage[]): GeminiContent[] {
  const output: GeminiContent[] = [];
  for (const message of messages) {
    if (!message.content.trim()) continue;
    if (message.role === "assistant") {
      output.push({
        role: "model",
        parts: [{ text: message.content }],
      });
      continue;
    }
    if (message.role === "user") {
      output.push({
        role: "user",
        parts: [{ text: message.content }],
      });
    }
  }

  if (output.length === 0) {
    const fallback = messages[messages.length - 1]?.content?.trim();
    if (fallback) {
      output.push({ role: "user", parts: [{ text: fallback }] });
    }
  }

  return output;
}

async function completeWithOpenAi(messages: ChatMessage[]): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: config.openAiModel,
    messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
    temperature: 0.7,
  });

  const reply = completion.choices?.[0]?.message?.content?.trim();
  if (!reply) {
    throw new Error("openai_empty_reply");
  }
  return reply;
}

async function completeWithGemini(messages: ChatMessage[]): Promise<string> {
  const url = `${config.geminiBaseUrl}/models/${encodeURIComponent(
    config.geminiModel
  )}:generateContent?key=${encodeURIComponent(config.geminiApiKey)}`;

  const contents = normalizeGeminiContents(messages);
  if (contents.length === 0) {
    throw new Error("gemini_empty_prompt");
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: SYSTEM_PROMPT }],
      },
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 512,
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`gemini_http_${response.status}:${body.slice(0, 260)}`);
  }

  const payload = (await response.json()) as {
    candidates?: {
      content?: { parts?: { text?: string }[] };
    }[];
  };

  const parts = payload.candidates?.[0]?.content?.parts ?? [];
  const reply = parts
    .map((part) => part.text ?? "")
    .join(" ")
    .trim();

  if (!reply) {
    throw new Error("gemini_empty_reply");
  }
  return reply;
}

async function completeWithProvider(
  provider: AiProvider,
  messages: ChatMessage[]
): Promise<string> {
  if (provider === "gemini") {
    return completeWithGemini(messages);
  }
  return completeWithOpenAi(messages);
}

app.get("/", (_req, res) => {
  return res.status(200).json({
    ok: true,
    service: "antislot-chat-server",
    aiProvider: config.aiProvider,
  });
});

app.get("/health", (_req, res) => {
  return res.status(200).json({
    status: "ok",
    service: "antislot-chat-server",
    aiProvider: config.aiProvider,
  });
});

app.post("/chat", async (req, res) => {
  const sanitized = sanitizeMessages(req.body?.messages);
  if (sanitized.length === 0) {
    return res.status(400).json({ error: "messages must be a non-empty array" });
  }

  try {
    const reply = await completeWithProvider(config.aiProvider, sanitized);
    return res.json({ reply, provider: config.aiProvider });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await sendOperationalAlert("chat.request_failed", {
      provider: config.aiProvider,
      message,
    });
    console.error("AI /chat error:", message);
    return res.status(500).json({
      error: "Could not generate reply",
      provider: config.aiProvider,
    });
  }
});

app.post("/iap/webhook", async (req, res) => {
  try {
    const event = req.body ?? {};
    if (!event || typeof event !== "object") {
      return res.status(400).json({ ok: false, error: "invalid webhook payload" });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await sendOperationalAlert("iap.webhook_failed", { message });
    return res.status(500).json({ ok: false, error: "webhook error" });
  }
});

app.listen(config.port, config.host, () => {
  console.log(
    `AI chat server running on http://${config.host}:${config.port} (provider=${config.aiProvider})`
  );
});
