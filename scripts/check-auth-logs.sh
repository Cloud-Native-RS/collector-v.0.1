#!/bin/bash

# Script to check authentication debug logs
LOG_FILE="/tmp/collector-auth-debug.log"

echo "=== Authentication Debug Log ==="
echo ""

# Try to get logs from API first
echo "Fetching logs from API..."
API_LOGS=$(curl -s http://localhost:3000/api/auth/get-debug-logs 2>/dev/null)
if [ $? -eq 0 ] && echo "$API_LOGS" | grep -q "success"; then
    echo "$API_LOGS" | jq -r '.logs[] | "\(.timestamp) [\(.level)] \(.message) \(.data // "" | tostring)"' 2>/dev/null || echo "$API_LOGS"
    echo ""
fi

# Also check local file
if [ -f "$LOG_FILE" ]; then
    echo "--- Local log file ---"
    tail -100 "$LOG_FILE" | while IFS= read -r line; do
        if [ -n "$line" ]; then
            echo "$line" | jq -r '.timestamp + " [" + .level + "] " + .message + (if .data then " | " + (.data | tostring) else "" end)' 2>/dev/null || echo "$line"
        fi
    done
else
    echo "Log file not found at $LOG_FILE"
    echo "Make sure you've attempted to login at least once"
fi

echo ""
echo "=== End of Log ==="
echo ""
echo "To view logs in browser:"
echo "  1. Open DevTools (F12)"
echo "  2. Go to Console tab - look for [AUTH DEBUG] messages"
echo "  3. Or check Application → Local Storage → auth_debug_logs"
echo ""
echo "To clear logs: rm $LOG_FILE"
echo "To follow logs in real-time: tail -f $LOG_FILE"

