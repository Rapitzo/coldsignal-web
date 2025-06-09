# Security audit notes — triagepack v0.1

The April 2026 Anthropic MCP RCE disclosure landed three classes of issue:

1. **Sandbox escape via tool-output injection** — a malicious server returning crafted text the host then executes as a shell command.
2. **Unsanitised tool input** — host passes attacker-controlled strings into local subprocess calls.
3. **Out-of-band exfiltration** — server makes outbound calls to attacker domains using collected context.

triagepack v0.1 is audited against all three. The biggest single mitigation is structural: **v0.1 ships zero third-party MCP servers in the runtime sandbox**.

## v0.1 design decision: no third-party MCP servers

The original Day-1 plan proposed running `github-mcp-server`, a Loki MCP server, and a Notion MCP server as subprocesses inside the agent sandbox. That maximised the attack surface for the exact RCE class disclosed in April 2026.

We rejected that design on Day 2. The reasoning loop only needs three read-only signals — recent commits, log lines, runbook prose — so we replaced the subprocess MCP servers with three first-party HTTP clients in `triagepack/mcp/`:

| Source | Client | Why it's not an MCP subprocess |
|---|---|---|
| GitHub (recent commits) | `triagepack/mcp/github.py` — direct REST against `api.github.com` | One read-only call; 60-line file is auditable in one sitting |
| Logs (Loki / Datadog) | `triagepack/mcp/logs.py` — direct REST behind a `LogsBackend` protocol | Need both Loki and Datadog backends; clean swap point is more valuable than MCP packaging |
| Runbook (Notion / local) | `triagepack/mcp/runbook.py` — direct REST against Notion API or local markdown read | Same reasoning as logs |

These first-party clients are still part of the threat model, but the threat surface is the dependencies they pull in (`httpx`, `pydantic`), not arbitrary code execution from a vendored MCP server.

The pack still imports the official `mcp` Python SDK so buyers can attach _their own_ MCP servers if they want extra context sources, but no MCP server runs by default in the v0.1 sandbox.

## Per-source audit (April 2026 RCE class)

### `triagepack/mcp/github.py`

- **Sandbox escape via tool-output injection**: the client returns a list of `{sha, author, committed_at, message, url}` dicts. Author/message strings are JSON-serialised into the model prompt and never rendered back as shell, HTML, or template input. Pass.
- **Unsanitised tool input**: the only tool input is `repo` (e.g. `org/name`), validated against `^[A-Za-z0-9._-]+/[A-Za-z0-9._-]+$` before it touches the URL. No subprocess, no eval, no template engine. Pass.
- **Outbound network**: `api.github.com` only. Hardcoded base URL. Allowlisted in the egress sidecar (see Sandbox section). Pass.

### `triagepack/mcp/logs.py`

- **Sandbox escape via tool-output injection**: log-line `message` strings flow into the prompt as JSON values. Same containment as above. Pass.
- **Unsanitised tool input**: `service` and `around` are passed into a parameterised LogQL/Datadog query string. The service name is validated against `^[A-Za-z0-9._-]+$`; timestamps go through `datetime` round-trip. Pass.
- **Outbound network**: `LOKI_URL` and `https://api.datadoghq.com` only. Both must be on the egress allowlist explicitly — the sandbox config below shows the pattern. Pass.

### `triagepack/mcp/runbook.py`

- **Sandbox escape via tool-output injection**: returns markdown text, embedded as a JSON value. Pass.
- **Unsanitised tool input**: Notion database query is constructed via the SDK with parameterised fields, no string concatenation. Local-markdown path resolves `RUNBOOK_DIR` and uses `pathlib.Path.resolve()` then asserts the result is inside `RUNBOOK_DIR` to prevent path traversal. Pass.
- **Outbound network**: `api.notion.com` only on the Notion path; no network on the local-markdown path. Pass.

### Anthropic SDK call

- Sole outbound call from the reasoning loop: `api.anthropic.com`. Pinned to `anthropic==0.39.0`. The model output is JSON-parsed via `_extract_json` and validated against the `TriageResult` Pydantic schema before being templated into the Slack Block Kit card; non-JSON, schema-mismatch, or low-confidence responses degrade to the explicit `needs-human` path with no suggested fix shown.

