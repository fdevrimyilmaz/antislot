/**
 * Crisis Decision UI Logic Tests
 * 
 * Tests for crisis decision logic in detect screen.
 */

import type { UrgeIntensity, UrgeTrigger } from '@/types/urge';
import { useUrgeStore } from '@/store/urgeStore';

/**
 * Pure function to determine if crisis choice should be shown
 * This logic matches what's used in detect.tsx
 */
export function shouldShowCrisisChoice(
  intensity: UrgeIntensity,
  trigger: UrgeTrigger | undefined
): boolean {
  const assessment = useUrgeStore.getState().assessSafety(intensity, trigger);
  return (
    assessment.level === 'crisis' ||
    assessment.recommendedAction === 'sos' ||
    intensity >= 9
  );
}

describe('Crisis Decision UI Logic', () => {
  beforeEach(() => {
    // Reset store state
    const store = useUrgeStore.getState();
    store.resetData();
  });

  it('should show crisis choice for intensity 9', () => {
    expect(shouldShowCrisisChoice(9 as UrgeIntensity, undefined)).toBe(true);
  });

  it('should show crisis choice for intensity 10', () => {
    expect(shouldShowCrisisChoice(10 as UrgeIntensity, undefined)).toBe(true);
  });

  it('should not show crisis choice for intensity 8', () => {
    expect(shouldShowCrisisChoice(8 as UrgeIntensity, undefined)).toBe(false);
  });

  it('should not show crisis choice for intensity 7', () => {
    expect(shouldShowCrisisChoice(7 as UrgeIntensity, undefined)).toBe(false);
  });

  it('should not show crisis choice for low intensity', () => {
    expect(shouldShowCrisisChoice(3 as UrgeIntensity, undefined)).toBe(false);
    expect(shouldShowCrisisChoice(5 as UrgeIntensity, undefined)).toBe(false);
  });

  it('should show crisis choice when assessment level is crisis', () => {
    // Intensity 9+ triggers crisis level
    expect(shouldShowCrisisChoice(9 as UrgeIntensity, 'emotional')).toBe(true);
  });

  it('should show crisis choice when recommended action is sos', () => {
    // Intensity 9+ triggers sos recommended action
    expect(shouldShowCrisisChoice(9 as UrgeIntensity, 'environmental')).toBe(true);
  });

  it('should work with different triggers', () => {
    expect(shouldShowCrisisChoice(9 as UrgeIntensity, 'cognitive')).toBe(true);
    expect(shouldShowCrisisChoice(9 as UrgeIntensity, 'physical')).toBe(true);
    expect(shouldShowCrisisChoice(9 as UrgeIntensity, 'social')).toBe(true);
    expect(shouldShowCrisisChoice(9 as UrgeIntensity, 'financial')).toBe(true);
    expect(shouldShowCrisisChoice(9 as UrgeIntensity, 'unknown')).toBe(true);
  });
});
