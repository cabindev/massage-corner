import Link from "next/link";
import { getAllTherapists } from "@/lib/therapists";
import {
  CLOSED_WEEKDAY,
  CLOSE_MINUTES,
  LAST_SLOT_MINUTES,
  OPEN_MINUTES,
  WEEKDAY_ORDER,
  WEEKDAY_SHORT,
  minutesToHHMM,
} from "@/lib/schedule-config";

export const dynamic = "force-dynamic";

const OPEN_WEEKDAYS = WEEKDAY_ORDER.filter((d) => d !== CLOSED_WEEKDAY);

/** คู่มือหลังบ้าน — เน้นเรื่องวันเข้างานของหมอ ซึ่งเป็นตัวกำหนดว่าจองซ้อนได้กี่คิว */
export default async function AdminGuidePage() {
  const therapists = await getAllTherapists();
  const active = therapists.filter((t) => t.isActive);
  // capacity ต่อวันในสัปดาห์ จากข้อมูลจริงตอนนี้
  const capacity = OPEN_WEEKDAYS.map((d) => ({
    day: d,
    names: active.filter((t) => t.workDays.includes(d)).map((t) => t.name),
  }));

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="font-display text-3xl font-medium text-leaf-700">
          Admin guide
        </h1>
        <p className="mt-1 text-sm text-bark/68">
          How bookings, therapists and capacity work in this back office.
        </p>
      </header>

      {/* ── หัวใจของระบบ: capacity ── */}
      <Section id="capacity" title="The one rule: capacity">
        <p>
          The shop can take as many bookings <b>at the same time</b> as there
          are therapists <b>working that day</b>. Two therapists on Tuesday →
          two overlapping bookings. One therapist on Saturday → one booking at
          a time; the next customer sees that time as <Tag>Full</Tag>.
        </p>
        <p>
          A therapist counts toward a day only when they are{" "}
          <b>turned on</b> <i>and</i> that day is one of their{" "}
          <b>work days</b>.
        </p>

        <div className="mt-4 overflow-x-auto rounded-xl ring-1 ring-leaf-100">
          <table className="w-full min-w-[520px] text-sm">
            <caption className="bg-cream-50 px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-bark/58">
              Capacity right now
            </caption>
            <thead>
              <tr className="border-b border-leaf-100 text-left text-xs text-bark/58">
                <th className="px-4 py-2 font-medium">Day</th>
                <th className="px-4 py-2 font-medium">Bookings at once</th>
                <th className="px-4 py-2 font-medium">Who works</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-leaf-50">
              {capacity.map((c) => (
                <tr key={c.day}>
                  <td className="px-4 py-2 font-medium text-bark">
                    {WEEKDAY_SHORT[c.day]}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`numeral inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs font-semibold ${
                        c.names.length === 0
                          ? "bg-red-50 text-red-600"
                          : "bg-leaf-50 text-leaf-700"
                      }`}
                    >
                      {c.names.length}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-bark/70">
                    {c.names.length ? (
                      c.names.join(", ")
                    ) : (
                      <span className="text-red-600">
                        Nobody, so customers can&apos;t book this day
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              <tr className="text-bark/52">
                <td className="px-4 py-2">{WEEKDAY_SHORT[CLOSED_WEEKDAY]}</td>
                <td className="px-4 py-2" colSpan={2}>
                  Shop closed
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── ตั้งวันเข้างาน ── */}
      <Section id="work-days" title="Set each therapist's work days">
        <Steps
          items={[
            <>
              Open{" "}
              <Link href="/admin/therapists" className="font-medium text-leaf-700 underline underline-offset-2">
                Therapists
              </Link>
              .
            </>,
            <>
              Under each name there is a row of days. <DayChip on>Sat</DayChip>{" "}
              (dark green) means they work, <DayChip>Sat</DayChip> (white) means
              day off.
            </>,
            <>
              Click a day to switch it. It saves straight away, with no Save
              button.
            </>,
          ]}
        />
        <Example>
          <p className="mb-2 font-medium text-bark">
            Example: two therapists on weekdays, one at the weekend
          </p>
          <ExampleRow name="Therapist A" off={[]} />
          <ExampleRow name="Therapist B" off={[6, 0]} />
          <p className="mt-2 text-bark/68">
            Tue–Fri: 2 bookings at once. Sat–Sun: 1 booking at once.
          </p>
        </Example>
        <Note>
          Monday isn&apos;t shown because the shop is closed. New therapists
          start with every day switched on.
        </Note>
      </Section>

      {/* ── วันหยุด vs ปิดรับงาน ── */}
      <Section id="off" title="Day off vs. Turn off">
        <dl className="grid gap-3 sm:grid-cols-2">
          <Card term="Day off (a day button)">
            The same day every week, e.g. never works Sundays.
          </Card>
          <Card term="Turn off (button on the right)">
            Not working on any day: long leave, or left the shop. They stop
            counting completely until you click <b>Turn on</b>.
          </Card>
        </dl>
        <Note>
          A one-off day off (e.g. only next Friday) can&apos;t be set yet, so
          the system still counts them that day. Keep an eye on bookings for
          that date and move or decline any extra ones.
        </Note>
      </Section>

      {/* ── สิ่งที่จะเห็น ── */}
      <Section id="where" title="Where you'll see it">
        <ul className="space-y-2">
          <Bullet title="Booking page (customers)">
            Times that are already full for that day show <Tag>Full</Tag> and
            can&apos;t be picked.
          </Bullet>
          <Bullet title="Dashboard calendar">
            Click a day: the line under the date shows{" "}
            <b>capacity</b> for that day, and the free-slot buttons use it.
          </Bullet>
          <Bullet title="Dashboard walk-in">
            The therapist list only has people who work that day.
          </Bullet>
          <Bullet title="Schedule (week view)">
            Days a therapist doesn&apos;t work are grey and say{" "}
            <span className="rounded bg-bark/[0.06] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-bark/52">
              Day off
            </span>
            .
          </Bullet>
        </ul>
      </Section>

      {/* ── ระบบไม่ยอม ── */}
      <Section id="blocked" title="When the system says no">
        <ul className="space-y-2">
          <Bullet title="“… doesn't work on this day.”">
            You assigned or dragged a booking to a therapist on their day off.
            Pick someone who works that day, or leave it <b>Unassigned</b>.
          </Bullet>
          <Bullet title="“… fully booked.”">
            Every therapist working that day is already busy at that time.
            Choose another time.
          </Bullet>
          <Bullet title="“No therapist works on this day.”">
            Nobody is on for that day. Switch someone&apos;s day on in
            Therapists.
          </Bullet>
        </ul>
      </Section>

      {/* ── เปลี่ยนวันทีหลัง ── */}
      <Section id="changing" title="Changing work days later">
        <p>
          Bookings already given to a therapist <b>stay where they are</b> when
          you remove one of their days. After changing days, open{" "}
          <Link href="/admin/schedule" className="font-medium text-leaf-700 underline underline-offset-2">
            Schedule
          </Link>
          , look for bookings in grey <b>Day off</b> cells, and drag them to
          another therapist or to <b>Unassigned</b>.
        </p>
      </Section>

      {/* ── อ้างอิงสั้น ── */}
      <Section id="reference" title="Quick reference">
        <ul className="space-y-2">
          <Bullet title="Opening hours">
            {minutesToHHMM(OPEN_MINUTES)}–{minutesToHHMM(CLOSE_MINUTES)}, every
            30 minutes. Last start {minutesToHHMM(LAST_SLOT_MINUTES)}; a
            treatment must finish by {minutesToHHMM(CLOSE_MINUTES)}. Closed
            Mondays.
          </Bullet>
          <Bullet title="What takes a place">
            <Tag>Pending</Tag> and <Tag>Confirmed</Tag> bookings use up a
            therapist. Rejected, Cancelled and Completed ones free the time
            again.
          </Bullet>
          <Bullet title="Times">
            Every time in this system is Sofia time, whatever device you use.
          </Bullet>
        </ul>
      </Section>
    </div>
  );
}

// ─── ชิ้นส่วนเล็ก ๆ ของหน้าคู่มือ ─────────────────────────────

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-6 rounded-2xl bg-white p-6 ring-1 ring-leaf-100"
    >
      <h2 className="font-display text-xl font-medium text-leaf-700">
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-bark/80">
        {children}
      </div>
    </section>
  );
}

