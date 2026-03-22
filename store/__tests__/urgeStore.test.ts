/**
 * Urge Store Tests
 * 
 * Tests for urge detection, intervention, and logging functionality.
 */

import { storage, STORAGE_KEYS } from '@/lib/storage';
import { syncUrgeCloud } from '@/services/urgeApi';
import type {
    UrgeIntensity,
    UrgeLog,
    UrgeSettings,
    UrgeTrigger
} from '@/types/urge';
import { setUrgeSyncClient, useUrgeStore } from '../urgeStore';

jest.mock('@/services/urgeApi', () => ({
  syncUrgeCloud: jest.fn(async () => null),
}));

// Mock storage
jest.mock('@/lib/storage', () => ({
  storage: {
    get: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
  },
  STORAGE_KEYS: {
    URGE_LOGS: 'antislot_urge_logs',
    URGE_PATTERNS: 'antislot_urge_patterns',
    URGE_SETTINGS: 'antislot_urge_settings',
    URGE_FEEDBACK: 'antislot_urge_feedback',
    URGE_ACTIVE: 'antislot_urge_active',
    URGE_LAST_SYNC_AT: 'antislot_urge_last_sync_at',
  },
}));

const mockStorage = storage as jest.Mocked<typeof storage>;
const mockSyncUrgeCloud = syncUrgeCloud as jest.MockedFunction<typeof syncUrgeCloud>;

