import * as SecureStore from "expo-secure-store";

const DIARY_ENTRIES_KEY = "antislot_diary_entries";
const LAST_ENTRY_DATE_KEY = "antislot_last_entry_date";

export interface DiaryEntry {
  id: string;
  date: string;
  content: string;
  createdAt: number;
}

export async function saveDiaryEntry(entry: DiaryEntry): Promise<void> {
  try {
    const entries = await getDiaryEntries();
    const exists = entries.find((e) => e.id === entry.id);
    const updated = exists
      ? entries.map((e) => (e.id === entry.id ? { ...e, content: entry.content } : e))
      : [...entries, entry];
    await SecureStore.setItemAsync(DIARY_ENTRIES_KEY, JSON.stringify(updated));
    await SecureStore.setItemAsync(LAST_ENTRY_DATE_KEY, entry.date);
  } catch (error) {
    console.error("Günlük kaydı kaydedilirken hata:", error);
    throw error;
  }
}

export async function getDiaryEntries(): Promise<DiaryEntry[]> {
  try {
    const entriesStr = await SecureStore.getItemAsync(DIARY_ENTRIES_KEY);
    if (!entriesStr) return [];
    const parsed = JSON.parse(entriesStr) as DiaryEntry[];
    return parsed.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error("Günlük kayıtları yüklenirken hata:", error);
    return [];
  }
}

export async function updateDiaryEntry(id: string, content: string): Promise<void> {
  try {
    const entries = await getDiaryEntries();
    const updated = entries.map(entry =>
      entry.id === id ? { ...entry, content } : entry
    );
    await SecureStore.setItemAsync(DIARY_ENTRIES_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Günlük kaydı güncellenirken hata:", error);
    throw error;
  }
}

export async function deleteDiaryEntry(id: string): Promise<void> {
  try {
    const entries = await getDiaryEntries();
    const updated = entries.filter(entry => entry.id !== id);
    await SecureStore.setItemAsync(DIARY_ENTRIES_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Günlük kaydı silinirken hata:", error);
    throw error;
  }
}

export async function getTodayEntry(): Promise<DiaryEntry | null> {
  const today = new Date().toISOString().split("T")[0];
  const entries = await getDiaryEntries();
  return entries.find(e => e.date === today) || null;
}

export async function getLastEntryDate(): Promise<string | null> {
  return await SecureStore.getItemAsync(LAST_ENTRY_DATE_KEY);
}