function Steps({ items }: { items: React.ReactNode[] }) {
  return (
    <ol className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3">
          <span className="numeral flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-leaf-600 text-xs font-semibold text-white">
            {i + 1}
          </span>
          <span className="pt-0.5">{item}</span>
        </li>
      ))}
    </ol>
  );
}

function DayChip({ on, children }: { on?: boolean; children: React.ReactNode }) {
  return (
    <span
      className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ${
        on
          ? "bg-leaf-600 text-white ring-leaf-600"
          : "bg-white text-bark/52 ring-leaf-100"
      }`}
    >
      {children}
    </span>
  );
}

function ExampleRow({ name, off }: { name: string; off: number[] }) {
  return (
    <div className="flex flex-wrap items-center gap-2 py-1">
      <span className="w-28 shrink-0 text-bark">{name}</span>
      <span className="flex flex-wrap gap-1">
        {OPEN_WEEKDAYS.map((d) => (
          <DayChip key={d} on={!off.includes(d)}>
            {WEEKDAY_SHORT[d]}
          </DayChip>
        ))}
      </span>
    </div>
  );
}

function Example({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 rounded-xl bg-cream-50 p-4 ring-1 ring-leaf-50">
      {children}
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl bg-gold-50 px-4 py-3 text-bark/75 ring-1 ring-gold-100">
      {children}
    </p>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-bark/[0.06] px-2 py-0.5 text-xs font-medium text-bark/75">
      {children}
    </span>
  );
}

function Bullet({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <li className="rounded-xl bg-cream-50 px-4 py-3 ring-1 ring-leaf-50">
      <p className="font-medium text-bark">{title}</p>
      <p className="mt-0.5 text-bark/70">{children}</p>
    </li>
  );
}

function Card({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-cream-50 px-4 py-3 ring-1 ring-leaf-50">
      <dt className="font-medium text-bark">{term}</dt>
      <dd className="mt-0.5 text-bark/70">{children}</dd>
    </div>
  );
}
