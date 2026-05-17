"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminManageCard from "@/components/admin/AdminManageCard";

const INIT = {
  stations: [
    { id: "CENTDEL-F-A", name: "Pacol Carolina Station", type: "Jeep Station", latitude: "13.6218", longitude: "123.1945" },
    { id: "CENTDEL-F-B", name: "Centro Station", type: "Jeep Station", latitude: "13.6315", longitude: "123.1978" },
    { id: "CENTDEL-F-C", name: "SM Naga Station", type: "Tricycle Station", latitude: "13.6325", longitude: "123.1867" },
    { id: "CENTDEL-F-D", name: "Concepcion Grande", type: "E-Jeep Station", latitude: "13.6150", longitude: "123.2100" },
  ],
  routes: [
    { id: "CENTDEL-F-A", name: "Centro - Francia - Del Rosario - A", transportMode: "Jeepney", stationId: "Centro" },
    { id: "CENTULLI-F-A", name: "Centro - Ullian - Francia - A", transportMode: "Jeepney", stationId: "Centro" },
    { id: "CENTDEL-F-B", name: "Centro - Francia - Del Rosario - B", transportMode: "Jeepney", stationId: "Centro" },
    { id: "CENTDEL-T-A", name: "Centro - Tricycle Route A", transportMode: "Tricycle", stationId: "Centro" },
  ],
  fareMatrix: [
    { id: "FM-001", transportMode: "Jeepney", baseFare: "14.00", baseKm: "4", incrementalCost: "1.50", effectiveDate: "2024-01-01" },
    { id: "FM-002", transportMode: "Tricycle", baseFare: "15.00", baseKm: "2", incrementalCost: "2.00", effectiveDate: "2024-01-01" },
    { id: "FM-003", transportMode: "E-Jeep", baseFare: "16.00", baseKm: "4", incrementalCost: "1.80", effectiveDate: "2024-01-01" },
  ],
  transportTypes: [
    { id: "TT-001", name: "Jeepney", rate: "1.50", description: "Traditional jeepney route" },
    { id: "TT-002", name: "Tricycle", rate: "2.00", description: "Short-distance tricycle" },
    { id: "TT-003", name: "E-Jeep", rate: "1.80", description: "Electric jeepney" },
  ],
};

const SECTIONS = {
  stations: {
    label: "Stations",
    singular: "Station",
    fields: [
      { key: "id", label: "Station_ID", placeholder: "CENTDEL-F-A" },
      { key: "name", label: "Name", placeholder: "Station Name" },
      { key: "type", label: "Type", placeholder: "Jeep Station" },
      { key: "latitude", label: "Latitude", placeholder: "13.6218" },
      { key: "longitude", label: "Longitude", placeholder: "123.1945" },
    ],
  },
  routes: {
    label: "Routes",
    singular: "Route",
    fields: [
      { key: "id", label: "Route_ID", placeholder: "CENTDEL-F-A" },
      { key: "name", label: "Name", placeholder: "Route Name" },
      { key: "transportMode", label: "Transport Mode", placeholder: "Jeepney" },
      { key: "stationId", label: "Station_ID", placeholder: "Centro" },
    ],
  },
  fareMatrix: {
    label: "Fare Matrix",
    singular: "Fare",
    fields: [
      { key: "id", label: "Fare_ID", placeholder: "FM-001" },
      { key: "transportMode", label: "Transport Mode", placeholder: "Jeepney" },
      { key: "baseFare", label: "Base Fare (₱)", placeholder: "14.00" },
      { key: "baseKm", label: "Base KM", placeholder: "4" },
      { key: "incrementalCost", label: "Incremental Cost", placeholder: "1.50" },
      { key: "effectiveDate", label: "Effective Date", placeholder: "2024-01-01" },
    ],
  },
  transportTypes: {
    label: "Transport Types",
    singular: "Transport Type",
    fields: [
      { key: "id", label: "Type_ID", placeholder: "TT-001" },
      { key: "name", label: "Name", placeholder: "Jeepney" },
      { key: "rate", label: "Rate (₱/km)", placeholder: "1.50" },
      { key: "description", label: "Description", placeholder: "Description" },
    ],
  },
};

