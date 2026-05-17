import ManageCard from "@/components/admin/ManageCard";

export default function AdminDashboard() {
  return (
    <div className="pt-2">
      <ManageCard />

      {/* Optional: summary info */}
      <div className="mt-4 bg-white rounded-2xl p-5 shadow-sm border border-[#E0DDD8]">
        <h3 className="font-bold text-[#0D3B3B] text-sm mb-3">
          System Overview
        </h3>
        <p className="text-sm text-gray-500 leading-relaxed">
          Use the Manage panel above to add and update stations, define routes,
          set fare matrices, and review transport types. All changes take effect
          immediately on the public-facing map.
        </p>
      </div>
    </div>
  );
}
