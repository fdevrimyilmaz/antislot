import * as SecureStore from "expo-secure-store";
import {
  deleteDiaryEntry,
  getDiaryEntries,
  getLastEntryDate,
  getLocalDateKey,
  getTodayEntry,
  MAX_DIARY_ENTRIES,
  saveDiaryEntry,
  updateDiaryEntry,
  type DiaryEntry,
} from "../diaryStore";

jest.mock("@/services/diaryApi", () => ({
  syncDiaryCloud: jest.fn(async () => null),
}));

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;
const memoryStore = new Map<string, string>();
const DIARY_ENTRIES_KEY = "antislot_diary_entries";
const LAST_ENTRY_DATE_KEY = "antislot_last_entry_date";

function dateDaysAgo(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return getLocalDateKey(date);
}

beforeEach(() => {
  memoryStore.clear();
  jest.clearAllMocks();

  mockSecureStore.getItemAsync.mockImplementation(async (key: string) => {
    return memoryStore.get(key) ?? null;
  });
  mockSecureStore.setItemAsync.mockImplementation(async (key: string, value: string) => {
    memoryStore.set(key, value);
  });
  mockSecureStore.deleteItemAsync.mockImplementation(async (key: string) => {
    memoryStore.delete(key);
  });
});

describe("diaryStore", () => {
  it("saves and loads entries in descending createdAt order", async () => {
    const older: DiaryEntry = {
      id: "entry_old",
      date: dateDaysAgo(1),
      content: "older note",
      createdAt: 1000,
    };
    const newer: DiaryEntry = {
      id: "entry_new",
      date: dateDaysAgo(0),
      content: "newer note",
      createdAt: 2000,
    };

    await saveDiaryEntry(older);
    await saveDiaryEntry(newer);

    const entries = await getDiaryEntries();
    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject(newer);
    expect(entries[1]).toMatchObject(older);

    const lastEntryDate = await getLastEntryDate();
    expect(lastEntryDate).toBe(newer.date);
  });

  it("keeps one entry per day and updates the content for same-day saves", async () => {
    const today = dateDaysAgo(0);
    await saveDiaryEntry({
      id: "entry_a",
      date: today,
      content: "first",
      createdAt: 1000,
    });
    await saveDiaryEntry({
      id: "entry_b",
      date: today,
      content: "second",
      createdAt: 2000,
    });

    const entries = await getDiaryEntries();
    expect(entries).toHaveLength(1);
    expect(entries[0].date).toBe(today);
    expect(entries[0].content).toBe("second");

    const todayEntry = await getTodayEntry();
    expect(todayEntry?.content).toBe("second");
  });

  it("updates an existing entry content by id", async () => {
    const entry: DiaryEntry = {
      id: "entry_update",
      date: dateDaysAgo(2),
      content: "before",
      createdAt: 3000,
    };

    await saveDiaryEntry(entry);
    await updateDiaryEntry(entry.id, "  after  ");

    const entries = await getDiaryEntries();
    expect(entries).toHaveLength(1);
    expect(entries[0].id).toBe(entry.id);
    expect(entries[0].content).toBe("after");
  });

  it("updates last-entry metadata after delete", async () => {
    const older: DiaryEntry = {
      id: "entry_older",
      date: dateDaysAgo(3),
      content: "older",
      createdAt: 4000,
    };
    const newer: DiaryEntry = {
      id: "entry_newer",
      date: dateDaysAgo(1),
      content: "newer",
      createdAt: 5000,
    };

    await saveDiaryEntry(older);
    await saveDiaryEntry(newer);

    await deleteDiaryEntry(newer.id);
    expect(await getLastEntryDate()).toBe(older.date);

    await deleteDiaryEntry(older.id);
    expect(await getLastEntryDate()).toBeNull();
  });

  it("repairs corrupted payload by clearing invalid stored data", async () => {
    memoryStore.set(DIARY_ENTRIES_KEY, "{invalid json}");
    memoryStore.set(LAST_ENTRY_DATE_KEY, "bad-date");

    const entries = await getDiaryEntries();
    expect(entries).toEqual([]);
    expect(memoryStore.get(DIARY_ENTRIES_KEY)).toBeUndefined();
    expect(memoryStore.get(LAST_ENTRY_DATE_KEY)).toBeUndefined();

    expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith(DIARY_ENTRIES_KEY);
    expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith(LAST_ENTRY_DATE_KEY);
  });

  it("caps recovered entries to MAX_DIARY_ENTRIES", async () => {
    const oversized: DiaryEntry[] = Array.from({ length: MAX_DIARY_ENTRIES + 50 }, (_, index) => {
      const date = new Date(2025, 0, 1);
      date.setDate(date.getDate() + index);
      return {
        id: `entry_${index}`,
        date: getLocalDateKey(date),
        content: `note_${index}`,
        createdAt: index + 1,
      };
    });

    memoryStore.set(DIARY_ENTRIES_KEY, JSON.stringify(oversized));

    const entries = await getDiaryEntries();
    expect(entries).toHaveLength(MAX_DIARY_ENTRIES);
    expect(entries[0].createdAt).toBe(MAX_DIARY_ENTRIES + 50);
  });
});
