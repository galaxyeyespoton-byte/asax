#!/usr/bin/env bash
# cap add android 로 만든 프로젝트에 아이콘, 스플래시, 버전, 색을 입힙니다.
set -euo pipefail
cd "$(dirname "$0")/.."
RES=android/app/src/main/res

# 런처 아이콘
for d in mdpi hdpi xhdpi xxhdpi xxxhdpi; do
  cp res/mipmap-$d/*.png "$RES/mipmap-$d/"
done
cat > "$RES/values/ic_launcher_background.xml" <<'XML'
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#2F7A58</color>
</resources>
XML

# 스플래시: 기본 Capacitor 로고 대신 종이색 바탕 + 앱 로고
if command -v convert >/dev/null; then
  find "$RES" -name splash.png | while read -r f; do
    size=$(identify -format "%wx%h" "$f")
    w=${size%x*}; h=${size#*x}; s=$(( (w < h ? w : h) / 4 ))
    convert -size "$size" xc:'#f5f5f0' \( res/splash-logo.png -resize "${s}x${s}" \) -gravity center -composite "$f"
  done
fi

# 버전: VERSION_CODE(빌드 번호)와 VERSION_NAME 환경변수로 지정
if [ -n "${VERSION_CODE:-}" ]; then
  sed -i "s/versionCode [0-9]*/versionCode ${VERSION_CODE}/" android/app/build.gradle
fi
if [ -n "${VERSION_NAME:-}" ]; then
  sed -i "s/versionName \"[^\"]*\"/versionName \"${VERSION_NAME}\"/" android/app/build.gradle
fi
echo "android resources applied"
