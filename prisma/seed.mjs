// Seed ข้อมูลเริ่มต้น — Massage Corner Sofia (EN/BG, ราคา EUR)
// รัน: npm run seed
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ADMIN_EMAIL = "admin@massage.local";
const ADMIN_PASSWORD = "massage@2026"; // เปลี่ยนก่อนใช้งานจริง

/** 10 บริการ — ตรงกับเว็บต้นแบบ Massage Corner Sofia (price = EUR, duration = ตัวหลักที่จองได้) */
const services = [
  {
    name: "Traditional Thai Massage",
    nameBg: "Традиционен тайландски масаж",
    description:
      "A therapeutic practice based on traditional Thai medicine. Pressing, stretching, and energy-line massage without oil — restoring balance and flexibility.",
    descriptionBg:
      "Терапевтична практика, базирана на традиционната тайландска медицина. Натиск, разтягане и масаж по енергийни линии без масло.",
    price: 55,
    durationMinutes: 60,
    imageUrl: "/images/services/traditional-thai.jpg",
  },
  {
    name: "Thai Oil Massage",
    nameBg: "Тайландско маслено",
    description:
      "A blend of Thai acupressure and oil massage for deeper muscle relaxation with less discomfort. Ideal for office syndrome and back pain.",
    descriptionBg:
      "Комбинация от тайландски акупресура и маслен масаж за по-дълбока мускулна релаксация с по-малко дискомфорт.",
    price: 65,
    durationMinutes: 60,
    imageUrl: "/images/services/thai-oil.jpg",
  },
  {
    name: "Oil Aromatherapy",
    nameBg: "Маслена ароматерапия",
    description:
      "A soothing massage using essential oils extracted from natural plants to heal body and mind, reduce stress, and nourish the skin.",
    descriptionBg:
      "Успокояващ масаж с етерични масла, извлечени от естествени растения, за лечение на тялото и духа, намаляване на стреса.",
    price: 65,
    durationMinutes: 60,
    imageUrl: "/images/services/oil-aromatherapy.jpg",
  },
  {
    name: "Neck & Shoulder Massage",
    nameBg: "Масаж на врата и раменете",
    description:
      "Targeted relief for neck, shoulder, and upper back tension. Ideal for office workers and anyone suffering from chronic headaches.",
    descriptionBg:
      "Целенасочено облекчение на напрежението в шията, раменете и горната част на гърба. Идеален за офис работници.",
    price: 65,
    durationMinutes: 60,
    imageUrl: "/images/services/neck-shoulder.jpg",
  },
  {
    name: "Foot Massage",
    nameBg: "Масаж на краката",
    description:
      "Reflexology and deep tissue work on the feet to stimulate energy flow throughout the entire body. Deeply relaxing and restorative.",
    descriptionBg:
      "Рефлексология и дълбока тъканна работа на краката за стимулиране на енергийния поток в цялото тяло.",
    price: 50,
    durationMinutes: 60,
    imageUrl: "/images/services/foot.jpg",
  },
  {
    name: "Sport Massage",
    nameBg: "Спортен масаж",
    description:
      "Designed for athletes and active individuals. Relieves muscle soreness, improves performance, and speeds up recovery after training.",
    descriptionBg:
      "Предназначен за спортисти и активни хора. Облекчава мускулната болка, подобрява представянето и ускорява възстановяването.",
    price: 70,
    durationMinutes: 60,
    imageUrl: "/images/services/sport.jpg",
  },
  {
    name: "Hot Herbal Compress",
    nameBg: "Горещ билков компрес",
    description:
      "Heated pouches filled with Thai medicinal herbs applied to the body to relieve pain, reduce inflammation, and deeply relax muscles.",
    descriptionBg:
      "Загряти торбички с тайландски лечебни билки, прилагани върху тялото за облекчаване на болката и дълбока релаксация.",
    price: 75,
    durationMinutes: 60,
    imageUrl: "/images/services/hot-herbal-compress.jpg",
  },
  {
    name: "Office Syndrome",
    nameBg: "Офис синдром",
    description:
      "A specialized treatment targeting muscle tension caused by prolonged sitting. Focuses on neck, shoulders, lower back, and wrists.",
    descriptionBg:
      "Специализирано лечение, насочено към мускулно напрежение, причинено от продължително седене. Фокусира се върху шията, раменете.",
    price: 75,
    durationMinutes: 60,
    imageUrl: "/images/services/office-syndrome.jpg",
  },
  {
    name: "Face Massage",
    nameBg: "Масаж на лицето",
    description:
      "A skincare and rejuvenation treatment using gentle pressure, Gua Sha, and lymphatic drainage to lift, brighten, and de-puff the face.",
    descriptionBg:
      "Грижа за кожата и подмладяване чрез нежен натиск, гуа ша и лимфен дренаж за стягане, озаряване и намаляване на отоците по лицето.",
    price: 30,
    durationMinutes: 30,
    imageUrl: "/images/services/face.jpg",
  },
  {
    name: "Anti-Stress",
    nameBg: "Анти-стрес",
    description:
      "A holistic full-body treatment combining gentle techniques to melt away stress, calm the nervous system, and restore inner peace.",
    descriptionBg:
      "Холистично лечение на цялото тяло, съчетаващо нежни техники за разтапяне на стреса и успокояване на нервната система.",
    price: 70,
    durationMinutes: 60,
    imageUrl: "/images/services/anti-stress.jpg",
  },
];

