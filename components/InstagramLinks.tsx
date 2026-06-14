import { site } from "@/lib/config";
import AccountAvatar from "./AccountAvatar";

export default function InstagramLinks() {
  return (
    <section className="links" aria-label="인스타그램 계정">
      {site.instagram.map((account, i) => {
        // avatar 미지정 시 핸들로 실제 프로필 사진을 불러옴 (없으면 글리프 폴백)
        const avatar =
          account.avatar ||
          `https://unavatar.io/instagram/${account.handle}?fallback=false`;
        return (
          <a
            key={account.handle}
            className="link-card"
            href={`https://instagram.com/${account.handle}`}
            target="_blank"
            rel="noreferrer"
            style={{ animationDelay: `${150 + i * 90}ms` }}
          >
            <span className="link-icon">
              <AccountAvatar src={avatar} alt={`${account.label} 프로필`} />
            </span>
            <span className="link-text">
              <span className="link-label">{account.label}</span>
              <span className="link-handle">@{account.handle}</span>
            </span>
            <span className="link-cta">팔로우</span>
          </a>
        );
      })}
    </section>
  );
}
