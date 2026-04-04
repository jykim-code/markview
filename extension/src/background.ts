chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

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

function isMdDownload(item: chrome.downloads.DownloadItem): boolean {
  const url = item.url || "";
  const pathname = new URL(url, "https://x").pathname;
  return (
    pathname.endsWith(".md") ||
    pathname.endsWith(".markdown") ||
    item.mime === "text/markdown" ||
    item.mime === "text/x-markdown"
  );
}

// Track IDs already handled to avoid double-processing
const handledDownloads = new Set<number>();

async function interceptMdDownload(id: number, url: string, finalUrl?: string) {
  if (handledDownloads.has(id)) return;
  handledDownloads.add(id);
  // Prevent memory leak — clean up after 30s
  setTimeout(() => handledDownloads.delete(id), 30_000);

  // Cancel and erase the download
  chrome.downloads.cancel(id, () => {
    chrome.downloads.erase({ id });
  });

  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!tab?.id) return;

    // Open side panel and show loading state BEFORE fetching
    chrome.sidePanel.open({ tabId: tab.id });
    await new Promise((r) => setTimeout(r, 400));
    chrome.runtime.sendMessage({ type: "md-loading" });

    // Now fetch content
    let content = await fetchViaTab(tab.id, url);

    if (!content && finalUrl && finalUrl !== url) {
      content = await fetchViaTab(tab.id, finalUrl);
    }

    if (!content) {
      try {
        const res = await fetch(url);
        if (res.ok) content = await res.text();
      } catch {
        // ignore
      }
    }

    if (content && content.length > 0) {
      chrome.runtime.sendMessage({
        type: "md-file-downloaded",
        content,
      });
    } else {
      chrome.runtime.sendMessage({
        type: "md-download-hint",
      });
    }
  } catch {
    // Silently fail
  }
}

// 1) Intercept at creation time if URL clearly ends with .md
chrome.downloads.onCreated.addListener((item) => {
  if (isMdDownload(item)) {
    interceptMdDownload(item.id, item.url, item.finalUrl);
  }
});

// 2) Fallback: catch by filename when it becomes available
chrome.downloads.onChanged.addListener(async (delta) => {
  if (handledDownloads.has(delta.id)) return;

  if (delta.filename?.current) {
    const name = delta.filename.current;
    if (name.endsWith(".md") || name.endsWith(".markdown")) {
      const [item] = await chrome.downloads.search({ id: delta.id });
      if (item) {
        interceptMdDownload(delta.id, item.url, item.finalUrl);
      }
    }
  }
});
