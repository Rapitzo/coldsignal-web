# Release runbook — triagepack

The release pipeline is `agent/scripts/release.sh`. It signs the wheel and the SBOMs with cosign keyless (OIDC), attests SLSA v1 provenance, and creates a draft GitHub release with all artefacts attached.

This runbook is the human cheat sheet around it.

## Cadence in cycle 1

| Day | Action |
|---:|:---|
| 9 | Internal calibration eval run. Bring the number to CEO before doing anything else. |
| 10 | Stripe live mode flips. Landing page must already display the Day 9 number under pillar 2. |
| 11 | SECURITY.md draft to CEO by EOD. |
| 12 | CEO sign-off on SECURITY.md. Release dry-run on a `v0.1.0-rc1` tag (signed, draft, not promoted). |
| 13 | Final eval run. Overwrites `agent/evals/baseline.json` regardless of whether the number is better or worse than Day 9 (this is the honesty rail; see `evals/run.py`). Real `v0.1.0` release cut. |
| 14 | Public ship: promote draft release, post to Smithery + MCP Market, outreach to 30 SRE/DevOps targets. |

## Pre-flight checklist (before running `release.sh`)

- [ ] `pyproject.toml` version matches the intended tag (`v$VERSION`).
- [ ] `agent/SECURITY.md` reflects the current dependency set.
- [ ] `make audit` is clean.
- [ ] `make sbom` produces both `.cdx.json` and `.spdx.json` artefacts.
- [ ] The eval harness has been run with `--write-baseline` against the current build, and the resulting `agent/evals/baseline.json` is what we want on the release page.
- [ ] `cosign version` reports >= 2.2.
- [ ] `gh auth status` shows we're logged in as the release principal.

## Honesty rail (do not skip)

The Day 13 measurement is the shipping number. It overwrites whatever Day 9 left behind. There is no "best of" selection logic in `evals/run.py --write-baseline`; it always replaces. If the Day 13 number is worse than Day 9, we publish Day 13 and that's the headline. Buyers can re-run on their infra, so anything we publish has to be verifiable.

## After the draft release lands

1. Walk through the draft as a buyer. Click each asset, verify the wheel installs in a fresh venv, verify `cosign verify-blob` against the bundle.
2. Promote: `gh release edit $TAG --draft=false`.
3. Submit to Smithery + MCP Market with the GitHub release URL.
4. Update Stripe product description with the live release URL.

## If the build fails after partial signing

`release.sh` is mostly idempotent — re-running overwrites the artefacts. The one thing to watch is the GitHub release: if a draft already exists at `$TAG`, `gh release create` errors. Either delete the draft (`gh release delete $TAG --yes`) or edit in place (`gh release upload $TAG ...`).
