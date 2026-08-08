import Link from "next/link";
import {
  getBookings,
  buildStats,
  formatThaiDateTime,
  formatTime,
  STATUS_META,
  type AdminBooking,
} from "@/lib/admin-data";
import { getActiveTherapists } from "@/lib/therapists";
import { SHOP_TIMEZONE } from "@/lib/schedule-config";
import { getServices } from "@/lib/services";
import { therapistColor } from "@/lib/therapist-color";
import { getSession } from "@/lib/auth";
import BookingCalendar, {
  type CalendarBooking,
} from "./BookingCalendar";

export const dynamic = "force-dynamic";

/* ── KPI card ── */
function Kpi({
  label,
  value,
  hint,
  icon,
  tone = "plain",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: React.ReactNode;
  tone?: "plain" | "emerald" | "amber" | "gold";
}) {
  const tones = {
    plain: "bg-white ring-leaf-100 text-bark",
    emerald: "bg-leaf-700 ring-leaf-700 text-cream-50",
    amber: "bg-amber-50 ring-amber-200 text-bark",
    gold: "bg-gold-50 ring-gold-200 text-bark",
  };
  const iconWrap = {
    plain: "bg-leaf-50 text-leaf-700",
    emerald: "bg-cream-50/15 text-gold-200",
    amber: "bg-amber-100 text-amber-700",
    gold: "bg-gold-100 text-gold-700",
  };
  const dark = tone === "emerald";
  return (
    <div className={`rounded-2xl p-5 ring-1 ${tones[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <p className={`text-sm ${dark ? "text-cream-50/80" : "text-bark/68"}`}>
          {label}
        </p>
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-full ${iconWrap[tone]}`}
        >
          {icon}
        </span>
      </div>
      <p className="numeral mt-3 text-3xl font-semibold">{value}</p>
      {hint && (
        <p className={`mt-1 text-xs ${dark ? "text-cream-50/70" : "text-bark/58"}`}>
          {hint}
        </p>
      )}
    </div>
  );
}

