import { getServices } from "@/lib/services";
import HomeContent from "@/app/components/HomeContent";

/**
 * อ่านบริการจาก DB ตอนมีคนเข้า ไม่ใช่ตอน build
 *
 * ถ้าปล่อยเป็น static (ค่า default) Next จะรัน getServices() ตอน `next build`
 * ซึ่งบนเซิร์ฟเวอร์ deploy เข้า DB ไม่ได้ → ตกไปใช้ MOCK_SERVICES แล้วฝัง id
 * ปลอม ("mock-thai") ลง HTML ถาวร ปุ่ม BOOK เลยลิงก์ไป ?service=mock-thai ซึ่ง
 * ไม่ตรงกับบริการจริงสักอัน ฟอร์มจองก็จะเด้งไปเลือกบริการตัวแรกให้แทน
 * (ลูกค้าจองผิดรายการ) และราคาที่แอดมินแก้ในหลังบ้านก็จะไม่ขึ้นจนกว่าจะ build ใหม่
 */
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const services = await getServices();
  return <HomeContent services={services} />;
}
