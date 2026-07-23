"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createBookingAdmin, updateBooking } from "./actions";

export type ModalService = {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
};
export type ModalTherapist = { id: string; name: string };

export type BookingFormInitial = {
  serviceId: string;
  customerName: string;
  phone: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  therapistId: string;
  notes: string;
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** ค่าเริ่มต้นสำหรับ "สร้างใหม่" (วันนี้ 10:00) */
export function emptyInitial(services: ModalService[]): BookingFormInitial {
  const d = new Date();
  return {
    serviceId: services[0]?.id ?? "",
    customerName: "",
    phone: "",
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: "10:00",
    therapistId: "",
    notes: "",
  };
}

/** สร้าง initial จาก booking ที่มีอยู่ (สำหรับแก้ไข) */
export function initialFromBooking(b: {
  serviceId: string;
  customerName: string;
  phone: string;
  bookingTimeISO: string;
  therapistId: string | null;
  notes: string | null;
}): BookingFormInitial {
  const d = new Date(b.bookingTimeISO);
  return {
    serviceId: b.serviceId,
    customerName: b.customerName,
    phone: b.phone === "—" || b.phone === "walk-in" ? "" : b.phone,
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
    therapistId: b.therapistId ?? "",
    notes: b.notes ?? "",
  };
}

const fieldCls =
  "w-full rounded-xl bg-cream-50 px-3 py-2 text-sm text-bark ring-1 ring-leaf-100 outline-none focus:ring-2 focus:ring-leaf-500";

export default function BookingFormModal({
  mode,
  bookingId,
  initial,
  services,
  therapists,
  onClose,
}: {
  mode: "create" | "edit";
  bookingId?: string;
  initial: BookingFormInitial;
  services: ModalService[];
  therapists: ModalTherapist[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<BookingFormInitial>(initial);
  const [err, setErr] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.serviceId || !form.customerName.trim() || !form.date || !form.time) {
      setErr("Please fill in service, name, date and time.");
      return;
    }
    const dt = new Date(`${form.date}T${form.time}:00`);
    if (isNaN(dt.getTime())) {
      setErr("Invalid date/time.");
      return;
    }
    setErr(null);
    const payload = {
      serviceId: form.serviceId,
      customerName: form.customerName.trim(),
      phone: form.phone.trim() || undefined,
      therapistId: form.therapistId || null,
      notes: form.notes.trim() || undefined,
      dateTime: dt.toISOString(),
    };
    startTransition(async () => {
      const res =
        mode === "create"
          ? await createBookingAdmin(payload)
          : await updateBooking(bookingId!, payload);
      if (res.ok) {
        router.refresh();
        onClose();
      } else {
        setErr(res.message);
      }
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-onyx/40 p-4"
      onClick={() => !pending && onClose()}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl ring-1 ring-leaf-100"
      >
        <div className="flex items-start justify-between">
          <h3 className="font-display text-xl font-medium text-leaf-700">
            {mode === "create" ? "New booking" : "Edit booking"}
          </h3>
          <button type="button" onClick={onClose} className="text-bark/52 hover:text-bark" aria-label="Close">✕</button>
        </div>

        <div className="mt-5 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-bark/60">Service</label>
            <select value={form.serviceId} onChange={(e) => setForm({ ...form, serviceId: e.target.value })} className={fieldCls} required>
              {services.map((s) => (
                <option key={s.id} value={s.id}>{s.name} · {s.durationMinutes}m · {s.price} €</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-bark/60">Date</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={fieldCls} required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-bark/60">Time</label>
              <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className={fieldCls} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-bark/60">Customer name</label>
              <input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} className={fieldCls} required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-bark/60">Phone (optional)</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={fieldCls} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-bark/60">Therapist (optional)</label>
            <select value={form.therapistId} onChange={(e) => setForm({ ...form, therapistId: e.target.value })} className={fieldCls}>
              <option value="">— Assign later —</option>
              {therapists.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-bark/60">Notes (optional)</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className={`${fieldCls} resize-none`} />
          </div>
        </div>

        {err && <p className="mt-3 text-sm text-red-600">{err}</p>}

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={pending} className="rounded-full px-5 py-2.5 text-sm text-bark/60 ring-1 ring-leaf-100 hover:bg-cream-50">Cancel</button>
          <button type="submit" disabled={pending} className="rounded-full bg-leaf-700 px-6 py-2.5 text-sm font-medium text-cream-50 transition hover:bg-leaf-600 disabled:opacity-50">
            {pending ? "Saving…" : mode === "create" ? "Create booking" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
