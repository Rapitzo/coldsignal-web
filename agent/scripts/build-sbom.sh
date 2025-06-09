#!/usr/bin/env bash
# Generate SBOM for the triagepack release.
# Outputs CycloneDX + SPDX in artifacts/. Idempotent — safe to re-run.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VERSION="${VERSION:-$(grep -E '^version' "$ROOT/pyproject.toml" | head -1 | cut -d'"' -f2)}"
OUT="$ROOT/artifacts"
mkdir -p "$OUT"

if ! command -v syft >/dev/null 2>&1; then
  echo "syft not found. Install: https://github.com/anchore/syft" >&2
  exit 2
fi

# Source SBOM (Python deps from pyproject.toml + the sandbox Dockerfile).
echo "==> SBOM (source) version=$VERSION"
syft "dir:$ROOT" \
  --source-name triagepack \
  --source-version "$VERSION" \
  -o cyclonedx-json="$OUT/sbom-$VERSION.cdx.json" \
  -o spdx-json="$OUT/sbom-$VERSION.spdx.json"

# Image SBOM (after `docker compose build`).
if docker image inspect "triagepack:$VERSION" >/dev/null 2>&1; then
  echo "==> SBOM (image) triagepack:$VERSION"
  syft "triagepack:$VERSION" \
    -o cyclonedx-json="$OUT/sbom-image-$VERSION.cdx.json" \
    -o spdx-json="$OUT/sbom-image-$VERSION.spdx.json"
else
  echo "    (skip image SBOM: triagepack:$VERSION not built locally)"
fi

# Secondary check: pip-audit against the pinned set. Non-zero exits the script.
if command -v pip-audit >/dev/null 2>&1; then
  echo "==> pip-audit"
  ( cd "$ROOT" && pip-audit --strict --requirement <(pip-compile --quiet pyproject.toml --output-file -) )
else
  echo "    (skip pip-audit: not installed)"
fi

echo "==> done. Artifacts in $OUT"
ls -la "$OUT"
