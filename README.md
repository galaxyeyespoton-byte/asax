# 하루 완성 홈페이지: 3일 실행 키트

동네 가게 홈페이지 제작 외주를 크몽과 직접 영업으로 판매하기 위한 자료입니다.

| 파일 | 용도 |
|---|---|
| `index.html` | 서비스 소개 페이지 (포트폴리오 겸 영업용 링크) |
| `samples/cafe.html` · `academy.html` · `salon.html` | 업종별 샘플 사이트 |
| `KMONG.md` | 크몽 상품 등록 문구 (제목, 설명, 패키지, FAQ) |
| `SALES.md` | 3일 실행 계획과 가게에 보낼 연락 문구 |

## 1단계: 크몽 주소 넣기

`index.html` 맨 아래에 있는 이 줄을 본인 크몽 서비스 주소로 바꿉니다.

```js
const ORDER_URL = "https://kmong.com/";
```

## 2단계: 무료로 사이트 공개하기 (GitHub Pages)

1. GitHub에서 이 저장소를 열고 **Settings → Pages**로 들어갑니다.
2. Source를 `Deploy from a branch`로, 브랜치를 `claude/100won-monetization-project-pt8p14`(또는 병합한 뒤라면 `main`)로, 폴더를 `/ (root)`로 고릅니다.
3. 1~2분 뒤 `https://galaxyeyespoton-byte.github.io/asax/` 에서 사이트가 열립니다.

공개 저장소여야 무료로 Pages를 쓸 수 있습니다. 비공개 저장소라면 Netlify Drop(https://app.netlify.com/drop)에 폴더를 끌어다 놓아도 됩니다.

## 고객 사이트 만들 때

`samples/` 파일 중 업종이 비슷한 것을 복사한 뒤 가게 이름, 메뉴, 가격, 주소, 연락처를 바꾸고 똑같이 배포하면 됩니다. Claude에게 고객 자료를 주면서 "이 샘플을 바탕으로 만들어줘"라고 하면 바로 만들 수 있습니다.
