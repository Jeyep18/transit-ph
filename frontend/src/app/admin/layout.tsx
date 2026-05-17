"use client";
import { usePathname } from "next/navigation";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import AdminHeader from "@/components/admin/AdminHeader";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";

  // Don't apply auth guard or layout chrome to login page
  if (isLoginPage) return <>{children}</>;

  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { admin, loading } = useAdminAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EDEAE4] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#0D3B3B] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EDEAE4]">
      <AdminHeader admin={admin} />
      <main className="max-w-md mx-auto px-4 py-4">{children}</main>
    </div>
  );
}