/** ช่วงราคาหลายแบบ (price list) ตามชื่อบริการ — อิงเว็บต้นแบบ */
const TIERS = {
  "Traditional Thai Massage": [
    { minutes: 60, price: 55 },
    { minutes: 90, price: 65 },
    { minutes: 120, price: 95 },
  ],
  "Thai Oil Massage": [
    { minutes: 60, price: 65 },
    { minutes: 90, price: 85 },
    { minutes: 120, price: 95 },
  ],
  "Oil Aromatherapy": [
    { minutes: 60, price: 65 },
    { minutes: 90, price: 95 },
    { minutes: 120, price: 115 },
  ],
  "Neck & Shoulder Massage": [
    { minutes: 30, price: 50 },
    { minutes: 60, price: 65 },
  ],
  "Foot Massage": [
    { minutes: 30, price: 40 },
    { minutes: 60, price: 50 },
  ],
  "Sport Massage": [
    { minutes: 60, price: 70 },
    { minutes: 90, price: 95 },
  ],
  "Hot Herbal Compress": [{ minutes: 60, price: 75 }],
  "Office Syndrome": [{ minutes: 60, price: 75 }],
  "Face Massage": [{ minutes: 30, price: 30 }],
  "Anti-Stress": [
    { minutes: 60, price: 70 },
    { minutes: 90, price: 105 },
  ],
};

/** หมอนวด 3 คน (ใช้คำนวณ capacity กัน overbook) */
const therapists = [
  { name: "Nuan", bio: "Specialist in Traditional Thai & Hot Herbal Compress, 10 years experience." },
  { name: "Daeng", bio: "Expert in Oil Aromatherapy & Sport Massage, muscle recovery." },
  { name: "Fon", bio: "Skilled in Foot & Neck/Shoulder massage, office syndrome relief." },
];

async function main() {
  // รีเซ็ตบริการให้ตรงชุดใหม่ (demo) — ลบ booking ที่อ้างถึงก่อน
  await prisma.booking.deleteMany();
  await prisma.service.deleteMany();
  for (const s of services) {
    await prisma.service.create({
      data: { ...s, priceTiers: TIERS[s.name] ?? null },
    });
  }
  console.log(`✔ สร้างบริการ ${services.length} รายการ (EN/BG, EUR, price tiers)`);

  // หมอนวด: รีเซ็ตเช่นกัน
  await prisma.therapist.deleteMany();
  for (const t of therapists) {
    await prisma.therapist.create({ data: t });
  }
  console.log(`✔ สร้างหมอนวด ${therapists.length} คน`);

  // admin user (รหัสผ่าน hash ด้วย bcrypt)
  const hashed = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { password: hashed },
    create: { email: ADMIN_EMAIL, password: hashed, name: "Administrator", role: "ADMIN" },
  });
  console.log(`✔ admin user: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD} (hashed)`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
