import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Markview — 마크다운을 사람이 읽기 좋은 형태로",
  description:
    "AI가 만든 마크다운 파일을 업로드하면, 누구나 읽기 편한 웹 문서로 변환하고 링크 하나로 바로 공유할 수 있습니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('markview-theme');if(t){document.documentElement.setAttribute('data-theme',t)}else if(window.matchMedia('(prefers-color-scheme:dark)').matches){document.documentElement.setAttribute('data-theme','dark')}}catch(e){}})()`,
          }}
        />
        <link rel="icon" href="/M.svg" type="image/svg+xml" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/highlight.js@11.10.0/styles/github.min.css"
          crossOrigin="anonymous"
        />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8302055447823333"
          crossOrigin="anonymous"
        />
      </head>
      <body className="font-montserrat antialiased">{children}</body>
    </html>
  );
}
