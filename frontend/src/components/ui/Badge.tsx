"use client";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "jeepney" | "tricycle" | "ejeep" | "default" | "success" | "warning" | "error";
  size?: "sm" | "md";
  className?: string;
}

const VARIANT_CLASSES: Record<string, string> = {
  jeepney: "bg-[#CC553D]/15 text-[#CC553D] border-[#CC553D]/20",
  tricycle: "bg-emerald-500/15 text-emerald-700 border-emerald-500/20",
  ejeep: "bg-blue-500/15 text-blue-700 border-blue-500/20",
  default: "bg-gray-100 text-gray-600 border-gray-200",
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  error: "bg-red-50 text-red-600 border-red-200",
};

const SIZE_CLASSES: Record<string, string> = {
  sm: "px-2 py-0.5 text-[10px]",
  md: "px-2.5 py-1 text-xs",
};

export default function Badge({
  children,
  variant = "default",
  size = "sm",
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded-full border
        font-bold uppercase tracking-wider
        ${VARIANT_CLASSES[variant]}
        ${SIZE_CLASSES[size]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}
