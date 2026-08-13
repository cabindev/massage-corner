import { prisma } from "@/lib/prisma";
import {
  SHOP_TIMEZONE,
  sofiaDateKey,
  sofiaDateTimeToUTC,
  sofiaStartOfDay,
} from "@/lib/schedule-config";

export type BookingStatusValue =
  | "PENDING"
  | "CONFIRMED"
  | "REJECTED"
  | "COMPLETED"
  | "CANCELLED";

export type AdminBooking = {
  id: string;
  customerName: string;
  phone: string;
  bookingTime: Date;
  endTime: Date;
  status: BookingStatusValue;
  notes: string | null;
  serviceId: string;
  serviceName: string;
  price: number;
  durationMinutes: number;
  therapistId: string | null;
  therapistName: string | null;
  createdAt: Date;
};

/**
 * ดึงรายการการจองทั้งหมดพร้อมชื่อบริการ
 * ถ้าฐานข้อมูลยังไม่พร้อมจะคืนค่าเป็น [] เพื่อให้หน้า admin แสดงผลได้
 */
export async function getBookings(): Promise<AdminBooking[]> {
  try {
    const rows = await prisma.booking.findMany({
      orderBy: { bookingTime: "desc" }, // ล่าสุด/อนาคตขึ้นก่อน (ของปัจจุบันอยู่บน)
      include: {
        service: { select: { name: true, price: true, durationMinutes: true } },
        therapist: { select: { id: true, name: true } },
      },
    });
    return rows.map((b) => ({
      id: b.id,
      customerName: b.customerName,
      phone: b.phone,
      bookingTime: b.bookingTime,
      endTime: b.endTime,
      status: b.status as BookingStatusValue,
      notes: b.notes,
      serviceId: b.serviceId,
      serviceName: b.service?.name ?? "—",
      price: b.service ? Number(b.service.price) : 0,
      durationMinutes: b.service?.durationMinutes ?? 0,
      therapistId: b.therapist?.id ?? null,
      therapistName: b.therapist?.name ?? null,
      createdAt: b.createdAt,
    }));
  } catch {
    return [];
  }
}

/** จุดข้อมูลกราฟรายวัน */
export type DayPoint = { label: string; count: number; isToday: boolean };
/** บริการยอดนิยม */
export type ServiceCount = { name: string; count: number };

/** สรุปสถิติสำหรับหน้า Dashboard */
export type DashboardStats = {
  todayCount: number;
  totalCount: number;
  pendingCount: number;
  confirmedCount: number;
  completedCount: number;
  cancelledCount: number;
  unassignedCount: number; // คิวที่ยังไม่จัดหมอ (ต้องดำเนินการ)
  weekCount: number; // คิวใน 7 วันข้างหน้า
  revenue: number; // รายได้คาดการณ์ (ยืนยัน + ปิดงาน)
  upcoming: AdminBooking[];
  todaySchedule: AdminBooking[];
  last7: DayPoint[];
  topServices: ServiceCount[];
};

/** สถานะที่ยัง "มีชีวิต" — ยังไม่จบ/ไม่ถูกปฏิเสธ/ไม่ถูกยกเลิก */
const LIVE_STATUSES: BookingStatusValue[] = ["PENDING", "CONFIRMED"];

// ใช้ปฏิทินเวลาร้าน (Europe/Sofia) เสมอ — ไม่ใช้เวลาเครื่องเซิร์ฟเวอร์ ป้องกัน "วันนี้"/สถิติเพี้ยน
// ถ้าเซิร์ฟเวอร์ไม่ได้ตั้ง TZ เป็นโซเฟีย
function isSameLocalDate(a: Date, b: Date) {
  return sofiaDateKey(a) === sofiaDateKey(b);
}

