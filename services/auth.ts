import { signInAnonymously } from "firebase/auth";
import { auth } from "@/lib/firebase";

export const anonymousLogin = async () => {
  const res = await signInAnonymously(auth);
  return res.user.uid;
};
