"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { TherapistAdmin } from "@/lib/therapists";
import {
  createTherapist,
  renameTherapist,
  setTherapistActive,
  deleteTherapist,
} from "./actions";

export default function TherapistManager({
  therapists,
}: {
  therapists: TherapistAdmin[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // ฟอร์มเพิ่ม
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");

  // แก้ชื่อ inline
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  function run(fn: () => Promise<{ ok: boolean; message?: string }>) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (res.ok) router.refresh();
      else setError(res.message ?? "Something went wrong");
    });
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    run(async () => {
      const res = await createTherapist(name, bio);
      if (res.ok) {
        setName("");
        setBio("");
      }
      return res;
    });
  }

  const input =
    "w-full rounded-xl bg-cream-50 px-4 py-2.5 text-sm text-bark ring-1 ring-leaf-100 outline-none transition focus:ring-2 focus:ring-leaf-500";

  return (
    <div className="space-y-6">
      {/* เพิ่มหมอใหม่ */}
      <section className="rounded-2xl bg-white p-6 ring-1 ring-leaf-100">
        <h2 className="font-display text-xl font-medium text-leaf-700">
          Add therapist
        </h2>
        <form onSubmit={handleAdd} className="mt-4 grid gap-3 sm:grid-cols-[1fr_1.5fr_auto]">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            className={input}
            required
          />
          <input
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Specialty / note (optional)"
            className={input}
          />
          <button
            type="submit"
            disabled={pending || !name.trim()}
            className="rounded-xl bg-leaf-700 px-6 py-2.5 text-sm font-medium text-cream-50 transition hover:bg-leaf-600 disabled:opacity-50"
          >
            Add
          </button>
        </form>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </section>

      {/* รายชื่อหมอ */}
      <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-leaf-100">
        <div className="flex items-center justify-between border-b border-leaf-100 px-6 py-4">
          <h2 className="font-display text-xl font-medium text-leaf-700">
            Therapists
          </h2>
          <span className="text-xs text-bark/45">
            {therapists.filter((t) => t.isActive).length} active ·{" "}
            {therapists.length} total
          </span>
        </div>

        {therapists.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-bark/45">
            No therapists yet — add one above.
          </p>
        ) : (
          <ul className="divide-y divide-leaf-50">
            {therapists.map((t) => (
              <li
                key={t.id}
                className="flex flex-wrap items-center gap-3 px-6 py-4"
              >
                {/* avatar */}
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display text-lg ${
                    t.isActive
                      ? "bg-leaf-100 text-leaf-700"
                      : "bg-bark/5 text-bark/40"
                  }`}
                >
                  {t.name.charAt(0).toUpperCase()}
                </span>

                {/* name + bio */}
                <div className="min-w-0 flex-1">
                  {editingId === t.id ? (
                    <input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          run(() => renameTherapist(t.id, editName));
                          setEditingId(null);
                        }
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className={`${input} max-w-xs`}
                    />
                  ) : (
                    <p className="flex items-center gap-2 font-medium text-bark">
                      {t.name}
                      {!t.isActive && (
                        <span className="rounded-full bg-bark/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-bark/50">
                          Off
                        </span>
                      )}
                    </p>
                  )}
                  {t.bio && editingId !== t.id && (
                    <p className="truncate text-xs text-bark/50">{t.bio}</p>
                  )}
                </div>

                {/* upcoming count */}
                <span className="hidden text-xs text-bark/45 sm:block">
                  {t.upcomingCount} upcoming
                </span>

                {/* actions */}
                <div className="flex items-center gap-2">
                  {editingId === t.id ? (
                    <>
                      <button
                        onClick={() => {
                          run(() => renameTherapist(t.id, editName));
                          setEditingId(null);
                        }}
                        disabled={pending}
                        className="rounded-lg bg-leaf-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-leaf-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="rounded-lg px-3 py-1.5 text-xs text-bark/60 ring-1 ring-leaf-100 hover:bg-cream-50"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setEditingId(t.id);
                          setEditName(t.name);
                        }}
                        className="rounded-lg px-3 py-1.5 text-xs text-bark/60 ring-1 ring-leaf-100 transition hover:bg-cream-50"
                      >
                        Rename
                      </button>
                      <button
                        onClick={() =>
                          run(() => setTherapistActive(t.id, !t.isActive))
                        }
                        disabled={pending}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium ring-1 transition ${
                          t.isActive
                            ? "bg-amber-50 text-amber-700 ring-amber-200 hover:bg-amber-100"
                            : "bg-leaf-50 text-leaf-700 ring-leaf-200 hover:bg-leaf-100"
                        }`}
                      >
                        {t.isActive ? "Turn off" : "Turn on"}
                      </button>
                      <button
                        onClick={() => {
                          const msg =
                            t.upcomingCount > 0
                              ? `${t.name} has ${t.upcomingCount} upcoming booking(s). They will become unassigned. Delete anyway?`
                              : `Delete ${t.name}?`;
                          if (confirm(msg))
                            run(() => deleteTherapist(t.id));
                        }}
                        disabled={pending}
                        className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 ring-1 ring-red-200 transition hover:bg-red-100"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
        {error && (
          <p className="border-t border-leaf-50 px-6 py-3 text-sm text-red-600">
            {error}
          </p>
        )}
      </section>
    </div>
  );
}
