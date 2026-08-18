import type { Metadata } from "next";
import Image from "next/image";
import { SiteHeader } from "@/components/SiteHeader";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About — Markview",
  description: "Markview는 마크다운을 아름답게 렌더링하고, URL 하나로 누구에게나 공유할 수 있는 서비스입니다.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-bg transition-colors duration-300">
      <SiteHeader active="about" />

      <div className="mx-auto max-w-[720px] px-5 pb-20 pt-10 md:px-6 md:pt-16">
        <h1 className="text-[28px] font-extrabold tracking-tight text-navy md:text-4xl">About</h1>

        <div className="mt-10 rounded-3xl bg-cream p-8 transition-colors duration-300 md:p-12">
          <div className="mb-8 flex items-center justify-center border-b border-navy/[0.06] pb-8">
            <Image src="/markview_text_icon.svg" alt="Markview" width={400} height={100} className="h-12 w-auto logo-light" />
            <Image src="/markview_text_icon_dark.svg" alt="Markview" width={400} height={100} className="h-12 w-auto logo-dark" />
          </div>
          <h2 className="text-lg font-bold text-navy">서비스 소개</h2>
          <p className="mt-3 text-sm leading-relaxed text-navy/70">
            Markview는 AI가 만든 마크다운(.md)과 HTML 파일을 업로드하면, 읽기 편하게 렌더링된 웹 문서로 변환하고 URL 하나로 누구에게나 공유할 수 있는 서비스입니다.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-navy/70">
            별도의 설치나 로그인 없이, 공유 링크를 받은 사람은 즉시 깔끔하게 렌더링된 문서를 열람할 수 있습니다.
          </p>

          <h2 className="mt-8 text-lg font-bold text-navy">주요 기능</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-relaxed text-navy/70">
            <li>URL 공유: 링크 하나로 누구나 열람</li>
            <li>HTML 문서 렌더링 (자기 완결형 인터랙티브 HTML 지원)</li>
            <li>내 문서 목록(My Docs)에서 올린 문서 확인과 삭제</li>
            <li>되돌리기: 편집 전 직전 내용을 한 번에 복원</li>
            <li>실시간 마크다운 편집 (View / Edit 모드)</li>
            <li>자동 목차(TOC) 생성</li>
            <li>Markdown, HTML, PDF 내보내기</li>
            <li>GFM, 코드 구문 강조, LaTeX 수식, Mermaid 다이어그램 지원</li>
            <li>본문 글자 크기 조절 (90~150%)</li>
            <li>다크 / 라이트 모드 전환</li>
            <li>파일 크기 최대 25MB</li>
          </ul>

          <h2 className="mt-8 text-lg font-bold text-navy">운영자 정보</h2>
          <p className="mt-3 text-sm leading-relaxed text-navy/70">
            <strong>운영자:</strong> jeongyeonkim
          </p>
          <p className="text-sm leading-relaxed text-navy/70">
            <strong>이메일:</strong> jeongyeonkim@hancom.com
          </p>
        </div>
      </div>

      <footer className="mx-auto flex max-w-[720px] items-center justify-between border-t border-navy/[0.04] px-5 py-6 md:px-6">
        <div className="flex gap-5">
          <Link href="/about" className="text-[11px] font-semibold text-navy/35 hover:text-navy">About</Link>
          <Link href="/privacy" className="text-[11px] font-semibold text-navy/35 hover:text-navy">Privacy</Link>
          <Link href="/contact" className="text-[11px] font-semibold text-navy/35 hover:text-navy">Contact</Link>
        </div>
        <span className="text-[10px] tracking-[3px] text-navy/15">MARKVIEW</span>
      </footer>
    </main>
  );
}
