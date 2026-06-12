/**
 * 사이트/브랜드 설정 — 여기 값만 바꾸면 페이지에 바로 반영됩니다.
 * 로고는 public/logo.svg(또는 png)를 교체한 뒤 logo 경로를 맞춰 주세요.
 */
export const site = {
  brandName: "울림",
  brandNameEn: "ULLIM",
  eyebrow: "WHERE ULLIM BEGINS",
  tagline: "울림이 시작되는 곳",
  subCopy: "공식 인스타그램 3개를 팔로우하고\n럭키드로우 행운에 도전해 보세요",
  logo: "/logo.svg",
  instagram: [
    { handle: "ullim.official", label: "울림 공식 계정" },
    { handle: "ullim.studio", label: "울림 스튜디오" },
    { handle: "ullim.event", label: "울림 이벤트" },
  ],
} as const;

/** 럭키드로우 설정 (서버 전용) */
export const drawConfig = {
  /** 전체 당첨 상한 — 기본 3명 */
  maxWinners: parseInt(process.env.MAX_WINNERS ?? "3", 10),
  /** 1회 응모당 당첨 확률 (0~1) — 기본 5% */
  winProbability: parseFloat(process.env.WIN_PROBABILITY ?? "0.05"),
};
