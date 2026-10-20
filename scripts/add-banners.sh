#!/usr/bin/env bash
# Adds two announcements to the home slider through the API: the GPMF event and a free webinar.
# Usage: ./scripts/add-banners.sh                      (API on http://localhost:8080, dev admin account)
#        API=https://api.example.com ADMIN_EMAIL=you@x.sa ADMIN_PASSWORD=secret ./scripts/add-banners.sh
# Edit the text below, or change them later in Admin > Announcements.
set -euo pipefail
API="${API:-http://localhost:8080}"
EMAIL="${ADMIN_EMAIL:-admin@gba.local}"
PASS="${ADMIN_PASSWORD:-Admin@12345}"

TOKEN=$(curl -fsS -X POST "$API/api/v1/auth/login" -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}" | python3 -c 'import sys,json; print(json.load(sys.stdin)["token"])')

post() {
  curl -fsS -X POST "$API/api/v1/admin/banners" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d "$1" >/dev/null
}

post '{
  "title":    {"ar":"المنتدى العالمي لإدارة المشاريع GPMF 2026","en":"Global Project Management Forum GPMF 2026"},
  "subtitle": {"ar":"سجّل الآن واحجز مقعدك في أكبر تجمّع لقادة المشاريع","en":"Register now and reserve your seat at the biggest gathering of project leaders"},
  "ctaLabel": {"ar":"زيارة موقع GPMF","en":"Visit the GPMF website"},
  "linkUrl": "https://gpmf.world", "theme": "navy", "active": true, "sortOrder": 10
}'
echo "added: GPMF event banner"

post '{
  "title":    {"ar":"ندوة مجانية: ابدأ مسارك المهني","en":"Free webinar: start your career path"},
  "subtitle": {"ar":"جلسة مباشرة مجانية مع خبراء الأكاديمية","en":"A free live session with the academy experts"},
  "ctaLabel": {"ar":"سجّل مجانًا","en":"Register free"},
  "linkUrl": "/courses", "theme": "gold", "active": true, "sortOrder": 11
}'
echo "added: free webinar banner"
echo "Open http://localhost:3000/ar to see the slider."
