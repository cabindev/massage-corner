"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  overlapWhere,
  getDayAvailability,
  type SlotInfo,
} from "@/lib/availability";

/** ข้อมูลที่ฟอร์มส่งเข้ามา */
export type BookingInput = {
  serviceId: string;
  customerName: string;
  phone: string;
  bookingTime: string; // ISO string (วัน+เวลาที่ลูกค้าเลือก)
  notes?: string;
};

/** ผลลัพธ์ที่ส่งกลับให้ฟอร์ม */
export type BookingResult =
  | { ok: true; bookingId: string }
  | { ok: false; message: string };

/**
 * Server Action: คืน slot ทั้งวันพร้อมสถานะว่าง/เต็ม สำหรับฟอร์มจอง
 * (เรียกจาก client เมื่อผู้ใช้เปลี่ยนวันหรือบริการ)
 */
export async function getAvailability(
  serviceId: string,
  dateStr: string
): Promise<SlotInfo[]> {
  if (!serviceId?.trim() || !dateStr?.trim()) return [];
  return getDayAvailability(serviceId.trim(), dateStr.trim());
}

/**
 * Server Action: สร้างการจอง พร้อมกัน overbook
 * - คำนวณ endTime = bookingTime + ระยะเวลาบริการ
 * - เช็ก capacity (จำนวนคิวที่ทับช่วงเวลากัน ต้องไม่เกินจำนวนหมอที่ active)
 * - ทำใน transaction ระดับ Serializable เพื่อกัน race condition จองชนกันพร้อมกัน
 */
export async function createBooking(
  input: BookingInput
): Promise<BookingResult> {
  // ── 1) ตรวจความครบถ้วน ──────────────────────────────────────────────
  const serviceId = input.serviceId?.trim();
  const customerName = input.customerName?.trim();
  const phone = input.phone?.trim();
  const notes = input.notes?.trim() || null;

  if (!serviceId || !customerName || !phone || !input.bookingTime) {
    return { ok: false, message: "Please fill in all required fields." };
  }

  // ── 2) ตรวจเบอร์โทร ─────────────────────────────────────────────────
  if (!/^[0-9+()\-\s]{6,20}$/.test(phone)) {
    return { ok: false, message: "Invalid phone number format." };
  }

  // ── 3) ตรวจวันเวลา ──────────────────────────────────────────────────
  const startTime = new Date(input.bookingTime);
  if (isNaN(startTime.getTime())) {
    return { ok: false, message: "The selected date or time is invalid." };
  }
  if (startTime.getTime() < Date.now()) {
    return { ok: false, message: "You cannot book a time in the past." };
  }

  try {
    const bookingId = await prisma.$transaction(
      async (tx) => {
        // หาบริการ เพื่อรู้ระยะเวลา → คำนวณ endTime
        const service = await tx.service.findUnique({
          where: { id: serviceId },
          select: { durationMinutes: true, isActive: true },
        });
        if (!service || !service.isActive) {
          throw new BookingError("The selected service was not found or is unavailable.");
        }

        const endTime = new Date(
          startTime.getTime() + service.durationMinutes * 60_000
        );

        // capacity = จำนวนหมอที่ยังรับงาน
        const activeTherapists = await tx.therapist.count({
          where: { isActive: true },
        });
        if (activeTherapists === 0) {
          throw new BookingError(
            "Sorry, no therapist is currently available."
          );
        }

        // นับคิวที่ทับช่วงเวลากัน (ใช้ logic overlap ชุดเดียวกับตอนเช็ก slot ว่าง)
        const overlapping = await tx.booking.count({
          where: overlapWhere(startTime, endTime),
        });
        if (overlapping >= activeTherapists) {
          throw new BookingError(
            "This time slot is fully booked. Please choose another time."
          );
        }

        const booking = await tx.booking.create({
          data: {
            serviceId,
            customerName: customerName.slice(0, 120),
            phone: phone.slice(0, 30),
            bookingTime: startTime,
            endTime,
            notes: notes ? notes.slice(0, 1000) : null,
            // status = PENDING, therapistId = null (แอดมินจัดทีหลัง)
          },
          select: { id: true },
        });
        return booking.id;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );

    return { ok: true, bookingId };
  } catch (err) {
    // ข้อความที่เราตั้งใจส่งให้ผู้ใช้
    if (err instanceof BookingError) {
      return { ok: false, message: err.message };
    }
    // ชนกันระดับ DB (serialization/lock) → ให้ลองใหม่
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      (err.code === "P2034" || err.code === "P2002")
    ) {
      return {
        ok: false,
        message: "Someone is booking the same slot right now. Please try again.",
      };
    }
    console.error("[createBooking]", err);
    return {
      ok: false,
      message: "Could not save your booking. Please try again.",
    };
  }
}

/** ข้อผิดพลาดที่ตั้งใจแสดงข้อความให้ผู้ใช้ (แยกจาก error ระบบ) */
class BookingError extends Error {}
