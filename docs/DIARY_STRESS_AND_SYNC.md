# Diary Stress & Cloud Sync Validation

This runbook validates diary reliability under repeated write/sync cycles.

## 1) Emulator E2E

### Build
```bash
npm run e2e:detox:build:android
```

### Basic diary flow
```bash
npm run e2e:detox:test:android:diary
```

### Stress flow (repeated save/update)
```bash
npm run e2e:detox:test:android:diary-stress
```

## 2) Real Device Soak (Maestro)

### Basic flow
```bash
maestro test e2e/maestro/diary-flow.yaml
```

### Stress flow
```bash
maestro test e2e/maestro/diary-stress-flow.yaml
```

## 3) Cloud Sync Conflict Checks

Use at least 2 devices signed into the same account:

1. Device A: create/update diary note.
2. Device B: update same date with different content.
3. Trigger sync on both devices (open diary and wait a few seconds).
4. Verify conflict rule:
   - Latest `updatedAt` wins.
   - If timestamps are equal, deterministic tie-break is applied.

## Acceptance Criteria

- Diary screen remains responsive across repeated saves.
- No crashes or hangs during stress flow.
- Same user on multiple devices converges to one final entry per date.
- Deletions propagate via tombstones (entry does not reappear after sync).
