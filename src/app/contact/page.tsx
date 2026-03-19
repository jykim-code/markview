"use client";

import { useState } from "react";
import Image from "next/image";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const form = e.currentTarget;
    const res = await fetch("https://formspree.io/f/xbdzwlyk", {
      method: "POST",
      body: new FormData(form),
      headers: { Accept: "application/json" },
    });
    setSubmitting(false);
    if (res.ok) {
      setSubmitted(true);
      form.reset();
    }
  }

  return (
    <main className="min-h-screen bg-white">
      <header className="sticky top-0 z-10 flex h-[66px] items-center justify-between border-b border-navy bg-white px-4 md:px-8">
        <a href="/" className="transition-opacity hover:opacity-70">
          <Image src="/markview_text_icon.svg" alt="Markview" width={200} height={56} className="h-7 w-auto" />
        </a>
        <nav className="flex items-center gap-4 md:gap-6">
          <a href="/" className="text-xs font-semibold uppercase tracking-wider text-navy/50 hover:text-navy">Home</a>
          <a href="/about" className="text-xs font-semibold uppercase tracking-wider text-navy/50 hover:text-navy">About</a>
          <a href="/privacy" className="text-xs font-semibold uppercase tracking-wider text-navy/50 hover:text-navy">Privacy</a>
          <a href="/contact" className="text-xs font-semibold uppercase tracking-wider text-navy">Contact</a>
        </nav>
      </header>

      <div className="mx-auto max-w-[720px] px-5 pb-20 pt-10 md:px-6 md:pt-16">
        <h1 className="text-[28px] font-extrabold tracking-tight text-navy md:text-4xl">Contact</h1>
        <p className="mt-3 text-[15px] text-navy/50">
          서비스 이용 중 불편한 점이나 개선 아이디어가 있으시면 언제든지 이메일로 연락해주세요.
          빠른 시일 내에 답변드리겠습니다 :)
        </p>

        <div className="mt-10 rounded-3xl bg-cream p-8 md:p-12">
          {submitted ? (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500">
                <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-lg font-bold text-navy">전송 완료!</p>
              <p className="mt-2 text-sm text-navy/50">메시지가 성공적으로 전송되었습니다. 빠른 시일 내에 답변드리겠습니다.</p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-6 rounded-full border border-navy/15 px-6 py-2 text-xs font-semibold text-navy transition-all hover:border-navy/30"
              >
                새 메시지 작성
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label htmlFor="name" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-navy/50">
                  이름
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="w-full rounded-xl border border-navy/10 bg-white px-4 py-3 text-sm text-navy outline-none transition-colors focus:border-navy/30"
                  placeholder="홍길동"
                />
              </div>
              <div>
                <label htmlFor="email" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-navy/50">
                  이메일
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="w-full rounded-xl border border-navy/10 bg-white px-4 py-3 text-sm text-navy outline-none transition-colors focus:border-navy/30"
                  placeholder="example@email.com"
                />
              </div>
              <div>
                <label htmlFor="message" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-navy/50">
                  메시지
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={5}
                  className="w-full resize-none rounded-xl border border-navy/10 bg-white px-4 py-3 text-sm leading-relaxed text-navy outline-none transition-colors focus:border-navy/30"
                  placeholder="문의 내용을 입력해주세요."
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="self-start rounded-full bg-navy px-8 py-3 text-sm font-semibold text-white transition-all hover:opacity-85 disabled:opacity-50"
              >
                {submitting ? "전송 중..." : "보내기"}
              </button>
            </form>
          )}
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
