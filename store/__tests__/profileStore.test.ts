/* eslint-disable import/first */
const mockSecureStoreState = new Map<string, string>();

jest.mock("@/lib/secureStoreCompat", () => ({
  getItemAsync: jest.fn(async (key: string) => mockSecureStoreState.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockSecureStoreState.set(key, value);
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    mockSecureStoreState.delete(key);
  }),
}));

import {
  getStoredUsername,
  normalizeUsername,
  saveProfile,
  USERNAME_MAX_LENGTH,
} from "@/store/profileStore";

describe("profileStore username rules", () => {
  beforeEach(() => {
    mockSecureStoreState.clear();
  });

  it("normalizes username by trimming, collapsing spaces and enforcing max length", () => {
    const raw = `   ali    veli   ${"x".repeat(USERNAME_MAX_LENGTH + 10)}   `;
    const normalized = normalizeUsername(raw);

    expect(normalized.includes("  ")).toBe(false);
    expect(normalized.startsWith("ali veli")).toBe(true);
    expect(normalized.length).toBeLessThanOrEqual(USERNAME_MAX_LENGTH);
  });

  it("rejects profile save when username is missing", async () => {
    await expect(
      saveProfile({
        username: "   ",
        age: "20",
        gender: "",
        ethnicity: "",
        countryState: "",
        referral: "",
      })
    ).rejects.toThrow("username-required");
  });

  it("returns normalized stored username", async () => {
    await saveProfile({
      username: "  deneme   kullanici  ",
      age: "",
      gender: "",
      ethnicity: "",
      countryState: "",
      referral: "",
    });

    await expect(getStoredUsername()).resolves.toBe("deneme kullanici");
  });
});
