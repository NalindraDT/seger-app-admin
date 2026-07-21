#!/bin/sh
set -e

API_URL="${API_BASE_URL:-${VITE_API_BASE_URL:-}}"

if [ -n "$API_URL" ]; then
  # Inline config agar tersedia sebelum JS bundle dieksekusi
  sed -i "s|<head>|<head><script>window.__APP_CONFIG__={API_BASE_URL:\"${API_URL}\"};</script>|" /app/dist/index.html

  cat > /app/dist/config.js <<EOF
window.__APP_CONFIG__ = {
  API_BASE_URL: "${API_URL}"
};
EOF
fi

exec serve -s dist -l "tcp://0.0.0.0:${PORT:-3000}"
