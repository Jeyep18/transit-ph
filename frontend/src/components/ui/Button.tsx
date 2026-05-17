"use client";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children: React.ReactNode;
}

const VARIANT_CLASSES: Record<string, string> = {
  primary:
    "bg-brand-teal text-white hover:bg-brand-teal/90 shadow-lg shadow-brand-teal/20",
  secondary:
    "bg-brand-red text-white hover:bg-brand-red/90 shadow-lg shadow-brand-red/20",
  outline:
    "border-2 border-brand-teal text-brand-teal bg-transparent hover:bg-brand-teal/5",
  ghost:
    "text-gray-600 bg-transparent hover:bg-gray-100",
  danger:
    "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20",
};

const SIZE_CLASSES: Record<string, string> = {
  sm: "px-3 py-1.5 text-xs rounded-lg",
  md: "px-4 py-2.5 text-sm rounded-xl",
  lg: "px-6 py-3.5 text-base rounded-2xl",
};

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  children,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`
        font-bold transition-all duration-200 active:scale-[0.97]
        disabled:opacity-60 disabled:cursor-not-allowed
        inline-flex items-center justify-center gap-2
        ${VARIANT_CLASSES[variant]}
        ${SIZE_CLASSES[size]}
        ${className}
      `}
      {...props}
    >
      {loading && (
        <svg
          className="w-4 h-4 animate-spin"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
