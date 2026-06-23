import type { Metadata } from "next";
import AdminSidebar from "@/components/AdminSidebar";
import { requireAdminPage } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Admin | Massage Corner Sofia",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ต้องล็อกอินเป็น ADMIN/STAFF ก่อนเข้าหน้าหลังบ้านทุกหน้า
  const session = await requireAdminPage();

  return (
    <div className="flex min-h-screen flex-col bg-cream md:flex-row">
      <AdminSidebar userName={session.user.name ?? session.user.email} />
      <main className="flex-1 px-4 py-6 sm:px-8 sm:py-8">{children}</main>
    </div>
  );
}
