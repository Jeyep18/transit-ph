"use client";

import dynamic from "next/dynamic";

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-[#e8f0d8] animate-pulse" />,
});

export default function MapWrapper() {
  return (
    <div className="fixed inset-0 z-0">
      <MapView />
    </div>
  );
}
