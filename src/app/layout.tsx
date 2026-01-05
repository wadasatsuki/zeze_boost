import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://zeze-boost.vercel.app"),
  title: "ZEZE BOOST",
  description: "膳所の未来をみんなで考えよう - 滋賀県大津市膳所地域について議論をかわしましょう",
  openGraph: {
    title: "ZEZE BOOST",
    description: "膳所の未来をみんなで考えよう - 滋賀県大津市膳所地域について議論をかわしましょう",
    type: "website",
    locale: "ja_JP",
    siteName: "ZEZE BOOST",
    images: [
      {
        url: "/photo/top_1.jpg",
        width: 1200,
        height: 630,
        alt: "ZEZE BOOST - 膳所の未来をみんなで考えよう",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ZEZE BOOST",
    description: "膳所の未来をみんなで考えよう - 滋賀県大津市膳所地域について議論をかわしましょう",
    images: ["/photo/top_1.jpg"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 ml-0 md:ml-16 pb-16 md:pb-0">{children}</main>
        </div>
      </body>
    </html>
  );
}
