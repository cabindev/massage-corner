// เปลี่ยนรหัสผ่านผู้ใช้หลังบ้าน โดยไม่ต้องพิมพ์รหัสลงคำสั่ง (ไม่ค้างใน shell history)
//
//   npm run admin:password                      → เปลี่ยนของ admin@massage.local
//   npm run admin:password -- someone@shop.com  → ระบุอีเมลเอง
//
// พิมพ์รหัสตอน prompt (จอไม่แสดงตัวอักษร) หรือ pipe เข้ามาก็ได้:
//   printf 'newpass\n' | node --env-file=.env prisma/set-admin-password.mjs
//
// สคริปต์นี้แตะเฉพาะแถวใน User ที่อีเมลตรงเท่านั้น — ไม่ลบข้อมูลอะไรทั้งสิ้น
// (ต่างจาก `npm run seed` ที่ deleteMany ทั้ง Service/Booking/Therapist)
import readline from "node:readline";
import { Writable } from "node:stream";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const DEFAULT_EMAIL = "admin@massage.local";
const MIN_LENGTH = 10;
const BCRYPT_ROUNDS = 10; // ให้ตรงกับ prisma/seed.mjs

const prisma = new PrismaClient();

/** อ่านรหัสจาก stdin — ซ่อนตัวอักษรถ้าเป็น terminal, อ่านตรงๆ ถ้าถูก pipe เข้ามา */
function readSecret(prompt) {
  if (!process.stdin.isTTY) {
    return new Promise((resolve) => {
      let buf = "";
      process.stdin.setEncoding("utf8");
      process.stdin.on("data", (d) => (buf += d));
      process.stdin.on("end", () => resolve(buf.split("\n")[0]));
    });
  }

  const muted = new Writable({
    write(chunk, enc, cb) {
      if (!muted.isMuted) process.stdout.write(chunk, enc);
      cb();
    },
  });

  const rl = readline.createInterface({
    input: process.stdin,
    output: muted,
    terminal: true,
  });

  return new Promise((resolve) => {
    process.stdout.write(prompt);
    muted.isMuted = true;
    rl.question("", (answer) => {
      muted.isMuted = false;
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
  });
}

async function main() {
  const email = (process.argv[2] || DEFAULT_EMAIL).trim();

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, role: true },
  });
  if (!user) {
    console.error(`✖ ไม่พบผู้ใช้ ${email}`);
    const all = await prisma.user.findMany({ select: { email: true, role: true } });
    if (all.length) {
      console.error("  ผู้ใช้ที่มีอยู่:");
      all.forEach((u) => console.error(`    - ${u.email} (${u.role})`));
    }
    process.exitCode = 1;
    return;
  }

  console.log(`กำลังเปลี่ยนรหัสของ: ${user.email} — ${user.name ?? "(ไม่มีชื่อ)"} (${user.role})`);

  const pass = await readSecret("รหัสผ่านใหม่: ");
  if (pass.length < MIN_LENGTH) {
    console.error(`✖ รหัสสั้นเกินไป ต้องอย่างน้อย ${MIN_LENGTH} ตัวอักษร`);
    process.exitCode = 1;
    return;
  }

  if (process.stdin.isTTY) {
    const again = await readSecret("พิมพ์ซ้ำอีกครั้ง: ");
    if (again !== pass) {
      console.error("✖ รหัสทั้งสองครั้งไม่ตรงกัน — ไม่ได้เปลี่ยนอะไร");
      process.exitCode = 1;
      return;
    }
  }

  const hashed = await bcrypt.hash(pass, BCRYPT_ROUNDS);
  await prisma.user.update({ where: { email }, data: { password: hashed } });

  // อ่านกลับมาตรวจว่า hash ที่บันทึกใช้ได้จริง
  const saved = await prisma.user.findUnique({
    where: { email },
    select: { password: true },
  });
  const ok = await bcrypt.compare(pass, saved.password);

  console.log(ok ? `✔ เปลี่ยนรหัสของ ${email} เรียบร้อย` : "✖ บันทึกแล้วแต่ตรวจสอบไม่ผ่าน");
  if (!ok) process.exitCode = 1;
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
