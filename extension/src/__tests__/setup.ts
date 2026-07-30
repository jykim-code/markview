import "@testing-library/jest-dom/vitest";

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Mock chrome APIs
const mockStorage: Record<string, unknown> = {};

// Optional host permissions, granted/revoked from the side panel at runtime.
type PermissionListener = (p: chrome.permissions.Permissions) => void;
const grantedOrigins = new Set<string>();
const permissionListeners: {
  added: PermissionListener[];
  removed: PermissionListener[];
} = { added: [], removed: [] };

const chromeMock = {
  storage: {
    local: {
      get: (keys: string | string[]) => {
        const result: Record<string, unknown> = {};
        const keyArray = Array.isArray(keys) ? keys : [keys];
        for (const key of keyArray) {
          if (key in mockStorage) result[key] = mockStorage[key];
        }
        return Promise.resolve(result);
      },
      set: (items: Record<string, unknown>) => {
        Object.assign(mockStorage, items);
        return Promise.resolve();
      },
    },
  },
  sidePanel: {
    setPanelBehavior: () => Promise.resolve(),
  },
  permissions: {
    contains: ({ origins = [] }: chrome.permissions.Permissions) =>
      Promise.resolve(origins.every((o) => grantedOrigins.has(o))),
    request: ({ origins = [] }: chrome.permissions.Permissions) => {
      origins.forEach((o) => grantedOrigins.add(o));
      permissionListeners.added.forEach((f) => f({ origins }));
      return Promise.resolve(true);
    },
    remove: ({ origins = [] }: chrome.permissions.Permissions) => {
      origins.forEach((o) => grantedOrigins.delete(o));
      permissionListeners.removed.forEach((f) => f({ origins }));
      return Promise.resolve(true);
    },
    onAdded: {
      addListener: (f: PermissionListener) => permissionListeners.added.push(f),
      removeListener: (f: PermissionListener) => {
        permissionListeners.added = permissionListeners.added.filter(
          (x) => x !== f
        );
      },
    },
    onRemoved: {
      addListener: (f: PermissionListener) =>
        permissionListeners.removed.push(f),
      removeListener: (f: PermissionListener) => {
        permissionListeners.removed = permissionListeners.removed.filter(
          (x) => x !== f
        );
      },
    },
  },
};

Object.defineProperty(globalThis, "chrome", {
  value: chromeMock,
  writable: true,
});
