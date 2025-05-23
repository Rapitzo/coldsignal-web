# Security audit notes — triagepack v0.1

The April 2026 Anthropic MCP RCE disclosure landed three classes of issue:

1. **Sandbox escape via tool-output injection** — a malicious server returning crafted text the host then executes as a shell command.
2. **Unsanitised tool input** — host passes attacker-controlled strings into local subprocess calls.
3. **Out-of-band exfiltration** — server makes outbound calls to attacker domains using collected context.

Every MCP server pinned in this build has been (or will be) audited against all three.

## Pinned versions

| Server | Version | Source | Audit status |
|---|---|---|---|
| `github-mcp-server` | v0.4.2 | github.com/github/github-mcp-server | TODO Day 6 |
| `triagepack-logs` (first-party Loki/Datadog wrapper) | 0.1.0 | this repo | N/A — first-party |
| `triagepack-runbook` (first-party Notion/local-md wrapper) | 0.1.0 | this repo | N/A — first-party |

## Per-class audit checklist

For each pinned third-party server we record the answer to:

- [ ] **Sandbox escape**: does the server return text that the host renders or executes? If yes, document the sanitisation applied on the host side.
- [ ] **Tool-input handling**: are tool arguments passed to subprocess, eval, or template engines on the server side? If yes, document the validator and parameterisation.
- [ ] **Outbound network**: what domains does this server contact? Are they on the Docker sandbox allowlist?

A server cannot be added to `pyproject.toml` until its row above is filled in and a CEO sign-off is recorded on [LIN-4](/LIN/issues/LIN-4).

## Build artefacts

- **SBOM**: `syft agent/ -o cyclonedx-json > artifacts/sbom-${VERSION}.cdx.json` (Day 6).
- **Signed release**: GitHub release attestation via `cosign sign-blob --yes ${ARTIFACT}` using the org keyless identity.
- **Provenance**: SLSA v1 provenance attached via `cosign attest`.

## Sandbox config (recommended Docker recipe)

See `docker/Dockerfile` and `docker/docker-compose.yml` (lands Day 6). Key invariants:

- Read-only root filesystem; only `/tmp` writeable, `tmpfs` mount, 100 MB cap.
- No host network. Egress allowlist enforced by an `iptables` init container limited to: `api.anthropic.com`, `api.github.com`, `slack.com`, `events.pagerduty.com`, plus the buyer-configured logs and runbook hosts.
- Capabilities dropped to none; `no-new-privileges` set.
- Seccomp profile: default Docker, with explicit deny for `ptrace`, `mount`, `kexec_load`.
