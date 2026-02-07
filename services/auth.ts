import { auth } from "@/lib/firebase";
import { signInAnonymously } from "firebase/auth";

export const anonymousLogin = async (): Promise<string> => {
  if (!auth) {
    throw new Error("Firebase yapılandırması eksik.");
  }
  if (auth.currentUser?.uid) {
    return auth.currentUser.uid;
  }

  const res = await signInAnonymously(auth);
  return res.user.uid;
};
