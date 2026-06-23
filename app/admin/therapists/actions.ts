"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdminAction } from "@/lib/auth";

export type ActionResult = { ok: true } | { ok: false; message: string };

function revalidateAll() {
  revalidatePath("/admin/therapists");
  revalidatePath("/admin");
  revalidatePath("/admin/bookings");
}

function cleanName(name: string) {
  return name.trim().replace(/\s+/g, " ").slice(0, 80);
}

/** เพิ่มหมอนวดใหม่ */
export async function createTherapist(
  name: string,
  bio?: string
): Promise<ActionResult> {
  const n = cleanName(name ?? "");
  if (n.length < 2) return { ok: false, message: "Please enter a valid name" };
  try {
    await requireAdminAction();
    await prisma.therapist.create({
      data: { name: n, bio: bio?.trim().slice(0, 300) || null },
    });
    revalidateAll();
    return { ok: true };
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED")
      return { ok: false, message: "Not authorized. Please sign in." };
    console.error("[createTherapist]", err);
    return { ok: false, message: "Could not add therapist" };
  }
}

/** เปลี่ยนชื่อหมอนวด */
export async function renameTherapist(
  id: string,
  name: string
): Promise<ActionResult> {
  const n = cleanName(name ?? "");
  if (!id?.trim() || n.length < 2)
    return { ok: false, message: "Invalid data" };
  try {
    await requireAdminAction();
    await prisma.therapist.update({ where: { id }, data: { name: n } });
    revalidateAll();
    return { ok: true };
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED")
      return { ok: false, message: "Not authorized. Please sign in." };
    console.error("[renameTherapist]", err);
    return { ok: false, message: "Could not rename therapist" };
  }
}

/** เปิด/ปิดการรับงาน (soft) */
export async function setTherapistActive(
  id: string,
  isActive: boolean
): Promise<ActionResult> {
  if (!id?.trim()) return { ok: false, message: "Invalid data" };
  try {
    await requireAdminAction();
    await prisma.therapist.update({ where: { id }, data: { isActive } });
    revalidateAll();
    return { ok: true };
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED")
      return { ok: false, message: "Not authorized. Please sign in." };
    console.error("[setTherapistActive]", err);
    return { ok: false, message: "Could not update therapist" };
  }
}

/** ลบหมอนวด (คิวที่ผูกไว้จะกลายเป็น "ยังไม่จัด" อัตโนมัติ) */
export async function deleteTherapist(id: string): Promise<ActionResult> {
  if (!id?.trim()) return { ok: false, message: "Invalid data" };
  try {
    await requireAdminAction();
    await prisma.therapist.delete({ where: { id } });
    revalidateAll();
    return { ok: true };
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED")
      return { ok: false, message: "Not authorized. Please sign in." };
    console.error("[deleteTherapist]", err);
    return { ok: false, message: "Could not delete therapist" };
  }
}
