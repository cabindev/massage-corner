"use client";

import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useI18n } from "@/app/components/I18nProvider";
import type { ServiceDTO } from "@/lib/services";

const GALLERY = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => `/images/gallery/g${n}.jpg`);
const MAP_SRC =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2933.6012637547524!2d23.321!3d42.676!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDLCsDQwJzMzLjYiTiAyM8KwMTknMTYuMCJF!5e0!3m2!1sen!2sbg!4v1635000000000!5m2!1sen!2sbg";

function Eyebrow({
  children,
  tone = "gold",
}: {
  children: React.ReactNode;
  tone?: "gold" | "light";
}) {
  return (
    <p
      className={`rule-gold inline-flex items-center text-[11px] font-medium uppercase tracking-widest-2 ${
        tone === "light" ? "text-gold-300" : "text-gold-700"
      }`}
    >
      {children}
    </p>
  );
}

function SectionNumber({
  n,
  tone = "gold",
}: {
  n: string;
  tone?: "gold" | "light";
}) {
  return (
    <span
      className={`numeral text-sm ${
        tone === "light" ? "text-gold-300/80" : "text-gold-600"
      }`}
    >
      {n}
      <span className="opacity-40"> / 06</span>
    </span>
  );
}

export default function HomeContent({ services }: { services: ServiceDTO[] }) {
  const { t, lang } = useI18n();

  const localize = (s: ServiceDTO) => ({
    name: lang === "bg" && s.nameBg ? s.nameBg : s.name,
    description:
      lang === "bg" && s.descriptionBg ? s.descriptionBg : s.description,
  });

  const features = [
    t("feat_certified"),
    t("feat_oils"),
    t("feat_calm"),
    t("feat_flexible"),
  ];

  return (
    <>
      <Navbar />

      <main className="flex-1">
        {/* ═══ HERO ═══ */}
        <section className="relative isolate flex min-h-[92vh] items-center overflow-hidden">
          <Image
            src="/images/hero.jpg"
            alt="Massage Corner Sofia"
            fill
            priority
            sizes="100vw"
            className="-z-10 object-cover"
          />
          {/* ชั้นไล่สีเขียวมรกตเข้ม ให้ดูหรูและอ่านง่าย */}
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-onyx/92 via-leaf-800/80 to-leaf-700/45" />
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(120%_80%_at_15%_50%,transparent,rgba(11,23,20,0.55))]" />

          <div className="mx-auto w-full max-w-6xl px-6 py-32">
            <div className="max-w-2xl">
              <Eyebrow tone="light">{t("hero_pre")}</Eyebrow>
              <h1 className="mt-6 font-display text-6xl font-light leading-[1.05] text-cream-50 sm:text-7xl">
                {t("hero_title_1")}
                <br />
                <span className="italic font-normal text-gold-300">
                  {t("hero_title_2")}
                </span>
              </h1>
              <p className="mt-7 max-w-xl text-lg leading-relaxed text-cream-50/75">
                {t("hero_sub")}
              </p>
              <div className="mt-11 flex flex-wrap items-center gap-7">
                <Link
                  href="/booking"
                  className="rounded-full bg-gold-500 px-9 py-4 text-sm font-medium uppercase tracking-wider text-onyx shadow-xl shadow-onyx/30 transition hover:bg-gold-300"
                >
                  {t("hero_book")}
                </Link>
                <a
                  href="#services"
                  className="group inline-flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-cream-50/90"
                >
                  {t("hero_explore")}
                  <span className="inline-block h-px w-8 bg-gold-300 transition-all duration-300 group-hover:w-12" />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── trust strip ── */}
        <div className="border-b border-gold/15 bg-cream-50">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-2 px-6 py-5 text-[11px] font-medium uppercase tracking-widest-2 text-bark/55">
            {features.map((f, i) => (
              <span key={f} className="flex items-center gap-10">
                {i > 0 && (
                  <span className="hidden h-1 w-1 rounded-full bg-gold-500 sm:inline-block" />
                )}
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* ═══ SERVICES ═══ */}
        <section
          id="services"
          className="mx-auto max-w-6xl scroll-mt-24 px-6 py-24 sm:py-28"
        >
          <div className="flex flex-col items-center text-center">
            <SectionNumber n="01" />
            <div className="mt-4">
              <Eyebrow>{t("serv_label")}</Eyebrow>
            </div>
            <h2 className="mt-4 max-w-2xl font-display text-4xl font-light text-leaf-700 sm:text-5xl">
              {t("serv_title")}
            </h2>
            <p className="mt-4 max-w-xl text-bark/55">{t("serv_sub")}</p>
          </div>

          <div className="mt-16 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => {
              const l = localize(service);
              return (
                <article
                  key={service.id}
                  className="group relative flex flex-col overflow-hidden rounded-[20px] bg-cream-50 ring-1 ring-gold/15 transition duration-500 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-leaf-800/10 hover:ring-gold/40"
                >
                  <div className="relative h-56 overflow-hidden">
                    {service.imageUrl ? (
                      <Image
                        src={service.imageUrl}
                        alt={l.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-leaf-100 to-cream-100" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-onyx/40 to-transparent opacity-60" />
                    <span className="absolute right-4 top-4 rounded-full bg-onyx/55 px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-gold-200 backdrop-blur">
                      {service.durationMinutes} min
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-7">
                    <h3 className="font-display text-2xl font-medium text-leaf-700">
                      {l.name}
                    </h3>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-bark/55">
                      {l.description}
                    </p>
                    <div className="mt-6 flex items-end justify-between gap-3 border-t border-gold/15 pt-5">
                      <span className="leading-none">
                        <span className="block text-[10px] uppercase tracking-widest text-bark/40">
                          {t("price_from")}
                        </span>
                        <span className="numeral mt-1 block text-2xl text-gold-700">
                          {service.price} €
                        </span>
                      </span>
                      <Link
                        href={`/booking?service=${service.id}`}
                        className="group/btn inline-flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-leaf-600 transition hover:text-gold-700"
                      >
                        {t("book_btn")}
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* ═══ PRICE LIST (luxe menu) ═══ */}
        <section
          id="prices"
          className="scroll-mt-24 border-y border-gold/15 bg-cream-50"
        >
          <div className="mx-auto max-w-5xl px-6 py-24 sm:py-28">
            <div className="flex flex-col items-center text-center">
              <SectionNumber n="02" />
              <div className="mt-4">
                <Eyebrow>{t("price_label")}</Eyebrow>
              </div>
              <h2 className="mt-4 font-display text-4xl font-light text-leaf-700 sm:text-5xl">
                {t("price_title")}
              </h2>
              <p className="mt-4 max-w-xl text-bark/55">{t("price_sub")}</p>
              <span className="mt-7 numeral text-gold-500">✦</span>
            </div>

            <div className="mt-14 grid gap-x-16 gap-y-10 sm:grid-cols-2">
              {services
                .filter((s) => s.priceTiers && s.priceTiers.length > 0)
                .map((service) => {
                  const l = localize(service);
                  return (
                    <div key={service.id}>
                      <div className="flex items-baseline justify-between gap-3">
                        <h3 className="font-display text-2xl font-medium text-leaf-700">
                          {l.name}
                        </h3>
                      </div>
                      <ul className="mt-3 space-y-2">
                        {service.priceTiers!.map((tier) => (
                          <li
                            key={tier.minutes}
                            className="flex items-baseline gap-3"
                          >
                            <span className="text-sm uppercase tracking-wide text-bark/55">
                              {tier.minutes} {t("price_min")}
                            </span>
                            <span className="mb-1 flex-1 border-b border-dotted border-gold/40" />
                            <span className="numeral text-lg text-gold-700">
                              {tier.price} €
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
            </div>

            <div className="mt-16 text-center">
              <Link
                href="/booking"
                className="inline-flex items-center gap-3 rounded-full bg-leaf-700 px-9 py-4 text-sm font-medium uppercase tracking-wider text-cream-50 transition hover:bg-leaf-600"
              >
                {t("nav_book")}
              </Link>
            </div>
          </div>
        </section>

        {/* ═══ GALLERY (onyx) ═══ */}
        <section id="gallery" className="scroll-mt-0 bg-onyx">
          <div className="mx-auto max-w-6xl px-6 py-24 sm:py-28">
            <div className="flex flex-col items-center text-center">
              <SectionNumber n="03" tone="light" />
              <div className="mt-4">
                <Eyebrow tone="light">{t("gal_label")}</Eyebrow>
              </div>
              <h2 className="mt-4 font-display text-4xl font-light text-cream-50 sm:text-5xl">
                {t("gal_title")}
              </h2>
              <p className="mt-4 max-w-xl text-cream-50/55">{t("gal_sub")}</p>
            </div>

            <div className="mt-16 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {GALLERY.map((src, i) => (
                <div
                  key={src}
                  className={`group relative overflow-hidden rounded-lg ring-1 ring-cream-50/10 ${
                    i % 5 === 0 ? "row-span-2 aspect-[3/4]" : "aspect-square"
                  }`}
                >
                  <Image
                    src={src}
                    alt={`Massage Corner ${i + 1}`}
                    fill
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className="object-cover transition duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-onyx/0 ring-0 ring-inset ring-gold-500/0 transition duration-500 group-hover:bg-onyx/10 group-hover:ring-1 group-hover:ring-gold-500/40" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ VIDEO ═══ */}
        <section
          id="video"
          className="scroll-mt-24 border-y border-gold/15 bg-cream-50"
        >
          <div className="mx-auto max-w-6xl px-6 py-24 sm:py-28">
            <div className="flex flex-col items-center text-center">
              <SectionNumber n="04" />
              <div className="mt-4">
                <Eyebrow>{t("video_label")}</Eyebrow>
              </div>
              <h2 className="mt-4 font-display text-4xl font-light text-leaf-700 sm:text-5xl">
                {t("video_title")}
              </h2>
              <p className="mt-4 max-w-xl text-bark/55">{t("video_sub")}</p>
            </div>

            <div className="mt-12 grid gap-5 sm:grid-cols-2">
              {["/videos/massage-1.mp4", "/videos/massage-2.mp4"].map((src) => (
                <div
                  key={src}
                  className="overflow-hidden rounded-2xl bg-onyx ring-1 ring-gold/20"
                >
                  <video
                    controls
                    preload="metadata"
                    playsInline
                    className="aspect-video w-full bg-onyx"
                  >
                    <source src={src} type="video/mp4" />
                  </video>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ ABOUT ═══ */}
        <section id="about" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-24 sm:py-28">
          <div className="grid items-center gap-14 lg:grid-cols-2">
            <div className="relative">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[20px]">
                <Image
                  src="/images/services/traditional-thai.jpg"
                  alt={t("about_title")}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
              {/* กรอบทองเหลื่อม */}
              <div
                aria-hidden
                className="pointer-events-none absolute -bottom-5 -right-5 -z-10 h-full w-full rounded-[20px] border border-gold-500/50"
              />
            </div>
            <div>
              <SectionNumber n="05" />
              <div className="mt-4">
                <Eyebrow>{t("about_label")}</Eyebrow>
              </div>
              <h2 className="mt-4 font-display text-4xl font-light leading-tight text-leaf-700 sm:text-5xl">
                {t("about_title")}
              </h2>
              <p className="mt-5 leading-relaxed text-bark/60">{t("about_p1")}</p>
              <p className="mt-3 leading-relaxed text-bark/60">{t("about_p2")}</p>
              <ul className="mt-9 divide-y divide-gold/15 border-y border-gold/15">
                {features.map((f) => (
                  <li key={f} className="flex items-center gap-4 py-3.5">
                    <span className="numeral text-gold-600">✦</span>
                    <span className="text-sm font-medium tracking-wide text-bark/75">
                      {f}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ═══ CONTACT (onyx) ═══ */}
        <section id="contact" className="scroll-mt-0 bg-onyx">
          <div className="mx-auto max-w-6xl px-6 py-24 sm:py-28">
            <div className="flex flex-col items-center text-center">
              <SectionNumber n="06" tone="light" />
              <div className="mt-4">
                <Eyebrow tone="light">{t("cont_label")}</Eyebrow>
              </div>
              <h2 className="mt-4 font-display text-4xl font-light text-cream-50 sm:text-5xl">
                {t("cont_title")}
              </h2>
            </div>
            <div className="mt-16 grid gap-10 lg:grid-cols-2">
              <div className="overflow-hidden rounded-[20px] ring-1 ring-gold-500/20">
                <iframe
                  src={MAP_SRC}
                  title="Map"
                  className="h-80 w-full lg:h-full"
                  style={{ border: 0, minHeight: "340px" }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <div className="flex flex-col justify-center gap-8">
                {[
                  { l: t("cont_address"), v: t("address_val"), href: undefined },
                  { l: t("cont_phone"), v: "088 625 0786", href: "tel:0886250786" },
                  { l: t("cont_hours"), v: t("cont_hours_val"), href: undefined },
                ].map((row) => (
                  <div key={row.l} className="border-l border-gold-500/40 pl-5">
                    <p className="text-[11px] font-medium uppercase tracking-widest-2 text-gold-400">
                      {row.l}
                    </p>
                    {row.href ? (
                      <a
                        href={row.href}
                        className="mt-1.5 block font-display text-xl text-cream-50 hover:text-gold-300"
                      >
                        {row.v}
                      </a>
                    ) : (
                      <p className="mt-1.5 font-display text-xl text-cream-50">
                        {row.v}
                      </p>
                    )}
                  </div>
                ))}
                <Link
                  href="/booking"
                  className="mt-2 inline-flex w-fit items-center gap-3 rounded-full bg-gold-500 px-8 py-3.5 text-sm font-medium uppercase tracking-wider text-onyx transition hover:bg-gold-300"
                >
                  {t("nav_book")}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ CTA ═══ */}
        <section className="bg-leaf-700">
          <div className="mx-auto max-w-4xl px-6 py-24 text-center sm:py-28">
            <Eyebrow tone="light">{t("cta_label")}</Eyebrow>
            <h2 className="mt-5 font-display text-4xl font-light italic text-cream-50 sm:text-6xl">
              {t("cta_title")}
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-cream-50/70">{t("cta_sub")}</p>
            <Link
              href="/booking"
              className="mt-10 inline-flex items-center gap-3 rounded-full bg-gold-500 px-10 py-4 text-sm font-medium uppercase tracking-wider text-onyx transition hover:bg-gold-300"
            >
              {t("cta_btn")}
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
