import React, { createContext, useContext, useEffect, useState } from "react";
import { anonymousLogin } from "@/services/auth";

type UserContextType = {
  uid: string | null;
  loading: boolean;
};

const UserContext = createContext<UserContextType>({
  uid: null,
  loading: true
});

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [uid, setUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const userId = await anonymousLogin();
        setUid(userId);
      } catch (error) {
        console.error("AUTH INIT ERROR", error);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  return (
    <UserContext.Provider value={{ uid, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
