"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ServiceDTO } from "@/lib/services";
import type { SlotInfo } from "@/lib/availability";
import { isClosedDateKey, sofiaDateTimeToUTC } from "@/lib/schedule-config";
import { useI18n } from "@/app/components/I18nProvider";
import { createBooking, getAvailability } from "./actions";

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

const inputClass =
  "w-full rounded-xl bg-cream-50 px-4 py-3 text-bark ring-1 ring-gold/20 outline-none transition placeholder:text-bark/40 focus:ring-2 focus:ring-leaf-500";
const labelClass = "mb-1.5 block text-sm font-medium text-bark";

type Result =
  | { ok: true; bookingId: string }
  | { ok: false; message: string }
  | null;

export default function BookingForm({
  services,
  initialServiceId,
}: {
  services: ServiceDTO[];
  initialServiceId?: string;
}) {
  const { t, lang } = useI18n();

  const localizeName = (s: ServiceDTO) =>
    lang === "bg" && s.nameBg ? s.nameBg : s.name;
  const localizeDesc = (s: ServiceDTO) =>
    lang === "bg" && s.descriptionBg ? s.descriptionBg : s.description;

  const defaultService =
    services.find((s) => s.id === initialServiceId)?.id ??
    services[0]?.id ??
    "";

  const [serviceId, setServiceId] = useState(defaultService);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Result>(null);
  const [slots, setSlots] = useState<SlotInfo[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const selected = services.find((s) => s.id === serviceId);

  // ตั้งวันที่เริ่มต้นเป็น "วันนี้" หลัง mount (ทำฝั่ง client เท่านั้น กัน hydration mismatch)
  useEffect(() => {
    setDate((prev) => prev || todayStr());
  }, []);

  // โหลดเวลาว่างจริงเมื่อเปลี่ยนบริการหรือวันที่
  useEffect(() => {
    if (!serviceId || !date) {
      setSlots([]);
      return;
    }
    let cancelled = false;
    setLoadingSlots(true);
    getAvailability(serviceId, date)
      .then((data) => {
        if (cancelled) return;
        setSlots(data);
        setTime((prev) =>
          prev && data.find((s) => s.time === prev)?.available ? prev : ""
        );
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });
    return () => {
      cancelled = true;
    };
  }, [serviceId, date]);

  const hasAnyFree = slots.some((s) => s.available);
  const closedDay = date ? isClosedDateKey(date) : false;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);

    if (!serviceId || !customerName.trim() || !phone.trim() || !date || !time) {
      setResult({ ok: false, message: t("f_required") });
      return;
    }

    const bookingTime = sofiaDateTimeToUTC(date, time);
    if (isNaN(bookingTime.getTime())) {
      setResult({ ok: false, message: t("f_required") });
      return;
    }

    setSubmitting(true);
    try {
      const data = await createBooking({
        serviceId,
        customerName: customerName.trim(),
        phone: phone.trim(),
        bookingTime: bookingTime.toISOString(),
        notes: notes.trim() || undefined,
      });
      if (data.ok) {
        setResult({ ok: true, bookingId: data.bookingId });
      } else {
        setResult({ ok: false, message: data.message });
      }
    } catch {
      setResult({ ok: false, message: data_error() });
    } finally {
      setSubmitting(false);
    }
  }

  function data_error() {
    return lang === "bg"
      ? "Връзката със сървъра е неуспешна. Моля, опитайте отново."
      : "Could not reach the server. Please try again.";
  }

  // ─── หน้าจอยืนยันหลังจองสำเร็จ ───
  if (result?.ok) {
    return (
      <div className="rounded-3xl bg-cream-50 p-8 text-center ring-1 ring-gold/20 shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-leaf-100 text-leaf-700">
          <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8" aria-hidden>
            <path
              d="M5 13l4 4L19 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h2 className="mt-5 font-display text-3xl font-semibold text-leaf-700">
          {t("succ_title")}
        </h2>
        <p className="mt-2 text-bark/60">{t("succ_sub")}</p>
        <div className="mx-auto mt-6 max-w-xs rounded-2xl bg-cream-100 p-4 ring-1 ring-gold/15">
          <p className="text-sm text-bark/50">{t("succ_code")}</p>
          <p className="mt-1 font-mono text-sm font-semibold text-gold-700 break-all">
            {result.bookingId}
          </p>
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => {
              setResult(null);
              setCustomerName("");
              setPhone("");
              setDate("");
              setTime("");
              setNotes("");
            }}
            className="rounded-full bg-leaf-700 px-6 py-3 font-medium text-cream-50 transition hover:bg-leaf-800"
          >
            {t("succ_again")}
          </button>
          <Link
            href="/"
            className="rounded-full bg-cream-50 px-6 py-3 font-medium text-leaf-700 ring-1 ring-gold/25 transition hover:bg-cream-100"
          >
            {t("succ_home")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl bg-cream-50 p-6 ring-1 ring-gold/20 shadow-sm sm:p-8"
    >
      {result && !result.ok && (
        <div className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100">
          {result.message}
        </div>
      )}

      <div className="space-y-5">
        {/* บริการ */}
        <div>
          <label htmlFor="service" className={labelClass}>
            {t("f_service")} <span className="text-red-500">*</span>
          </label>
          <select
            id="service"
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            className={inputClass}
            required
          >
            {services.length === 0 && <option value="">—</option>}
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {localizeName(s)} · {s.durationMinutes} min · {s.price} €
              </option>
            ))}
          </select>
          {selected && (
            <p className="mt-2 text-sm text-bark/55">{localizeDesc(selected)}</p>
          )}
        </div>

        {/* วันที่ + เวลา */}
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="date" className={labelClass}>
              {t("f_date")} <span className="text-red-500">*</span>
            </label>
            <input
              id="date"
              type="date"
              min={todayStr()}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label htmlFor="time" className={labelClass}>
              {t("f_time")} <span className="text-red-500">*</span>
            </label>
            <select
              id="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className={inputClass}
              required
              disabled={!date || loadingSlots}
            >
              <option value="">
                {!date
                  ? t("slot_pick_date")
                  : loadingSlots
                  ? t("slot_loading")
                  : t("slot_pick")}
              </option>
              {slots.map((s) => (
                <option key={s.time} value={s.time} disabled={!s.available}>
                  {s.time}
                  {!s.available ? ` — ${t("slot_full")}` : ""}
                </option>
              ))}
            </select>
            {date && !loadingSlots && closedDay && (
              <p className="mt-2 text-sm text-amber-600">{t("day_closed")}</p>
            )}
            {date && !loadingSlots && !closedDay && slots.length > 0 && !hasAnyFree && (
              <p className="mt-2 text-sm text-amber-600">{t("slot_all_full")}</p>
            )}
          </div>
        </div>

        {/* ชื่อ + เบอร์โทร */}
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className={labelClass}>
              {t("f_name")} <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder={t("name_ph")}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label htmlFor="phone" className={labelClass}>
              {t("f_phone")} <span className="text-red-500">*</span>
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t("phone_ph")}
              className={inputClass}
              required
            />
          </div>
        </div>

        {/* หมายเหตุ */}
        <div>
          <label htmlFor="notes" className={labelClass}>
            {t("f_notes")}
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder={t("notes_ph")}
            className={`${inputClass} resize-none`}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="mt-7 w-full rounded-full bg-leaf-700 px-6 py-3.5 font-medium text-cream-50 shadow-md transition hover:bg-leaf-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? t("f_submitting") : t("f_submit")}
      </button>
    </form>
  );
}
