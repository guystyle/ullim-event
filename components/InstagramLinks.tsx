import { site } from "@/lib/config";

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="2.5"
        y="2.5"
        width="19"
        height="19"
        rx="5.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.3" cy="6.7" r="1.3" fill="currentColor" />
    </svg>
  );
}

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
            <InstagramIcon />
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
