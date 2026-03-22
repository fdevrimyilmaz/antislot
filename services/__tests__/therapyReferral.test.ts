import {
  buildTherapyCallbackMailto,
  isValidTherapyPhone,
  normalizePhoneNumber,
} from "@/services/therapyReferral";

describe("therapyReferral", () => {
  it("normalizes phone numbers", () => {
    expect(normalizePhoneNumber(" +1 (415) 555-0100 ")).toBe("+14155550100");
    expect(normalizePhoneNumber("0532 123 45 67")).toBe("05321234567");
  });

  it("validates plausible phone lengths", () => {
    expect(isValidTherapyPhone("+14155550100")).toBe(true);
    expect(isValidTherapyPhone("05321234567")).toBe(true);
    expect(isValidTherapyPhone("12345")).toBe(false);
  });

  it("builds mailto payload with callback fields", () => {
    const url = buildTherapyCallbackMailto({
      phone: "+1 (415) 555-0100",
      name: "Test User",
      preferredTime: "Weekdays after 18:00",
      note: "Need gambling-focused support",
      locale: "en",
    });

    expect(url.startsWith("mailto:")).toBe(true);
    expect(url).toContain("Phone%20Therapy%20Callback%20Request");
    expect(url).toContain("14155550100");
    expect(url).toContain("Test%20User");
  });
});
