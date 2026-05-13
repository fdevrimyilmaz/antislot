import * as SecureStore from "expo-secure-store";

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  /**
   * Optional "buddy" designation. At most one contact is the user's
   * accountability partner — they get a prominent SMS shortcut in SOS.
   */
  isBuddy?: boolean;
}

const CONTACTS_KEY = "antislot_emergency_contacts";
const BUDDY_MESSAGE_KEY = "antislot_buddy_message_v1";

/**
 * Default SMS template used when the user taps "buddy'e mesaj" in SOS.
 * Short, non-alarming, opens the door to a conversation without
 * forcing details.
 */
export const DEFAULT_BUDDY_MESSAGE =
  "Selam — şu an bahis dürtüsü içindeyim. Konuşabilir miyiz?";

export async function getContacts(): Promise<EmergencyContact[]> {
  try {
    const stored = await SecureStore.getItemAsync(CONTACTS_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored) as EmergencyContact[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (error) {
    console.error("Kişiler yüklenirken hata:", error);
    return [];
  }
}

async function saveContacts(contacts: EmergencyContact[]): Promise<void> {
  await SecureStore.setItemAsync(CONTACTS_KEY, JSON.stringify(contacts));
}

export async function addContact(name: string, phone: string): Promise<EmergencyContact[]> {
  const contacts = await getContacts();
  const contact: EmergencyContact = {
    id: `contact_${Date.now()}`,
    name: name.trim(),
    phone: phone.trim(),
  };
  const updated = [...contacts, contact];
  await saveContacts(updated);
  return updated;
}

export async function removeContact(id: string): Promise<EmergencyContact[]> {
  const contacts = await getContacts();
  const updated = contacts.filter((c) => c.id !== id);
  await saveContacts(updated);
  return updated;
}

/**
 * Sets `id` as the buddy. Clears the flag on every other contact, so
 * there's at most one buddy at any time. Pass `null` to clear.
 */
export async function setBuddy(id: string | null): Promise<EmergencyContact[]> {
  const contacts = await getContacts();
  const updated = contacts.map((c) => ({
    ...c,
    isBuddy: id !== null && c.id === id,
  }));
  await saveContacts(updated);
  return updated;
}

export async function getBuddy(): Promise<EmergencyContact | null> {
  const contacts = await getContacts();
  return contacts.find((c) => c.isBuddy) ?? null;
}

export async function getBuddyMessage(): Promise<string> {
  try {
    const stored = await SecureStore.getItemAsync(BUDDY_MESSAGE_KEY);
    return stored && stored.trim().length > 0 ? stored : DEFAULT_BUDDY_MESSAGE;
  } catch {
    return DEFAULT_BUDDY_MESSAGE;
  }
}

export async function setBuddyMessage(message: string): Promise<void> {
  const trimmed = message.trim().slice(0, 240);
  if (trimmed.length === 0) {
    await SecureStore.deleteItemAsync(BUDDY_MESSAGE_KEY);
    return;
  }
  await SecureStore.setItemAsync(BUDDY_MESSAGE_KEY, trimmed);
}
