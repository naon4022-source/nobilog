#!/usr/bin/env bash
set -euo pipefail
TASK_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$TASK_ROOT/candidate"
npx --yes wrangler@latest pages deploy "$TASK_ROOT/candidate/pages" --project-name nobilog --branch main --commit-dirty=true
