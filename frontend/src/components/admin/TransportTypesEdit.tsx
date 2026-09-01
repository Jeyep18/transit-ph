"use client";

import { useState } from "react";

type TransportType = {
  id: number;
  transId: string;
  name: string;
  code: string;
};

const initialData: TransportType[] = [
  {
    id: 1,
    transId: "1",
    name: "Jeepney",
    code: "001",
  },
  {
    id: 2,
    transId: "2",
    name: "Tricycle",
    code: "002",
  },
    {
    id: 3,
    transId: "3",
    name: "E-Jeep",
    code: "003",
  },
];

export default function TransportTypesAdmin() {
  const [rows, setRows] = useState(initialData);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editForm, setEditForm] = useState<TransportType | null>(null);
  const [newRow, setNewRow] = useState<TransportType>({
    id: 0,
    transId: "",
    name: "",
  });

  // DELETE MODE
  const toggleDeleteMode = () => {
    setDeleteMode((prev) => !prev);
    if (deleteMode) {
      setSelectedIds([]);
    }
  };

  // DELETE
  const handleDelete = () => {
    setRows((prev) => prev.filter((row) => !selectedIds.includes(row.id)));
    setSelectedIds([]);
    setDeleteMode(false);
  };

  // CHECKBOX
  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // EDIT
  const handleEdit = (row: TransportType) => {
    setEditingId(row.id);
    setEditForm(row);
    setIsAdding(false);
  };

  // SAVE EDIT
  const handleSave = () => {
    if (!editForm) return;
    setRows((prev) => prev.map((row) => (row.id === editForm.id ? editForm : row)));
    setEditingId(null);
    setEditForm(null);
  };

  // ADD NEW ROW
  const handleAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    setDeleteMode(false);
  };

  // SAVE NEW ROW
  const handleSaveNew = () => {
    const newTransport = { ...newRow, id: Date.now() };
    setRows((prev) => [...prev, newTransport]);
    setNewRow({ id: 0, transId: "", name: "", code: ""});
    setIsAdding(false);
  };

  return (
    <div className="min-h-screen bg-neutral-200 flex justify-center p-6">
      <div className="w-[357px] h-[644px] bg-white shadow-md flex flex-col overflow-hidden">

        {/* HEADER */}
        <div className="bg-[#004C56] px-4 py-3 flex items-center justify-between shrink-0">
          <h1 className="text-white font-bold text-lg">Transport Types</h1>

          <div className="flex gap-2">
            {/* ADD BUTTON */}
            <button
              onClick={handleAdd}
              className="bg-[#4B9E7A] hover:bg-[#3f8667] transition text-white text-xs font-semibold px-3 py-1 rounded-lg"
            >
              Add
            </button>

            {/* DELETE BUTTON */}
            <button
              onClick={toggleDeleteMode}
              className="bg-[#D65C41] hover:bg-[#bf4e35] transition text-white text-xs font-semibold px-3 py-1 rounded-lg"
            >
              Delete
            </button>
          </div>
        </div>

        {/* DELETE CONFIRM */}
        {deleteMode && (
          <div className="mx-4 mt-4 bg-white rounded-lg shadow border p-4 shrink-0">
            <p className="text-center text-sm font-semibold text-neutral-700 mb-4">
              Are you sure you want to Delete?
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setDeleteMode(false);
                  setSelectedIds([]);
                }}
                className="flex-1 bg-[#B8C7C7] text-white py-2 rounded-lg text-sm font-semibold hover:bg-orange-500 transition-colors duration-200"
              >
                Cancel
              </button>

              <button
                onClick={handleDelete}
                className="flex-1 bg-[#D7DFDF] text-white py-2 rounded-lg text-sm font-semibold hover:bg-orange-500 transition-colors duration-200"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        )}

        {/* CONTENT — scrollable */}
        <div className="p-4 flex flex-col gap-4 overflow-y-auto flex-1">

          {/* ADD CARD */}
          {isAdding && (
            <div className="border border-[#C7D3D3] p-4 bg-white relative">

              {/* CLOSE */}
              <button
                onClick={() => setIsAdding(false)}
                className="absolute top-3 right-3 text-[#D65C41] font-bold text-lg"
              >
                x
              </button>

              <div className="space-y-2">
                <Field
                  label="Trans_ID:"
                  value={newRow.transId}
                  onChange={(e) => setNewRow({ ...newRow, transId: e.target.value })}
                />
                <Field
                  label="Name:"
                  value={newRow.name}
                  onChange={(e) => setNewRow({ ...newRow, name: e.target.value })}
                />
                <Field
                  label="Code:"
                  value={newRow.code}
                  onChange={(e) => setNewRow({ ...newRow, code: e.target.value })}
                />

                {/* SAVE */}
                <div className="flex justify-end pt-4">
                  <button
                    onClick={handleSaveNew}
                    className="bg-[#D65C41] hover:bg-[#bf4e35] transition text-white px-4 py-2 rounded-lg text-sm font-bold"
                  >
                    SAVE
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ROWS */}
          {rows.map((row) => {
            const isEditing = editingId === row.id;

            return (
              <div
                key={row.id}
                className="border border-[#C7D3D3] p-4 bg-white relative"
              >
                {/* CHECKBOX ONLY IN DELETE MODE */}
                {deleteMode && !isEditing && (
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(row.id)}
                    onChange={() => toggleSelect(row.id)}
                    className="absolute top-3 right-3 w-4 h-4"
                  />
                )}

                {/* EDIT MODE */}
                {isEditing && editForm ? (
                  <div className="space-y-2">

                    {/* CLOSE */}
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setEditForm(null);
                      }}
                      className="absolute top-3 right-3 text-[#D65C41] font-bold text-lg"
                    >
                      x
                    </button>

                    <Field
                      label="Trans_ID:"
                      value={editForm.transId}
                      onChange={(e) => setEditForm({ ...editForm, transId: e.target.value })}
                    />
                    <Field
                      label="Name:"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    />
                    <Field
                      label="Code:"
                      value={editForm.code}
                      onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                    />


                    {/* SAVE */}
                    <div className="flex justify-end pt-4">
                      <button
                        onClick={handleSave}
                        className="bg-[#D65C41] hover:bg-[#bf4e35] transition text-white px-4 py-2 rounded-lg text-sm font-bold"
                      >
                        SAVE
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* VIEW MODE */}
                    <div className="space-y-2 text-sm">
                      <RowItem label="Trans_ID:" value={row.transId} />
                      <RowItem label="Name:" value={row.name} />
                      <RowItem label="Code:" value={row.code} />
                    </div>

                    {/* EDIT BUTTON */}
                    {!deleteMode && (
                      <div className="flex justify-end mt-6">
                        <button
                          onClick={() => handleEdit(row)}
                          className="bg-[#D65C41] hover:bg-[#bf4e35] transition text-white w-20 px-3 py-2 rounded-lg text-xs font-semibold"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* =========================
   DISPLAY ROW
========================= */

function RowItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <p className="font-bold text-[#003F4A] min-w-[70px]">{label}</p>
      <p className="text-[#235B64]">{value}</p>
    </div>
  );
}

/* =========================
   INPUT FIELD
========================= */

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <label className="font-bold text-sm text-[#003F4A] min-w-[80px]">
        {label}
      </label>
      <input
        value={value}
        onChange={onChange}
        className="flex-1 border border-[#C7D3D3] bg-[#DCE5E5] h-6 px-2 text-sm outline-none"
      />
    </div>
  );
}