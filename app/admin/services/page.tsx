import { getServices } from "@/lib/services";

export const dynamic = "force-dynamic";

export default async function AdminServicesPage() {
  const services = await getServices();

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-bark">Services</h1>
          <p className="mt-1 text-sm text-bark/68">
            Treatments available for booking
          </p>
        </div>
        <span className="rounded-full bg-white px-4 py-1.5 text-sm font-medium text-leaf-700 ring-1 ring-leaf-100">
          {services.length} services
        </span>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((s) => (
          <div
            key={s.id}
            className="rounded-2xl bg-white p-5 ring-1 ring-leaf-100"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-semibold text-bark">{s.name}</h3>
              <span className="shrink-0 rounded-full bg-leaf-50 px-2.5 py-1 text-xs font-medium text-leaf-700">
                {s.durationMinutes} min
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-bark/68">
              {s.description}
            </p>
            <p className="mt-4 text-lg font-semibold text-leaf-700">
              {s.price} €
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
