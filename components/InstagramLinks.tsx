"use client";

import { site } from "@/lib/config";
import AccountAvatar from "./AccountAvatar";
import { useFollowGate } from "./FollowGate";

export default function InstagramLinks() {
  const { isClicked, markClicked } = useFollowGate();

  return (
    <section className="links" aria-label="인스타그램 계정">
      {site.instagram.map((account, i) => {
        const done = isClicked(account.handle);
        return (
          <a
            key={account.handle}
            className={`link-card${done ? " done" : ""}`}
            href={`https://instagram.com/${account.handle}`}
            target="_blank"
            rel="noreferrer"
            onClick={() => markClicked(account.handle)}
            style={{ animationDelay: `${150 + i * 90}ms` }}
          >
            <span className="link-icon">
              <AccountAvatar src={account.avatar} alt={`${account.label} 프로필`} />
            </span>
            <span className="link-text">
              <span className="link-label">{account.label}</span>
              <span className="link-handle">@{account.handle}</span>
            </span>
            <span className="link-cta">{done ? "완료 ✓" : "팔로우"}</span>
          </a>
        );
      })}
    </section>
  );
}
