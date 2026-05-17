"use client";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  color?: string;
  className?: string;
}

const SIZE_MAP = {
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
};

export default function Spinner({
  size = "md",
  color = "currentColor",
  className = "",
}: SpinnerProps) {
  return (
    <svg
      className={`animate-spin ${SIZE_MAP[size]} ${className}`}
      fill="none"
      viewBox="0 0 24 24"
      role="status"
      aria-label="Loading"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke={color}
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill={color}
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

/**
 * Full-page loading spinner with optional message.
 */
export function PageSpinner({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
      <Spinner size="lg" color="#0F3D35" />
      {message && (
        <p className="text-sm text-gray-500 font-medium">{message}</p>
      )}
    </div>
  );
}
