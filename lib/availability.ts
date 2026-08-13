import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

// ─── เวลาทำการ (แหล่งเดียวใน lib/schedule-config) ───────────────
export {
  OPEN_MINUTES,
  CLOSE_MINUTES,
  LAST_SLOT_MINUTES,
  SLOT_STEP_MINUTES,
} from "@/lib/schedule-config";
import {
  OPEN_MINUTES,
  CLOSE_MINUTES,
  LAST_SLOT_MINUTES,
  SLOT_STEP_MINUTES,
  isClosedDateKey,
  minutesToHHMM as toHHMM,
  sofiaDateKey,
  sofiaDateTimeToUTC,
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

/**
 * เหตุผลที่ slot จองไม่ได้ — แยกไว้เพื่อให้ฟอร์มบอกลูกค้าได้ตรง
 * "เลยเวลาไปแล้ว" ไม่เหมือน "คิวเต็ม": ถ้าขึ้น Full ทั้งคู่ คนที่เปิดดูตอนบ่าย
 * จะนึกว่าร้านคิวแน่นทั้งวัน ทั้งที่แค่เปิดดูสาย
 */
export type SlotUnavailableReason =
  /** เวลาผ่านไปแล้ว */
  | "past"
  /** หมอไม่ว่าง (คิวทับ ≥ จำนวนหมอ) หรือไม่มีหมอ active */
  | "full"
  /** เริ่มทันแต่คิวจะจบหลังร้านปิด */
  | "hours";

export type SlotInfo = {
  time: string;
  available: boolean;
  reason?: SlotUnavailableReason;
};

/** รายการ slot ที่จองได้ทั้งวัน เช่น ["10:30","11:00",...,"18:00"] — คิวสุดท้าย 18:00 */
export function buildDaySlots(): string[] {
  const slots: string[] = [];
  for (let m = OPEN_MINUTES; m <= LAST_SLOT_MINUTES; m += SLOT_STEP_MINUTES) {
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

  if (isClosedDateKey(dateStr)) return [];

  const activeTherapists = await prisma.therapist.count({
    where: { isActive: true },
  });

  // ดึงการจองของทั้งวันมาครั้งเดียว แล้วคำนวณ overlap ใน JS (ลดจำนวน query)
  // ขอบวันคิดตามเวลาร้าน (Europe/Sofia) — ไม่ใช่โซนเวลาของเครื่องเซิร์ฟเวอร์
  const dayStart = sofiaDateTimeToUTC(dateStr, "00:00");
  if (isNaN(dayStart.getTime())) return [];
  // +36 ชม. จากเที่ยงคืนย่อมตกกลางวันของวันถัดไปเสมอ (แม้วันสลับ DST ที่ยาว/สั้น 1 ชม.)
  // → เอา date key ของวันถัดไป แล้วค่อยหาเที่ยงคืนของมัน
  const nextDayKey = sofiaDateKey(new Date(dayStart.getTime() + 36 * 3_600_000));
  const dayEnd = sofiaDateTimeToUTC(nextDayKey, "00:00");

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

  for (let m = OPEN_MINUTES; m <= LAST_SLOT_MINUTES; m += SLOT_STEP_MINUTES) {
    const time = toHHMM(m);
    const start = sofiaDateTimeToUTC(dateStr, time);
    const end = new Date(start.getTime() + service.durationMinutes * 60_000);

    const fitsWithinHours = m + service.durationMinutes <= CLOSE_MINUTES;
    const inFuture = start.getTime() > now.getTime();

    // เรียงตามลำดับที่ลูกค้าควรได้ยินก่อน: เลยเวลา → ไม่ทันปิดร้าน → คิวเต็ม
    let reason: SlotUnavailableReason | undefined;
    if (!inFuture) reason = "past";
    else if (!fitsWithinHours) reason = "hours";
    else if (activeTherapists === 0) reason = "full";
    else {
      const overlap = dayBookings.filter(
        (b) => b.bookingTime < end && b.endTime > start
      ).length;
      if (overlap >= activeTherapists) reason = "full";
    }

    results.push(reason ? { time, available: false, reason } : { time, available: true });
  }

  return results;
}
