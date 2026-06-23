import { getBookings } from "@/lib/admin-data";
import { getActiveTherapists } from "@/lib/therapists";
import { getServices } from "@/lib/services";
import BookingsTable, { type BookingRow } from "./BookingsTable";

export const dynamic = "force-dynamic";

export default async function AdminBookingsPage() {
  const [bookings, therapists, services] = await Promise.all([
    getBookings(),
    getActiveTherapists(),
    getServices(),
  ]);

  const rows: BookingRow[] = bookings.map((b) => ({
    id: b.id,
    customerName: b.customerName,
    phone: b.phone,
    serviceId: b.serviceId,
    serviceName: b.serviceName,
    durationMinutes: b.durationMinutes,
    bookingTimeISO: b.bookingTime.toISOString(),
    status: b.status,
    therapistId: b.therapistId,
    notes: b.notes,
  }));

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-5">
        <h1 className="font-display text-3xl font-medium text-leaf-700">
          Bookings
        </h1>
        <p className="mt-1 text-sm text-bark/55">
          Add, edit, delete, assign a therapist and update status — all here.
        </p>
      </header>
      <BookingsTable
        bookings={rows}
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
