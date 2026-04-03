import { useRef } from "react";

interface FileOpenButtonProps {
  onFileLoad: (content: string, filename: string) => void;
  variant?: "icon" | "button";
}

export function FileOpenButton({
  onFileLoad,
  variant = "icon",
}: FileOpenButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onFileLoad(reader.result, file.name);
      }
    };
    reader.readAsText(file);

    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".md"
        onChange={handleChange}
        className="hidden"
      />
      {variant === "button" ? (
        <button
          onClick={() => inputRef.current?.click()}
          aria-label="파일 열기"
          className="rounded-full bg-navy px-8 py-3 text-[13px] font-bold text-bg transition-all hover:opacity-85 active:scale-[0.98]"
        >
          .md 파일 열기
        </button>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          aria-label="파일 열기"
          title="파일 열기"
          className="flex h-[30px] w-[30px] items-center justify-center rounded-full text-navy transition-colors hover:bg-navy/[0.06]"
        >
          <svg
            width="14"
            height="14"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
          </svg>
        </button>
      )}
    </>
  );
}
