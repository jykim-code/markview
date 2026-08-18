import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

type NavKey = "home" | "my" | "about" | "privacy" | "contact";

/**
 * Privacy and Contact drop out of the header below `sm` and stay reachable
 * through the footer every page already renders — the landing page's
 * long-standing arrangement, now applied everywhere. Home, My Docs and About
 * fit a 320px viewport alongside the theme toggle (measured, not guessed).
 */
const LINKS: { key: NavKey; href: string; label: string; mobile: boolean }[] = [
  { key: "home", href: "/", label: "Home", mobile: true },
  { key: "my", href: "/my", label: "My Docs", mobile: true },
  { key: "about", href: "/about", label: "About", mobile: true },
  { key: "privacy", href: "/privacy", label: "Privacy", mobile: false },
  { key: "contact", href: "/contact", label: "Contact", mobile: false },
];

interface SiteHeaderProps {
  /** Which nav link renders as the current page. */
  active?: NavKey;
}

/**
 * Top bar for the static pages (landing, /my, About, Privacy, Contact).
 *
 * These pages used to carry five hand-copied headers that had drifted apart:
 * three padding variants, two z-indexes, and three different ideas of which
 * links a phone shows. None of that was a rendering bug, but every future
 * header change had five chances to miss a copy.
 *
 * The editor pages keep their own EditorHeader: that one carries document
 * actions (save, export, share) and collapses into a hamburger instead.
 */
export function SiteHeader({ active }: SiteHeaderProps) {
  return (
    <header
      className="sticky top-0 z-50 flex h-[66px] items-center justify-between bg-bg px-4 transition-colors duration-300 md:px-8"
      style={{ borderBottom: "1px solid var(--header-border)" }}
    >
      <Link href="/" className="shrink-0 transition-opacity hover:opacity-70">
        <Image
          src="/markview_text_icon.svg"
          alt="Markview"
          width={200}
          height={56}
          priority={active === "home"}
          className="h-7 w-auto logo-light"
        />
        <Image
          src="/markview_text_icon_dark.svg"
          alt="Markview"
          width={200}
          height={56}
          priority={active === "home"}
          className="h-7 w-auto logo-dark"
        />
      </Link>
      <nav className="flex items-center gap-3 md:gap-6">
        {LINKS.map(({ key, href, label, mobile }) => (
          <Link
            key={key}
            href={href}
            className={`text-xs font-semibold uppercase tracking-wider ${
              mobile ? "" : "hidden sm:inline "
            }${
              active === key ? "text-navy" : "text-navy/50 hover:text-navy"
            }`}
          >
            {label}
          </Link>
        ))}
        <ThemeToggle />
      </nav>
    </header>
  );
}