describe('UrgeStore', () => {
  beforeEach(() => {
    setUrgeSyncClient(mockSyncUrgeCloud);

    // Reset store state synchronously to avoid stale snapshots between tests
    useUrgeStore.setState({
      activeUrge: null,
      urgeLogs: [],
      patterns: [],
      settings: {
        enabled: true,
        defaultInterventions: ['breathing', 'grounding', 'delay'],
        interventionConfigs: [
          { type: 'breathing', enabled: true, defaultDuration: 60 },
          { type: 'grounding', enabled: true },
          { type: 'reframing', enabled: true },
          { type: 'redirection', enabled: true },
          { type: 'delay', enabled: true, defaultDuration: 600 },
          { type: 'support', enabled: true },
          { type: 'sos', enabled: true },
        ],
        autoLog: true,
        reminderEnabled: false,
        patternAnalysisEnabled: true,
      },
      hydrated: false,
      loading: false,
      error: null,
    });
    
    // Clear all mocks
    jest.clearAllMocks();
    mockStorage.get.mockResolvedValue(null);
    mockStorage.set.mockResolvedValue(undefined);
    mockStorage.remove.mockResolvedValue(undefined);
    mockSyncUrgeCloud.mockResolvedValue(null);
  });

  afterAll(() => {
    setUrgeSyncClient(null);
  });

  describe('startUrge', () => {
    it('should create a new urge session', async () => {
      const store = useUrgeStore.getState();
      
      const urge = await store.startUrge(5, 'emotional', 'Feeling stressed');
      
      expect(urge).toBeDefined();
      expect(urge.id).toMatch(/^urge_/);
      expect(urge.initialIntensity).toBe(5);
      expect(urge.currentIntensity).toBe(5);
      expect(urge.trigger).toBe('emotional');
      expect(urge.context).toBe('Feeling stressed');
      expect(urge.startedAt).toBeGreaterThan(0);
      expect(urge.interventions).toEqual([]);
      
      // Verify state was updated
      expect(useUrgeStore.getState().activeUrge).toEqual(urge);
      expect(mockStorage.set).toHaveBeenCalledWith(
        STORAGE_KEYS.URGE_ACTIVE,
        urge,
        { type: 'secure' }
      );
    });

    it('should return existing urge if one is already active', async () => {
      const store = useUrgeStore.getState();
      
      const firstUrge = await store.startUrge(5);
      const secondUrge = await store.startUrge(7);
      
      expect(secondUrge).toEqual(firstUrge);
      expect(useUrgeStore.getState().activeUrge).toEqual(firstUrge);
    });

    it('should create urge with minimal parameters', async () => {
      const store = useUrgeStore.getState();
      
      const urge = await store.startUrge(3);
      
      expect(urge.initialIntensity).toBe(3);
      expect(urge.currentIntensity).toBe(3);
      expect(urge.trigger).toBeUndefined();
      expect(urge.context).toBeUndefined();
    });
  });

  describe('addIntervention', () => {
    it('should add intervention and update state', async () => {
      const store = useUrgeStore.getState();
      
      await store.startUrge(5, 'emotional');
      await store.addIntervention('breathing', 60);
      
      const activeUrge = useUrgeStore.getState().activeUrge;
      expect(activeUrge).toBeDefined();
      expect(activeUrge!.interventions).toHaveLength(1);
      expect(activeUrge!.interventions[0].type).toBe('breathing');
      expect(activeUrge!.interventions[0].duration).toBe(60);
      expect(activeUrge!.interventions[0].startedAt).toBeGreaterThan(0);
      expect(activeUrge!.currentIntervention).toBe('breathing');
    });

    it('should add multiple interventions', async () => {
      const store = useUrgeStore.getState();
      
      await store.startUrge(5);
      await store.addIntervention('breathing');
      await store.addIntervention('grounding');
      
      const activeUrge = useUrgeStore.getState().activeUrge;
      expect(activeUrge!.interventions).toHaveLength(2);
      expect(activeUrge!.interventions[0].type).toBe('breathing');
      expect(activeUrge!.interventions[1].type).toBe('grounding');
      expect(activeUrge!.currentIntervention).toBe('grounding');
    });

    it('should not add intervention if no active urge', async () => {
      const store = useUrgeStore.getState();
      
      await store.addIntervention('breathing');
      
      expect(useUrgeStore.getState().activeUrge).toBeNull();
    });

    it('should not duplicate same unfinished intervention', async () => {
      const store = useUrgeStore.getState();

      await store.startUrge(5);
      await store.addIntervention('delay', 600);
      await store.addIntervention('delay', 600);

      const activeUrge = useUrgeStore.getState().activeUrge;
      expect(activeUrge!.interventions).toHaveLength(1);
      expect(activeUrge!.interventions[0].type).toBe('delay');
    });
  });

  describe('completeIntervention', () => {
    it('should complete the last intervention with effectiveness', async () => {
      const store = useUrgeStore.getState();
      
      await store.startUrge(5);
      await store.addIntervention('breathing');
      
      const beforeComplete = Date.now();
      await store.completeIntervention('very_helpful');
      const afterComplete = Date.now();
      
      const activeUrge = useUrgeStore.getState().activeUrge;
      expect(activeUrge).toBeDefined();
      expect(activeUrge!.interventions[0].completedAt).toBeGreaterThanOrEqual(beforeComplete);
      expect(activeUrge!.interventions[0].completedAt).toBeLessThanOrEqual(afterComplete);
      expect(activeUrge!.interventions[0].duration).toBeGreaterThan(0);
      expect(activeUrge!.interventions[0].effectiveness).toBe('very_helpful');
      expect(activeUrge!.currentIntervention).toBeUndefined();
    });

    it('should not complete if no active urge', async () => {
      const store = useUrgeStore.getState();
      
      await store.completeIntervention('helpful');
      
      expect(useUrgeStore.getState().activeUrge).toBeNull();
    });

    it('should store duration in seconds', async () => {
      const nowSpy = jest.spyOn(Date, 'now');
      const store = useUrgeStore.getState();

      nowSpy.mockReturnValue(1_000);
      await store.startUrge(5);

      nowSpy.mockReturnValue(1_500);
      await store.addIntervention('breathing');

      nowSpy.mockReturnValue(4_100);
      await store.completeIntervention('helpful');

      const activeUrge = useUrgeStore.getState().activeUrge;
      expect(activeUrge!.interventions[0].duration).toBe(2);
      nowSpy.mockRestore();
    });
  });

  describe('completeUrge', () => {
    it('should write log to storage and clear active urge', async () => {
      const store = useUrgeStore.getState();
      
      await store.startUrge(7, 'emotional', 'Test context');
      await store.addIntervention('breathing');
      await store.completeIntervention('helpful');
      
      const log = await store.completeUrge(3, 'very_helpful', 'Feeling better');
      
      expect(log).toBeDefined();
      expect(log.id).toBeDefined();
      expect(log.intensity).toBe(7);
      expect(log.trigger).toBe('emotional');
      expect(log.context).toBe('Test context');
      expect(log.outcome?.finalIntensity).toBe(3);
      expect(log.outcome?.effectiveness).toBe('very_helpful');
      expect(log.outcome?.note).toBe('Feeling better');
      expect(log.duration).toBeGreaterThan(0);
      expect(log.interventions).toHaveLength(1);
      
      // Verify storage was called
      expect(mockStorage.set).toHaveBeenCalledWith(
        STORAGE_KEYS.URGE_LOGS,
        expect.arrayContaining([log]),
        { type: 'secure' }
      );
      expect(mockStorage.remove).toHaveBeenCalledWith(
        STORAGE_KEYS.URGE_ACTIVE,
        { type: 'secure' }
      );
      
      // Verify active urge was cleared
      expect(useUrgeStore.getState().activeUrge).toBeNull();
      
      // Verify log was added to store
      expect(useUrgeStore.getState().urgeLogs).toContainEqual(log);
    });

    it('should throw error if no active urge', async () => {
      const store = useUrgeStore.getState();
      
      await expect(store.completeUrge(5, 'helpful')).rejects.toThrow('No active urge to complete');
    });

    it('should complete incomplete interventions before logging', async () => {
      const store = useUrgeStore.getState();
      
      await store.startUrge(5);
      await store.addIntervention('breathing');
      // Don't complete the intervention
      
      const log = await store.completeUrge(3, 'helpful');
      
      expect(log.interventions).toHaveLength(1);
      expect(log.interventions[0].completedAt).toBeDefined();
      expect(log.interventions[0].duration).toBeGreaterThan(0);
    });

    it('should limit logs to 1000 entries', async () => {
      const store = useUrgeStore.getState();
      
      // Create 1001 logs
      const existingLogs: UrgeLog[] = Array.from({ length: 1001 }, (_, i) => ({
        id: `log_${i}`,
        timestamp: Date.now() - i * 1000,
        intensity: 5 as UrgeIntensity,
        interventions: [],
        duration: 60,
      }));
      
      // Mock storage to return existing logs
      mockStorage.get.mockResolvedValueOnce(existingLogs);
      await store.hydrate();
      
      await store.startUrge(5);
      const log = await store.completeUrge(3, 'helpful');
      
      // Verify only 1000 logs are kept
      expect(useUrgeStore.getState().urgeLogs).toHaveLength(1000);
      expect(useUrgeStore.getState().urgeLogs[0]).toEqual(log);
    });
  });

  describe('hydrate', () => {
    it('should load persisted logs on app restart', async () => {
      const persistedLogs: UrgeLog[] = [
        {
          id: 'log1',
          timestamp: Date.now() - 10000,
          intensity: 7 as UrgeIntensity,
          trigger: 'emotional' as UrgeTrigger,
          interventions: [],
          duration: 120,
        },
        {
          id: 'log2',
          timestamp: Date.now() - 5000,
          intensity: 5 as UrgeIntensity,
          trigger: 'environmental' as UrgeTrigger,
          interventions: [],
          duration: 60,
        },
      ];
      
      const persistedSettings: UrgeSettings = {
        enabled: true,
        defaultInterventions: ['breathing', 'grounding'],
        interventionConfigs: [],
        autoLog: true,
        reminderEnabled: false,
        patternAnalysisEnabled: true,
      };
      
      mockStorage.get
        .mockResolvedValueOnce(persistedLogs) // logs
        .mockResolvedValueOnce([]) // patterns
        .mockResolvedValueOnce(persistedSettings) // settings
        .mockResolvedValueOnce(null); // active urge
      
      const store = useUrgeStore.getState();
      await store.hydrate();
      
      expect(useUrgeStore.getState().hydrated).toBe(true);
      expect(useUrgeStore.getState().loading).toBe(false);
      expect(useUrgeStore.getState().urgeLogs.map((log) => log.id)).toEqual(['log2', 'log1']);
      expect(useUrgeStore.getState().settings.defaultInterventions).toEqual(persistedSettings.defaultInterventions);
      expect(useUrgeStore.getState().settings.interventionConfigs.length).toBeGreaterThan(0);
      
      expect(mockStorage.get).toHaveBeenCalledWith(
        STORAGE_KEYS.URGE_LOGS,
        { type: 'secure' }
      );
    });

    it('should use default settings if none persisted', async () => {
      mockStorage.get
        .mockResolvedValueOnce([]) // logs
        .mockResolvedValueOnce([]) // patterns
        .mockResolvedValueOnce(null) // settings
        .mockResolvedValueOnce(null); // active urge
      
      const store = useUrgeStore.getState();
      await store.hydrate();
      
      expect(useUrgeStore.getState().settings.enabled).toBe(true);
      expect(useUrgeStore.getState().settings.defaultInterventions).toContain('breathing');
    });

    it('should handle hydration errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockStorage.get.mockRejectedValueOnce(new Error('Storage error'));
      
      const store = useUrgeStore.getState();
      await store.hydrate();
      
      expect(useUrgeStore.getState().hydrated).toBe(true);
      expect(useUrgeStore.getState().loading).toBe(false);
      expect(useUrgeStore.getState().error).toBe('Storage error');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[UrgeStore] Hydration error:',
        expect.any(Error)
      );
      consoleErrorSpy.mockRestore();
    });

    it('should not hydrate multiple times', async () => {
      mockStorage.get.mockResolvedValue(null);
      
      const store = useUrgeStore.getState();
      await store.hydrate();
      await store.hydrate();
      
      // Should only call storage once
      expect(mockStorage.get).toHaveBeenCalledTimes(4); // logs, patterns, settings, active
    });
  });

  describe('active urge persistence', () => {
    it('should hydrate active urge from storage', async () => {
      const persistedActiveUrge = {
        id: 'urge_active',
        startedAt: Date.now() - 5000,
        initialIntensity: 7 as UrgeIntensity,
        currentIntensity: 6 as UrgeIntensity,
        trigger: 'emotional' as UrgeTrigger,
        interventions: [],
      };

      mockStorage.get
        .mockResolvedValueOnce([]) // logs
        .mockResolvedValueOnce([]) // patterns
        .mockResolvedValueOnce(null) // settings
        .mockResolvedValueOnce(persistedActiveUrge); // active urge

      await useUrgeStore.getState().hydrate();
      expect(useUrgeStore.getState().activeUrge).toMatchObject(persistedActiveUrge);
    });

    it('should clear persisted active urge on cancel', async () => {
      const store = useUrgeStore.getState();
      await store.startUrge(6, 'social');
      await store.cancelUrge();

      expect(useUrgeStore.getState().activeUrge).toBeNull();
      expect(mockStorage.remove).toHaveBeenCalledWith(
        STORAGE_KEYS.URGE_ACTIVE,
        { type: 'secure' }
      );
    });
  });

  describe('cloud sync', () => {
    it('should send local logs and merge remote logs', async () => {
      const localLog: UrgeLog = {
        id: 'local-1',
        timestamp: Date.now() - 10_000,
        intensity: 6 as UrgeIntensity,
        trigger: 'emotional' as UrgeTrigger,
        interventions: [],
        duration: 120,
      };

      const remoteLog = {
        id: 'remote-1',
        timestamp: Date.now() - 5_000,
        intensity: 4 as UrgeIntensity,
        trigger: 'social' as UrgeTrigger,
        interventions: [],
        duration: 60,
      };

      let storedLogs: UrgeLog[] = [localLog];
      let storedPatterns: unknown[] = [];
      let storedLastSyncAt = 0;

      mockStorage.get.mockImplementation(async (key: string) => {
        if (key === STORAGE_KEYS.URGE_LOGS) return storedLogs;
        if (key === STORAGE_KEYS.URGE_PATTERNS) return storedPatterns;
        if (key === STORAGE_KEYS.URGE_LAST_SYNC_AT) return storedLastSyncAt;
        return null;
      });

      mockStorage.set.mockImplementation(async (key: string, value: unknown) => {
        if (key === STORAGE_KEYS.URGE_LOGS) {
          storedLogs = value as UrgeLog[];
        }
        if (key === STORAGE_KEYS.URGE_PATTERNS) {
          storedPatterns = value as unknown[];
        }
        if (key === STORAGE_KEYS.URGE_LAST_SYNC_AT) {
          storedLastSyncAt = Number(value ?? 0);
        }
      });

      mockSyncUrgeCloud.mockResolvedValue({
        ok: true,
        logs: [remoteLog],
        serverTime: Date.now(),
        conflicts: 0,
      });

      await useUrgeStore.getState().syncWithServer();

      expect(mockSyncUrgeCloud).toHaveBeenCalledWith({
        logs: expect.arrayContaining([
          expect.objectContaining({ id: 'local-1' }),
        ]),
        lastSyncAt: 0,
      });

      const ids = useUrgeStore.getState().urgeLogs.map((log) => log.id);
      expect(ids).toEqual(expect.arrayContaining(['local-1', 'remote-1']));
      expect(storedLastSyncAt).toBeGreaterThan(0);
    });
  });

  describe('assessSafety - crisis override logic', () => {
    it('should route to crisis for intensity >= 9', () => {
      const store = useUrgeStore.getState();
      
      const assessment9 = store.assessSafety(9 as UrgeIntensity);
      expect(assessment9.level).toBe('crisis');
      expect(assessment9.recommendedAction).toBe('sos');
      expect(assessment9.urgency).toBe('critical');
      expect(assessment9.message).toBeDefined();
      
      const assessment10 = store.assessSafety(10 as UrgeIntensity);
      expect(assessment10.level).toBe('crisis');
      expect(assessment10.recommendedAction).toBe('sos');
      expect(assessment10.urgency).toBe('critical');
    });

    it('should route to high for intensity 7-8', () => {
      const store = useUrgeStore.getState();
      
      const assessment7 = store.assessSafety(7 as UrgeIntensity);
      expect(assessment7.level).toBe('high');
      expect(assessment7.recommendedAction).toBe('helpline');
      expect(assessment7.urgency).toBe('high');
      
      const assessment8 = store.assessSafety(8 as UrgeIntensity);
      expect(assessment8.level).toBe('high');
      expect(assessment8.recommendedAction).toBe('helpline');
    });

    it('should route to moderate for intensity 5-6', () => {
      const store = useUrgeStore.getState();
      
      const assessment5 = store.assessSafety(5 as UrgeIntensity);
      expect(assessment5.level).toBe('moderate');
      expect(assessment5.recommendedAction).toBe('continue');
      expect(assessment5.urgency).toBe('medium');
      
      const assessment6 = store.assessSafety(6 as UrgeIntensity);
      expect(assessment6.level).toBe('moderate');
    });

    it('should route to safe for intensity < 5', () => {
      const store = useUrgeStore.getState();
      
      const assessment1 = store.assessSafety(1 as UrgeIntensity);
      expect(assessment1.level).toBe('safe');
      expect(assessment1.recommendedAction).toBe('continue');
      expect(assessment1.urgency).toBe('low');
      
      const assessment4 = store.assessSafety(4 as UrgeIntensity);
      expect(assessment4.level).toBe('safe');
    });

    it('should work with trigger parameter', () => {
      const store = useUrgeStore.getState();
      
      const assessment = store.assessSafety(9 as UrgeIntensity, 'emotional');
      expect(assessment.level).toBe('crisis');
      expect(assessment.recommendedAction).toBe('sos');
    });
  });

  describe('updateUrgeIntensity', () => {
    it('should update current intensity of active urge', async () => {
      const store = useUrgeStore.getState();
      
      await store.startUrge(5);
      await store.updateUrgeIntensity(8 as UrgeIntensity);
      
      expect(useUrgeStore.getState().activeUrge?.currentIntensity).toBe(8);
      expect(useUrgeStore.getState().activeUrge?.initialIntensity).toBe(5); // Should not change
    });

    it('should not update if no active urge', async () => {
      const store = useUrgeStore.getState();
      
      await store.updateUrgeIntensity(8 as UrgeIntensity);
      
      expect(useUrgeStore.getState().activeUrge).toBeNull();
    });
  });

  describe('cancelUrge', () => {
    it('should clear active urge without logging', async () => {
      const store = useUrgeStore.getState();
      
      await store.startUrge(5);
      await store.cancelUrge();
      
      expect(useUrgeStore.getState().activeUrge).toBeNull();
      expect(mockStorage.remove).toHaveBeenCalledWith(
        STORAGE_KEYS.URGE_ACTIVE,
        { type: 'secure' }
      );
    });
  });

  describe('logUrge', () => {
    it('should write log directly to storage', async () => {
      const store = useUrgeStore.getState();
      
      const logData = {
        intensity: 6 as UrgeIntensity,
        trigger: 'emotional' as UrgeTrigger,
        interventions: [],
        duration: 90,
      };
      
      const log = await store.logUrge(logData);
      
      expect(log.id).toBeDefined();
      expect(log.timestamp).toBeGreaterThan(0);
      expect(log.intensity).toBe(6);
      expect(log.trigger).toBe('emotional');
      
      expect(mockStorage.set).toHaveBeenCalledWith(
        STORAGE_KEYS.URGE_LOGS,
        expect.arrayContaining([log]),
        { type: 'secure' }
      );
    });
  });

  describe('getUrgeLogs', () => {
    it('should return logs sorted by timestamp descending', async () => {
      const store = useUrgeStore.getState();
      
      const logs: UrgeLog[] = [
        {
          id: 'log1',
          timestamp: 1000,
          intensity: 5 as UrgeIntensity,
          interventions: [],
          duration: 60,
        },
        {
          id: 'log2',
          timestamp: 2000,
          intensity: 7 as UrgeIntensity,
          interventions: [],
          duration: 120,
        },
        {
          id: 'log3',
          timestamp: 1500,
          intensity: 6 as UrgeIntensity,
          interventions: [],
          duration: 90,
        },
      ];
      
      mockStorage.get.mockResolvedValueOnce(logs);
      await store.hydrate();
      
      const retrievedLogs = store.getUrgeLogs();
      
      expect(retrievedLogs).toHaveLength(3);
      expect(retrievedLogs[0].id).toBe('log2'); // Most recent
      expect(retrievedLogs[1].id).toBe('log3');
      expect(retrievedLogs[2].id).toBe('log1');
    });

    it('should limit results when limit is provided', () => {
      const store = useUrgeStore.getState();
      
      const logs: UrgeLog[] = Array.from({ length: 10 }, (_, i) => ({
        id: `log_${i}`,
        timestamp: Date.now() - i * 1000,
        intensity: 5 as UrgeIntensity,
        interventions: [],
        duration: 60,
      }));
      
      // Set logs directly in state for testing
      useUrgeStore.setState({ urgeLogs: logs });
      
      const limitedLogs = store.getUrgeLogs(5);
      expect(limitedLogs).toHaveLength(5);
    });
  });

  describe('getRecentUrges', () => {
    it('should return urges within specified days', () => {
      const store = useUrgeStore.getState();
      const now = Date.now();
      
      const logs: UrgeLog[] = [
        {
          id: 'log1',
          timestamp: now - 1 * 24 * 60 * 60 * 1000, // 1 day ago
          intensity: 5 as UrgeIntensity,
          interventions: [],
          duration: 60,
        },
        {
          id: 'log2',
          timestamp: now - 3 * 24 * 60 * 60 * 1000, // 3 days ago
          intensity: 7 as UrgeIntensity,
          interventions: [],
          duration: 120,
        },
        {
          id: 'log3',
          timestamp: now - 8 * 24 * 60 * 60 * 1000, // 8 days ago
          intensity: 6 as UrgeIntensity,
          interventions: [],
          duration: 90,
        },
      ];
      
      useUrgeStore.setState({ urgeLogs: logs });
      
      const recent = store.getRecentUrges(7);
      expect(recent).toHaveLength(2);
      expect(recent.map(l => l.id)).toEqual(['log1', 'log2']);
    });
  });
});
