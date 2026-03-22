import {
  SUPPORTED_LANGUAGE_OPTIONS,
  getTranslationCoverageReport,
} from "@/i18n/translations";

describe("translation coverage", () => {
  it("includes all supported languages in report", () => {
    const report = getTranslationCoverageReport();
    const expected = SUPPORTED_LANGUAGE_OPTIONS.map((item) => item.code).sort();
    const actual = report.map((item) => item.language).sort();

    expect(actual).toEqual(expected);
  });

  it("keeps full core key coverage for every supported language", () => {
    const report = getTranslationCoverageReport();
    for (const item of report) {
      expect(item.localizedCoreKeys).toBe(item.totalCoreKeys);
      expect(item.coreCoveragePercent).toBe(100);
    }
  });
});
