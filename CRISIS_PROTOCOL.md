# Crisis Protocol (Offline-First)

## Scope
- Works without AI or network.
- Entry points: `app/urge/detect.tsx` (intensity 9-10), `app/urge/crisis.tsx`.
- Protocol source of truth: `services/crisisProtocol.ts`.

## Standard Flow
1. Immediate safety check: if life-threatening risk, call `112`.
2. Regulation: run a 60-second `4-4-6` breathing cycle.
3. Trigger distance: close gambling apps/sites and move to a safer context.
4. Human support: call `YEDAM 115` or `Alo 183`.

## Built-in Referrals
- `112`: emergency response.
- `115`: addiction support (YEDAM).
- `183`: social support and SMS channel.

## Product Rules
- No guilt/moral framing in crisis UI copy.
- Crisis actions must remain available even if AI backend is down.
- SOS access remains visible in all urge intervention screens.

