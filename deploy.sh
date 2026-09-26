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

status() { echo "$2|$3" > "$OUT/$1.status"; }

# Build time on Hostinger is unknown, so the bar creeps from 40% toward 85% over ~60s.
deploy() {
  local name=$1 domain=$2 file=$3 settings=$4 builds id state started
  builds=/accounts/$HOSTINGER_USER/websites/$domain/nodejs/builds
  status "$name" 10 "Uploading $(du -h "$file" | cut -f1 | tr -d ' ')"
  upload "$domain" "$file"
  status "$name" 30 "Starting build"
  hapi PUT "$builds/settings" -d "$settings" > /dev/null
  id=$(hapi POST "$builds" -d "${settings%\}},\"source_type\":\"archive\",\"source_options\":{\"archive_path\":\"$(basename "$file")\"}}" | json uuid)
  started=$SECONDS
  while state=$(hapi GET "$builds/$id" | json state); [[ $state == pending || $state == running ]]; do
    local elapsed=$((SECONDS - started))
    status "$name" $((40 + (elapsed > 60 ? 45 : elapsed * 45 / 60))) "Building on Hostinger"
    sleep 3
  done
  if [[ $state != completed ]]; then
    hapi GET "$builds/$id/logs" | json logs | tail -20 > "$OUT/$name.log"
    status "$name" -1 "Build $state"; exit 1
  fi
}

wait_live() {
  local name=$1 url=$2
  status "$name" 90 "Waiting for site"
  for _ in $(seq 1 60); do
    [[ $(curl -s -o /dev/null -w '%{http_code}' "$url") == 200 ]] && { status "$name" 100 "Live"; return; }
    sleep 3
  done
  status "$name" -1 "Not responding: $url"; exit 1
}

render() {
  local tty=0 last="" frame n pct label bar i fill line
  [[ -t 1 ]] && tty=1
  while :; do
    frame=""
    for n in backend frontend; do
      IFS='|' read -r pct label < "$OUT/$n.status"
      if [[ $pct == -1 ]]; then fill=0; label="✗ $label"; else fill=$((pct * 30 / 100)); fi
      bar=""; for ((i = 0; i < 30; i++)); do ((i < fill)) && bar+="█" || bar+="░"; done
      frame+=$(printf '%-9s %s %4s  %s' "$n" "$bar" "$([[ $pct == -1 ]] && echo ' ' || echo "$pct%")" "$label")$'\n'
    done
    if ((tty)); then
      [[ -n $last ]] && printf '\033[3A'
      while IFS= read -r line; do printf '%s\033[K\n' "$line"; done <<< "${frame%$'\n'}"
      printf '          elapsed %d:%02d\033[K\n' $((SECONDS / 60)) $((SECONDS % 60))
    elif [[ $frame != "$last" ]]; then
      printf '%s' "$frame"
    fi
    last=$frame
    [[ -f $OUT/done ]] && break
    sleep 1
  done
}

branch=$(git rev-parse --abbrev-ref HEAD)
[[ $branch == main ]] || { echo "Switch to main first (on $branch)" >&2; exit 1; }

echo "→ Building backend"
npm run build > /dev/null
zip -qr "$OUT/backend.zip" dist src package.json package-lock.json tsconfig.json nest-cli.json -x '*.DS_Store' '*.tsbuildinfo'

echo "→ Building frontend"
(cd frontend && rm -rf .next && NEXT_PUBLIC_API_URL=https://$API_DOMAIN/api npm run build > /dev/null)
(cd frontend && zip -qr "$OUT/frontend.zip" .next public src package.json package-lock.json next.config.ts \
  tsconfig.json postcss.config.mjs next-env.d.ts -x '.next/cache/*' '*.DS_Store')

if [[ -n $(git status --porcelain) ]]; then
  git add -A
  git commit -qm "${1:-deploy: $(date '+%Y-%m-%d %H:%M')}"
fi
git push -q origin main
echo "→ Pushed $(git rev-parse --short HEAD) to main"
echo

status backend 0 "Queued"
status frontend 0 "Queued"
SECONDS=0
render &
renderer=$!

(
  deploy backend "$API_DOMAIN" "$OUT/backend.zip" \
    '{"node_version":22,"app_type":"express","root_directory":".","output_directory":null,"build_script":"build:prod","entry_file":"dist/main.js","package_manager":"npm"}'
  wait_live backend "https://$API_DOMAIN/api/products?limit=1"
) &
backend=$!
(
  deploy frontend "$WEB_DOMAIN" "$OUT/frontend.zip" \
    '{"node_version":22,"app_type":"next","root_directory":".","output_directory":".next","build_script":"build:prod","entry_file":null,"package_manager":"npm"}'
  hapi DELETE "/accounts/$HOSTINGER_USER/websites/$WEB_DOMAIN/cache/clear" > /dev/null
  wait_live frontend "https://$WEB_DOMAIN/"
) &
frontend=$!

failed=0
wait $backend || failed=1
wait $frontend || failed=1
touch "$OUT/done"; wait $renderer
echo

for n in backend frontend; do
  [[ -f $OUT/$n.log ]] && { echo "── $n build log (last 20 lines) ──"; cat "$OUT/$n.log"; }
done
[[ $failed == 0 ]] || { echo "✗ Deploy failed" >&2; exit 1; }
echo "✓ Deployed $(git rev-parse --short HEAD) to https://$WEB_DOMAIN and https://$API_DOMAIN"
