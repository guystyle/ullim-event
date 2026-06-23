import { site } from "@/lib/config";
import InstagramLinks from "@/components/InstagramLinks";
import LuckyDraw from "@/components/LuckyDraw";

export default function Home() {
  return (
    <main className="page">
      <div className="page-glow" aria-hidden />

      <div className="shell">
        <header className="hero">
          <div className="hero-logo">
            {/* 브랜드 로고 — public/logo.png 파일을 교체하면 됩니다 */}
            <img src={site.logo} alt={`${site.brandName} 로고`} />
          </div>
          <svg className="wave-divider" viewBox="0 0 80 16" aria-hidden>
            <path
              d="M3 8q9.5-9 19 0t19 0t19 0t19 0"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
          <p className="hero-sub">
            {site.subCopy.split("\n").map((line, i) => (
              <span key={i}>
                {i > 0 && <br />}
                {line}
              </span>
            ))}
          </p>
        </header>

        <InstagramLinks />

        <LuckyDraw />

        <footer className="footer">
          © {new Date().getFullYear()} {site.brandNameEn} · all rights reserved
        </footer>
      </div>
    </main>
  );
}
