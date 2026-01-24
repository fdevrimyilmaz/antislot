import * as SecureStore from "expo-secure-store";

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
}

const CONTACTS_KEY = "antislot_emergency_contacts";

export async function getContacts(): Promise<EmergencyContact[]> {
  try {
    const stored = await SecureStore.getItemAsync(CONTACTS_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as EmergencyContact[];
  } catch (error) {
    console.error("Kişiler yüklenirken hata:", error);
    return [];
  }
}

export async function addContact(name: string, phone: string): Promise<EmergencyContact[]> {
  const contacts = await getContacts();
  const contact: EmergencyContact = {
    id: `contact_${Date.now()}`,
    name: name.trim(),
    phone: phone.trim(),
  };
  const updated = [...contacts, contact];
  await SecureStore.setItemAsync(CONTACTS_KEY, JSON.stringify(updated));
  return updated;
}

export async function removeContact(id: string): Promise<EmergencyContact[]> {
  const contacts = await getContacts();
  const updated = contacts.filter((c) => c.id !== id);
  await SecureStore.setItemAsync(CONTACTS_KEY, JSON.stringify(updated));
  return updated;
}
