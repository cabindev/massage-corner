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

/**
 * ข้อมูลตัวอย่าง ใช้แสดงผลเมื่อฐานข้อมูลยังไม่พร้อม (ยังไม่ได้ migrate/seed)
 * ต้องตรงกับ `prisma/seed.mjs` — ครบทั้ง 10 บริการ ไม่งั้นหน้าเว็บจะโชว์ไม่ครบเวลา DB ล่ม
 */
export const MOCK_SERVICES: ServiceDTO[] = [
  {
    id: "mock-thai",
    name: "Traditional Thai Massage",
    nameBg: "Традиционен тайландски масаж",
    description:
      "A therapeutic practice based on traditional Thai medicine. Pressing, stretching, and energy-line massage without oil — restoring balance and flexibility.",
    descriptionBg:
      "Терапевтична практика, базирана на традиционната тайландска медицина. Натиск, разтягане и масаж по енергийни линии без масло.",
    price: 55,
    durationMinutes: 60,
    imageUrl: "/images/services/traditional-thai.jpg",
    priceTiers: [
      { minutes: 60, price: 55 },
      { minutes: 90, price: 65 },
      { minutes: 120, price: 95 },
    ],
  },
  {
    id: "mock-thai-oil",
    name: "Thai Oil Massage",
    nameBg: "Тайландско маслено",
    description:
      "A blend of Thai acupressure and oil massage for deeper muscle relaxation with less discomfort. Ideal for office syndrome and back pain.",
    descriptionBg:
      "Комбинация от тайландски акупресура и маслен масаж за по-дълбока мускулна релаксация с по-малко дискомфорт.",
    price: 65,
    durationMinutes: 60,
    imageUrl: "/images/services/thai-oil.jpg",
    priceTiers: [
      { minutes: 60, price: 65 },
      { minutes: 90, price: 85 },
      { minutes: 120, price: 95 },
    ],
  },
  {
    id: "mock-aroma",
    name: "Oil Aromatherapy",
    nameBg: "Маслена ароматерапия",
    description:
      "A soothing massage using essential oils extracted from natural plants to heal body and mind, reduce stress, and nourish the skin.",
    descriptionBg:
      "Успокояващ масаж с етерични масла, извлечени от естествени растения, за лечение на тялото и духа, намаляване на стреса.",
    price: 65,
    durationMinutes: 60,
    imageUrl: "/images/services/oil-aromatherapy.jpg",
    priceTiers: [
      { minutes: 60, price: 65 },
      { minutes: 90, price: 95 },
      { minutes: 120, price: 115 },
    ],
  },
  {
    id: "mock-neck-shoulder",
    name: "Neck & Shoulder Massage",
    nameBg: "Масаж на врата и раменете",
    description:
      "Targeted relief for neck, shoulder, and upper back tension. Ideal for office workers and anyone suffering from chronic headaches.",
    descriptionBg:
      "Целенасочено облекчение на напрежението в шията, раменете и горната част на гърба. Идеален за офис работници.",
    price: 65,
    durationMinutes: 60,
    imageUrl: "/images/services/neck-shoulder.jpg",
    priceTiers: [
      { minutes: 30, price: 50 },
      { minutes: 60, price: 65 },
    ],
  },
  {
    id: "mock-foot",
    name: "Foot Massage",
    nameBg: "Масаж на краката",
    description:
      "Reflexology and deep tissue work on the feet to stimulate energy flow throughout the entire body. Deeply relaxing and restorative.",
    descriptionBg:
      "Рефлексология и дълбока тъканна работа на краката за стимулиране на енергийния поток в цялото тяло.",
    price: 50,
    durationMinutes: 60,
    imageUrl: "/images/services/foot.jpg",
    priceTiers: [
      { minutes: 30, price: 40 },
      { minutes: 60, price: 50 },
    ],
  },
  {
    id: "mock-sport",
    name: "Sport Massage",
    nameBg: "Спортен масаж",
    description:
      "Designed for athletes and active individuals. Relieves muscle soreness, improves performance, and speeds up recovery after training.",
    descriptionBg:
      "Предназначен за спортисти и активни хора. Облекчава мускулната болка, подобрява представянето и ускорява възстановяването.",
    price: 70,
    durationMinutes: 60,
    imageUrl: "/images/services/sport.jpg",
    priceTiers: [
      { minutes: 60, price: 70 },
      { minutes: 90, price: 95 },
    ],
  },
  {
    id: "mock-herbal",
    name: "Hot Herbal Compress",
    nameBg: "Горещ билков компрес",
    description:
      "Heated pouches filled with Thai medicinal herbs applied to the body to relieve pain, reduce inflammation, and deeply relax muscles.",
    descriptionBg:
      "Загряти торбички с тайландски лечебни билки, прилагани върху тялото за облекчаване на болката и дълбока релаксация.",
    price: 75,
    durationMinutes: 60,
    imageUrl: "/images/services/hot-herbal-compress.jpg",
    priceTiers: [{ minutes: 60, price: 75 }],
  },
  {
    id: "mock-office",
    name: "Office Syndrome",
    nameBg: "Офис синдром",
    description:
      "A specialized treatment targeting muscle tension caused by prolonged sitting. Focuses on neck, shoulders, lower back, and wrists.",
    descriptionBg:
      "Специализирано лечение, насочено към мускулно напрежение, причинено от продължително седене. Фокусира се върху шията, раменете.",
    price: 75,
    durationMinutes: 60,
    imageUrl: "/images/services/office-syndrome.jpg",
    priceTiers: [{ minutes: 60, price: 75 }],
  },
  {
    id: "mock-face",
    name: "Face Massage",
    nameBg: "Масаж на лицето",
    description:
      "A skincare and rejuvenation treatment using gentle pressure, Gua Sha, and lymphatic drainage to lift, brighten, and de-puff the face.",
    descriptionBg:
      "Грижа за кожата и подмладяване чрез нежен натиск, гуа ша и лимфен дренаж за стягане, озаряване и намаляване на отоците по лицето.",
    price: 30,
    durationMinutes: 30,
    imageUrl: "/images/services/face.jpg",
    priceTiers: [{ minutes: 30, price: 30 }],
  },
  {
    id: "mock-anti-stress",
    name: "Anti-Stress",
    nameBg: "Анти-стрес",
    description:
      "A holistic full-body treatment combining gentle techniques to melt away stress, calm the nervous system, and restore inner peace.",
    descriptionBg:
      "Холистично лечение на цялото тяло, съчетаващо нежни техники за разтапяне на стреса и успокояване на нервната система.",
    price: 70,
    durationMinutes: 60,
    imageUrl: "/images/services/anti-stress.jpg",
    priceTiers: [
      { minutes: 60, price: 70 },
      { minutes: 90, price: 105 },
    ],
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
    console.warn(
      "[getServices] DB ตอบกลับ 0 บริการ — ใช้ MOCK_SERVICES แทน (id เป็น 'mock-*' ปุ่ม BOOK จะลิงก์ไปบริการที่ไม่มีจริง)"
    );
  } catch (err) {
    // ฐานข้อมูลยังไม่พร้อม → ใช้ข้อมูลตัวอย่าง
    // log ไว้ด้วย ไม่งั้น DB ล่มแล้วเว็บยังดูปกติ กว่าจะรู้ตัวก็ตอนลูกค้าจองผิดรายการ
    console.warn("[getServices] อ่าน DB ไม่ได้ — ใช้ MOCK_SERVICES แทน:", err);
  }
  return MOCK_SERVICES;
}
