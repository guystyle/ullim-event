"use client";

import { useState } from "react";

function InstagramGlyph() {
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

/**
 * 인스타그램 프로필 사진을 표시한다.
 * 이미지를 불러오지 못하면(404·차단·오프라인) 인스타그램 글리프로 폴백.
 */
export default function AccountAvatar({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) return <InstagramGlyph />;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className="avatar-img"
      src={src}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}
