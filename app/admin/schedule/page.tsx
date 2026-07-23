import { getBookings } from "@/lib/admin-data";
import { getActiveTherapists } from "@/lib/therapists";
import { getServices } from "@/lib/services";
import WeekSchedule, { type SchedBooking } from "./WeekSchedule";

export const dynamic = "force-dynamic";

export default async function AdminSchedulePage() {
  const [bookings, therapists, services] = await Promise.all([
    getBookings(),
    getActiveTherapists(),
    getServices(),
  ]);

  const data: SchedBooking[] = bookings
    .filter((b) => b.status !== "CANCELLED" && b.status !== "REJECTED")
    .map((b) => ({
      id: b.id,
      customerName: b.customerName,
      serviceId: b.serviceId,
      serviceName: b.serviceName,
      phone: b.phone,
      notes: b.notes,
      therapistId: b.therapistId,
      start: b.bookingTime.toISOString(),
      end: b.endTime.toISOString(),
      durationMinutes: b.durationMinutes,
      status: b.status,
    }));

  return (
    <div className="mx-auto max-w-7xl">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-medium text-leaf-700">
          Week schedule
        </h1>
        <p className="mt-1 text-sm text-bark/68">
          Weekly timeline by therapist. Drag to reschedule · double-click to edit.
        </p>
      </header>
      <WeekSchedule
        bookings={data}
        therapists={therapists.map((t) => ({ id: t.id, name: t.name }))}
        services={services.map((s) => ({
          id: s.id,
          name: s.name,
          durationMinutes: s.durationMinutes,
          price: s.price,
        }))}
      />
    </div>
  );
}
