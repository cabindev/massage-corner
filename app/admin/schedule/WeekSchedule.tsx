"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { therapistColor } from "@/lib/therapist-color";
import { sofiaDateTimeToUTC, sofiaHHMM, sofiaDateKey } from "@/lib/schedule-config";
import { moveBooking } from "./actions";
import {
  createTherapist,
  renameTherapist,
  deleteTherapist,
} from "@/app/admin/therapists/actions";
import BookingFormModal, {
  initialFromBooking,
  type BookingFormInitial,
  type ModalService,
} from "@/app/admin/bookings/BookingFormModal";

export type SchedBooking = {
  id: string;
  customerName: string;
  serviceId: string;
  serviceName: string;
  phone: string;
  notes: string | null;
  therapistId: string | null;
  start: string; // ISO
  end: string;
  durationMinutes: number;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "REJECTED";
};
type Lane = { id: string | null; name: string };

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function startOfWeek(d: Date) {
  const x = new Date(d);
  const dow = (x.getDay() + 6) % 7; // Mon = 0
  x.setDate(x.getDate() - dow);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function dkey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

const MINI_DOW = ["M", "T", "W", "T", "F", "S", "S"];

/** ปฏิทินจิ๋วรายเดือน — คลิกวันเพื่อกระโดดไปสัปดาห์นั้น */
function MiniMonth({
  y,
  m,
  weekKeys,
  todayKey,
  countByDay,
  onPick,
}: {
  y: number;
  m: number;
  weekKeys: Set<string>;
  todayKey: string;
  countByDay: Map<string, number>;
  onPick: (d: Date) => void;
}) {
  const first = new Date(y, m, 1);
  const lead = (first.getDay() + 6) % 7;
  const dim = new Date(y, m + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let d = 1; d <= dim; d++) cells.push(d);
  const label = new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
  }).format(first);

  return (
    <div>
      <p className="mb-1.5 text-center text-xs font-semibold text-bark/65">
        {label}
      </p>
      <div className="grid grid-cols-7 gap-0.5 text-center text-[9px] font-medium text-bark/48">
        {MINI_DOW.map((w, i) => (
          <span key={i}>{w}</span>
        ))}
      </div>
      <div className="mt-0.5 grid grid-cols-7 gap-0.5">
        {cells.map((d, i) => {
          if (!d) return <span key={i} />;
          const date = new Date(y, m, d);
          const k = dkey(date);
          const inWeek = weekKeys.has(k);
          const isToday = k === todayKey;
          const has = (countByDay.get(k) ?? 0) > 0;
          return (
            <button
              key={i}
              onClick={() => onPick(date)}
              className={`relative aspect-square rounded text-[11px] transition ${
                inWeek
                  ? "bg-leaf-600 font-semibold text-cream-50"
                  : isToday
                  ? "text-bark ring-1 ring-gold-400"
                  : "text-bark/65 hover:bg-cream-50"
              }`}
            >
              {d}
              {has && !inWeek && (
                <span className="absolute bottom-[3px] left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-gold-500" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function WeekSchedule({
  bookings,
  therapists,
  services,
}: {
  bookings: SchedBooking[];
  therapists: Lane[];
  services: ModalService[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [dragId, setDragId] = useState<string | null>(null);
  const [overKey, setOverKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ดับเบิลคลิก chip → เปิดฟอร์มแก้ไข booking
  const [edit, setEdit] = useState<{ id: string; initial: BookingFormInitial } | null>(null);
  function openEdit(b: SchedBooking) {
    setEdit({
      id: b.id,
      initial: initialFromBooking({
        serviceId: b.serviceId,
        customerName: b.customerName,
        phone: b.phone,
        bookingTimeISO: b.start,
        therapistId: b.therapistId,
        notes: b.notes,
      }),
    });
  }

  // ── จัดการหมอจากหน้านี้ (เพิ่ม/เปลี่ยนชื่อ/ลบ) ──
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState("");

  function mgr(fn: () => Promise<{ ok: boolean; message?: string }>) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (res.ok) router.refresh();
      else setError(res.message ?? "Something went wrong");
    });
  }
  function addTherapist() {
    const name = newName.trim();
    if (!name) return;
    mgr(async () => {
      const res = await createTherapist(name);
      if (res.ok) {
        setNewName("");
        setAdding(false);
      }
      return res;
    });
  }
  function saveRename(id: string) {
    const name = renameVal.trim();
    if (!name) {
      setRenameId(null);
      return;
    }
    setRenameId(null);
    mgr(() => renameTherapist(id, name));
  }
  function removeTherapist(id: string, name: string) {
    if (
      confirm(
        `Delete ${name}? Their existing bookings will become unassigned.`
      )
    )
      mgr(() => deleteTherapist(id));
  }

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );
  const lanes: Lane[] = useMemo(
    () => [...therapists, { id: null, name: "Unassigned" }],
    [therapists]
  );

  // group: key `${therapistId}|${dayKey}` -> bookings (sorted by time)
  const grouped = useMemo(() => {
    const map = new Map<string, (SchedBooking & { s: Date })[]>();
    for (const b of bookings) {
      const s = new Date(b.start);
      const key = `${b.therapistId ?? "null"}|${sofiaDateKey(s)}`;
      const arr = map.get(key) ?? [];
      arr.push({ ...b, s });
      map.set(key, arr);
    }
    for (const arr of map.values())
      arr.sort((a, b) => a.s.getTime() - b.s.getTime());
    return map;
  }, [bookings]);

  const todayKey = sofiaDateKey(new Date());

  // จำนวนคิวต่อวัน (จุดในปฏิทินจิ๋ว) + วันในสัปดาห์ที่กำลังดู (ไฮไลต์)
  const countByDay = useMemo(() => {
    const m = new Map<string, number>();
    for (const b of bookings) {
      const k = sofiaDateKey(new Date(b.start));
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return m;
  }, [bookings]);
  const weekKeys = useMemo(() => new Set(days.map(dkey)), [days]);

  // เดือนนี้ (ของสัปดาห์ที่ดู) + เดือนถัดไป
  const monthA = { y: weekStart.getFullYear(), m: weekStart.getMonth() };
  const nextM = new Date(monthA.y, monthA.m + 1, 1);
  const monthB = { y: nextM.getFullYear(), m: nextM.getMonth() };

  function pickDay(d: Date) {
    setWeekStart(startOfWeek(d));
  }

  function onDrop(lane: Lane, day: Date) {
    setOverKey(null);
    const id = dragId;
    setDragId(null);
    if (!id) return;
    const b = bookings.find((x) => x.id === id);
    if (!b) return;
    const s = new Date(b.start);
    const ns = sofiaDateTimeToUTC(dkey(day), sofiaHHMM(s));
    // ไม่เปลี่ยนอะไร → ข้าม
    if (sofiaDateKey(ns) === sofiaDateKey(s) && (b.therapistId ?? null) === lane.id) return;
    setError(null);
    startTransition(async () => {
      const res = await moveBooking(id, ns.toISOString(), lane.id);
      if (res.ok) router.refresh();
      else setError(res.message);
    });
  }

  const weekLabel = `${new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
  }).format(days[0])} – ${new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(days[6])}`;

  return (
    <div>
      {/* mini calendars: this month + next month */}
      <div className="mb-4 grid max-w-md grid-cols-2 gap-5 rounded-2xl bg-white p-4 ring-1 ring-leaf-100">
        <MiniMonth
          y={monthA.y}
          m={monthA.m}
          weekKeys={weekKeys}
          todayKey={todayKey}
          countByDay={countByDay}
          onPick={pickDay}
        />
        <MiniMonth
          y={monthB.y}
          m={monthB.m}
          weekKeys={weekKeys}
          todayKey={todayKey}
          countByDay={countByDay}
          onPick={pickDay}
        />
      </div>

      {/* controls */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="font-display text-xl font-medium text-leaf-700">
          {weekLabel}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {/* add therapist */}
          {adding ? (
            <div className="flex items-center gap-1.5">
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addTherapist();
                  if (e.key === "Escape") {
                    setAdding(false);
                    setNewName("");
                  }
                }}
                placeholder="Therapist name"
                className="w-40 rounded-lg bg-cream-50 px-3 py-1.5 text-sm text-bark ring-1 ring-leaf-100 outline-none focus:ring-2 focus:ring-leaf-500"
              />
              <button onClick={addTherapist} disabled={pending || !newName.trim()} className="rounded-lg bg-leaf-700 px-3 py-1.5 text-sm font-medium text-cream-50 hover:bg-leaf-600 disabled:opacity-50">Add</button>
              <button onClick={() => { setAdding(false); setNewName(""); }} className="rounded-lg px-2 py-1.5 text-sm text-bark/62 ring-1 ring-leaf-100 hover:bg-cream-50">✕</button>
            </div>
          ) : (
            <button onClick={() => setAdding(true)} className="rounded-full bg-gold-500 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-onyx transition hover:bg-gold-300">
              + Therapist
            </button>
          )}
          <span className="mx-1 hidden h-5 w-px bg-leaf-100 sm:block" />
          <div className="flex items-center gap-1">
            <button onClick={() => setWeekStart((w) => addDays(w, -7))} className="flex h-9 w-9 items-center justify-center rounded-lg text-bark/60 ring-1 ring-leaf-100 transition hover:bg-cream-50" aria-label="Previous week">‹</button>
            <button onClick={() => setWeekStart(startOfWeek(new Date()))} className="rounded-lg px-3 py-1.5 text-sm text-bark/70 ring-1 ring-leaf-100 transition hover:bg-cream-50">This week</button>
            <button onClick={() => setWeekStart((w) => addDays(w, 7))} className="flex h-9 w-9 items-center justify-center rounded-lg text-bark/60 ring-1 ring-leaf-100 transition hover:bg-cream-50" aria-label="Next week">›</button>
          </div>
        </div>
      </div>

      {error && (
        <p className="mb-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700 ring-1 ring-red-100">
          {error}
        </p>
      )}
      {therapists.length === 0 ? (
        <p className="mb-3 rounded-xl bg-gold-50 px-4 py-2.5 text-sm text-gold-800 ring-1 ring-gold-200">
          No therapists yet — add one with “+ Therapist” to start scheduling and
          set booking capacity.
        </p>
      ) : (
        <p className="mb-3 text-sm text-bark/62">
          Drag a booking to another day or therapist to reschedule (time of day is
          kept). Hover a therapist to rename or remove.
        </p>
      )}

      {/* grid */}
      <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-leaf-100">
        <div className="min-w-[920px]">
          {/* header */}
          <div className="grid border-b border-leaf-100" style={{ gridTemplateColumns: "160px repeat(7, 1fr)" }}>
            <div className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-bark/58">
              Therapist
            </div>
            {days.map((d) => {
              const isToday = dkey(d) === todayKey;
              return (
                <div key={d.toISOString()} className={`border-l border-leaf-50 px-3 py-3 text-center ${isToday ? "bg-leaf-50" : ""}`}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-bark/58">
                    {DAY_LABELS[(d.getDay() + 6) % 7]}
                  </p>
                  <p className={`text-sm font-semibold ${isToday ? "text-leaf-700" : "text-bark/70"}`}>
                    {d.getDate()}
                  </p>
                </div>
              );
            })}
          </div>

          {/* lanes */}
          {lanes.map((lane) => {
            const c = therapistColor(lane.id);
            return (
              <div key={lane.id ?? "null"} className="grid border-b border-leaf-50 last:border-0" style={{ gridTemplateColumns: "160px repeat(7, 1fr)" }}>
                <div className="group flex items-center gap-2 px-4 py-3">
                  <span className="inline-block h-3 w-3 shrink-0 rounded-full" style={{ background: c.base }} />
                  {renameId === lane.id ? (
                    <input
                      autoFocus
                      value={renameVal}
                      onChange={(e) => setRenameVal(e.target.value)}
                      onBlur={() => lane.id && saveRename(lane.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && lane.id) saveRename(lane.id);
                        if (e.key === "Escape") setRenameId(null);
                      }}
                      className="w-full min-w-0 rounded-md bg-cream-50 px-2 py-1 text-sm text-bark ring-1 ring-leaf-200 outline-none focus:ring-2 focus:ring-leaf-500"
                    />
                  ) : (
                    <>
                      <span className="flex-1 truncate text-sm font-medium text-bark">
                        {lane.name}
                      </span>
                      {lane.id && (
                        <span className="flex shrink-0 items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
                          <button
                            onClick={() => {
                              setRenameId(lane.id);
                              setRenameVal(lane.name);
                            }}
                            title="Rename"
                            className="flex h-6 w-6 items-center justify-center rounded text-bark/58 hover:bg-cream-50 hover:text-leaf-700"
                          >
                            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden>
                              <path d="M4 20h4L18.5 9.5a2 2 0 0 0-3-3L5 17v3Zm10-13 3 3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                          <button
                            onClick={() => lane.id && removeTherapist(lane.id, lane.name)}
                            title="Delete"
                            className="flex h-6 w-6 items-center justify-center rounded text-red-400 hover:bg-red-50 hover:text-red-600"
                          >
                            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden>
                              <path d="M5 7h14M9 7V5h6v2m-7 0v12a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                        </span>
                      )}
                    </>
                  )}
                </div>
                {days.map((d, di) => {
                  const key = `${lane.id ?? "null"}|${dkey(d)}`;
                  const cellKey = `${lane.id ?? "null"}-${di}`;
                  const items = grouped.get(key) ?? [];
                  const isOver = overKey === cellKey;
                  return (
                    <div
                      key={di}
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (overKey !== cellKey) setOverKey(cellKey);
                      }}
                      onDragLeave={() => setOverKey((k) => (k === cellKey ? null : k))}
                      onDrop={() => onDrop(lane, d)}
                      className={`min-h-[72px] space-y-1 border-l border-leaf-50 p-1.5 transition ${
                        isOver ? "bg-leaf-50 ring-1 ring-inset ring-leaf-300" : ""
                      }`}
                    >
                      {items.map((b) => {
                        const bc = therapistColor(b.therapistId);
                        return (
                          <div
                            key={b.id}
                            draggable={!pending}
                            onDragStart={() => setDragId(b.id)}
                            onDragEnd={() => {
                              setDragId(null);
                              setOverKey(null);
                            }}
                            onDoubleClick={() => openEdit(b)}
                            title={`${sofiaHHMM(b.s)} · ${b.customerName} · ${b.serviceName} — double-click to edit`}
                            className={`flex cursor-grab items-start gap-1.5 rounded-md bg-white px-2 py-1 text-[11px] leading-tight text-bark ring-1 ring-leaf-100 active:cursor-grabbing ${
                              b.status === "PENDING" ? "opacity-70" : ""
                            }`}
                          >
                            <span
                              className="mt-[3px] inline-block h-2 w-2 shrink-0 rounded-full"
                              style={{ background: bc.base }}
                            />
                            <span className="min-w-0">
                              <span className="numeral font-semibold">{sofiaHHMM(b.s)}</span>{" "}
                              <span className="font-medium">{b.customerName}</span>
                              <span className="block truncate text-bark/68">
                                {b.serviceName} · {b.durationMinutes}m
                              </span>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
      {pending && (
        <p className="mt-3 text-sm text-bark/58">Saving…</p>
      )}

      {edit && (
        <BookingFormModal
          mode="edit"
          bookingId={edit.id}
          initial={edit.initial}
          services={services}
          therapists={therapists
            .filter((t) => t.id)
            .map((t) => ({ id: t.id as string, name: t.name }))}
          onClose={() => setEdit(null)}
        />
      )}
    </div>
  );
}
