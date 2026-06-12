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
            {/* 브랜드 로고 — public/logo.svg 파일을 교체하면 됩니다 */}
            <img src={site.logo} alt={`${site.brandName} 로고`} />
          </div>
          <p className="hero-eyebrow">{site.eyebrow}</p>
          <h1 className="hero-title">{site.tagline}</h1>
          <svg className="smile-divider" viewBox="0 0 64 20" aria-hidden>
            <path
              d="M4 4q28 22 56 0"
              stroke="currentColor"
              strokeWidth="3.5"
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
          © {new Date().getFullYear()} {site.brandNameEn}. ALL RIGHTS RESERVED.
        </footer>
      </div>
    </main>
  );
}
