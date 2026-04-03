chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

// Track download IDs that are .md files
const mdDownloads = new Map<number, string>(); // id -> url

// Fetch .md content using the active tab's context (has auth cookies)
async function fetchViaTab(
  tabId: number,
  url: string
): Promise<string | null> {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: async (fileUrl: string) => {
        try {
          const res = await fetch(fileUrl, { credentials: "include" });
          if (!res.ok) return null;
          return await res.text();
        } catch {
          return null;
        }
      },
      args: [url],
    });
    return results?.[0]?.result ?? null;
  } catch {
    return null;
  }
}

// When filename becomes available or download completes
chrome.downloads.onChanged.addListener(async (delta) => {
  // Track when filename is determined to be .md
  if (delta.filename?.current) {
    const name = delta.filename.current;
    if (name.endsWith(".md") || name.endsWith(".markdown")) {
      // Get the download URL
      const [item] = await chrome.downloads.search({ id: delta.id });
      if (item) {
        mdDownloads.set(delta.id, item.url);
      }
    }
  }

  // When a tracked .md download completes
  if (delta.state?.current === "complete" && mdDownloads.has(delta.id)) {
    const url = mdDownloads.get(delta.id)!;
    mdDownloads.delete(delta.id);

    try {
      const [item] = await chrome.downloads.search({ id: delta.id });
      if (!item) return;

      const filename =
        item.filename.split(/[/\\]/).pop() || "document.md";

      // Get the active tab
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (!tab?.id) return;

      // Try to fetch content via the tab's context (has cookies)
      let content = await fetchViaTab(tab.id, url);

      // Fallback: try finalUrl
      if (!content && item.finalUrl && item.finalUrl !== url) {
        content = await fetchViaTab(tab.id, item.finalUrl);
      }

      // Fallback: try direct fetch from background
      if (!content) {
        try {
          const res = await fetch(url);
          if (res.ok) content = await res.text();
        } catch {
          // ignore
        }
      }

      // Open side panel
      chrome.sidePanel.open({ tabId: tab.id });

      if (content && content.length > 0) {
        // Send content to side panel
        // Small delay to ensure side panel is open
        setTimeout(() => {
          chrome.runtime.sendMessage({
            type: "md-file-downloaded",
            content,
            filename,
          });
        }, 500);
      } else {
        // Can't read — show drag hint
        setTimeout(() => {
          chrome.runtime.sendMessage({
            type: "md-download-hint",
            filename,
          });
        }, 500);
      }
    } catch {
      // Silently fail
    }
  }
});

// Also check at creation time for direct .md URLs
chrome.downloads.onCreated.addListener((item) => {
  const url = item.url || "";
  if (
    url.endsWith(".md") ||
    url.endsWith(".markdown") ||
    item.mime === "text/markdown" ||
    item.mime === "text/x-markdown"
  ) {
    mdDownloads.set(item.id, url);
  }
});
