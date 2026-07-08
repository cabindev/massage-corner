"use client";

import Link from "next/link";
import { useI18n } from "@/app/components/I18nProvider";

export default function Footer() {
  const { t } = useI18n();
  return (
    <footer className="mt-auto bg-onyx text-cream-50/70">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <h3 className="font-display text-3xl font-light text-cream-50">
              Massage Corner <span className="text-gold-400">Sofia</span>
            </h3>
            <p className="mt-2 text-[10px] uppercase tracking-widest-2 text-gold-400">
              {t("brand_tag")}
            </p>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-cream-50/55">
              {t("about_p1")}
            </p>
          </div>

          <div>
            <h4 className="rule-gold inline-flex items-center text-[11px] font-medium uppercase tracking-widest-2 text-gold-400">
              {t("nav_contact")}
            </h4>
            <p className="mt-4 text-sm leading-relaxed text-cream-50/60">
              {t("address_val")}
            </p>
            <a
              href="tel:0876047743"
              className="mt-2 block font-display text-lg text-cream-50 hover:text-gold-300"
            >
              08 7604 7743
            </a>
          </div>

          <div>
            <h4 className="rule-gold inline-flex items-center text-[11px] font-medium uppercase tracking-widest-2 text-gold-400">
              {t("cont_hours")}
            </h4>
            <p className="mt-4 text-sm text-cream-50/60">{t("cont_hours_val")}</p>
            <Link
              href="/booking"
              className="mt-5 inline-flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-gold-300 hover:text-gold-200"
            >
              {t("nav_book")}
            </Link>
          </div>
        </div>
      </div>
      <div className="border-t border-cream-50/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-6 text-xs tracking-wide text-cream-50/40 sm:flex-row">
          <span>
            © {new Date().getFullYear()} Massage Corner Sofia · {t("rights")}
          </span>
          <nav className="flex items-center gap-3">
            <Link
              href="/"
              className="rounded-full px-4 py-1.5 font-medium uppercase tracking-wider text-cream-50/70 ring-1 ring-cream-50/15 transition hover:bg-cream-50/10 hover:text-cream-50"
            >
              {t("nav_home")}
            </Link>
            <Link
              href="/auth/signin"
              className="rounded-full bg-gold-500 px-4 py-1.5 font-medium uppercase tracking-wider text-onyx transition hover:bg-gold-300"
            >
              {t("admin_login")}
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
