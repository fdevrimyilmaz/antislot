import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

import { db } from "@/lib/firebase";

export async function readProgress(uid: string): Promise<number> {
  const docRef = doc(db, "users", uid);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return 0;
  const data = snapshot.data() as { progress?: { gamblingFreeDays?: unknown } } | undefined;
  const value = data?.progress?.gamblingFreeDays;
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export async function writeProgress(uid: string, days: number): Promise<void> {
  const docRef = doc(db, "users", uid);
  await setDoc(
    docRef,
    {
      progress: {
        gamblingFreeDays: days,
        updatedAt: serverTimestamp(),
      },
    },
    { merge: true }
  );
}
