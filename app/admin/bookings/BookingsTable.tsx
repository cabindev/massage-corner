"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { therapistColor } from "@/lib/therapist-color";
import { SHOP_TIMEZONE, sofiaDateKey } from "@/lib/schedule-config";
import { assignTherapist, updateBookingStatus, deleteBooking } from "./actions";
import BookingFormModal, {
  emptyInitial,
  initialFromBooking,
  type BookingFormInitial,
} from "./BookingFormModal";

type Status = "PENDING" | "CONFIRMED" | "REJECTED" | "COMPLETED" | "CANCELLED";

export type BookingRow = {
  id: string;
  customerName: string;
  phone: string;
  serviceId: string;
  serviceName: string;
  durationMinutes: number;
  bookingTimeISO: string;
  status: Status;
  therapistId: string | null;
  notes: string | null;
};
type Therapist = { id: string; name: string };
type Service = { id: string; name: string; durationMinutes: number; price: number };

const ST: Record<Status, { label: string; cls: string }> = {
  PENDING: { label: "Pending", cls: "bg-amber-100 text-amber-700 ring-amber-200" },
  CONFIRMED: { label: "Confirmed", cls: "bg-leaf-100 text-leaf-700 ring-leaf-200" },
  REJECTED: { label: "Rejected", cls: "bg-red-100 text-red-700 ring-red-200" },
  COMPLETED: { label: "Completed", cls: "bg-sky-100 text-sky-700 ring-sky-200" },
  CANCELLED: { label: "Cancelled", cls: "bg-bark/10 text-bark/68 ring-bark/15" },
};

function actionsFor(status: Status): { to: Status; label: string; cls: string }[] {
  const primary = "bg-leaf-700 text-white hover:bg-leaf-600";
  const sky = "bg-sky-600 text-white hover:bg-sky-700";
  const danger = "bg-red-50 text-red-600 ring-1 ring-red-200 hover:bg-red-100";
  const muted = "bg-cream-100 text-bark/60 ring-1 ring-leaf-100 hover:bg-cream";
  switch (status) {
    case "PENDING":
      return [
        { to: "CONFIRMED", label: "Confirm", cls: primary },
        { to: "REJECTED", label: "Reject", cls: danger },
      ];
    case "CONFIRMED":
      return [
        { to: "COMPLETED", label: "Complete", cls: sky },
        { to: "CANCELLED", label: "Cancel", cls: muted },
      ];
    default:
      return [{ to: "PENDING", label: "Reopen", cls: muted }];
  }
}

const FILTERS = ["Today", "Upcoming", "Pending", "Done", "All"] as const;
type Filter = (typeof FILTERS)[number];

