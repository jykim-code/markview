"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

export function UploadZone() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  const upload = useCallback(
    async (file: File) => {
      setError("");

      if (!file.name.endsWith(".md")) {
        setError(".md 파일만 업로드할 수 있습니다.");
        return;
      }

      if (file.size > 512 * 1024) {
        setError("파일 크기는 512KB 이하여야 합니다.");
        return;
      }

      setIsUploading(true);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = (await res.json()) as { error?: string; slug?: string };

        if (!res.ok) {
          setError(data.error || "업로드에 실패했습니다.");
          return;
        }

        router.push(`/v/${data.slug}`);
      } catch {
        setError("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
      } finally {
        setIsUploading(false);
      }
    },
    [router]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) upload(file);
    },
    [upload]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) upload(file);
    },
    [upload]
  );

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`
        flex flex-col items-center gap-5 transition-all duration-200
        ${isDragging ? "scale-[1.02]" : ""}
        ${isUploading ? "pointer-events-none opacity-50" : ""}
      `}
    >
      {isUploading ? (
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-navy/20 border-t-navy" />
          <p className="text-sm font-medium text-navy/50">업로드 중...</p>
        </div>
      ) : isDragging ? (
        <p className="py-6 text-lg font-semibold text-navy/60">
          여기에 놓으세요!
        </p>
      ) : (
        <>
          <button
            onClick={handleClick}
            className="rounded-full bg-navy px-12 py-4 text-base font-bold text-bg transition-all hover:opacity-85 active:scale-[0.98]"
          >
            .md 파일 업로드
          </button>
          <p className="text-[15px] font-semibold text-navy/50">
            또는 파일 드래그 앤 드롭
          </p>
          <p className="text-xs text-navy/35">.md · 최대 512KB</p>
        </>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".md"
        onChange={handleChange}
        className="hidden"
      />

      {error && (
        <div className="rounded-lg bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
          {error}
        </div>
      )}
    </div>
  );
}
