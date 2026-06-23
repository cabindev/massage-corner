"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ACTIVE_BOOKING_STATUSES, overlapWhere } from "@/lib/availability";
import { requireAdminAction } from "@/lib/auth";
import type { BookingStatusValue } from "@/lib/admin-data";

export type ActionResult = { ok: true } | { ok: false; message: string };

/** ข้อมูลฟอร์มเพิ่ม/แก้ไข booking */
export type BookingFormInput = {
  serviceId: string;
  customerName: string;
  phone?: string;
  dateTime: string; // ISO
  therapistId?: string | null;
  notes?: string;
};

class BookingFormError extends Error {}

function revalidateAll() {
  revalidatePath("/admin");
  revalidatePath("/admin/bookings");
  revalidatePath("/admin/schedule");
}

/** ตรวจ + เช็ก capacity + clash ภายใน transaction (ใช้ร่วมกันทั้ง create/update) */
async function assertSlotAndCompute(
  tx: Prisma.TransactionClient,
  serviceId: string,
  start: Date,
  therapistId: string | null,
  excludeBookingId: string | null
): Promise<Date> {
  const service = await tx.service.findUnique({
    where: { id: serviceId },
    select: { durationMinutes: true, isActive: true },
  });
  if (!service || !service.isActive)
    throw new BookingFormError("Service not found or inactive.");

  const end = new Date(start.getTime() + service.durationMinutes * 60_000);

  const activeTherapists = await tx.therapist.count({
    where: { isActive: true },
  });
  if (activeTherapists === 0)
    throw new BookingFormError("No active therapists.");

  const overlap = await tx.booking.count({
    where: excludeBookingId
      ? { id: { not: excludeBookingId }, ...overlapWhere(start, end) }
      : overlapWhere(start, end),
  });
  if (overlap >= activeTherapists)
    throw new BookingFormError("That time slot is fully booked.");

  if (therapistId) {
    const th = await tx.therapist.findUnique({
      where: { id: therapistId },
      select: { isActive: true },
    });
    if (!th || !th.isActive)
      throw new BookingFormError("That therapist is unavailable.");
    const clash = await tx.booking.count({
      where: {
        ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
        therapistId,
        status: { in: [...ACTIVE_BOOKING_STATUSES] },
        bookingTime: { lt: end },
        endTime: { gt: start },
      },
    });
    if (clash > 0)
      throw new BookingFormError("That therapist is busy at this time.");
  }
  return end;
}

function parseForm(input: BookingFormInput) {
  const serviceId = input.serviceId?.trim();
  const customerName = input.customerName?.trim();
  const phone = input.phone?.trim() || "—";
  const therapistId = input.therapistId?.trim() || null;
  const notes = input.notes?.trim() || null;
  if (!serviceId || !customerName || !input.dateTime)
    throw new BookingFormError("Please fill in service, name and time.");
  const start = new Date(input.dateTime);
  if (isNaN(start.getTime())) throw new BookingFormError("Invalid date/time.");
  return { serviceId, customerName, phone, therapistId, notes, start };
}

function formError(err: unknown, ctx: string): { ok: false; message: string } {
  if (err instanceof BookingFormError) return { ok: false, message: err.message };
  if (err instanceof Error && err.message === "UNAUTHORIZED")
    return { ok: false, message: "Not authorized. Please sign in." };
  if (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === "P2034"
  )
    return { ok: false, message: "Busy right now — please try again." };
  console.error(`[${ctx}]`, err);
  return { ok: false, message: "Something went wrong. Please try again." };
}

