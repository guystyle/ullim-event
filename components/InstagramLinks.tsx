"use client";

import { site } from "@/lib/config";
import AccountAvatar from "./AccountAvatar";
import { useFollowGate } from "./FollowGate";

export default function InstagramLinks() {
  const { isClicked, markClicked, count } = useFollowGate();
  const accounts = site.instagram;
  // 아직 안 누른 첫 번째 계정 = 지금 눌러야 할 "다음" 단계
  const nextIndex = accounts.findIndex((a) => !isClicked(a.handle));

  return (
    <section className="links" aria-label="인스타그램 계정">
      {accounts.map((account, i) => {
        const done = isClicked(account.handle);
        const isNext = i === nextIndex;
        return (
          <a
            key={account.handle}
            className={`link-card${done ? " done" : ""}${isNext ? " next" : ""}`}
            href={`https://instagram.com/${account.handle}`}
            target="_blank"
            rel="noreferrer"
            onClick={() => markClicked(account.handle)}
            style={{ animationDelay: `${150 + i * 90}ms` }}
          >
            <span className="link-icon">
              <AccountAvatar src={account.avatar} alt={`${account.label} 프로필`} />
              <span className="link-step" aria-hidden>
                {done ? "✓" : i + 1}
              </span>
            </span>
            <span className="link-text">
              <span className="link-label">{account.label}</span>
              <span className="link-handle">@{account.handle}</span>
            </span>
            <span className="link-cta">
              {done ? "완료" : isNext ? (count === 0 ? "팔로우 ▸" : "다음 ▸") : "팔로우"}
            </span>
          </a>
        );
      })}
    </section>
  );
}
