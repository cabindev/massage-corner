"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useI18n } from "@/app/components/I18nProvider";
import { LANGS } from "@/lib/i18n";

function LangToggle({ scrolled }: { scrolled: boolean }) {
  const { lang, setLang } = useI18n();
  return (
    <div
      className={`flex items-center rounded-full p-0.5 ring-1 ${
        scrolled ? "bg-cream-100 ring-gold/25" : "bg-cream-50/10 ring-cream-50/25"
      }`}
    >
      {LANGS.map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider transition ${
            lang === l
              ? "bg-gold-500 text-onyx"
              : scrolled
              ? "text-bark/55 hover:text-gold-700"
              : "text-cream-50/70 hover:text-cream-50"
          }`}
          aria-pressed={lang === l}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

export default function Navbar() {
  const { t } = useI18n();
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role;
  const isAdmin = role === "ADMIN" || role === "STAFF";
  const overHero = pathname === "/"; // เฉพาะหน้าแรกที่มี hero เข้ม ให้ navbar โปร่งใสได้
  const [atTop, setAtTop] = useState(true);

  useEffect(() => {
    if (!overHero) return;
    const onScroll = () => setAtTop(window.scrollY <= 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [overHero]);

  // โปร่งใสเฉพาะหน้าแรกตอนอยู่บนสุด — หน้าอื่นทึบเสมอ
  const scrolled = !(overHero && atTop);
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { href: "/#services", label: t("nav_services") },
    { href: "/#prices", label: t("nav_prices") },
    { href: "/#gallery", label: t("nav_gallery") },
    { href: "/#about", label: t("nav_about") },
    { href: "/#contact", label: t("nav_contact") },
  ];

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-all duration-500 ${
        scrolled
          ? "border-b border-gold/15 bg-cream/90 backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo.webp"
            alt="Massage Corner Sofia"
            width={48}
            height={34}
            className="h-11 w-auto"
            priority
          />
          <span className="leading-tight">
            <span
              className={`block font-display text-xl font-medium tracking-wide transition-colors ${
                scrolled ? "text-leaf-700" : "text-cream-50"
              }`}
            >
              Massage Corner <span className="text-gold-500">Sofia</span>
            </span>
            <span className="block text-[9px] uppercase tracking-widest-2 text-gold-500">
              {t("brand_tag")}
            </span>
          </span>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-7">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`group relative hidden text-xs font-medium uppercase tracking-wider transition-colors sm:inline-block ${
                scrolled
                  ? "text-bark/65 hover:text-gold-700"
                  : "text-cream-50/80 hover:text-cream-50"
              }`}
            >
              {link.label}
              <span className="absolute -bottom-1.5 left-0 h-px w-0 bg-gold-500 transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
          {isAdmin && (
            <Link
              href="/admin"
              className={`hidden items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium uppercase tracking-wider ring-1 transition sm:inline-flex ${
                scrolled
                  ? "text-leaf-700 ring-leaf-200 hover:bg-leaf-50"
                  : "text-cream-50 ring-cream-50/40 hover:bg-cream-50/10"
              }`}
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden>
                <path
                  d="M4 13h7V4H4v9Zm0 7h7v-5H4v5Zm9 0h7v-9h-7v9Zm0-16v5h7V4h-7Z"
                  fill="currentColor"
                />
              </svg>
              Dashboard
            </Link>
          )}
          <LangToggle scrolled={scrolled} />
          <Link
            href="/booking"
            className={`hidden rounded-full px-5 py-2 text-xs font-medium uppercase tracking-wider transition sm:inline-block ${
              scrolled
                ? "bg-leaf-700 text-cream-50 hover:bg-leaf-600"
                : "bg-gold-500 text-onyx hover:bg-gold-300"
            }`}
          >
            {t("nav_book")}
          </Link>

          {/* hamburger (มือถือ) */}
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className={`flex h-9 w-9 items-center justify-center rounded-lg transition sm:hidden ${
              scrolled ? "text-leaf-700 hover:bg-leaf-50" : "text-cream-50 hover:bg-cream-50/10"
            }`}
            aria-label="Menu"
            aria-expanded={menuOpen}
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden>
              {menuOpen ? (
                <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </nav>
      </div>

      {/* mobile panel */}
      {menuOpen && (
        <div className="border-t border-gold/15 bg-cream/95 backdrop-blur-md sm:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col px-6 py-3">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="border-b border-gold/10 py-3 text-sm font-medium uppercase tracking-wider text-bark/70 last:border-0 hover:text-gold-700"
              >
                {link.label}
              </a>
            ))}
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setMenuOpen(false)}
                className="border-b border-gold/10 py-3 text-sm font-medium uppercase tracking-wider text-leaf-700 hover:text-gold-700"
              >
                Dashboard
              </Link>
            )}
            <Link
              href="/booking"
              onClick={() => setMenuOpen(false)}
              className="mt-3 rounded-full bg-leaf-700 px-5 py-2.5 text-center text-sm font-medium uppercase tracking-wider text-cream-50"
            >
              {t("nav_book")}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
