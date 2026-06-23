import { PrismaClient } from "@prisma/client";

// ใช้ singleton เพื่อกัน Next.js (dev/hot-reload) สร้าง PrismaClient ซ้ำหลายตัว
// จนเปิด connection เกินลิมิตของฐานข้อมูล
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
