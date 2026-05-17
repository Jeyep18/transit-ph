import ManageCard from "@/components/admin/ManageCard";

export default function TransportTypesPage() {
  return (
    <div className="pt-2">
      <ManageCard />

      <div className="rounded-2xl overflow-hidden shadow-md">
        <div className="bg-[#0D3B3B] px-4 py-3">
          <h2 className="text-white font-bold text-base">Transport Types</h2>
        </div>

        <div className="bg-[#EDEAE4] p-3 rounded-b-2xl">
          {/* Jeepney — only active mode (BR-TM-02) */}
          <div className="bg-white rounded-2xl p-4 border border-[#0D3B3B] ring-1 ring-[#0D3B3B]/20 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <span className="inline-block bg-[#0D3B3B] text-white text-[10px] font-bold px-2 py-0.5 rounded-full mb-2 uppercase tracking-wider">
                  Active
                </span>
                <p className="font-bold text-[#0D3B3B] text-sm">Jeepney</p>
                <p className="text-xs text-gray-400 mt-0.5">Code: JEP</p>
              </div>
              <span className="text-3xl">🚌</span>
            </div>
          </div>

          {/* Scope note */}
          <div className="mt-3 bg-white rounded-2xl p-4 border border-[#E0DDD8]">
            <p className="text-xs text-gray-500 leading-relaxed">
              <strong className="text-[#0D3B3B]">Note:</strong> Per system
              business rules (BR-TM-02), only the Jeepney transport mode is
              within scope for this application. Bus and UV Express are not
              supported. Tricycle routes are represented as station types, not
              transport modes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
