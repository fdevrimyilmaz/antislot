/**
 * Urge Intervention Entry Point
 * 
 * Redirects to detect screen to start the urge intervention flow.
 */

import { useEffect } from 'react';
import { router } from 'expo-router';
import { useUrgeStore } from '@/store/urgeStore';

export default function UrgeIndexScreen() {
  const activeUrge = useUrgeStore((state) => state.activeUrge);
  const hydrated = useUrgeStore((state) => state.hydrated);

  useEffect(() => {
    if (!hydrated) return;
    router.replace(activeUrge ? '/urge/intervene' : '/urge/detect');
  }, [activeUrge, hydrated]);

  return null;
}
