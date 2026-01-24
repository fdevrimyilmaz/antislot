import "dotenv/config";
import cors from "cors";
import express from "express";
import OpenAI from "openai";

type ClientMessage = {
  role?: string;
  content?: string;
};

const SYSTEM_PROMPT = [
  "Sen YAPAY ANTİ adlı, Türkçe konuşan bir sohbet asistanısın.",
  "Kumar/bahis dürtüsü, stres ve kriz yönetiminde empatik, kısa ve net yanıtlar ver.",
  "Tıbbi/psikolojik tanı koyma, yasal veya finansal tavsiye verme.",
  "Kullanıcı acil tehlike, kendine zarar, intihar veya kriz ifadeleri paylaştığında",
  "mutlaka 112 Acil Çağrı Merkezi ve SOS ekranına yönlendir.",
  "Yanıtları 1-2 kısa paragraf ve gerekirse maddelerle sınırla.",
].join(" ");

const app = express();
const port = Number(process.env.PORT) || 3001;
const apiKey = process.env.OPENAI_API_KEY || "";
const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

app.use(cors());
app.use(express.json({ limit: "1mb" }));

const openai = new OpenAI({ apiKey });

app.post("/chat", async (req, res) => {
  if (!apiKey) {
    return res.status(500).json({ error: "OPENAI_API_KEY eksik" });
  }

  const { messages } = req.body ?? {};
  if (!Array.isArray(messages)) {
    return res.status(400).json({ error: "messages alanı dizi olmalı" });
  }

  const sanitized = (messages as ClientMessage[])
    .filter((item) => item && typeof item.content === "string" && typeof item.role === "string")
    .map((item) => ({ role: item.role as string, content: item.content as string }))
    .filter((item) => ["user", "assistant", "system"].includes(item.role));

  if (sanitized.length === 0) {
    return res.status(400).json({ error: "messages alanı boş olamaz" });
  }

  try {
    const completion = await openai.chat.completions.create({
      model,
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...sanitized],
      temperature: 0.7,
    });

    const reply = completion.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      return res.status(502).json({ error: "Boş yanıt alındı" });
    }

    return res.json({ reply });
  } catch (error) {
    console.error("OpenAI /chat hatası:", error);
    return res.status(500).json({ error: "Yanıt üretilemedi" });
  }
});

app.listen(port, () => {
  console.log(`AI chat server running on http://localhost:${port}`);
});
