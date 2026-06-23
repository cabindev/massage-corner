"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { overlapWhere } from "@/lib/availability";
import { requireAdminAction } from "@/lib/auth";

export type MoveResult = { ok: true } | { ok: false; message: string };
class MoveError extends Error {}

/**
 * ย้าย/เปลี่ยนเวลาคิว (ลากบนปฏิทินรายสัปดาห์)
 * - คงระยะเวลาเดิม คำนวณ endTime ใหม่จากเวลาเริ่มใหม่
 * - เช็ก capacity (ไม่นับตัวเอง) + ถ้ามีหมอ เช็กว่าหมอไม่ติดคิวอื่น
 */
export async function moveBooking(
  id: string,
  newStartISO: string,
  newTherapistId: string | null
): Promise<MoveResult> {
  if (!id?.trim() || !newStartISO) return { ok: false, message: "Invalid data" };
  const newStart = new Date(newStartISO);
  if (isNaN(newStart.getTime()))
    return { ok: false, message: "Invalid date/time" };
  const tid = newTherapistId?.trim() || null;

  try {
    await requireAdminAction();

    await prisma.$transaction(
      async (tx) => {
        const b = await tx.booking.findUnique({
          where: { id },
          select: { bookingTime: true, endTime: true },
        });
        if (!b) throw new MoveError("Booking not found.");

        const duration = b.endTime.getTime() - b.bookingTime.getTime();
        const newEnd = new Date(newStart.getTime() + duration);

        const activeTherapists = await tx.therapist.count({
          where: { isActive: true },
        });
        const overlap = await tx.booking.count({
          where: { id: { not: id }, ...overlapWhere(newStart, newEnd) },
        });
        if (overlap >= activeTherapists)
          throw new MoveError("That time is fully booked.");

        if (tid) {
          const th = await tx.therapist.findUnique({
            where: { id: tid },
            select: { isActive: true },
          });
          if (!th || !th.isActive)
            throw new MoveError("That therapist is unavailable.");
          const clash = await tx.booking.count({
            where: {
              id: { not: id },
              therapistId: tid,
              status: { in: ["PENDING", "CONFIRMED"] },
              bookingTime: { lt: newEnd },
              endTime: { gt: newStart },
            },
          });
          if (clash > 0)
            throw new MoveError("That therapist is busy at this time.");
        }

        await tx.booking.update({
          where: { id },
          data: { bookingTime: newStart, endTime: newEnd, therapistId: tid },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );

    revalidatePath("/admin/schedule");
    revalidatePath("/admin");
    revalidatePath("/admin/bookings");
    return { ok: true };
  } catch (err) {
    if (err instanceof MoveError) return { ok: false, message: err.message };
    if (err instanceof Error && err.message === "UNAUTHORIZED")
      return { ok: false, message: "Not authorized. Please sign in." };
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2034"
    )
      return { ok: false, message: "Busy right now — please try again." };
    console.error("[moveBooking]", err);
    return { ok: false, message: "Could not move the booking." };
  }
}