/** เพิ่ม booking ใหม่จากแอดมิน (สถานะ CONFIRMED) */
export async function createBookingAdmin(
  input: BookingFormInput
): Promise<ActionResult> {
  try {
    await requireAdminAction();
    const f = parseForm(input);
    await prisma.$transaction(
      async (tx) => {
        const end = await assertSlotAndCompute(
          tx,
          f.serviceId,
          f.start,
          f.therapistId,
          null
        );
        await tx.booking.create({
          data: {
            serviceId: f.serviceId,
            customerName: f.customerName.slice(0, 120),
            phone: f.phone.slice(0, 30),
            bookingTime: f.start,
            endTime: end,
            status: "CONFIRMED",
            therapistId: f.therapistId,
            notes: f.notes ? f.notes.slice(0, 1000) : null,
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );
    revalidateAll();
    return { ok: true };
  } catch (err) {
    return formError(err, "createBookingAdmin");
  }
}

/** แก้ไข booking ที่มีอยู่ */
export async function updateBooking(
  id: string,
  input: BookingFormInput
): Promise<ActionResult> {
  if (!id?.trim()) return { ok: false, message: "Invalid data" };
  try {
    await requireAdminAction();
    const f = parseForm(input);
    await prisma.$transaction(
      async (tx) => {
        const existing = await tx.booking.findUnique({
          where: { id },
          select: { id: true },
        });
        if (!existing) throw new BookingFormError("Booking not found.");
        const end = await assertSlotAndCompute(
          tx,
          f.serviceId,
          f.start,
          f.therapistId,
          id
        );
        await tx.booking.update({
          where: { id },
          data: {
            serviceId: f.serviceId,
            customerName: f.customerName.slice(0, 120),
            phone: f.phone.slice(0, 30),
            bookingTime: f.start,
            endTime: end,
            therapistId: f.therapistId,
            notes: f.notes ? f.notes.slice(0, 1000) : null,
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );
    revalidateAll();
    return { ok: true };
  } catch (err) {
    return formError(err, "updateBooking");
  }
}

/** ลบ booking */
export async function deleteBooking(id: string): Promise<ActionResult> {
  if (!id?.trim()) return { ok: false, message: "Invalid data" };
  try {
    await requireAdminAction();
    await prisma.booking.delete({ where: { id } });
    revalidateAll();
    return { ok: true };
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED")
      return { ok: false, message: "Not authorized. Please sign in." };
    console.error("[deleteBooking]", err);
    return { ok: false, message: "Could not delete booking." };
  }
}

const VALID_STATUSES: BookingStatusValue[] = [
  "PENDING",
  "CONFIRMED",
  "REJECTED",
  "COMPLETED",
  "CANCELLED",
];

function revalidateAdmin() {
  revalidatePath("/admin");
  revalidatePath("/admin/bookings");
}

/**
 * เปลี่ยนสถานะการจอง (ยืนยัน / ปฏิเสธ / ปิดงาน / ยกเลิก / คืนค่ารอยืนยัน)
 */
export async function updateBookingStatus(
  id: string,
  status: BookingStatusValue
): Promise<ActionResult> {
  if (!id?.trim() || !VALID_STATUSES.includes(status)) {
    return { ok: false, message: "Invalid data" };
  }

  try {
    await requireAdminAction();
    const booking = await prisma.booking.findUnique({
      where: { id },
      select: { id: true, therapistId: true },
    });
    if (!booking) return { ok: false, message: "Booking not found" };

    // ยืนยัน/ปิดงาน ควรมีหมอก่อน
    if (
      (status === "CONFIRMED" || status === "COMPLETED") &&
      !booking.therapistId
    ) {
      return {
        ok: false,
        message: "Please assign a therapist before confirming or completing.",
      };
    }

    await prisma.booking.update({ where: { id }, data: { status } });
    revalidateAdmin();
    return { ok: true };
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return { ok: false, message: "Not authorized. Please sign in." };
    }
    console.error("[updateBookingStatus]", err);
    return { ok: false, message: "Failed to update status" };
  }
}

/**
 * จัดหมอนวดให้การจอง (therapistId = "" หรือ null = เอาหมอออก)
 * เช็กว่าหมอ active และไม่ติดคิวอื่นที่ทับช่วงเวลากัน
 * TODO(เฟส 5): ครอบด้วย requireAdmin()
 */
export async function assignTherapist(
  bookingId: string,
  therapistId: string | null
): Promise<ActionResult> {
  if (!bookingId?.trim()) return { ok: false, message: "Invalid data" };
  const targetId = therapistId?.trim() || null;

  try {
    await requireAdminAction();

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { id: true, bookingTime: true, endTime: true },
    });
    if (!booking) return { ok: false, message: "Booking not found" };

    if (targetId) {
      const therapist = await prisma.therapist.findUnique({
        where: { id: targetId },
        select: { isActive: true },
      });
      if (!therapist || !therapist.isActive) {
        return { ok: false, message: "This therapist is unavailable" };
      }

      // หมอคนนี้ติดคิวอื่นที่เวลาทับกันหรือไม่ (ไม่นับรายการนี้เอง)
      const clash = await prisma.booking.count({
        where: {
          id: { not: bookingId },
          therapistId: targetId,
          status: { in: [...ACTIVE_BOOKING_STATUSES] },
          bookingTime: { lt: booking.endTime },
          endTime: { gt: booking.bookingTime },
        },
      });
      if (clash > 0) {
        return {
          ok: false,
          message: "This therapist is already booked at this time",
        };
      }
    }

    await prisma.booking.update({
      where: { id: bookingId },
      data: { therapistId: targetId },
    });
    revalidateAdmin();
    return { ok: true };
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return { ok: false, message: "Not authorized. Please sign in." };
    }
    console.error("[assignTherapist]", err);
    return { ok: false, message: "Failed to assign therapist" };
  }
}
