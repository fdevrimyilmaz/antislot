import { getClientIdentity } from "@/services/clientIdentity";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type UserContextType = {
  uid: string | null;
  loading: boolean;
  setUid: (uid: string | null) => Promise<void>;
};

const STORAGE_KEY = "APP_USER_UID";

const UserContext = createContext<UserContextType>({
  uid: null,
  loading: true,
  setUid: async () => {}
});

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [uid, setUidState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const setUid = useCallback(async (newUid: string | null) => {
    if (newUid) {
      await AsyncStorage.setItem(STORAGE_KEY, newUid);
    } else {
      await AsyncStorage.removeItem(STORAGE_KEY);
    }
    setUidState(newUid);
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const storedUid = await AsyncStorage.getItem(STORAGE_KEY);

        if (storedUid) {
          setUidState(storedUid);
        } else {
          const userId = await getClientIdentity();
          await AsyncStorage.setItem(STORAGE_KEY, userId);
          setUidState(userId);
        }
      } catch (error) {
        console.error("AUTH INIT ERROR", error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const value = useMemo(
    () => ({ uid, loading, setUid }),
    [uid, loading, setUid]
  );

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
