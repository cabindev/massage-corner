import { prisma } from "@/lib/prisma";

export type TherapistDTO = {
  id: string;
  name: string;
  isActive: boolean;
};

/** หมอนวดพร้อมข้อมูลจัดการ (รวมจำนวนคิวที่กำลังจะถึง) */
export type TherapistAdmin = {
  id: string;
  name: string;
  bio: string | null;
  isActive: boolean;
  upcomingCount: number;
};

/** หมอนวดที่ยังรับงาน (ใช้ใน dropdown จัดหมอ) */
export async function getActiveTherapists(): Promise<TherapistDTO[]> {
  try {
    const rows = await prisma.therapist.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, isActive: true },
    });
    return rows;
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
      upcomingCount: t._count.bookings,
    }));
  } catch {
    return [];
  }
}
