import { inferSupportedLanguageFromLocale } from "../languageStore";

describe("languageStore locale inference", () => {
  it("returns explicit supported language when locale language is non-English", () => {
    expect(inferSupportedLanguageFromLocale("tr-DE")).toBe("tr");
    expect(inferSupportedLanguageFromLocale("es-US")).toBe("es");
    expect(inferSupportedLanguageFromLocale("fr-CA")).toBe("fr");
    expect(inferSupportedLanguageFromLocale("pt_BR")).toBe("pt");
  });

  it("maps filipino locale alias to tl", () => {
    expect(inferSupportedLanguageFromLocale("fil-PH")).toBe("tl");
  });

  it("uses region fallback for generic English locales", () => {
    expect(inferSupportedLanguageFromLocale("en-TH")).toBe("th");
    expect(inferSupportedLanguageFromLocale("en-TR")).toBe("tr");
  });

  it("falls back to region when language is unsupported", () => {
    expect(inferSupportedLanguageFromLocale("xx-TR")).toBe("tr");
    expect(inferSupportedLanguageFromLocale("xx-TH")).toBe("th");
  });

  it("keeps English for English-speaking regions", () => {
    expect(inferSupportedLanguageFromLocale("en-US")).toBe("en");
    expect(inferSupportedLanguageFromLocale("en-GB")).toBe("en");
  });

  it("handles script locales and invalid values", () => {
    expect(inferSupportedLanguageFromLocale("sr-Latn-RS")).toBe("sr");
    expect(inferSupportedLanguageFromLocale("")).toBeNull();
    expect(inferSupportedLanguageFromLocale(null)).toBeNull();
    expect(inferSupportedLanguageFromLocale(undefined)).toBeNull();
  });
});

