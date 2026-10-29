#!/usr/bin/env bash
# Claude Code status line for this repo.
#
# Answers one question at a glance: how full is this session's context window,
# and is it time to start a fresh session?
#
# The canary line in CLAUDE.md cannot answer that. It lives at the start of the
# context, which is the best-retained position, so it keeps reading healthy long
# after the middle of the conversation has started to blur. This reads the real
# number instead of inferring it.
#
# Claude Code pipes session JSON to stdin; whatever we print becomes the bar.

input=$(cat)

MODEL=$(echo "$input" | jq -r '.model.display_name // "?"')
DIR=$(echo "$input" | jq -r '.workspace.current_dir // ""')
PCT=$(echo "$input" | jq -r '.context_window.used_percentage // empty' | cut -d. -f1)

BRANCH=$(git -C "${DIR:-.}" branch --show-current 2>/dev/null)
[ -n "$BRANCH" ] || BRANCH="none"

RESET=$'\033[0m'
DIM=$'\033[2m'

echo "${DIM}[${MODEL}] ${DIR##*/} · ${BRANCH}${RESET}"

# used_percentage is null before the first API response and again just after
# /compact, so treat "no number yet" as its own state rather than as 0%.
if [ -z "$PCT" ]; then
  echo "${DIM}context —${RESET}"
  exit 0
fi

if   [ "$PCT" -ge 80 ]; then COLOUR=$'\033[31m'; VERDICT="start a new session"
elif [ "$PCT" -ge 65 ]; then COLOUR=$'\033[33m'; VERDICT="getting long"
elif [ "$PCT" -ge 40 ]; then COLOUR=$'\033[32m'; VERDICT="fine"
else                         COLOUR=$'\033[32m'; VERDICT="fresh"
fi

WIDTH=20
FILLED=$(( PCT * WIDTH / 100 ))
[ "$FILLED" -gt "$WIDTH" ] && FILLED=$WIDTH
BAR=$(printf '█%.0s' $(seq 1 "$FILLED" 2>/dev/null))
BAR+=$(printf '░%.0s' $(seq 1 $(( WIDTH - FILLED )) 2>/dev/null))

echo "${COLOUR}context ${BAR} ${PCT}%${RESET} ${DIM}· ${VERDICT}${RESET}"
