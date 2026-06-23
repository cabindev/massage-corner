// ข้อมูลจองตัวอย่างสำหรับเดโม dashboard
//   เพิ่ม:  node --env-file=.env prisma/sample-bookings.mjs
//   ล้าง:  node --env-file=.env prisma/sample-bookings.mjs --clear
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const TAG = "[sample]"; // ใส่ใน notes เพื่อให้ลบเฉพาะข้อมูลตัวอย่างได้

const NAMES = [
  "Maria Ivanova", "Georgi Petrov", "Elena Dimitrova", "Ivan Stoyanov",
  "Nadia Koleva", "Dimitar Angelov", "Petya Hristova", "Stefan Marinov",
  "Yana Todorova", "Nikolay Iliev", "Viktoria Popova", "Aleksandar Vasilev",
];
function phone() {
  return "+359 88 " + Math.floor(100 + Math.random() * 900) + " " + Math.floor(1000 + Math.random() * 9000);
}
function at(dayOffset, hour, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d;
}

async function main() {
  if (process.argv.includes("--clear")) {
    const r = await prisma.booking.deleteMany({ where: { notes: TAG } });
    console.log(`🧹 cleared ${r.count} sample bookings`);
    return;
  }

  const existing = await prisma.booking.count({ where: { notes: TAG } });
  if (existing > 0) {
    console.log(`• sample bookings already exist (${existing}) — run with --clear first`);
    return;
  }

  const services = await prisma.service.findMany();
  const therapists = await prisma.therapist.findMany({ where: { isActive: true } });
  if (services.length === 0 || therapists.length === 0) {
    console.log("! need services + therapists first (run npm run seed)");
    return;
  }
  const svc = (i) => services[i % services.length];
  const ther = (i) => therapists[i % therapists.length];
  let n = 0;

  // plan: [dayOffset, hour, serviceIdx, status, assign?]
  const plan = [
    // อดีต (สำหรับกราฟ + รายได้ + บริการยอดนิยม)
    [-6, 11, 0, "COMPLETED", true], [-6, 15, 2, "COMPLETED", true],
    [-5, 12, 1, "COMPLETED", true], [-4, 10, 0, "COMPLETED", true],
    [-4, 16, 5, "COMPLETED", true], [-3, 14, 3, "COMPLETED", true],
    [-2, 11, 0, "COMPLETED", true], [-2, 18, 2, "CANCELLED", false],
    [-1, 13, 6, "COMPLETED", true], [-1, 17, 1, "COMPLETED", true],
    // วันนี้
    [0, 10, 0, "CONFIRMED", true], [0, 12, 2, "CONFIRMED", true],
    [0, 14, 4, "PENDING", false], [0, 16, 9, "PENDING", false],
    [0, 18, 1, "CONFIRMED", true],
    // สัปดาห์นี้ (ข้างหน้า)
    [1, 11, 0, "CONFIRMED", true], [1, 15, 3, "PENDING", false],
    [2, 13, 2, "PENDING", false], [3, 10, 5, "CONFIRMED", true],
    [4, 17, 1, "PENDING", false], [5, 14, 0, "CONFIRMED", true],
  ];

  for (let i = 0; i < plan.length; i++) {
    const [day, hour, si, status, assign] = plan[i];
    const s = svc(si);
    const start = at(day, hour);
    const end = new Date(start.getTime() + s.durationMinutes * 60000);
    await prisma.booking.create({
      data: {
        customerName: NAMES[i % NAMES.length],
        phone: phone(),
        bookingTime: start,
        endTime: end,
        status,
        notes: TAG,
        serviceId: s.id,
        therapistId: assign ? ther(i).id : null,
      },
    });
    n++;
  }
  console.log(`✔ created ${n} sample bookings`);
}

main().then(() => prisma.$disconnect()).catch(async (e) => {
  console.error(e); await prisma.$disconnect(); process.exit(1);
});
