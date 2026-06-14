/**
 * 사이트/브랜드 설정 — 여기 값만 바꾸면 페이지에 바로 반영됩니다.
 * 로고는 public/logo.svg(또는 png)를 교체한 뒤 logo 경로를 맞춰 주세요.
 */
export const site = {
  brandName: "울림",
  brandNameEn: "ullim",
  eyebrow: "Seoul DJ Collective",
  tagline: "문턱은 낮게, 울림은 깊게",
  subCopy: "공식 인스타그램을 팔로우하고\n럭키드로우에 참여해 보세요",
  logo: "/logo.svg",
  /** 당첨 경품 — 결과 화면에 표시됩니다 */
  prize: "프리미엄 진 IGIN 1병",
  /** 꽝 위로 경품 — 모든 참여자에게 증정 */
  consolationPrize: "논알콜 드링크",
  instagram: [
    { handle: "weareullim", label: "ullim 공식 계정" },
    { handle: "igin.official", label: "애플진은 아이진, IGIN" },
    { handle: "unionseoul", label: "BAR UNION" },
  ],
} as const;

/** 럭키드로우 설정 (서버 전용) */
export const drawConfig = {
  /** 전체 당첨 상한 — 기본 3명 */
  maxWinners: parseInt(process.env.MAX_WINNERS ?? "3", 10),
  /** 1회 응모당 당첨 확률 (0~1) — 기본 5% */
  winProbability: parseFloat(process.env.WIN_PROBABILITY ?? "0.05"),
};
