import { SMSClassifier } from "../classifier";
import { SpamCategory } from "../types";

describe("SMSClassifier junk protection", () => {
  it("detects obfuscated gambling spam with short link", () => {
    const classifier = new SMSClassifier({ strictMode: true });

    const result = classifier.classify({
      body: "B A H 1 S bonusu! Hemen tikla https://bit.ly/xx12",
      sender: "TRX889991",
    });

    expect(result.isSpam).toBe(true);
    expect(result.category).toBe(SpamCategory.GAMBLING);
    expect(result.confidence).toBeGreaterThanOrEqual(0.45);
    expect(result.signalCount).toBeGreaterThanOrEqual(3);
  });

  it("detects scam-like junk combinations even without direct gambling words", () => {
    const classifier = new SMSClassifier({ strictMode: false });

    const result = classifier.classify({
      body: "URGENT! Verify account now at secure-check.top and enter 998877",
      sender: "905555667788",
    });

    expect(result.isSpam).toBe(true);
    expect([SpamCategory.SCAM, SpamCategory.ADVERTISEMENT, SpamCategory.GAMBLING]).toContain(result.category);
    expect(result.confidence).toBeGreaterThanOrEqual(0.35);
  });

  it("treats custom keyword match as high-priority spam signal", () => {
    const classifier = new SMSClassifier({
      strictMode: false,
      customKeywords: ["vip paket"],
    });

    const result = classifier.classify({
      body: "Sadece sana ozel VIP paket acildi, hemen giris yap!",
      sender: "PROMO777",
    });

    expect(result.isSpam).toBe(true);
    expect(result.matchedKeywords).toContain("vip paket");
  });

  it("keeps transactional OTP SMS as non-spam", () => {
    const classifier = new SMSClassifier({ strictMode: true });

    const result = classifier.classify({
      body: "Bankanizdan tek kullanimlik dogrulama kodunuz 123456. Kimseyle paylasmayin.",
      sender: "AKBANK",
    });

    expect(result.isSpam).toBe(false);
    expect(result.category).toBe(SpamCategory.NORMAL);
  });

  it("classifies clean delivery updates as non-spam", () => {
    const classifier = new SMSClassifier({ strictMode: false });

    const result = classifier.classify({
      body: "Kargonuz yarin 10:00-12:00 arasi teslim edilecektir.",
      sender: "YURTICI",
    });

    expect(result.isSpam).toBe(false);
    expect(result.category).toBe(SpamCategory.NORMAL);
  });
});
