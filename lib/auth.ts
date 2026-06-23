import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import authOptions from "@/lib/auth-options";

/** อ่าน session ปัจจุบัน (server side) */
export function getSession() {
  return getServerSession(authOptions);
}

/**
 * บังคับว่าต้องเป็น ADMIN หรือ STAFF — ใช้ใน Server Component (เช่น admin layout)
 * ถ้าไม่ล็อกอิน/สิทธิ์ไม่พอ จะ redirect ไปหน้า signin
 */
export async function requireAdminPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "STAFF")) {
    redirect("/auth/signin");
  }
  return session;
}

/**
 * บังคับสิทธิ์ใน Server Action — โยน error ถ้าไม่ผ่าน (action จับแล้วคืนข้อความ)
 * ป้องกันการเรียก action ตรง ๆ ผ่าน POST โดยไม่ผ่าน UI
 */
export async function requireAdminAction() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "STAFF")) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}
