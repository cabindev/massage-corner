import type { Metadata } from "next";
import { getServices } from "@/lib/services";
import BookingContent from "./BookingContent";

export const metadata: Metadata = {
  title: "Book a Treatment | Massage Corner Sofia",
  description:
    "Reserve your Thai massage or spa treatment online at Massage Corner Sofia.",
};

export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string }>;
}) {
  const [services, params] = await Promise.all([getServices(), searchParams]);

  return (
    <BookingContent services={services} initialServiceId={params.service} />
  );
}
