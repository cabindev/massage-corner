"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  OPEN_MINUTES,
  CLOSE_MINUTES,
  SLOT_STEP_MINUTES,
} from "@/lib/schedule-config";
import { therapistColor } from "@/lib/therapist-color";
import { createWalkin } from "./walkin-actions";

export type CalendarBooking = {
  id: string;
  customerName: string;
  serviceName: string;
  therapistId: string | null;
  therapistName: string | null;
  start: string; // ISO
  end: string; // ISO
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "REJECTED";
};
export type ServiceLite = {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
};
export type TherapistLite = { id: string; name: string };

const ST: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "Pending", cls: "bg-amber-100 text-amber-700" },
  CONFIRMED: { label: "Confirmed", cls: "bg-leaf-100 text-leaf-700" },
  COMPLETED: { label: "Completed", cls: "bg-sky-100 text-sky-700" },
  CANCELLED: { label: "Cancelled", cls: "bg-bark/10 text-bark/62" },
  REJECTED: { label: "Rejected", cls: "bg-red-100 text-red-700" },
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}
function hhmm(min: number) {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(
    min % 60
  ).padStart(2, "0")}`;
}

type Parsed = CalendarBooking & { startMs: number; endMs: number; key: string };

export default function BookingCalendar({
  bookings,
  therapistCount,
  services,
  therapists,
}: {
  bookings: CalendarBooking[];
  therapistCount: number;
  services: ServiceLite[];
  therapists: TherapistLite[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const today = new Date();
  const [view, setView] = useState({
    y: today.getFullYear(),
    m: today.getMonth(),
  });
  const [selected, setSelected] = useState(dateKey(today));

  // ── walk-in form state ──
  const [walkTime, setWalkTime] = useState<string | null>(null); // "HH:MM"
  const [wService, setWService] = useState(services[0]?.id ?? "");
  const [wName, setWName] = useState("");
  const [wPhone, setWPhone] = useState("");
  const [wTherapist, setWTherapist] = useState("");
  const [wError, setWError] = useState<string | null>(null);

  const { parsed, countByDay } = useMemo(() => {
    const parsed: Parsed[] = bookings.map((b) => {
      const s = new Date(b.start);
      return {
        ...b,
        startMs: s.getTime(),
        endMs: new Date(b.end).getTime(),
        key: dateKey(s),
      };
    });
    const countByDay = new Map<string, number>();
    for (const b of parsed)
      countByDay.set(b.key, (countByDay.get(b.key) ?? 0) + 1);
    return { parsed, countByDay };
  }, [bookings]);

  const cells = useMemo(() => {
    const first = new Date(view.y, view.m, 1);
    const lead = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
    const arr: (Date | null)[] = [];
    for (let i = 0; i < lead; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(new Date(view.y, view.m, d));
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [view]);

  const todayKey = dateKey(today);
  const [sy, sm, sd] = selected.split("-").map(Number);

  const dayBookings = parsed
    .filter((b) => b.key === selected)
    .sort((a, b) => a.startMs - b.startMs);

  const slots: { min: number; label: string; free: number }[] = [];
  for (let min = OPEN_MINUTES; min < CLOSE_MINUTES; min += SLOT_STEP_MINUTES) {
    const t = new Date(sy, sm - 1, sd, Math.floor(min / 60), min % 60).getTime();
    const occupied = parsed.filter(
      (b) =>
        b.status !== "CANCELLED" &&
        b.status !== "REJECTED" &&
        b.startMs <= t &&
        t < b.endMs
    ).length;
    slots.push({
      min,
      label: hhmm(min),
      free: Math.max(0, therapistCount - occupied),
    });
  }

  const monthLabel = new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
  }).format(new Date(view.y, view.m, 1));
  const selectedLabel = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(sy, sm - 1, sd));

  function shift(delta: number) {
    setView((v) => {
      const d = new Date(v.y, v.m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  }

  function openWalkin(time: string) {
    setWalkTime(time);
    setWName("");
    setWPhone("");
    setWTherapist("");
    setWService(services[0]?.id ?? "");
    setWError(null);
  }

  function submitWalkin(e: React.FormEvent) {
    e.preventDefault();
    if (!walkTime || !wName.trim() || !wService) {
      setWError("Please enter a service and customer name.");
      return;
    }
    const [hh, mm] = walkTime.split(":").map(Number);
    const dt = new Date(sy, sm - 1, sd, hh, mm);
    setWError(null);
    startTransition(async () => {
      const res = await createWalkin({
        serviceId: wService,
        customerName: wName.trim(),
        phone: wPhone.trim() || undefined,
        therapistId: wTherapist || null,
        dateTime: dt.toISOString(),
      });
      if (res.ok) {
        setWalkTime(null);
        router.refresh();
      } else {
        setWError(res.message);
      }
    });
  }

  const selSvc = services.find((s) => s.id === wService);
  const fieldCls =
    "w-full rounded-xl bg-cream-50 px-3 py-2 text-sm text-bark ring-1 ring-leaf-100 outline-none focus:ring-2 focus:ring-leaf-500";

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* ── month grid ── */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="font-display text-lg font-medium text-leaf-700">
            {monthLabel}
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => shift(-1)} className="flex h-8 w-8 items-center justify-center rounded-lg text-bark/60 ring-1 ring-leaf-100 transition hover:bg-cream-50" aria-label="Previous month">‹</button>
            <button onClick={() => setView({ y: today.getFullYear(), m: today.getMonth() })} className="rounded-lg px-2.5 py-1 text-xs text-bark/60 ring-1 ring-leaf-100 transition hover:bg-cream-50">Today</button>
            <button onClick={() => shift(1)} className="flex h-8 w-8 items-center justify-center rounded-lg text-bark/60 ring-1 ring-leaf-100 transition hover:bg-cream-50" aria-label="Next month">›</button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wide text-bark/52">
          {WEEKDAYS.map((w) => (<span key={w} className="py-1">{w}</span>))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (!d) return <span key={i} />;
            const key = dateKey(d);
            const count = countByDay.get(key) ?? 0;
            const isSel = key === selected;
            const isToday = key === todayKey;
            return (
              <button
                key={i}
                onClick={() => setSelected(key)}
                className={`relative aspect-square rounded-lg text-sm transition ${
                  isSel
                    ? "bg-leaf-700 font-semibold text-cream-50"
                    : isToday
                    ? "bg-cream-50 text-bark ring-1 ring-gold-400"
                    : "text-bark/70 hover:bg-cream-50"
                }`}
              >
                {d.getDate()}
                {count > 0 && (
                  <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 rounded-full px-1.5 text-[9px] font-semibold ${isSel ? "bg-cream-50/25 text-cream-50" : "bg-gold-500 text-onyx"}`}>{count}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── day detail ── */}
      <div className="rounded-xl bg-cream-50 p-4 ring-1 ring-leaf-50">
        <p className="font-display text-lg font-medium text-leaf-700">
          {selectedLabel}
        </p>
        <p className="text-xs text-bark/58">
          {dayBookings.length} booking{dayBookings.length === 1 ? "" : "s"} · capacity {therapistCount}
        </p>

        <ul className="mt-3 max-h-40 space-y-1.5 overflow-y-auto">
          {dayBookings.length === 0 ? (
            <li className="py-5 text-center text-sm text-bark/52">No bookings this day.</li>
          ) : (
            dayBookings.map((b) => {
              const c = therapistColor(b.therapistId);
              return (
                <li
                  key={b.id}
                  className="flex items-center gap-3 rounded-lg bg-white px-3 py-2 ring-1 ring-leaf-50"
                >
                  <span className="numeral w-12 shrink-0 text-sm font-semibold text-leaf-700">
                    {hhmm(new Date(b.startMs).getHours() * 60 + new Date(b.startMs).getMinutes())}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-bark">{b.customerName}</span>
                    <span className="flex items-center gap-1.5 truncate text-xs text-bark/68">
                      <span className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ background: c.base }} />
                      {b.serviceName}{b.therapistName ? ` · ${b.therapistName}` : " · unassigned"}
                    </span>
                  </span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${ST[b.status]?.cls ?? ""}`}>{ST[b.status]?.label ?? b.status}</span>
                </li>
              );
            })
          )}
        </ul>

        <p className="mt-4 mb-2 text-[11px] font-semibold uppercase tracking-wide text-bark/58">
          Availability — click a free slot to add a walk-in
        </p>
        <div className="grid grid-cols-4 gap-1 sm:grid-cols-5">
          {slots.map((s) => {
            const full = s.free === 0;
            return (
              <button
                key={s.min}
                type="button"
                disabled={full || pending}
                onClick={() => openWalkin(s.label)}
                title={full ? `${s.label} · full` : `${s.label} · ${s.free} free — add walk-in`}
                className={`rounded-md px-1.5 py-1 text-center text-[11px] font-medium transition ${
                  full
                    ? "cursor-not-allowed bg-red-50 text-red-400"
                    : s.free === therapistCount
                    ? "bg-leaf-50 text-leaf-700 hover:bg-leaf-100 hover:ring-1 hover:ring-leaf-300"
                    : "bg-gold-50 text-gold-700 hover:bg-gold-100 hover:ring-1 hover:ring-gold-300"
                }`}
              >
                {s.label}
                <span className="ml-1 opacity-70">{full ? "full" : s.free}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── walk-in modal ── */}
      {walkTime && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-onyx/40 p-4"
          onClick={() => !pending && setWalkTime(null)}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={submitWalkin}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl ring-1 ring-leaf-100"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-display text-xl font-medium text-leaf-700">
                  New walk-in
                </h3>
                <p className="text-sm text-bark/68">
                  {selectedLabel} · {walkTime}
                  {selSvc ? ` – ${hhmm(
                    Number(walkTime.split(":")[0]) * 60 +
                      Number(walkTime.split(":")[1]) +
                      selSvc.durationMinutes
                  )}` : ""}
                </p>
              </div>
              <button type="button" onClick={() => setWalkTime(null)} className="text-bark/52 hover:text-bark" aria-label="Close">✕</button>
            </div>

            <div className="mt-5 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-bark/60">Service</label>
                <select value={wService} onChange={(e) => setWService(e.target.value)} className={fieldCls} required>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} · {s.durationMinutes}m · {s.price} €</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-bark/60">Customer name</label>
                  <input value={wName} onChange={(e) => setWName(e.target.value)} placeholder="e.g. Maria I." className={fieldCls} required />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-bark/60">Phone (optional)</label>
                  <input value={wPhone} onChange={(e) => setWPhone(e.target.value)} placeholder="—" className={fieldCls} />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-bark/60">Therapist (optional)</label>
                <select value={wTherapist} onChange={(e) => setWTherapist(e.target.value)} className={fieldCls}>
                  <option value="">— Assign later —</option>
                  {therapists.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}
                </select>
              </div>
            </div>

            {wError && <p className="mt-3 text-sm text-red-600">{wError}</p>}

            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setWalkTime(null)} disabled={pending} className="rounded-full px-5 py-2.5 text-sm text-bark/60 ring-1 ring-leaf-100 hover:bg-cream-50">Cancel</button>
              <button type="submit" disabled={pending} className="rounded-full bg-leaf-700 px-6 py-2.5 text-sm font-medium text-cream-50 transition hover:bg-leaf-600 disabled:opacity-50">
                {pending ? "Saving…" : "Confirm walk-in"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