export function buildStats(bookings: AdminBooking[]): DashboardStats {
  const now = new Date();
  const today0 = sofiaStartOfDay(now);
  const weekAhead = new Date(today0.getTime() + 7 * 24 * 60 * 60 * 1000);

  const isActive = (b: AdminBooking) => LIVE_STATUSES.includes(b.status);
  const isLive = (b: AdminBooking) =>
    b.status !== "CANCELLED" && b.status !== "REJECTED";

  // กราฟ 7 วันล่าสุด (รวมวันนี้) — เดินย้อนหลังจาก "เที่ยงวัน" ตามเวลาร้าน
  // ไม่ใช่เที่ยงคืน เพราะวันที่สลับ DST ยาว/สั้นไป 1 ชม. แล้วจะข้ามวันผิด
  const noonToday = sofiaDateTimeToUTC(sofiaDateKey(now), "12:00");
  const last7: DayPoint[] = [];
  for (let i = 6; i >= 0; i--) {
    const day = new Date(noonToday.getTime() - i * 24 * 60 * 60 * 1000);
    const count = bookings.filter(
      (b) => isLive(b) && isSameLocalDate(b.bookingTime, day)
    ).length;
    last7.push({
      label: new Intl.DateTimeFormat("en-GB", {
        weekday: "short",
        timeZone: SHOP_TIMEZONE,
      }).format(day),
      count,
      isToday: i === 0,
    });
  }

  // บริการยอดนิยม (เฉพาะคิวที่ไม่ถูกยกเลิก)
  const svcMap = new Map<string, number>();
  for (const b of bookings) {
    if (!isLive(b)) continue;
    svcMap.set(b.serviceName, (svcMap.get(b.serviceName) ?? 0) + 1);
  }
  const topServices: ServiceCount[] = [...svcMap.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    todayCount: bookings.filter(
      (b) => isLive(b) && isSameLocalDate(b.bookingTime, now)
    ).length,
    totalCount: bookings.length,
    pendingCount: bookings.filter((b) => b.status === "PENDING").length,
    confirmedCount: bookings.filter((b) => b.status === "CONFIRMED").length,
    completedCount: bookings.filter((b) => b.status === "COMPLETED").length,
    cancelledCount: bookings.filter(
      (b) => b.status === "CANCELLED" || b.status === "REJECTED"
    ).length,
    unassignedCount: bookings.filter(
      (b) => isActive(b) && !b.therapistId && b.bookingTime >= today0
    ).length,
    weekCount: bookings.filter(
      (b) =>
        isActive(b) && b.bookingTime >= today0 && b.bookingTime < weekAhead
    ).length,
    revenue: bookings
      .filter((b) => b.status === "CONFIRMED" || b.status === "COMPLETED")
      .reduce((sum, b) => sum + b.price, 0),
    upcoming: bookings
      .filter((b) => isActive(b) && b.bookingTime >= now)
      .sort((a, b) => a.bookingTime.getTime() - b.bookingTime.getTime())
      .slice(0, 6),
    todaySchedule: bookings
      .filter((b) => isLive(b) && isSameLocalDate(b.bookingTime, now))
      .sort((a, b) => a.bookingTime.getTime() - b.bookingTime.getTime()),
    last7,
    topServices,
  };
}

/** เป็นวันนี้หรือไม่ (ตามเวลาร้าน Europe/Sofia เสมอ) */
export function isToday(d: Date): boolean {
  return isSameLocalDate(d, new Date());
}

/** จัดรูปแบบเวลาอย่างเดียว (HH:mm) ตามเวลาร้าน Europe/Sofia เสมอ */
export function formatTime(d: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: SHOP_TIMEZONE,
  }).format(d);
}

/** ตัวช่วยจัดรูปแบบวันเวลา ตามเวลาร้าน Europe/Sofia เสมอ */
export function formatThaiDateTime(d: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: SHOP_TIMEZONE,
  }).format(d);
}

export const STATUS_META: Record<
  BookingStatusValue,
  { label: string; badge: string }
> = {
  PENDING: {
    label: "Pending",
    badge: "bg-amber-100 text-amber-700 ring-amber-200",
  },
  CONFIRMED: {
    label: "Confirmed",
    badge: "bg-leaf-100 text-leaf-700 ring-leaf-200",
  },
  REJECTED: {
    label: "Rejected",
    badge: "bg-red-100 text-red-700 ring-red-200",
  },
  COMPLETED: {
    label: "Completed",
    badge: "bg-sky-100 text-sky-700 ring-sky-200",
  },
  CANCELLED: {
    label: "Cancelled",
    badge: "bg-bark/10 text-bark/60 ring-bark/15",
  },
};
