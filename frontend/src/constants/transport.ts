import type { StationType } from "@/types/station";

export const STATION_TYPES: Record<StationType, string> = {
  JEEPNEY_STOP: "Jeepney Stop",
  TRICYCLE_TERMINAL: "Tricycle Terminal",
  JEEPNEY_TERMINAL: "Jeepney Terminal",
  BUS_TERMINAL: "Bus Terminal",
  MIXED_TERMINAL: "Tricycle/Jeep Terminal",
};

export const STATION_TYPE_COLORS: Record<StationType, string> = {
  JEEPNEY_STOP: "#CC553D",
  TRICYCLE_TERMINAL: "#2E8B57",
  JEEPNEY_TERMINAL: "#CC553D",
  BUS_TERMINAL: "#7c3aed",
  MIXED_TERMINAL: "#0891b2",
};

// Only one mode in scope — BR-TM-02
export const JEEPNEY_MODE_CODE = "JEP" as const;

// BR-FCM-08: shown on tricycle legs instead of a computed fare
export const TRICYCLE_FARE_ADVISORY =
  "Tricycle fares are negotiated locally and are not regulated " +
  "under the LTFRB fare matrix. The amount shown is an advisory estimate only.";

export const TRANSPORT_COLORS: Record<string, string> = {
  Jeepney: "#CC553D",
  Tricycle: "#2E8B57",
  default: "#1B3A6B",
};