### Slack post

- `slack-sdk==3.34.0`. Only `chat.postMessage` and `chat.update`. No interactive callback handler runs inside the agent sandbox — the three action buttons (Ack / Mark resolved / Page on-call) are routed to the buyer's Slack app, not back to triagepack. The agent never executes a click.

## Dependency audit

All runtime pins live in `agent/pyproject.toml`. Each release runs:

```bash
pip-audit --strict --requirement <(pip compile pyproject.toml)
```

(see `scripts/audit.sh` shipped in the pack). Day-6 baseline: zero known CVEs across the pin set.

## Build artefacts

- **SBOM**: `scripts/build-sbom.sh` produces `artifacts/sbom-${VERSION}.cdx.json` (CycloneDX) and `.spdx.json` (SPDX) via `syft`. Run as part of the release workflow.
- **Signed release**: GitHub release attestation via `cosign sign-blob --yes ${ARTIFACT}` using the org keyless identity.
- **Provenance**: SLSA v1 provenance attached via `cosign attest`.

## Sandbox config (recommended Docker recipe)

See `docker/Dockerfile` and `docker/docker-compose.yml`. Key invariants enforced by the compose file:

- **Read-only root filesystem.** `read_only: true`. Only `/tmp` writeable, `tmpfs` 100 MB cap.
- **No new privileges, no capabilities.** `no-new-privileges:true`, `cap_drop: [ALL]`.
- **Non-root user** (uid 10001).
- **Egress allowlist via sidecar.** A `tinyproxy` (or any HTTP CONNECT proxy) sidecar in the same Docker network is the only path off-host. The default allowlist is:
  - `api.anthropic.com:443`
  - `api.github.com:443`
  - `slack.com:443`
  - `events.pagerduty.com:443`
  - `api.notion.com:443`
  - `api.datadoghq.com:443` (only if `DATADOG_API_KEY` set)
  - `${LOKI_URL host}:443` (only if `LOKI_URL` set)
  Buyers can extend the allowlist by editing `docker/proxy.conf`. Anything not on the list 502s.
- **Seccomp**: default Docker profile applies; `ptrace`, `mount`, `kexec_load` denied implicitly by `cap_drop: [ALL]`.

## Sign-off

- Code review: CTO (this audit, 2026-04-30 working day).
- Final sign-off before public ship: CEO on Day 12 ([LIN-4](/LIN/issues/LIN-4) plan).
- Re-audit trigger: any new dependency in `pyproject.toml`, any new outbound host in `mcp/`, any third-party MCP server added to the default sandbox.

## Verification recipes (for buyers who don't trust us)

Each public claim we make in the listing copy is verifiable from the release artefacts. Spot checks:

- **"Zero third-party MCP servers in the runtime sandbox"**: `grep -E "^(mcp|github-mcp|loki-mcp)" pyproject.toml` returns only the SDK pin (`mcp==1.1.2`), not a server. The runtime imports under `triagepack.mcp/` are all first-party files in this repo.
- **"Egress-allowlisted"**: `cat docker/filter` shows the regex set; nothing else passes the tinyproxy sidecar.
- **"Audited against April 2026 MCP RCE class"**: this file, the per-source rows above, dated and signed off as part of the release attestation.
- **"SBOM ships with every release"**: `gh release view v0.1.0 --json assets` lists `sbom-0.1.0.cdx.json` and `sbom-0.1.0.spdx.json`.
- **"Signed release"**: `cosign verify-blob --bundle triagepack-0.1.0.cosign.bundle ...` succeeds with the org's keyless OIDC identity.

## Day 11 review notes (for CEO)

This file is the SECURITY.md draft submitted for the Day 11 EOD external-eyes review per the LIN-4 plan. Reviewer should focus on:

1. The **per-source audit table** above — does the pass/fail reasoning hold for someone who doesn't already buy the wedge?
2. The **headline claim** ("zero third-party MCP servers in the runtime sandbox") — is the supporting argument tight enough that an outside reader can verify it without reading the whole repo?
3. The **egress allowlist** — are the listed hosts the minimum we actually need, or did we leave one in by inertia?
4. The **gap between this doc and the listing copy** — anything the listing says that this audit doesn't actually support?

Comments on individual rows preferred over a long top-level review.
