import Link from "next/link";
import Image from "next/image";

export default function GlobalNotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-cream px-6">
      <Image
        src="/markview_text_icon.svg"
        alt="Markview"
        width={160}
        height={46}
        className="mb-10 h-10 w-auto opacity-30"
      />
      <h1 className="mb-2 text-6xl font-bold tracking-tight text-navy">404</h1>
      <p className="mb-8 text-lg font-medium text-navy/60">페이지를 찾을 수 없습니다.</p>
      <Link
        href="/"
        className="rounded-md bg-navy px-7 py-3 text-sm font-medium text-cream transition-all hover:bg-navy/90 active:scale-[0.98]"
      >
        메인으로 돌아가기
      </Link>
    </main>
  );
}
