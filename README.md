# 세금 도우미

2026년 요율 기준 세금 계산기 모음.
- 직장인·프리랜서: 연봉 실수령액, 3.3% 세금, 시급/주휴수당, 퇴직금
- 소상공인·자영업자: 종합소득세, 부가세 납부세액(일반·간이), 세금 신고 일정·절세 가이드
빌드 없이 그대로 올리면 되는 정적 사이트이며, 휴대폰 홈 화면에 앱처럼 설치할 수 있습니다(PWA).

## 배포 (GitHub Pages)
이 저장소(`asax`)의 루트가 곧 사이트입니다.
1. GitHub 저장소 → **Settings → Pages**
2. Source: `Deploy from a branch`, Branch: `claude/100won-monetization-project-pt8p14` (병합 후에는 `main`), Folder: `/ (root)` → Save
3. 1~2분 뒤 https://galaxyeyespoton-byte.github.io/asax/ 에서 열립니다.

### 도메인 연결
가비아 등에서 산 도메인의 DNS를 GitHub Pages로 연결한 뒤 아래 한 줄을 실행하면, 모든 주소·CNAME·sitemap이 바뀝니다.
```
tools/set-domain.sh 내도메인.kr
```

### 연봉별 페이지
`salary-XXXX.html`(31개)과 `sitemap.xml`은 `node tools/gen-salary-pages.mjs`로 만듭니다. 요율을 바꾼 뒤 다시 실행하세요.

### 홍보
방문자를 늘리는 방법(검색 등록, 시즌 전략, 커뮤니티 문구, 블로그 초안)은 `marketing/PROMOTION.md`에 있습니다.

이전에 만든 홈페이지 제작 외주 키트는 `kmong-kit/` 폴더로 옮겼습니다.

## 광고 (Google AdSense)
- 모든 페이지 `<head>`와 `ads.txt`에 게시자 ID `ca-pub-2484423746725349`가 들어 있습니다. 본인 ID가 아니면 전체 찾아 바꾸기로 교체하세요.
- AdSense 승인 후 디스플레이 광고 단위를 만들고 `assets/common.js`의 `AD_SLOT`에 슬롯 ID를 넣으면 각 페이지의 광고 자리에 광고가 나옵니다.

## 요율 수정
매년 `assets/common.js`의 `RATES`, `BRACKETS`, `TAX_SCHEDULE`을 고치면 모든 계산기에 반영됩니다.
노란우산 한도는 `business-tax.html`, 간이과세 부가가치율과 카드매출 공제는 `vat-pay.html`에 있습니다.
