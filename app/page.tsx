import { getServices } from "@/lib/services";
import HomeContent from "@/app/components/HomeContent";

export default async function HomePage() {
  const services = await getServices();
  return <HomeContent services={services} />;
}
