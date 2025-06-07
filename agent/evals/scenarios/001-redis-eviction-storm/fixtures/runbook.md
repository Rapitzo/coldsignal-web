# session-api runbook

## Common failure modes

### redis cache eviction storm

Symptoms: 503s from `/v1/sessions`, redis logs show OOM, eviction counters climbing.

Recent change history that has caused this before:
- A new TTL'd cache write path being added without raising `maxmemory` first.
- A rolling restart of redis without warming the cache.

Mitigation:
1. Raise `maxmemory` on the cache cluster (Terraform var `redis_session_maxmemory_gb`).
2. If the offending writer is a recently-added key pattern, revert the commit that introduced it and re-deploy in a quieter window.
3. Confirm `maxmemory-policy` is `allkeys-lru`, not `noeviction`.

## Escalation

Cache infra team is `#cache-oncall`. Do not page outside business hours unless the burn rate exceeds 5x.
