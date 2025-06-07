# auth-gateway runbook

## 401 spike on a single pod

Most often this is a clock-skew issue between the issuing service and the validating gateway.

Mitigation:
1. Check `chronyc sources` / `ntpq -p` on the affected hosts. Look for stratum 16 or "no association".
2. Force resync: `chronyc makestep` or restart `systemd-timesyncd`.
3. If the host clock is healthy, look at the `nbf` (not-before) and `iat` (issued-at) claims on a sample failing token.

## Long-term

We accept up to 30s of clock skew via `JWT_CLOCK_SKEW_TOLERANCE_SEC`. Bumping it above that means tokens will validate even when something is genuinely broken — do not change without a postmortem.
