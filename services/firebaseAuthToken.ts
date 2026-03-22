import { auth } from "@/lib/firebase";
import { anonymousLogin } from "@/services/auth";

export async function getFirebaseAuthBearerToken(): Promise<string> {
  if (!auth) return "";

  if (!auth.currentUser) {
    await anonymousLogin();
  }

  const user = auth.currentUser;
  if (!user) return "";

  return user.getIdToken();
}

