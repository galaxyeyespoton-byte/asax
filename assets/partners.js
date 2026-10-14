/* 제휴 링크 설정
 *
 * 1) 제휴 프로그램에 가입해 내 추천 링크를 받습니다.
 *    예: 쿠팡 파트너스(partners.coupang.com), 링크프라이스(linkprice.com), 텐핑(tenping.kr),
 *        세무·회계 서비스 회사의 자체 제휴 프로그램
 * 2) 아래 항목의 url 칸에 받은 링크를 붙여넣습니다. url이 비어 있는 항목은 화면에 나오지 않습니다.
 * 3) slots: 이 항목을 보여줄 페이지 자리
 *      salary(연봉), freelancer(3.3%), business(종합소득세), vat(부가세), guide(사장님 가이드)
 *
 * 공정위 「추천·보증 심사지침」에 따라 수수료를 받는 링크라는 사실을 함께 표시합니다(disclosure).
 * 쿠팡 파트너스 링크라면 disclosure에 쿠팡이 요구하는 문구를 그대로 넣으세요.
 */
const PARTNER_DISCLOSURE = "이 영역의 링크를 통해 가입하거나 구매하면 운영자가 일정 수수료를 받을 수 있어요. 이용자가 내는 금액은 같습니다.";
const COUPANG_DISCLOSURE = "이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.";

const PARTNERS = [
  {
    title: "세무 기장·신고 대행",
    desc: "장부 정리와 종합소득세·부가세 신고를 세무사에게 맡기고 싶을 때",
    cta: "상담 알아보기",
    url: "",
    slots: ["business", "vat", "guide"],
  },
  {
    title: "프리랜서 종합소득세 신고·환급",
    desc: "3.3% 떼인 세금, 5월에 직접 신고하기 어렵다면",
    cta: "환급액 조회",
    url: "",
    slots: ["freelancer"],
  },
  {
    title: "사업자 카드·간편 회계 프로그램",
    desc: "매입 증빙을 자동으로 모아 부가세 신고를 쉽게",
    cta: "알아보기",
    url: "",
    slots: ["vat", "business"],
  },
  {
    title: "파킹통장·적금 금리 비교",
    desc: "월급 들어오면 바로 옮겨둘 곳 찾기",
    cta: "금리 비교",
    url: "",
    slots: ["salary"],
  },
  {
    title: "영수증 정리함·사무용품",
    desc: "증빙 서류 보관용 파일, 영수증 스캐너",
    cta: "쿠팡에서 보기",
    url: "",
    disclosure: COUPANG_DISCLOSURE,
    slots: ["guide"],
  },
];
