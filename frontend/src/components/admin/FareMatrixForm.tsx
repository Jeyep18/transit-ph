"use client";

import { useState } from "react";

const initialData = {
  jeep: [
    { id: 1, km: 3 },
    { id: 2, km: 5 },
    { id: 3, km: 8 },
    { id: 4, km: 12 },
  ],
  tricycle: [
    { id: 1, km: 1 },
    { id: 2, km: 2 },
    { id: 3, km: 4 },
    { id: 4, km: 6 },
  ],
  ejeep: [
    { id: 1, km: 2 },
    { id: 2, km: 4 },
    { id: 3, km: 7 },
    { id: 4, km: 10 },
  ],
};

const initialRules = {
  jeep: { baseKm: 5, baseFare: 10, incrementRate: 1 },
  tricycle: { baseKm: 2, baseFare: 15, incrementRate: 2 },
  ejeep: { baseKm: 4, baseFare: 12, incrementRate: 1.5 },
};

export default function FareMatrixForm() {
  // CURRENT VIEW
  const [view, setView] = useState<"jeep" | "tricycle" | "ejeep">("jeep");

  // RULES PER VEHICLE
  const [rules, setRules] = useState(initialRules);

  const [isEditing, setIsEditing] = useState(false);
  const [tempRules, setTempRules] = useState(rules[view]);

  const data = initialData[view];

  // COMPUTE FARE
  const computeFare = (km: number) => {
    const rule = rules[view];
    if (km <= rule.baseKm) return rule.baseFare;

    return (
      rule.baseFare +
      (km - rule.baseKm) * rule.incrementRate
    );
  };

  // EDIT HANDLERS
  const handleEdit = () => {
    setTempRules(rules[view]);
    setIsEditing(true);
  };

  const handleSave = () => {
    setRules((prev) => ({
      ...prev,
      [view]: tempRules,
    }));
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempRules(rules[view]);
    setIsEditing(false);
  };

  return (
    <div className="bg-white flex flex-col h-[619px] w-[357px]">

      <div className="flex justify-between items-center bg-[#003F48] text-white font-bold p-4">
      <h2>Fare Matrix</h2>
        <select
          className="border p-2 w-30 bg-[#003F48] text-white rounded-sm"
          value={view}
          onChange={(e) => {
            const newView = e.target.value as "jeep" | "tricycle" | "ejeep";
            setView(newView);
            setTempRules(rules[newView]);
            setIsEditing(false);
          }}>
          <option value="jeep">Jeep</option>
          <option value="tricycle">Tricycle</option>
          <option value="ejeep">E-Jeep</option>
        </select>
      </div>

      
      {/* RULES TABLE */}
      <div className="p-3">
        <table className="w-full border border-[#003F48]">
          <caption className="text-center font-extrabold text-orange-600 mb-2">
              {view.toUpperCase()} FARE RULES
            </caption>
          <thead className="bg-[#003F48] text-white">
            <tr>
              <th className="p-2">Field</th>
              <th className="p-2">Value</th>
            </tr>
          </thead>

          <tbody>
            {/* BASE KM */}
            <tr className="border-t">
              <td className="p-2">Base KM</td>
              <td className="p-2">
                {isEditing ? (
                  <input
                    type="number"
                    className="border px-2 w-full"
                    value={tempRules.baseKm}
                    onChange={(e) =>
                      setTempRules({
                        ...tempRules,
                        baseKm: Number(e.target.value),
                      })}/>) : (rules[view].baseKm)}
              </td>
            </tr>

            {/* BASE FARE */}
            <tr className="border-t">
              <td className="p-2">Base Fare</td>
              <td className="p-2">
                {isEditing ? (
                  <input
                    type="number"
                    className="border px-2 w-full"
                    value={tempRules.baseFare}
                    onChange={(e) =>
                      setTempRules({
                        ...tempRules,
                        baseFare: Number(e.target.value),
                      })
                    }
                  />
                ) : (
                  `₱ ${rules[view].baseFare}`
                )}
              </td>
            </tr>

            {/* INCREMENT */}
            <tr className="border-t">
              <td className="p-2">Increment / KM</td>
              <td className="p-2">
                {isEditing ? (
                  <input
                    type="number"
                    step={0.5}
                    className="border px-2 w-full"
                    value={tempRules.incrementRate}
                    onChange={(e) =>
                      setTempRules({
                        ...tempRules,
                        incrementRate: Number(e.target.value),
                      })
                    }
                  />
                ) : (
                  rules[view].incrementRate
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* EDIT BUTTONS */}
      <div className="p-4 flex justify-end gap-2">
        {!isEditing ? (
          <button
            onClick={handleEdit}
            className="bg-orange-600 w-25 rounded-sm text-white p-2"
          >
            Edit
          </button>
        ) : (
          <>
            <button onClick={handleSave} className="bg-[#4B9E7A] text-white p-2 rounded-sm">
              Save
            </button>
            <button onClick={handleCancel} className="bg-gray-400 text-white p-2 rounded-sm">
              Cancel
            </button>
          </>
        )}
      </div>

      {/* FARE PREVIEW TABLE */}
      <div className="p-4">
        <table className="w-full border border-[#003F48]">

          <thead className="bg-[#003F48] text-white">
            <tr>
              <th className="p-2">KM</th>
              <th className="p-2">Fare</th>
            </tr>
          </thead>

          <tbody>
            {data.map((row) => {
              const fare = computeFare(row.km);

              return (
                <tr key={row.id} className="border-t">
                  <td className="p-2">{row.km}</td>
                  <td className="p-2 font-semibold">
                    ₱ {fare.toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>

        </table>
      </div>
    </div>
  );
}