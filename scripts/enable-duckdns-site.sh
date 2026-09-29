#!/usr/bin/env bash
set -euo pipefail

domain="${1:-}"
if [[ ! "$domain" =~ ^[a-z0-9]([a-z0-9-]*[a-z0-9])?\.duckdns\.org$ ]]; then
  echo 'Uso: sudo bash enable-duckdns-site.sh nombre.duckdns.org' >&2
  exit 1
fi
if [[ "$EUID" -ne 0 ]]; then
  echo 'Este paso requiere sudo para instalar y recargar la configuración de Caddy.' >&2
  exit 1
fi

target=/etc/caddy/conf.d/snail-club.caddy
if [[ -e "$target" ]]; then
  echo "Ya existe $target. Revísalo antes de actualizarlo." >&2
  exit 1
fi
curl --fail --silent --show-error http://127.0.0.1:4334/api/health >/dev/null
temporary=$(mktemp)
trap 'rm -f "$temporary"' EXIT
cat >"$temporary" <<EOF
$domain {
    encode zstd gzip
    reverse_proxy 127.0.0.1:4334
}
EOF
install -o root -g root -m 644 "$temporary" "$target"
if ! caddy validate --config /etc/caddy/Caddyfile; then
  rm -f "$target"
  exit 1
fi
if ! systemctl reload caddy; then
  rm -f "$target"
  echo 'La recarga falló; se retiró únicamente el sitio nuevo.' >&2
  exit 1
fi
printf 'Sitio configurado: https://%s\n' "$domain"
