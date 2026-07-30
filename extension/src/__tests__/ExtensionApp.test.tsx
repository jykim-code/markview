import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ExtensionApp } from "../components/ExtensionApp";

// SiteAccessToggle reads chrome.permissions on mount, so every render schedules
// an async state update. Flush it before asserting, otherwise React logs an
// act() warning on each test and real warnings get lost in the noise.
async function renderApp() {
  const result = render(<ExtensionApp />);
  await act(async () => {});
  return result;
}

describe("ExtensionApp", () => {
  it("renders home screen with guide when empty", async () => {
    await renderApp();
    expect(screen.getByText(/형태로\./)).toBeInTheDocument();
    expect(screen.getByText(/\.md 파일 열기/)).toBeInTheDocument();
    expect(screen.getByText(/직접 입력하기/)).toBeInTheDocument();
  });

  it("shows view mode first when content is entered via edit", async () => {
    await renderApp();
    // Click "직접 입력" to go to edit mode
    fireEvent.click(screen.getByText(/직접 입력하기/));
    const textarea = screen.getByPlaceholderText(/마크다운을 입력하세요/);
    fireEvent.change(textarea, { target: { value: "# Hello World" } });

    // Switch to view — View tab should be first
    const viewTab = screen.getByRole("button", { name: /view/i });
    fireEvent.click(viewTab);
    expect(viewTab).toHaveAttribute("aria-selected", "true");
  });

  it("preserves content when switching tabs", async () => {
    await renderApp();
    // Enter edit mode
    fireEvent.click(screen.getByText(/직접 입력하기/));
    const textarea = screen.getByPlaceholderText(/마크다운을 입력하세요/);
    fireEvent.change(textarea, { target: { value: "# Hello World" } });

    // Switch to view and back
    fireEvent.click(screen.getByRole("button", { name: /view/i }));
    fireEvent.click(screen.getByRole("button", { name: /edit/i }));

    expect(
      screen.getByPlaceholderText(/마크다운을 입력하세요/)
    ).toHaveValue("# Hello World");
  });

  it("derives title from first H1 heading", async () => {
    await renderApp();
    fireEvent.click(screen.getByText(/직접 입력하기/));
    const textarea = screen.getByPlaceholderText(/마크다운을 입력하세요/);
    fireEvent.change(textarea, {
      target: { value: "# My Document\n\nSome content" },
    });
    expect(screen.getByText("My Document")).toBeInTheDocument();
  });

  it("hides header on empty home screen (view mode)", async () => {
    await renderApp();
    // Home screen in view mode — no header
    expect(screen.queryByRole("button", { name: /view/i })).not.toBeInTheDocument();
  });

  it("shows header when entering edit mode from home", async () => {
    await renderApp();
    fireEvent.click(screen.getByText(/직접 입력하기/));
    // Header visible with tabs in edit mode
    expect(screen.getByRole("button", { name: /view/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument();
  });
});
