#!/usr/bin/env bash
set -euo pipefail
TASK_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
node "${NOBI_WRANGLER_CLI:?Wrangler CLI path required}" pages deploy "$TASK_ROOT/candidate/pages" --project-name nobilog --branch main --commit-dirty=true
