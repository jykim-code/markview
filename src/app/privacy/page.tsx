import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "개인정보 처리방침 — Markview",
  description: "Markview의 개인정보 처리방침입니다.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white">
      <header className="sticky top-0 z-10 flex h-[66px] items-center justify-between border-b border-navy bg-white px-4 md:px-8">
        <a href="/" className="transition-opacity hover:opacity-70">
          <Image src="/markview_text_icon.svg" alt="Markview" width={200} height={56} className="h-7 w-auto" />
        </a>
        <nav className="flex items-center gap-4 md:gap-6">
          <a href="/" className="text-xs font-semibold uppercase tracking-wider text-navy/50 hover:text-navy">Home</a>
          <a href="/about" className="text-xs font-semibold uppercase tracking-wider text-navy/50 hover:text-navy">About</a>
          <a href="/privacy" className="text-xs font-semibold uppercase tracking-wider text-navy">Privacy</a>
          <a href="/contact" className="text-xs font-semibold uppercase tracking-wider text-navy/50 hover:text-navy">Contact</a>
        </nav>
      </header>

      <div className="mx-auto max-w-[720px] px-5 pb-20 pt-10 md:px-6 md:pt-16">
        <h1 className="text-[28px] font-extrabold tracking-tight text-navy md:text-4xl">개인정보 처리방침</h1>
        <p className="mt-3 text-[15px] text-navy/50">최종 수정일: 2026년 3월 19일</p>

        <div className="mt-10 rounded-3xl bg-cream p-8 md:p-12">
          <h2 className="text-lg font-bold text-navy">1. 수집하는 개인정보</h2>
          <p className="mt-3 text-sm leading-relaxed text-navy/70">
            Markview는 서비스 제공을 위해 최소한의 정보만 처리합니다.
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-navy/70">
            <li>업로드된 마크다운 파일 내용 (문서 렌더링 및 공유 목적)</li>
            <li>자동 수집 정보: 쿠키, 접속 로그, IP 주소 (서비스 운영 및 보안 목적)</li>
          </ul>

          <h2 className="mt-8 text-lg font-bold text-navy">2. 개인정보의 이용 목적</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-relaxed text-navy/70">
            <li>마크다운 문서의 렌더링 및 공유 URL 생성</li>
            <li>서비스 품질 개선 및 오류 분석</li>
            <li>부정 이용 방지</li>
          </ul>

          <h2 className="mt-8 text-lg font-bold text-navy">3. 제3자 서비스</h2>
          <p className="mt-3 text-sm leading-relaxed text-navy/70">Markview는 다음 제3자 서비스를 사용합니다:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-navy/70">
            <li>
              <strong>Google AdSense:</strong> 광고 제공 목적으로 쿠키를 사용할 수 있습니다. Google의 광고 쿠키 사용에 대한 자세한 내용은{" "}
              <a href="https://policies.google.com/technologies/ads" className="underline underline-offset-2" target="_blank" rel="noopener noreferrer">
                Google 광고 정책
              </a>
              을 참조하세요.
            </li>
            <li><strong>Cloudflare:</strong> 호스팅 및 CDN 서비스 제공</li>
            <li><strong>Formspree:</strong> 문의 폼 데이터 처리</li>
          </ul>

          <h2 className="mt-8 text-lg font-bold text-navy">4. 데이터 보관 및 삭제</h2>
          <p className="mt-3 text-sm leading-relaxed text-navy/70">
            업로드된 문서는 서비스 제공 기간 동안 보관되며, 서비스 종료 시 삭제됩니다.
          </p>

          <h2 className="mt-8 text-lg font-bold text-navy">5. 이용자의 권리</h2>
          <p className="mt-3 text-sm leading-relaxed text-navy/70">
            이용자는 언제든지 자신의 데이터 삭제를 요청할 수 있습니다.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-navy/70">
            <strong>문의:</strong> jeongyeonkim@hancom.com
          </p>
        </div>
      </div>

      <footer className="mx-auto flex max-w-[720px] items-center justify-between border-t border-navy/[0.04] px-5 py-6 md:px-6">
        <div className="flex gap-5">
          <a href="/about" className="text-[11px] font-semibold text-navy/35 hover:text-navy">About</a>
          <a href="/privacy" className="text-[11px] font-semibold text-navy/35 hover:text-navy">Privacy</a>
          <a href="/contact" className="text-[11px] font-semibold text-navy/35 hover:text-navy">Contact</a>
        </div>
        <span className="text-[10px] tracking-[3px] text-navy/15">MARKVIEW</span>
      </footer>
    </main>
  );
}
