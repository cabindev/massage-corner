"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useI18n } from "@/app/components/I18nProvider";
import type { ServiceDTO } from "@/lib/services";
import BookingForm from "./BookingForm";

export default function BookingContent({
  services,
  initialServiceId,
}: {
  services: ServiceDTO[];
  initialServiceId?: string;
}) {
  const { t } = useI18n();

  return (
    <>
      <Navbar />

      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-gold/15 bg-onyx">
          <div className="mx-auto max-w-3xl px-6 pb-16 pt-36 text-center">
            <p className="rule-gold inline-flex items-center text-[11px] font-medium uppercase tracking-widest-2 text-gold-300">
              {t("book_pre")}
            </p>
            <h1 className="mt-5 font-display text-4xl font-light text-cream-50 sm:text-5xl">
              {t("book_title")}
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-cream-50/65">
              {t("book_sub")}
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-6 py-16">
          <BookingForm services={services} initialServiceId={initialServiceId} />
        </section>
      </main>

      <Footer />
    </>
  );
}
