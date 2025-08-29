#!/bin/bash
curl -sS https://connect.squareup.com/v2/locations \
  -H "Square-Version: 2025-07-16" \
  -H "Authorization: Bearer $SQUARE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" | jq '.locations[] | {id, name}'

SINCE="$(date -u -d '7 days ago' +%Y-%m-%dT%H:%M:%SZ)"
curl -sS "https://connect.squareup.com/v2/payments?begin_time=$SINCE&limit=2&sort_order=DESC" \
  -H "Square-Version: 2025-07-16" \
  -H "Authorization: Bearer $SQUARE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" | jq '{count: (.payments|length), cursor}'

