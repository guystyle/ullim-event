import type { Metadata, Viewport } from "next";
import { site } from "@/lib/config";
import "./globals.css";

export const metadata: Metadata = {
  title: `${site.brandName} ${site.brandNameEn} | 팔로우하고 럭키드로우`,
  description: `${site.brandName} 공식 인스타그램을 팔로우하고 럭키드로우 행운에 도전해 보세요.`,
  openGraph: {
    title: `${site.brandName} | 팔로우하고 럭키드로우`,
    description: "공식 인스타그램 팔로우하고 럭키드로우 행운에 도전!",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#F6EFE3",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
