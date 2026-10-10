import { prisma } from "@/lib/prisma";
import { parseWorkDays } from "@/lib/schedule-config";

export type TherapistDTO = {
  id: string;
  name: string;
  isActive: boolean;
  /** วันที่เข้างาน 0=อาทิตย์ … 6=เสาร์ */
  workDays: number[];
};

/** หมอนวดพร้อมข้อมูลจัดการ (รวมจำนวนคิวที่กำลังจะถึง) */
export type TherapistAdmin = {
  id: string;
  name: string;
  bio: string | null;
  isActive: boolean;
  workDays: number[];
  upcomingCount: number;
};

/** หมอนวดที่ยังรับงาน (ใช้ใน dropdown จัดหมอ) */
export async function getActiveTherapists(): Promise<TherapistDTO[]> {
  try {
    const rows = await prisma.therapist.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, isActive: true, workDays: true },
    });
    return rows.map((t) => ({ ...t, workDays: parseWorkDays(t.workDays) }));
  } catch {
    return [];
  }
}

/** หมอนวดทั้งหมด (รวมที่ปิดรับงาน) สำหรับหน้าจัดการ */
export async function getAllTherapists(): Promise<TherapistAdmin[]> {
  try {
    const now = new Date();
    const rows = await prisma.therapist.findMany({
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        bio: true,
        isActive: true,
        workDays: true,
        _count: {
          select: {
            bookings: {
              where: {
                status: { in: ["PENDING", "CONFIRMED"] },
                bookingTime: { gte: now },
              },
            },
          },
        },
      },
    });
    return rows.map((t) => ({
      id: t.id,
      name: t.name,
      bio: t.bio,
      isActive: t.isActive,
      workDays: parseWorkDays(t.workDays),
      upcomingCount: t._count.bookings,
    }));
  } catch {
    return [];
  }
}