function sameDay(a: Date, b: Date) {
  return sofiaDateKey(a) === sofiaDateKey(b);
}
function fmt(d: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: SHOP_TIMEZONE,
  }).format(d);
}
export default function BookingsTable({
  bookings,
  therapists,
  services,
}: {
  bookings: BookingRow[];
  therapists: Therapist[];
  services: Service[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("Upcoming");
  const [query, setQuery] = useState("");

  // modal: create or edit (ใช้ฟอร์มร่วม BookingFormModal)
  const [modal, setModal] = useState<
    | null
    | { mode: "create"; initial: BookingFormInitial }
    | { mode: "edit"; id: string; initial: BookingFormInitial }
  >(null);

  const now = new Date();
  const rows = useMemo(
    () => bookings.map((b) => ({ ...b, t: new Date(b.bookingTimeISO) })),
    [bookings]
  );

  const counts = useMemo(() => {
    const live = (s: Status) => s !== "CANCELLED" && s !== "REJECTED";
    return {
      Today: rows.filter((r) => live(r.status) && sameDay(r.t, now)).length,
      Upcoming: rows.filter(
        (r) => (r.status === "PENDING" || r.status === "CONFIRMED") && r.t >= now
      ).length,
      Pending: rows.filter((r) => r.status === "PENDING").length,
      Done: rows.filter((r) => r.status === "COMPLETED").length,
      All: rows.length,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    // ค้นหา → ค้นทุกสถานะ (ลูกค้าโทรมาขอเลื่อน หาจากชื่อ/เบอร์/รหัสได้ทันที)
    if (q) {
      const nq = q.replace(/\s/g, "");
      return rows.filter(
        (r) =>
          r.customerName.toLowerCase().includes(q) ||
          r.phone.toLowerCase().replace(/\s/g, "").includes(nq) ||
          r.id.toLowerCase().includes(q) ||
          r.serviceName.toLowerCase().includes(q)
      );
    }
    const live = (s: Status) => s !== "CANCELLED" && s !== "REJECTED";
    switch (filter) {
      case "Today":
        return rows.filter((r) => live(r.status) && sameDay(r.t, now));
      case "Upcoming":
        return rows.filter(
          (r) => (r.status === "PENDING" || r.status === "CONFIRMED") && r.t >= now
        );
      case "Pending":
        return rows.filter((r) => r.status === "PENDING");
      case "Done":
        return rows.filter((r) => r.status === "COMPLETED");
      default:
        return rows;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, filter, query]);

  function run(id: string, fn: () => Promise<{ ok: boolean; message?: string }>) {
    setBusyId(id);
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (res.ok) router.refresh();
      else setError(res.message ?? "Something went wrong");
      setBusyId(null);
    });
  }

  function openCreate() {
    setModal({ mode: "create", initial: emptyInitial(services) });
  }
  function openEdit(r: BookingRow) {
    setModal({ mode: "edit", id: r.id, initial: initialFromBooking(r) });
  }

  return (
    <div>
      {/* tabs + new */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                filter === f
                  ? "bg-leaf-700 text-cream-50"
                  : "bg-white text-bark/60 ring-1 ring-leaf-100 hover:bg-cream-50"
              }`}
            >
              {f}
              <span className={`ml-1.5 ${filter === f ? "text-cream-50/70" : "text-bark/48"}`}>
                {counts[f]}
              </span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <svg
              viewBox="0 0 24 24"
              className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-bark/48"
              fill="none"
              aria-hidden
            >
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
              <path d="m20 20-3.2-3.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, phone, code…"
              className="w-52 rounded-full bg-white py-2 pl-8 pr-7 text-xs text-bark ring-1 ring-leaf-100 outline-none focus:ring-2 focus:ring-leaf-500"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-bark/52 hover:text-bark"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
          <button
            onClick={openCreate}
            className="shrink-0 rounded-full bg-gold-500 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-onyx transition hover:bg-gold-300"
          >
            + New booking
          </button>
        </div>
      </div>

      {error && (
        <p className="mb-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700 ring-1 ring-red-100">
          {error}
        </p>
      )}

      {query.trim() && (
        <p className="mb-2 text-xs text-bark/58">
          {shown.length} result{shown.length === 1 ? "" : "s"} for “
          {query.trim()}” · searching all statuses
        </p>
      )}

      <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-leaf-100">
        {shown.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-bark/58">
            {query.trim()
              ? `No bookings match “${query.trim()}”.`
              : `No bookings in “${filter}”.`}
          </p>
        ) : (
          <>
            {/* ── mobile: cards ── */}
            <ul className="divide-y divide-leaf-50 md:hidden">
              {shown.map((r) => {
                const c = therapistColor(r.therapistId);
                const busy = pending && busyId === r.id;
                const isToday = sameDay(r.t, now);
                return (
                  <li key={r.id} className={`p-4 ${busy ? "opacity-50" : ""}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-bark">{r.customerName}</p>
                        <a href={`tel:${r.phone}`} className="text-xs text-bark/58">{r.phone}</a>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ${ST[r.status].cls}`}>
                        {ST[r.status].label}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-sm text-bark/70">{fmt(r.t)}</span>
                      {isToday && (
                        <span className="rounded-full bg-leaf-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-leaf-700">Today</span>
                      )}
                      <span className="text-xs text-bark/52">{r.serviceName} · {r.durationMinutes}m</span>
                    </div>
                    {r.notes && <p className="mt-1 text-xs text-bark/52">{r.notes}</p>}
                    <div className="mt-3 flex items-center gap-2">
                      <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: c.base }} />
                      <select
                        value={r.therapistId ?? ""}
                        disabled={busy}
                        onChange={(e) => run(r.id, () => assignTherapist(r.id, e.target.value || null))}
                        className="flex-1 rounded-lg bg-cream-50 px-2 py-1.5 text-xs text-bark ring-1 ring-leaf-100 outline-none focus:ring-2 focus:ring-leaf-500"
                      >
                        <option value="">Unassigned</option>
                        {therapists.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}
                      </select>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      {actionsFor(r.status).map((a) => (
                        <button key={a.to} disabled={busy} onClick={() => run(r.id, () => updateBookingStatus(r.id, a.to))} className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition disabled:opacity-40 ${a.cls}`}>
                          {a.label}
                        </button>
                      ))}
                      <span className="mx-0.5 h-5 w-px bg-leaf-100" />
                      <button onClick={() => openEdit(r)} disabled={busy} className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-bark/60 ring-1 ring-leaf-100 hover:bg-cream-50 disabled:opacity-40">Edit</button>
                      <button
                        onClick={() => { if (confirm(`Delete booking for ${r.customerName}?`)) run(r.id, () => deleteBooking(r.id)); }}
                        disabled={busy}
                        className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 ring-1 ring-red-200 hover:bg-red-50 disabled:opacity-40"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* ── desktop: table ── */}
            <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="border-b border-leaf-100 bg-cream-50 text-[11px] uppercase tracking-wide text-bark/58">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Customer</th>
                  <th className="px-4 py-2.5 font-semibold">When</th>
                  <th className="px-4 py-2.5 font-semibold">Therapist</th>
                  <th className="px-4 py-2.5 font-semibold">Status</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-leaf-50">
                {shown.map((r) => {
                  const c = therapistColor(r.therapistId);
                  const busy = pending && busyId === r.id;
                  const isToday = sameDay(r.t, now);
                  return (
                    <tr key={r.id} className={`hover:bg-cream-50/50 ${busy ? "opacity-50" : ""}`}>
                      <td className="px-4 py-2.5">
                        <p className="font-medium text-bark">{r.customerName}</p>
                        <a href={`tel:${r.phone}`} className="text-xs text-bark/58 hover:text-leaf-700">
                          {r.phone}
                        </a>
                        {r.notes && (
                          <p className="max-w-[220px] truncate text-xs text-bark/52">{r.notes}</p>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="whitespace-nowrap text-bark/70">{fmt(r.t)}</span>
                          {isToday && (
                            <span className="rounded-full bg-leaf-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-leaf-700">
                              Today
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-bark/52">
                          {r.serviceName} · {r.durationMinutes}m
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: c.base }} />
                          <select
                            value={r.therapistId ?? ""}
                            disabled={busy}
                            onChange={(e) => run(r.id, () => assignTherapist(r.id, e.target.value || null))}
                            className="w-32 rounded-lg bg-cream-50 px-2 py-1 text-xs text-bark ring-1 ring-leaf-100 outline-none focus:ring-2 focus:ring-leaf-500"
                          >
                            <option value="">Unassigned</option>
                            {therapists.map((t) => (
                              <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ${ST[r.status].cls}`}>
                          {ST[r.status].label}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-end gap-1.5">
                          {actionsFor(r.status).map((a) => (
                            <button
                              key={a.to}
                              disabled={busy}
                              onClick={() => run(r.id, () => updateBookingStatus(r.id, a.to))}
                              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition disabled:opacity-40 ${a.cls}`}
                            >
                              {a.label}
                            </button>
                          ))}
                          <span className="mx-0.5 h-5 w-px bg-leaf-100" />
                          <button
                            onClick={() => openEdit(r)}
                            disabled={busy}
                            title="Edit"
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-bark/62 ring-1 ring-leaf-100 transition hover:bg-cream-50 hover:text-leaf-700 disabled:opacity-40"
                          >
                            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden>
                              <path d="M4 20h4L18.5 9.5a2 2 0 0 0-3-3L5 17v3Zm10-13 3 3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete booking for ${r.customerName}? This cannot be undone.`))
                                run(r.id, () => deleteBooking(r.id));
                            }}
                            disabled={busy}
                            title="Delete"
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-red-500 ring-1 ring-red-200 transition hover:bg-red-50 disabled:opacity-40"
                          >
                            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden>
                              <path d="M5 7h14M9 7V5h6v2m-7 0v12a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </>
        )}
      </div>

      {/* ── add / edit modal (ฟอร์มร่วม) ── */}
      {modal && (
        <BookingFormModal
          mode={modal.mode}
          bookingId={modal.mode === "edit" ? modal.id : undefined}
          initial={modal.initial}
          services={services}
          therapists={therapists}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