export default function AdminPage() {
  const router = useRouter();
  const [authUser, setAuthUser] = useState("Admin");
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  const [data, setData] = useState({ ...INIT });

  const [filterText, setFilterText] = useState("");
  const [filterType, setFilterType] = useState("");
  const [showFilter, setShowFilter] = useState(false);

  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleteMode, setDeleteMode] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    const raw = localStorage.getItem("auth");
    if (!raw) { router.push("/login"); return; }
    const auth = JSON.parse(raw);
    if (auth.role !== "admin") { router.push("/login"); return; }
    setAuthUser(auth.username || "Admin");
  }, [router]);

  const sectionList = activeSection ? data[activeSection] : [];
  const cfg = activeSection ? SECTIONS[activeSection] : null;

  const filtered = sectionList.filter((item) =>
    (!filterText || Object.values(item).some(v => String(v).toLowerCase().includes(filterText.toLowerCase()))) &&
    (!filterType || item.type === filterType || item.transportMode === filterType || item.name === filterType)
  );

  const updateSection = (key, arr) => setData(p => ({ ...p, [key]: arr }));

  const handleLogout = () => { localStorage.removeItem("auth"); router.push("/login"); };

  const selectSection = (key) => {
    setActiveSection(key); setFilterText(""); setFilterType("");
    setShowFilter(false); setDeleteMode(false); setPendingDelete(null); setMenuOpen(false);
  };

  const confirmDelete = () => {
    updateSection(activeSection, sectionList.filter(i => i.id !== pendingDelete.id));
    setPendingDelete(null); setDeleteMode(false);
  };

  const openEdit = (item) => {
    setIsAdding(false); setEditingId(item.id); setFormData({ ...item }); setShowModal(true);
  };
  const openAdd = () => {
    const empty = {}; cfg.fields.forEach(f => empty[f.key] = "");
    setIsAdding(true); setEditingId(null); setFormData(empty); setShowModal(true);
  };
  const saveForm = () => {
    if (isAdding) updateSection(activeSection, [...sectionList, { ...formData }]);
    else updateSection(activeSection, sectionList.map(i => i.id === editingId ? { ...formData } : i));
    setShowModal(false);
  };

  const typeOptions = activeSection
    ? [...new Set(sectionList.map(i => i.type || i.transportMode || i.name).filter(Boolean))]
    : [];

  return (
    <div className="min-h-screen bg-[#eef4ee] font-jost">


      <AdminHeader setMenuOpen={setMenuOpen} />


      <AdminSidebar
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        SECTIONS={SECTIONS}
        activeSection={activeSection}
        selectSection={selectSection}
        handleLogout={handleLogout}
      />

      <div className="max-w-md mx-auto px-4 pt-4 pb-12">


        <AdminManageCard
          SECTIONS={SECTIONS}
          activeSection={activeSection}
          selectSection={selectSection}
        />


        {!activeSection && (
          <div className="text-center py-20 text-gray-400">
            <p className="text-4xl mb-3">🗂️</p>
            <p className="text-sm font-medium">Select a section above to manage</p>
          </div>
        )}


        {activeSection && cfg && (
          <div>

            <div className="bg-white rounded-2xl px-4 py-3 mb-3 flex items-center gap-2 shadow-sm">
              <span className="font-bold text-[#0F3D35] text-sm flex-1">{cfg.label}</span>
              <button onClick={() => { setShowFilter(!showFilter); setFilterText(""); setFilterType(""); }}
                className="flex items-center gap-1 text-[11px] font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
                </svg>
                Filter
              </button>
              <button onClick={() => { setDeleteMode(!deleteMode); setPendingDelete(null); }}
                className={`flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-colors ${deleteMode ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
                </svg>
                Delete
              </button>
            </div>


            {showFilter && (
              <div className="flex gap-2 mb-3 animate-fadeIn">
                <div className="relative flex-1">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  <input id="filter-input" type="text" placeholder="Search..." value={filterText}
                    onChange={e => setFilterText(e.target.value)}
                    className="w-full bg-white border border-gray-200 focus:border-[#0F3D35] rounded-xl py-2.5 pl-9 pr-3 text-[12px] outline-none transition-colors shadow-sm" />
                </div>
                <select value={filterType} onChange={e => setFilterType(e.target.value)}
                  className="bg-white border border-gray-200 focus:border-[#0F3D35] rounded-xl px-3 py-2.5 text-[12px] font-semibold text-gray-600 outline-none shadow-sm cursor-pointer">
                  <option value="">Type ▾</option>
                  {typeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            )}


            {deleteMode && !pendingDelete && (
              <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 mb-3 flex items-center gap-3 animate-fadeIn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#CC553D" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p className="text-[12px] text-red-700 font-medium flex-1">Click the delete icon on a card to remove it.</p>
                <button onClick={() => setDeleteMode(false)} className="text-[11px] text-red-500 font-bold hover:text-red-700">Cancel</button>
              </div>
            )}


            {pendingDelete && (
              <div className="bg-white border border-gray-200 rounded-2xl px-4 py-4 mb-3 shadow-md animate-fadeIn">
                <p className="text-[13px] font-bold text-gray-800 mb-1">Are you sure you want to Delete?</p>
                <p className="text-[11px] text-gray-500 mb-4">{pendingDelete.name || pendingDelete.id}</p>
                <div className="flex gap-2">
                  <button onClick={() => { setPendingDelete(null); setDeleteMode(false); }}
                    className="flex-1 py-2 rounded-xl border-2 border-gray-200 text-[12px] font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                  <button onClick={confirmDelete}
                    className="flex-1 py-2 rounded-xl bg-[#CC553D] text-white text-[12px] font-bold hover:bg-[#b84732] transition-colors">
                    Yes, Delete
                  </button>
                </div>
              </div>
            )}


            <button onClick={openAdd}
              className="w-full mb-3 py-2.5 rounded-xl border-2 border-dashed border-[#0F3D35]/30 text-[12px] font-semibold text-[#0F3D35]/60 hover:bg-[#0F3D35]/5 hover:border-[#0F3D35]/50 transition-all flex items-center justify-center gap-2">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add {cfg.singular}
            </button>


            {filtered.length === 0
              ? <p className="text-center text-sm text-gray-400 py-10">No records found.</p>
              : filtered.map(item => (
                <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4 mb-3">
                  <div className="space-y-[3px] mb-3">
                    {cfg.fields.map(f => (
                      <div key={f.key} className="flex text-[12px] leading-[1.6]">
                        <span className="font-bold text-gray-800 w-[110px] shrink-0">{f.label}:</span>
                        <span className="text-gray-600">{item[f.key]}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end gap-2">
                    {deleteMode && (
                      <button onClick={() => setPendingDelete(item)}
                        className="flex items-center gap-1.5 bg-red-50 text-red-500 border border-red-200 text-[11px] font-semibold px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                          <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
                        </svg>
                        Delete
                      </button>
                    )}
                    <button onClick={() => openEdit(item)}
                      className="flex items-center gap-1.5 bg-[#CC553D] text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg hover:bg-[#b84732] transition-colors">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                      Edit {cfg.singular}
                    </button>
                  </div>
                </div>
              ))
            }
          </div>
        )}
      </div>


      {showModal && cfg && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl px-6 py-6 w-full max-w-sm max-h-[90vh] overflow-y-auto animate-fadeIn">
            <h3 className="font-bold text-[#0F3D35] text-base mb-5">
              {isAdding ? `Add ${cfg.singular}` : `Edit ${cfg.singular}`}
            </h3>
            {cfg.fields.map(f => (
              <div key={f.key} className="mb-3">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{f.label}</label>
                <input id={`field-${f.key}`} type="text" placeholder={f.placeholder}
                  value={formData[f.key] || ""}
                  onChange={e => setFormData(p => ({ ...p, [f.key]: e.target.value }))}
                  disabled={!isAdding && f.key === "id"}
                  className="w-full bg-[#f7faf7] border-2 border-gray-100 focus:border-[#0F3D35] rounded-xl px-4 py-2.5 text-[13px] outline-none transition-colors disabled:opacity-40" />
              </div>
            ))}
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-[13px] font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={saveForm}
                className="flex-1 py-3 rounded-xl bg-[#0F3D35] text-white text-[13px] font-bold hover:bg-[#1a4f46] transition-colors">
                {isAdding ? "Add" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
