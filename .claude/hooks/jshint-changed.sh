#!/bin/sh
# PostToolUse hook: lint an edited widget source file with jshint using the repo .jshintrc.
# No-ops quietly on anything that isn't a hand-written widget JS file, and if jshint
# can't be resolved (nothing is installed by default in this repo).

f=$(jq -r '.tool_input.file_path // .tool_response.filePath // empty')
[ -n "$f" ] || exit 0

case "$f" in
  */src/*/widget/*.js) ;;
  *) exit 0 ;;
esac
case "$f" in
  */lib/*) exit 0 ;;
esac

root=$(git -C "$(dirname "$f")" rev-parse --show-toplevel 2>/dev/null) || exit 0

if [ -x "$root/node_modules/.bin/jshint" ]; then
  JSHINT="$root/node_modules/.bin/jshint"
elif command -v jshint >/dev/null 2>&1; then
  JSHINT=jshint
else
  exit 0
fi

out=$("$JSHINT" --config "$root/.jshintrc" "$f" 2>&1) && exit 0

printf '%s\n' "$out" | jq -Rsc '{
  hookSpecificOutput: {
    hookEventName: "PostToolUse",
    additionalContext: ("jshint reported issues:\n" + .)
  }
}'
