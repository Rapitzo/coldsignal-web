# orders-api runbook — db pool

If `db_pool_wait` climbs and you see `TimeoutError: QueuePool limit ... reached`:

1. Look for any code path opening a connection per request rather than using the shared pool.
2. Revert the offending commit; redeploy.
3. Temporary mitigation: bump `pool_size` and `max_overflow` via env vars, but this masks the real problem.
