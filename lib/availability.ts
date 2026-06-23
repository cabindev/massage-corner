import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

// ─── เวลาทำการ (แหล่งเดียวใน lib/schedule-config) ───────────────
export {
  OPEN_MINUTES,
  CLOSE_MINUTES,
  SLOT_STEP_MINUTES,
} from "@/lib/schedule-config";
import {
  OPEN_MINUTES,
  CLOSE_MINUTES,
  SLOT_STEP_MINUTES,
} from "@/lib/schedule-config";

/** สถานะการจองที่ถือว่า "กินคิว" หมอ (ใช้คำนวณ capacity) */
export const ACTIVE_BOOKING_STATUSES = ["PENDING", "CONFIRMED"] as const;

/** where clause: การจองที่ทับช่วงเวลา [start, end) — ใช้ร่วมกันทั้งตอนเช็กว่างและตอนจองจริง */
export function overlapWhere(start: Date, end: Date): Prisma.BookingWhereInput {
  return {
    status: { in: [...ACTIVE_BOOKING_STATUSES] },
    bookingTime: { lt: end },
    endTime: { gt: start },
  };
}

export type SlotInfo = { time: string; available: boolean };

function toHHMM(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** รายการ slot ทั้งวันตามเวลาทำการ เช่น ["10:00","10:30",...] */
export function buildDaySlots(): string[] {
  const slots: string[] = [];
  for (let m = OPEN_MINUTES; m < CLOSE_MINUTES; m += SLOT_STEP_MINUTES) {
    slots.push(toHHMM(m));
  }
  return slots;
}

/**
 * คืน slot ทั้งวันพร้อมสถานะว่าง/เต็ม สำหรับวัน + บริการที่เลือก
 * slot จะ "ว่าง" ก็ต่อเมื่อ:
 *   1) เริ่มในอนาคต (ไม่ใช่อดีต)
 *   2) คิวจบภายในเวลาทำการ (start + duration ≤ ปิดร้าน)
 *   3) มีหมอ active และคิวที่ทับช่วงเวลายังน้อยกว่าจำนวนหมอ
 * ใช้ logic overlap เดียวกับ createBooking เพื่อให้ "ว่าง" ตรงกับตอนกดจองจริง
 */
export async function getDayAvailability(
  serviceId: string,
  dateStr: string
): Promise<SlotInfo[]> {
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    select: { durationMinutes: true, isActive: true },
  });
  if (!service || !service.isActive) return [];

  const activeTherapists = await prisma.therapist.count({
    where: { isActive: true },
  });

  // ดึงการจองของทั้งวันมาครั้งเดียว แล้วคำนวณ overlap ใน JS (ลดจำนวน query)
  const dayStart = new Date(`${dateStr}T00:00:00`);
  if (isNaN(dayStart.getTime())) return [];
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const dayBookings = await prisma.booking.findMany({
    where: {
      status: { in: [...ACTIVE_BOOKING_STATUSES] },
      bookingTime: { lt: dayEnd },
      endTime: { gt: dayStart },
    },
    select: { bookingTime: true, endTime: true },
  });

  const now = new Date();
  const results: SlotInfo[] = [];

  for (let m = OPEN_MINUTES; m < CLOSE_MINUTES; m += SLOT_STEP_MINUTES) {
    const time = toHHMM(m);
    const start = new Date(`${dateStr}T${time}:00`);
    const end = new Date(start.getTime() + service.durationMinutes * 60_000);

    const fitsWithinHours = m + service.durationMinutes <= CLOSE_MINUTES;
    const inFuture = start.getTime() > now.getTime();

    let available = activeTherapists > 0 && fitsWithinHours && inFuture;
    if (available) {
      const overlap = dayBookings.filter(
        (b) => b.bookingTime < end && b.endTime > start
      ).length;
      available = overlap < activeTherapists;
    }
    results.push({ time, available });
  }

  return results;
}
