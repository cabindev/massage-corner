import { prisma } from "@/lib/prisma";

/** ช่วงราคาแต่ละความยาวเวลา (price list) */
export type PriceTier = { minutes: number; price: number };

/** รูปแบบข้อมูลบริการที่ส่งให้ฝั่ง UI (price แปลงเป็น number แล้ว) — รองรับ EN/BG */
export type ServiceDTO = {
  id: string;
  name: string;
  nameBg: string | null;
  description: string | null;
  descriptionBg: string | null;
  price: number;
  durationMinutes: number;
  imageUrl: string | null;
  priceTiers: PriceTier[] | null;
};

/** ข้อมูลตัวอย่าง ใช้แสดงผลเมื่อฐานข้อมูลยังไม่พร้อม (ยังไม่ได้ migrate/seed) */
export const MOCK_SERVICES: ServiceDTO[] = [
  {
    id: "mock-thai",
    name: "Traditional Thai Massage",
    nameBg: "Традиционен тайландски масаж",
    description:
      "A therapeutic practice based on traditional Thai medicine — pressing, stretching, and energy-line massage without oil.",
    descriptionBg:
      "Терапевтична практика, базирана на традиционната тайландска медицина — натиск, разтягане и масаж по енергийни линии без масло.",
    price: 55,
    durationMinutes: 60,
    imageUrl: "/images/services/traditional-thai.jpg",
    priceTiers: [{ minutes: 60, price: 55 }, { minutes: 90, price: 65 }, { minutes: 120, price: 95 }],
  },
  {
    id: "mock-aroma",
    name: "Oil Aromatherapy",
    nameBg: "Маслена ароматерапия",
    description:
      "A soothing massage using essential oils to heal body and mind, reduce stress, and nourish the skin.",
    descriptionBg:
      "Успокояващ масаж с етерични масла за лечение на тялото и духа, намаляване на стреса.",
    price: 65,
    durationMinutes: 60,
    imageUrl: "/images/services/oil-aromatherapy.jpg",
    priceTiers: [{ minutes: 60, price: 65 }, { minutes: 90, price: 95 }, { minutes: 120, price: 115 }],
  },
  {
    id: "mock-foot",
    name: "Foot Massage",
    nameBg: "Масаж на краката",
    description:
      "Reflexology and deep tissue work on the feet to stimulate energy flow throughout the body.",
    descriptionBg:
      "Рефлексология и дълбока тъканна работа на краката за стимулиране на енергийния поток в тялото.",
    price: 50,
    durationMinutes: 60,
    imageUrl: "/images/services/foot.jpg",
    priceTiers: [{ minutes: 30, price: 40 }, { minutes: 60, price: 50 }],
  },
];

/**
 * ดึงรายการบริการที่เปิดใช้งานจากฐานข้อมูลผ่าน Prisma
 * ถ้าฐานข้อมูลยังไม่พร้อม (เช่น ยังไม่ได้ migrate) จะคืนค่า MOCK_SERVICES แทน
 */
export async function getServices(): Promise<ServiceDTO[]> {
  try {
    const rows = await prisma.service.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
    });
    if (rows.length > 0) {
      return rows.map((s) => ({
        id: s.id,
        name: s.name,
        nameBg: s.nameBg,
        description: s.description,
        descriptionBg: s.descriptionBg,
        price: Number(s.price),
        durationMinutes: s.durationMinutes,
        imageUrl: s.imageUrl,
        priceTiers: (s.priceTiers as PriceTier[] | null) ?? null,
      }));
    }
  } catch {
    // ฐานข้อมูลยังไม่พร้อม → ใช้ข้อมูลตัวอย่าง
  }
  return MOCK_SERVICES;
}
