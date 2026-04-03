import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FileOpenButton } from "../components/FileOpenButton";

describe("FileOpenButton", () => {
  it("renders a file open button", () => {
    render(<FileOpenButton onFileLoad={vi.fn()} />);
    expect(screen.getByLabelText(/파일 열기/)).toBeInTheDocument();
  });

  it("accepts only .md files", () => {
    render(<FileOpenButton onFileLoad={vi.fn()} />);
    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.accept).toBe(".md");
  });

  it("calls onFileLoad with file content when a file is selected", async () => {
    const onFileLoad = vi.fn();
    render(<FileOpenButton onFileLoad={onFileLoad} />);

    const file = new File(["# Test Content"], "test.md", {
      type: "text/markdown",
    });
    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    // Mock FileReader
    const mockReader = {
      readAsText: vi.fn(),
      result: "# Test Content",
      onload: null as (() => void) | null,
    };
    vi.spyOn(window, "FileReader").mockImplementation(
      () => mockReader as unknown as FileReader
    );

    fireEvent.change(input, { target: { files: [file] } });
    mockReader.onload?.();

    expect(onFileLoad).toHaveBeenCalledWith("# Test Content", "test.md");
  });
});
