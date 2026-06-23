"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { overlapWhere } from "@/lib/availability";
import { requireAdminAction } from "@/lib/auth";

export type WalkinInput = {
  serviceId: string;
  customerName: string;
  phone?: string;
  dateTime: string; // ISO
  therapistId?: string | null;
};

export type WalkinResult =
  | { ok: true; bookingId: string }
  | { ok: false; message: string };

class WalkinError extends Error {}

/**
 * สร้างคิว walk-in จากหน้าแอดมิน (คลิก slot ว่างในปฏิทิน)
 * - คำนวณ endTime จากระยะเวลาบริการ
 * - เช็ก capacity (overlap < หมอ active) ใน transaction Serializable
 * - ถ้าระบุหมอ เช็กว่าหมอไม่ติดคิวอื่นที่ทับเวลากัน
 * - บันทึกเป็น CONFIRMED (ลูกค้ามาที่ร้านแล้ว)
 */
export async function createWalkin(input: WalkinInput): Promise<WalkinResult> {
  const serviceId = input.serviceId?.trim();
  const customerName = input.customerName?.trim();
  const phone = input.phone?.trim() || "walk-in";
  const therapistId = input.therapistId?.trim() || null;

  if (!serviceId || !customerName || !input.dateTime) {
    return { ok: false, message: "Please fill in service and customer name." };
  }
  const start = new Date(input.dateTime);
  if (isNaN(start.getTime())) {
    return { ok: false, message: "Invalid date/time." };
  }

  try {
    await requireAdminAction();

    const bookingId = await prisma.$transaction(
      async (tx) => {
        const service = await tx.service.findUnique({
          where: { id: serviceId },
          select: { durationMinutes: true, isActive: true },
        });
        if (!service || !service.isActive)
          throw new WalkinError("Service not found or inactive.");

        const end = new Date(
          start.getTime() + service.durationMinutes * 60_000
        );

        const activeTherapists = await tx.therapist.count({
          where: { isActive: true },
        });
        if (activeTherapists === 0)
          throw new WalkinError("No active therapists.");

        const overlapping = await tx.booking.count({
          where: overlapWhere(start, end),
        });
        if (overlapping >= activeTherapists)
          throw new WalkinError("This time slot is fully booked.");

        if (therapistId) {
          const th = await tx.therapist.findUnique({
            where: { id: therapistId },
            select: { isActive: true },
          });
          if (!th || !th.isActive)
            throw new WalkinError("Selected therapist is unavailable.");
          const clash = await tx.booking.count({
            where: {
              therapistId,
              status: { in: ["PENDING", "CONFIRMED"] },
              bookingTime: { lt: end },
              endTime: { gt: start },
            },
          });
          if (clash > 0)
            throw new WalkinError(
              "That therapist is already booked at this time."
            );
        }

        const b = await tx.booking.create({
          data: {
            serviceId,
            customerName: customerName.slice(0, 120),
            phone: phone.slice(0, 30),
            bookingTime: start,
            endTime: end,
            status: "CONFIRMED",
            therapistId,
            notes: "Walk-in",
          },
          select: { id: true },
        });
        return b.id;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );

    revalidatePath("/admin");
    revalidatePath("/admin/bookings");
    return { ok: true, bookingId };
  } catch (err) {
    if (err instanceof WalkinError) return { ok: false, message: err.message };
    if (err instanceof Error && err.message === "UNAUTHORIZED")
      return { ok: false, message: "Not authorized. Please sign in." };
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2034"
    )
      return { ok: false, message: "Busy right now — please try again." };
    console.error("[createWalkin]", err);
    return { ok: false, message: "Could not create the booking." };
  }
}
