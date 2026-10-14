#!/usr/bin/env bash
# 사용법: tools/set-domain.sh example.com
# 모든 페이지의 사이트 주소를 새 도메인으로 바꾸고, CNAME 파일을 만들고, 연봉별 페이지와 sitemap을 다시 만듭니다.
set -euo pipefail
cd "$(dirname "$0")/.."
domain="${1:?도메인을 입력하세요 (예: taxdoumi.kr)}"
old="$(tr -d '\n' < tools/site-url.txt)"
new="https://${domain}/"
grep -rlF "$old" --include='*.html' --include='*.xml' --include='*.txt' --include='*.webmanifest' . | xargs sed -i "s#${old}#${new}#g"
echo "$new" > tools/site-url.txt
echo "$domain" > CNAME
node tools/gen-salary-pages.mjs
echo "완료: ${old} → ${new}"