function Card({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-white p-6 ring-1 ring-leaf-100">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-xl font-medium text-leaf-700">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function StatusBadge({ status }: { status: AdminBooking["status"] }) {
  return (
    <span
      className={`inline-block shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ${STATUS_META[status].badge}`}
    >
      {STATUS_META[status].label}
    </span>
  );
}

/* ── icons ── */
const I = {
  cal: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
      <path d="M7 2v3m10-3v3M4 8h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
  clock: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
  week: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
      <path d="M4 19V5m0 14h16M8 16v-5m4 5V8m4 8v-7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
  euro: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
      <path d="M16 7a6 6 0 1 0 0 10M5 10h7M5 14h7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
};

export default async function AdminDashboardPage() {
  const [bookings, therapists, services, session] = await Promise.all([
    getBookings(),
    getActiveTherapists(),
    getServices(),
    getSession(),
  ]);
  const calendarServices = services.map((s) => ({
    id: s.id,
    name: s.name,
    durationMinutes: s.durationMinutes,
    price: s.price,
  }));
  const calendarTherapists = therapists.map((t) => ({ id: t.id, name: t.name }));
  const stats = buildStats(bookings);
  const name = session?.user?.name ?? "Administrator";

  // ข้อมูลสำหรับปฏิทิน (เฉพาะคิวที่ยังมีผล) — แปลงวันที่เป็น ISO string ให้ client
  const calendarBookings: CalendarBooking[] = bookings
    .filter((b) => b.status !== "CANCELLED" && b.status !== "REJECTED")
    .map((b) => ({
      id: b.id,
      customerName: b.customerName,
      serviceName: b.serviceName,
      therapistId: b.therapistId,
      therapistName: b.therapistName,
      start: b.bookingTime.toISOString(),
      end: b.endTime.toISOString(),
      status: b.status,
    }));
  const today = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: SHOP_TIMEZONE,
  }).format(new Date());


  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* ── header ── */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest-2 text-gold-600">
            {today}
          </p>
          <h1 className="mt-1 font-display text-3xl font-medium text-leaf-700">
            Welcome back, {name}
          </h1>
        </div>
        <Link
          href="/admin/bookings"
          className="rounded-full bg-leaf-700 px-5 py-2.5 text-sm font-medium text-cream-50 transition hover:bg-leaf-600"
        >
          Manage bookings
        </Link>
      </header>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Today" value={stats.todayCount} hint="appointments today" icon={I.cal} tone="emerald" />
        <Kpi label="Pending" value={stats.pendingCount} hint="awaiting confirmation" icon={I.clock} tone="amber" />
        <Kpi label="This week" value={stats.weekCount} hint="next 7 days" icon={I.week} />
        <Kpi label="Revenue" value={`€${stats.revenue.toLocaleString()}`} hint="confirmed + completed" icon={I.euro} tone="gold" />
      </div>

      {/* ── row: calendar + side ── */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card
            title="Calendar"
            action={
              <Link
                href="/admin/schedule"
                className="text-sm font-medium text-leaf-700 hover:text-gold-700"
              >
                Week view
              </Link>
            }
          >
            <BookingCalendar
              bookings={calendarBookings}
              therapistCount={therapists.length}
              services={calendarServices}
              therapists={calendarTherapists}
            />
          </Card>
        </div>

        {/* side column */}
        <div className="space-y-6">
          {/* needs attention */}
          <Card title="Needs attention">
            {stats.pendingCount === 0 && stats.unassignedCount === 0 ? (
              <div className="flex items-center gap-3 rounded-xl bg-leaf-50 px-4 py-5 text-sm text-leaf-700">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-leaf-100">
                  ✓
                </span>
                You&apos;re all caught up.
              </div>
            ) : (
              <ul className="space-y-3">
                {stats.pendingCount > 0 && (
                  <li>
                    <Link
                      href="/admin/bookings"
                      className="flex items-center justify-between gap-3 rounded-xl bg-amber-50 px-4 py-3 ring-1 ring-amber-200 transition hover:bg-amber-100"
                    >
                      <span className="text-sm text-amber-800">
                        Pending confirmation
                      </span>
                      <span className="numeral text-lg font-semibold text-amber-700">
                        {stats.pendingCount}
                      </span>
                    </Link>
                  </li>
                )}
                {stats.unassignedCount > 0 && (
                  <li>
                    <Link
                      href="/admin/bookings"
                      className="flex items-center justify-between gap-3 rounded-xl bg-gold-50 px-4 py-3 ring-1 ring-gold-200 transition hover:bg-gold-100"
                    >
                      <span className="text-sm text-gold-800">
                        Need a therapist
                      </span>
                      <span className="numeral text-lg font-semibold text-gold-700">
                        {stats.unassignedCount}
                      </span>
                    </Link>
                  </li>
                )}
              </ul>
            )}
          </Card>

          {/* therapist colour legend */}
          <Card
            title="Therapists"
            action={
              <Link
                href="/admin/therapists"
                className="text-sm font-medium text-leaf-700 hover:text-gold-700"
              >
                Manage
              </Link>
            }
          >
            {therapists.length === 0 ? (
              <p className="py-6 text-center text-sm text-bark/58">
                No therapists yet.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {therapists.map((t) => {
                  const c = therapistColor(t.id);
                  return (
                    <li key={t.id} className="flex items-center gap-3 text-sm">
                      <span
                        className="inline-block h-3.5 w-3.5 shrink-0 rounded-full"
                        style={{ background: c.base }}
                      />
                      <span className="text-bark/75">{t.name}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      </div>

      {/* ── row: today's schedule + upcoming ── */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card
            title="Today's schedule"
            action={
              <span className="text-xs text-bark/58">
                {stats.todaySchedule.length} appointment
                {stats.todaySchedule.length === 1 ? "" : "s"}
              </span>
            }
          >
            {stats.todaySchedule.length === 0 ? (
              <p className="py-12 text-center text-sm text-bark/58">
                No appointments scheduled for today.
              </p>
            ) : (
              <ul className="space-y-2">
                {stats.todaySchedule.map((b) => (
                  <li
                    key={b.id}
                    className="flex items-center gap-4 rounded-xl bg-cream-50 px-4 py-3 ring-1 ring-leaf-50"
                  >
                    <div className="w-14 shrink-0 text-center">
                      <p className="numeral font-semibold text-leaf-700">
                        {formatTime(b.bookingTime)}
                      </p>
                      <p className="text-[10px] text-bark/52">
                        {b.durationMinutes}m
                      </p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-bark">
                        {b.customerName}
                      </p>
                      <p className="truncate text-sm text-bark/68">
                        {b.serviceName}
                        {b.therapistName ? ` · ${b.therapistName}` : ""}
                      </p>
                    </div>
                    <StatusBadge status={b.status} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <Card
          title="Upcoming"
          action={
            <Link
              href="/admin/bookings"
              className="text-sm font-medium text-leaf-700 hover:text-gold-700"
            >
              View all
            </Link>
          }
        >
          {stats.upcoming.length === 0 ? (
            <p className="py-8 text-center text-sm text-bark/58">
              No upcoming appointments.
            </p>
          ) : (
            <ul className="divide-y divide-leaf-50">
              {stats.upcoming.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-bark">
                      {b.customerName}
                    </p>
                    <p className="truncate text-xs text-bark/62">
                      {formatThaiDateTime(b.bookingTime)}
                    </p>
                  </div>
                  <StatusBadge status={b.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
