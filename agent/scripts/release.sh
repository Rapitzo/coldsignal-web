#!/usr/bin/env bash
# Cut a signed triagepack release.
#
# Steps (in order):
#   1. Build the wheel + Docker image (deterministic-ish; reproducibility is a v0.2 goal).
#   2. Generate SBOM (CycloneDX + SPDX) for source and image.
#   3. Sign the wheel and the SBOMs with cosign keyless (OIDC, GitHub Actions identity).
#   4. Attest SLSA v1 provenance against the wheel.
#   5. Create the GitHub release, attach the wheel, the SBOMs, the signature bundles, and a
#      copy of agent/evals/baseline.json (the published pass-rate is read from this file).
#
# This script is meant to run inside the GitHub Actions release workflow. Local invocation
# requires GITHUB_TOKEN and a logged-in `gh`.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VERSION="${VERSION:-$(grep -E '^version' "$ROOT/pyproject.toml" | head -1 | cut -d'"' -f2)}"
TAG="v$VERSION"
OUT="$ROOT/artifacts"
mkdir -p "$OUT"

require() {
  command -v "$1" >/dev/null 2>&1 || { echo "missing dependency: $1" >&2; exit 2; }
}

require python
require syft
require cosign
require gh

echo "==> 1/5 build wheel"
( cd "$ROOT" && python -m build --wheel --outdir "$OUT" )
WHEEL="$(ls "$OUT"/triagepack-"$VERSION"*.whl | head -1)"

echo "==> 2/5 SBOM"
bash "$ROOT/scripts/build-sbom.sh"

echo "==> 3/5 cosign sign-blob (keyless)"
# COSIGN_EXPERIMENTAL=1 enables OIDC keyless signing. In CI this binds to the
# GitHub Actions OIDC identity; locally it opens a browser for OIDC.
COSIGN_EXPERIMENTAL=1 cosign sign-blob --yes \
  --bundle "$OUT/triagepack-$VERSION.cosign.bundle" \
  "$WHEEL"

for sbom in "$OUT"/sbom-"$VERSION".cdx.json "$OUT"/sbom-"$VERSION".spdx.json; do
  [ -f "$sbom" ] || continue
  COSIGN_EXPERIMENTAL=1 cosign sign-blob --yes \
    --bundle "$sbom.cosign.bundle" \
    "$sbom"
done

echo "==> 4/5 SLSA provenance attestation"
COSIGN_EXPERIMENTAL=1 cosign attest-blob --yes \
  --predicate <(jq -n \
    --arg builder "github-actions" \
    --arg digest "$(sha256sum "$WHEEL" | cut -d' ' -f1)" \
    --arg version "$VERSION" \
    '{
      builder: { id: $builder },
      buildType: "https://github.com/triagepack/release@v1",
      invocation: { configSource: { uri: "git+https://github.com/coldsignal/triagepack" } },
      materials: [{ uri: ("pkg:pypi/triagepack@" + $version), digest: { sha256: $digest } }]
    }') \
  --type slsaprovenance \
  --bundle "$OUT/triagepack-$VERSION.attestation.bundle" \
  "$WHEEL"

echo "==> 5/5 gh release create $TAG"
NOTES_FILE="$(mktemp)"
trap 'rm -f "$NOTES_FILE"' EXIT
{
  echo "## triagepack $TAG"
  echo
  echo "Audited Claude agent for incident triage. See README and SECURITY.md for the audit notes."
  echo
  if [ -f "$ROOT/evals/baseline.json" ]; then
    PASSED=$(jq -r '.passed // "n/a"' "$ROOT/evals/baseline.json")
    TOTAL=$(jq -r '.totalScenarios // 30' "$ROOT/evals/baseline.json")
    PCT=$(jq -r '(.passRate // 0) * 100 | floor' "$ROOT/evals/baseline.json")
    MEASURED=$(jq -r '.measured // false' "$ROOT/evals/baseline.json")
    if [ "$MEASURED" = "true" ]; then
      echo "**Eval baseline**: $PASSED/$TOTAL pass ($PCT%). Re-run via \`make evals\`."
    else
      echo "**Eval baseline**: not yet measured for this release."
    fi
  fi
  echo
  echo "**Verifying signatures**:"
  echo
  echo '```bash'
  echo "cosign verify-blob \\"
  echo "  --bundle triagepack-$VERSION.cosign.bundle \\"
  echo "  --certificate-identity-regexp 'https://github.com/coldsignal/triagepack/.+' \\"
  echo "  --certificate-oidc-issuer https://token.actions.githubusercontent.com \\"
  echo "  triagepack-$VERSION-py3-none-any.whl"
  echo '```'
} > "$NOTES_FILE"

ASSETS=("$WHEEL")
for f in "$OUT"/sbom-"$VERSION".cdx.json "$OUT"/sbom-"$VERSION".spdx.json \
         "$OUT"/triagepack-"$VERSION".cosign.bundle \
         "$OUT"/sbom-"$VERSION".cdx.json.cosign.bundle \
         "$OUT"/sbom-"$VERSION".spdx.json.cosign.bundle \
         "$OUT"/triagepack-"$VERSION".attestation.bundle \
         "$ROOT/evals/baseline.json"; do
  [ -f "$f" ] && ASSETS+=("$f")
done

gh release create "$TAG" \
  --title "triagepack $TAG" \
  --notes-file "$NOTES_FILE" \
  --draft \
  "${ASSETS[@]}"

echo "==> done. Draft release at $TAG. Promote with: gh release edit $TAG --draft=false"
