"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useToast } from "@/components/Toast";
import { readMyDocs, syncMyDocs, removeMyDoc, type MyDoc } from "@/lib/myDocs";

/**
 * The uploader's own document list.
 *
 * Client-only by necessity: the list lives in localStorage, which the server
 * can't read, so there is nothing to render server-side.
 */
export default function MyDocsPage() {
  const [docs, setDocs] = useState<MyDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<MyDoc | null>(null);
  const toast = useToast();

  useEffect(() => {
    // Paint the local list immediately, then drop entries the server no longer
    // recognises so dead links don't linger.
    setDocs(readMyDocs());
    let active = true;
    syncMyDocs()
      .then((synced) => {
        if (active) setDocs(synced);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleDelete = useCallback(async () => {
    const doc = pendingDelete;
    if (!doc) return;
    setDeleting(true);
    let res: Response;
    try {
      res = await fetch(`/api/documents/${doc.slug}`, {
        method: "DELETE",
        headers: { "X-Owner-Token": doc.ownerToken },
      });
    } catch {
      // Request never left the browser — the document is untouched.
      toast.error("네트워크 연결을 확인해주세요");
      setDeleting(false);
      setPendingDelete(null);
      return;
    }

    try {
      if (res.status === 403) {
        toast.error("삭제 권한이 없습니다");
        return;
      }
      if (!res.ok) {
        toast.error("삭제에 실패했습니다");
        return;
      }
      removeMyDoc(doc.slug);
      setDocs((prev) => prev.filter((d) => d.slug !== doc.slug));
      toast.success("삭제했습니다");
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  }, [pendingDelete, toast]);

  return (
    <main className="flex min-h-screen flex-col bg-bg">
      <header
        className="sticky top-0 z-50 flex h-[66px] items-center justify-between bg-bg px-6 transition-colors duration-300 md:px-8"
        style={{ borderBottom: "1px solid var(--header-border)" }}
      >
        <Link href="/">
          <Image src="/markview_text_icon.svg" alt="Markview" width={200} height={56} priority className="h-7 w-auto logo-light" />
          <Image src="/markview_text_icon_dark.svg" alt="Markview" width={200} height={56} priority className="h-7 w-auto logo-dark" />
        </Link>
        <nav className="flex items-center gap-4 md:gap-6">
          <Link href="/" className="text-xs font-semibold uppercase tracking-wider text-navy/50 hover:text-navy">Home</Link>
          <Link href="/my" className="text-xs font-semibold uppercase tracking-wider text-navy">My Docs</Link>
          <Link href="/about" className="hidden text-xs font-semibold uppercase tracking-wider text-navy/50 hover:text-navy sm:inline">About</Link>
          <ThemeToggle />
        </nav>
      </header>

      <section className="mx-auto w-full max-w-[760px] flex-1 px-6 py-10 md:py-14">
        <h1
          className="font-montserrat text-navy"
          style={{ fontSize: "clamp(26px, 5vw, 36px)", fontWeight: 800, letterSpacing: "-1px" }}
        >
          My Docs
        </h1>

        <p className="mt-3 text-[13px] leading-relaxed text-navy/50">
          <strong className="font-semibold text-navy">현재 브라우저에만</strong> 저장되는
          목록입니다. 기기 간 동기화는 로그인 계정에서 지원 예정입니다.
        </p>

        {loading && docs.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-navy/20 border-t-navy" />
            <p className="text-sm font-medium text-navy/50">불러오는 중...</p>
          </div>
        ) : docs.length === 0 ? (
          <div className="mt-8 flex flex-col items-center gap-4 rounded-3xl bg-bg px-6 py-16 text-center shadow-[var(--shadow-card)]">
            <p className="text-base font-semibold text-navy/60">
              업로드한 문서가 없습니다.
            </p>
            <Link
              href="/"
              className="rounded-full bg-navy px-8 py-3 text-sm font-bold text-bg transition-all hover:opacity-85 active:scale-[0.98]"
            >
              파일 업로드하기
            </Link>
          </div>
        ) : (
          <ul className="mt-6 flex flex-col gap-3">
            {docs.map((doc) => (
              <li
                key={doc.slug}
                className="flex items-center gap-3 rounded-2xl bg-bg px-4 py-4 shadow-[var(--shadow-card)] md:px-5"
              >
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/v/${doc.slug}`}
                    className="block truncate text-[15px] font-semibold text-navy hover:underline"
                  >
                    {doc.title}
                  </Link>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-navy/40">
                    <span className="rounded-full border border-navy/15 px-2 py-0.5 font-semibold uppercase">
                      {doc.type}
                    </span>
                    <span>{formatDate(doc.uploadedAt)}</span>
                    <span className="truncate font-mono">/v/{doc.slug}</span>
                  </div>
                </div>

                <button
                  onClick={() => setPendingDelete(doc)}
                  className="shrink-0 rounded-full border border-navy/15 px-3 py-1.5 text-xs font-semibold text-navy/60 transition-all hover:border-red-400/50 hover:text-red-400"
                >
                  삭제
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className="flex flex-col items-center gap-4 border-t border-navy/[0.06] px-6 py-6 md:flex-row md:justify-between md:px-16">
        <div className="flex gap-5">
          <Link href="/about" className="text-[11px] font-semibold text-navy/35 hover:text-navy">About</Link>
          <Link href="/privacy" className="text-[11px] font-semibold text-navy/35 hover:text-navy">Privacy</Link>
          <Link href="/contact" className="text-[11px] font-semibold text-navy/35 hover:text-navy">Contact</Link>
        </div>
        <span className="text-[10px] uppercase tracking-[3px] text-navy/50">
          Markview — Markdown + View
        </span>
      </footer>

      <ConfirmDialog
        open={!!pendingDelete}
        title="문서를 삭제할까요?"
        description={`«${pendingDelete?.title ?? ""}» 문서를 삭제하면 되돌릴 수 없습니다.`}
        confirmLabel="삭제"
        destructive
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </main>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}
