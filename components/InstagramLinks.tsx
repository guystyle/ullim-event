import { site } from "@/lib/config";
import AccountAvatar from "./AccountAvatar";

export default function InstagramLinks() {
  return (
    <section className="links" aria-label="인스타그램 계정">
      {site.instagram.map((account, i) => (
        <a
          key={account.handle}
          className="link-card"
          href={`https://instagram.com/${account.handle}`}
          target="_blank"
          rel="noreferrer"
          style={{ animationDelay: `${150 + i * 90}ms` }}
        >
          <span className="link-icon">
            <AccountAvatar src={account.avatar} alt={`${account.label} 프로필`} />
          </span>
          <span className="link-text">
            <span className="link-label">{account.label}</span>
            <span className="link-handle">@{account.handle}</span>
          </span>
          <span className="link-cta">팔로우</span>
        </a>
      ))}
    </section>
  );
}
