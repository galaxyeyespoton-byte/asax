# 세금 도우미 앱

같은 화면을 두 가지 방법으로 앱으로 씁니다.

| 방법 | 대상 | 비용 | 상태 |
|---|---|---|---|
| **설치형 웹앱 (PWA)** | 안드로이드 + 아이폰 | 무료 | 지금 바로 가능. 사이트의 `app.html`에서 안내 |
| **안드로이드 앱 (Capacitor)** | 안드로이드, 플레이 스토어 | 구글 개발자 등록비 25달러(1회) | GitHub Actions가 자동 빌드 |
| 아이폰 앱스토어 앱 | 아이폰 | 애플 개발자 연 99달러 + Mac 필요 | 아직 안 함. 당분간 PWA로 충분 |

## 1. 테스트용 APK 받기
1. GitHub 저장소 → **Actions** 탭 → **Android 앱 빌드** → 맨 위 실행 기록
2. 아래 **Artifacts**의 `sejeumdoumi-test-apk-번호`를 내려받아 압축 해제
3. `app-debug.apk`를 안드로이드 폰에 옮겨 설치 ("출처를 알 수 없는 앱" 허용 필요)

사이트 파일(`*.html`, `assets/`)이나 `app/`이 바뀌어 푸시되면 자동으로 다시 빌드됩니다. Actions 탭에서 **Run workflow**를 눌러 직접 실행할 수도 있습니다.

## 2. 플레이 스토어에 올리기
1. **Google Play Console** (play.google.com/console) 가입, 등록비 25달러 결제, 본인 인증
2. **서명 키 만들기** (한 번만, 잃어버리지 않게 보관)
   ```
   keytool -genkeypair -v -keystore release.jks -alias taxhelper -keyalg RSA -keysize 2048 -validity 10000
   base64 -w0 release.jks > release.jks.b64
   ```
3. GitHub 저장소 → **Settings → Secrets and variables → Actions → New repository secret** 에 4개 등록
   | 이름 | 값 |
   |---|---|
   | `ANDROID_KEYSTORE_BASE64` | `release.jks.b64` 파일 내용 |
   | `ANDROID_KEYSTORE_PASSWORD` | 키스토어 비밀번호 |
   | `ANDROID_KEY_ALIAS` | `taxhelper` |
   | `ANDROID_KEY_PASSWORD` | 키 비밀번호 |
4. 다시 빌드하면 Artifacts에 `sejeumdoumi-playstore-aab-번호`가 생깁니다. 이 `.aab` 파일을 Play Console의 **내부 테스트**부터 올리세요.
5. 개인 개발자 계정은 정식 출시 전에 **테스터 12명이 14일 동안 비공개 테스트**를 해야 할 수 있습니다(구글 정책). 지인 12명에게 테스트를 부탁해 두세요.

### 스토어 등록 문구
- **앱 이름**: 세금 도우미 - 연봉 실수령액·종합소득세 계산기
- **간단한 설명** (80자): 연봉 실수령액, 3.3% 프리랜서, 사장님 종합소득세·부가세까지 2026년 기준으로 바로 계산해요.
- **자세한 설명**:
  ```
  월급날 통장에 찍힐 돈, 5월에 낼 종합소득세, 이번 부가세. 숫자만 넣으면 바로 계산하고, 무엇이 얼마씩 빠지는지 한 줄씩 보여드려요.

  ■ 직장인·프리랜서
  · 연봉 실수령액: 국민연금·건강보험·고용보험·소득세 공제 내역
  · 연봉별 실수령액 표: 2천만~1.5억
  · 3.3% 프리랜서: 세후 금액과 5월 환급 예상
  · 시급·주휴수당, 퇴직금

  ■ 사장님
  · 종합소득세: 매출과 경비로 계산, 노란우산공제 절세액까지
  · 부가세 납부세액: 일반과세자·간이과세자
  · 세금 신고 일정 D-day와 절세 가이드

  ■ 이런 점이 좋아요
  · 가입 없이 바로 사용
  · 입력한 금액은 휴대폰 밖으로 나가지 않아요
  · 2026년 4대보험 요율과 세율 반영

  ※ 계산 결과는 참고용 추정치예요. 정확한 세액은 국세청(126)이나 세무사와 확인하세요.
  ```
- **카테고리**: 금융
- **스크린샷**: `assets/screen-home.png`, `screen-salary.png`, `screen-business.png`
- **아이콘(512×512)**: `assets/icon-512.png`
- **개인정보처리방침 URL**: 사이트의 `privacy.html` 주소

## 3. 앱에서 광고로 수익 내기
구글 정책상 **AdSense는 앱 안에서 쓸 수 없어서** 앱 버전에서는 AdSense 코드를 자동으로 뺍니다(`scripts/copy-web.mjs`). 앱 광고는 **AdMob**으로 따로 붙여야 합니다. AdMob 가입 후 앱 ID와 광고 단위 ID를 알려주시면 연결합니다. 제휴 링크는 앱에서도 그대로 보이고, 누르면 휴대폰 브라우저로 열립니다.

## 개발 메모
- 앱 ID: `io.github.galaxyeyespoton.taxhelper`. 플레이 스토어에 처음 올린 뒤에는 바꿀 수 없습니다. 도메인을 사면 그에 맞춰 바꾸는 것도 방법입니다(`capacitor.config.json`).
- 로컬에서 준비: `cd app && npm ci && npm run android:prepare` (빌드에는 Android SDK가 필요)
- 아이콘 원본은 `res/`, 앱에 들어가는 사이트 복사본(`www/`)과 `android/`는 빌드할 때마다 새로 만듭니다.
