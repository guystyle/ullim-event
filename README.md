# ullim 럭키드로우 이벤트 페이지

린크트리 스타일의 원페이지 이벤트 사이트입니다.

- 인스타그램 계정 **3개** 팔로우 버튼
- **럭키드로우** 응모 — 슬롯머신 애니메이션 + 당첨 컨페티 이펙트
- 당첨은 서버에서 강제: **낮은 확률 추첨 + 전체 당첨 3명 상한 + 아이디당 1회 응모**
- 경품: 당첨 시 **프리미엄 진 IGIN 1병**, 그 외에도 **논알콜 드링크** 증정
  (현장 BAR UNION 운영 — 참여자가 결과 화면을 직원에게 보여주고 수령. 문구는 `lib/config.ts` 의 `prize`·`consolationPrize` 로 변경)
- 디자인: **ullim Design System v1.0** 기준
  - 컬러: Warm Ivory `#F5F5DC` 배경 / Deep Navy `#1A2B3C` 텍스트 / Midnight Teal `#2C7A7B` 버튼 / Soft Gold `#C2B280` 보더 / Cream Yellow `#FFF4C2` 하이라이트 / Rosy Brown `#B29588` 서브 텍스트 / Dark Coral Brown `#8B3E2F` 에러·꽝
  - 폰트: 영문 헤딩·배지 **Cormorant Garamond**(이탤릭 세리프), 한글 본문 **Arita Buri**
    (`public/fonts/AritaBuri.ttf` 추가 시 적용 — [public/fonts/README.md](public/fonts/README.md) 참고. 없으면 고운바탕 폴백)

## 빠른 시작

```bash
npm install
npm run dev   # http://localhost:3000
```

로컬에서는 응모 기록이 `data/draw.json` 파일에 저장됩니다(자동 생성, git 제외).

## 커스터마이즈

### 1. 브랜드 로고 교체

지금은 임시 워드마크(`public/logo.svg`)가 들어 있습니다. 디자인 시스템의 Jorick 워드마크
PNG(`ullim-logo-dark.png` — 밝은 배경용 Deep Navy 버전)를 `public/images/`에 넣고
`lib/config.ts` 의 `logo: "/images/ullim-logo-dark.png"` 로 바꾸면 됩니다.

### 2. 브랜드명 / 인스타그램 계정 / 문구

전부 [`lib/config.ts`](lib/config.ts) 한 파일에서 수정합니다.

```ts
export const site = {
  brandName: "울림",
  brandNameEn: "ULLIM",
  tagline: "울림이 시작되는 곳",
  // ...
  instagram: [
    { handle: "ullim.official", label: "울림 공식 계정" },
    // 핸들만 실제 계정으로 바꾸면 링크가 연결됩니다
  ],
};
```

### 3. 당첨 확률 / 당첨 인원 (환경 변수)

| 변수 | 기본값 | 설명 |
| --- | --- | --- |
| `WIN_PROBABILITY` | `0.05` | 응모 1회당 당첨 확률 (0~1) |
| `MAX_WINNERS` | `3` | 전체 당첨 상한. 소진되면 이후 응모는 모두 꽝 |
| `ADMIN_TOKEN` | (없음) | 설정 시 관리자 조회 API 활성화 |
| `UPSTASH_REDIS_REST_URL` | (없음) | 운영용 Redis (아래 배포 참고) |
| `UPSTASH_REDIS_REST_TOKEN` | (없음) | 운영용 Redis 토큰 |

## 당첨 로직 (서버 강제)

`POST /api/draw` 가 모든 판정을 서버에서 처리합니다. 클라이언트 조작으로는 당첨될 수 없습니다.

1. 인스타그램 아이디 정규화(@제거, 소문자) 후 **중복 응모 차단** (원자적 등록)
2. `WIN_PROBABILITY` 확률로 추첨
3. 당첨이 나와도 **남은 당첨 슬롯(기본 3개)을 원자적으로 확인** — 소진이면 꽝 처리
4. 결과를 저장하고 `win | lose` 만 응답 (슬롯머신은 결과를 받은 뒤 연출만 함)

## 당첨자 확인 (관리자)

`ADMIN_TOKEN` 환경 변수를 설정하면 사용 가능합니다.

```bash
curl "https://<도메인>/api/admin/entries?token=<ADMIN_TOKEN>"
# → { "winners": [{ "handle": "...", "at": "..." }], "totalEntries": 123 }
```

현장(BAR UNION)에서 참여자가 결과 화면을 직원에게 보여주면 경품을 지급합니다.
당첨자는 IGIN 1병, 그 외 참여자는 논알콜 드링크를 받습니다. 당첨자 명단은 위
관리자 API로 확인·대조할 수 있고, 경품 문구는 `lib/config.ts` 의 `prize`·
`consolationPrize` 값으로 바꿀 수 있습니다.

## 배포 (Vercel 권장)

1. 이 저장소를 Vercel에 연결해 배포
2. **[Upstash](https://upstash.com)에서 무료 Redis 생성** 후 Vercel 환경 변수에
   `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` 추가
   - 서버리스 환경은 파일이 유지되지 않으므로 운영에서는 Redis가 **필수**입니다.
     (없으면 응모 기록/당첨 카운트가 인스턴스마다 초기화될 수 있음)
3. `ADMIN_TOKEN`(긴 랜덤 문자열), 필요 시 `WIN_PROBABILITY`, `MAX_WINNERS` 설정

## 참고

- 실제 이벤트 운영 시 개인정보(인스타그램 아이디) 수집·이용 고지를 페이지에 맞게 보완하세요.
- 팔로우 여부는 인스타그램 API 제약상 자동 검증이 어려워, 체크박스 확인 + 당첨 후 수동 확인 방식을 권장합니다.
