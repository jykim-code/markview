import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SiteAccessToggle } from "../components/SiteAccessToggle";
import { originPattern } from "../lib/origin";

const ALL_URLS = { origins: ["<all_urls>"] };

describe("SiteAccessToggle", () => {
  beforeEach(async () => {
    await chrome.permissions.remove(ALL_URLS);
  });

  it("starts off when the optional permission is not granted", async () => {
    render(<SiteAccessToggle />);
    const sw = await screen.findByRole("switch");
    expect(sw).toHaveAttribute("aria-checked", "false");
    expect(screen.getByText(/모든 사이트 접근 권한이 필요합니다/)).toBeInTheDocument();
  });

  it("requests the permission on enable and reflects the granted state", async () => {
    render(<SiteAccessToggle />);
    fireEvent.click(await screen.findByRole("switch"));

    await waitFor(() => {
      expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
    });
    expect(await chrome.permissions.contains(ALL_URLS)).toBe(true);
  });

  it("revokes the permission on disable", async () => {
    await chrome.permissions.request(ALL_URLS);
    render(<SiteAccessToggle />);

    const sw = await screen.findByRole("switch");
    await waitFor(() => expect(sw).toHaveAttribute("aria-checked", "true"));

    fireEvent.click(sw);
    await waitFor(() => {
      expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false");
    });
    expect(await chrome.permissions.contains(ALL_URLS)).toBe(false);
  });
});

describe("originPattern", () => {
  it("narrows a URL to its origin so access is not requested site-wide", () => {
    expect(originPattern("https://example.com/docs/a.md?x=1")).toBe(
      "https://example.com/*"
    );
    expect(originPattern("http://localhost:3000/a.md")).toBe(
      "http://localhost/*"
    );
  });

  it("returns null for schemes chrome.permissions cannot grant", () => {
    expect(originPattern("file:///C:/notes/a.md")).toBeNull();
    expect(originPattern("chrome://extensions")).toBeNull();
    expect(originPattern("not a url")).toBeNull();
  });
});
