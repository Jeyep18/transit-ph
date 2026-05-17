"use client";

interface PinIconProps {
  variant: "origin" | "destination";
  size?: number;
  className?: string;
}

const COLORS = {
  origin: "#CC553D",
  destination: "#1B3A6B",
};

/**
 * Location pin SVG icon with origin (red) and destination (blue) variants.
 */
export default function PinIcon({
  variant,
  size = 20,
  className = "",
}: PinIconProps) {
  const color = COLORS[variant];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      className={className}
    >
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
    </svg>
  );
}

/**
 * Small dot indicator for origin/destination in forms.
 */
export function PinDot({
  variant,
  size = 12,
  className = "",
}: PinIconProps) {
  const color = COLORS[variant];

  return (
    <div
      className={`rounded-full border-2 border-white shadow-sm ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: color,
      }}
    />
  );
}
