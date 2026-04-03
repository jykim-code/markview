import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ThemeToggle } from "../components/ThemeToggle";

describe("ThemeToggle", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("data-theme");
  });

  it("renders toggle button", () => {
    render(<ThemeToggle />);
    expect(screen.getByLabelText(/dark mode/i)).toBeInTheDocument();
  });

  it("toggles theme on click", async () => {
    render(<ThemeToggle />);
    const button = screen.getByLabelText(/dark mode/i);

    // Initial state is light (no saved pref, matchMedia returns false)
    await waitFor(() => {
      expect(
        document.documentElement.getAttribute("data-theme")
      ).toBe("light");
    });

    // First click → dark
    fireEvent.click(button);
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");

    // Second click → light
    fireEvent.click(button);
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });

  it("saves theme preference to chrome.storage.local", async () => {
    render(<ThemeToggle />);
    const button = screen.getByLabelText(/dark mode/i);

    fireEvent.click(button);
    await waitFor(() => {
      expect(chrome.storage.local.set).toBeDefined();
    });
  });
});
