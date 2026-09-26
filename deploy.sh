#!/usr/bin/env bash
# Usage: ./deploy.sh ["commit message"]   (token: HOSTINGER_API_TOKEN in env or .env.deploy)
set -euo pipefail
cd "$(dirname "$0")"

[ -f .env.deploy ] && source .env.deploy
: "${HOSTINGER_API_TOKEN:?Set HOSTINGER_API_TOKEN in .env.deploy}"

HOSTINGER_USER=u576200460
API_DOMAIN=api.narayanenterprise.in
WEB_DOMAIN=narayanenterprise.in
API_BASE=https://developers.hostinger.com/api/hosting/v1
OUT=$(mktemp -d)
trap 'rm -rf "$OUT"' EXIT

hapi() {
  local method=$1 path=$2; shift 2
  curl -sf -X "$method" -H "Authorization: Bearer $HOSTINGER_API_TOKEN" -H 'Content-Type: application/json' "$@" "$API_BASE$path"
}
json() { node -pe "JSON.parse(require('fs').readFileSync(0)).$1"; }

upload() {
  local domain=$1 file=$2 name size creds url ak rk
  name=$(basename "$file"); size=$(wc -c < "$file" | tr -d ' ')
  creds=$(hapi POST /files/upload-urls -d "{\"username\":\"$HOSTINGER_USER\",\"domain\":\"$domain\"}")
  url=$(json url <<< "$creds"); ak=$(json auth_key <<< "$creds"); rk=$(json rest_auth_key <<< "$creds")
  local tus=(-H "X-Auth: $ak" -H "X-Auth-Rest: $rk" -H "Tus-Resumable: 1.0.0")
  curl -sf -o /dev/null -X POST "$url/$name?override=true" "${tus[@]}" -H "Upload-Length: $size" -H "Upload-Offset: 0"
  curl -sf -o /dev/null -X PATCH "$url/$name?override=true" "${tus[@]}" \
    -H "Content-Type: application/offset+octet-stream" -H "Upload-Offset: 0" --data-binary "@$file"
}

deploy() {
  local domain=$1 file=$2 settings=$3 builds id state
  builds=/accounts/$HOSTINGER_USER/websites/$domain/nodejs/builds
  echo "→ $domain: uploading $(du -h "$file" | cut -f1)"
  upload "$domain" "$file"
  hapi PUT "$builds/settings" -d "$settings" > /dev/null
  id=$(hapi POST "$builds" -d "${settings%\}},\"source_type\":\"archive\",\"source_options\":{\"archive_path\":\"$(basename "$file")\"}}" | json uuid)
  echo "→ $domain: building $id"
  while state=$(hapi GET "$builds/$id" | json state); [[ $state == pending || $state == running ]]; do sleep 10; done
  if [[ $state != completed ]]; then
    hapi GET "$builds/$id/logs" | json logs | tail -20
    echo "✗ $domain: build $state" >&2; exit 1
  fi
  echo "✓ $domain: deployed"
}

wait_live() {
  for _ in $(seq 1 18); do
    [[ $(curl -s -o /dev/null -w '%{http_code}' "$1") == 200 ]] && { echo "✓ live: $1"; return; }
    sleep 10
  done
  echo "✗ not responding: $1" >&2; exit 1
}

branch=$(git rev-parse --abbrev-ref HEAD)
[[ $branch == main ]] || { echo "Switch to main first (on $branch)" >&2; exit 1; }

echo "→ building backend"
npm run build > /dev/null
zip -qr "$OUT/backend.zip" dist src package.json package-lock.json tsconfig.json nest-cli.json -x '*.DS_Store' '*.tsbuildinfo'

echo "→ building frontend"
(cd frontend && rm -rf .next && NEXT_PUBLIC_API_URL=https://$API_DOMAIN/api npm run build > /dev/null)
(cd frontend && zip -qr "$OUT/frontend.zip" .next public src package.json package-lock.json next.config.ts \
  tsconfig.json postcss.config.mjs next-env.d.ts -x '.next/cache/*' '*.DS_Store')

if [[ -n $(git status --porcelain) ]]; then
  git add -A
  git commit -m "${1:-deploy: $(date '+%Y-%m-%d %H:%M')}"
fi
git push origin main

(
  deploy "$API_DOMAIN" "$OUT/backend.zip" \
    '{"node_version":22,"app_type":"express","root_directory":".","output_directory":null,"build_script":"build:prod","entry_file":"dist/main.js","package_manager":"npm"}'
  wait_live "https://$API_DOMAIN/api/products?limit=1"
) &
backend=$!
(
  deploy "$WEB_DOMAIN" "$OUT/frontend.zip" \
    '{"node_version":22,"app_type":"next","root_directory":".","output_directory":".next","build_script":"build:prod","entry_file":null,"package_manager":"npm"}'
  hapi DELETE "/accounts/$HOSTINGER_USER/websites/$WEB_DOMAIN/cache/clear" > /dev/null
  wait_live "https://$WEB_DOMAIN/"
) &
frontend=$!

failed=0
wait $backend || failed=1
wait $frontend || failed=1
[[ $failed == 0 ]] || { echo "✗ Deploy failed" >&2; exit 1; }

echo "✓ Deployed $(git rev-parse --short HEAD) to https://$WEB_DOMAIN and https://$API_DOMAIN"
