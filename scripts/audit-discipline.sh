#!/usr/bin/env bash
# §0.9 audit greps — STYLE_DISCIPLINE.md
# Run before every PR. Each block prints a header; a clean run shows zero offending lines.

set -u

cd "$(dirname "$0")/.."

red()   { printf '\033[31m%s\033[0m\n' "$1"; }
green() { printf '\033[32m%s\033[0m\n' "$1"; }
gray()  { printf '\033[90m%s\033[0m\n' "$1"; }

fail=0

heading() {
  echo
  printf '\033[1m%s\033[0m\n' "$1"
}

run() {
  local label="$1"; shift
  local expected_zero="$1"; shift
  local pattern="$1"; shift
  heading "$label"
  local out
  out=$(grep -rnE "$pattern" "$@" 2>/dev/null || true)
  if [[ -z "$out" ]]; then
    green "  ok — no matches"
  else
    if [[ "$expected_zero" == "1" ]]; then
      red "  FAIL — must be zero matches:"
      echo "$out" | sed 's/^/    /'
      fail=1
    else
      gray "  $(echo "$out" | wc -l | tr -d ' ') hits — audit each against §0.2 allow-list:"
      echo "$out" | sed 's/^/    /'
    fi
  fi
}

run "text-xs (audit each against §0.2 allow-list)" 0 'text-xs'                       src/
run "text-[10/11/12px] arbitrary values"            1 'text-\[1[012]px\]'             src/
run "Hardcoded hex colors"                          0 '#[0-9a-fA-F]{3,6}'             src/
run "Unicode arrows in copy"                        1 '[←→↑↓»]'                       src/
run "Inline <svg>"                                  1 '<svg'                          src/
run "Sticky <thead>"                                1 'sticky.*thead'                 src/
run "max-width on <main>"                           1 'max-w-.*main|main.*max-w'      src/
run "ChevronLeft on Назад"                          1 '<ChevronLeft.*Назад'           src/
run "uppercase tracking-wider on data-table headers" 1 'uppercase tracking-wider'     src/components/shared/DataTable

echo
if [[ $fail -eq 0 ]]; then
  green "✓ §0.9 audit clean"
  exit 0
else
  red "✗ §0.9 audit has violations — see above"
  exit 1
fi
