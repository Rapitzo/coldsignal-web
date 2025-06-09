#!/usr/bin/env bash
# Run the dependency audit referenced in SECURITY.md.
#
# Resolves pyproject.toml pins, runs pip-audit --strict against the resolved
# set, and returns non-zero on any known CVE. This is the gate the release
# pipeline blocks on; do not waive it.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if ! command -v pip-audit >/dev/null 2>&1; then
  echo "pip-audit not installed. Install: pip install pip-audit==2.7.3" >&2
  exit 2
fi
if ! command -v pip-compile >/dev/null 2>&1; then
  echo "pip-compile not installed. Install: pip install pip-tools" >&2
  exit 2
fi

echo "==> resolving pyproject.toml pins"
RESOLVED="$(mktemp)"
trap 'rm -f "$RESOLVED"' EXIT
( cd "$ROOT" && pip-compile --quiet pyproject.toml --output-file "$RESOLVED" )

echo "==> pip-audit (strict)"
pip-audit --strict --requirement "$RESOLVED"

echo "==> done. Zero known CVEs across the pin set."
