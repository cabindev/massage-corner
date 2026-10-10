import { getAllTherapists } from "@/lib/therapists";
import TherapistManager from "./TherapistManager";

export const dynamic = "force-dynamic";

export default async function AdminTherapistsPage() {
  const therapists = await getAllTherapists();

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-medium text-leaf-700">
          Therapists
        </h1>
        <p className="mt-1 text-sm text-bark/68">
          Add, rename, or remove therapists, and pick the days each one works.
          Capacity on a day = active therapists who work that day.
        </p>
      </header>
      <TherapistManager therapists={therapists} />
    </div>
  );
}
