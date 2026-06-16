"use client";

interface StarRatingProps {
  value: number | null;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-xl",
};

export function StarRating({
  value,
  onChange,
  readonly = false,
  size = "md",
}: StarRatingProps) {
  return (
    <div className={`flex gap-0.5 ${sizeMap[size]}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !readonly && onChange?.(star)}
          disabled={readonly}
          className={`${
            value !== null && star <= (value ?? 0)
              ? "text-white"
              : "text-[#444]"
          } ${!readonly ? "hover:text-white transition-colors" : ""} disabled:cursor-default`}
          aria-label={`Rate ${star} stars`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export function StarDisplay({
  value,
  size = "sm",
}: {
  value: number | null;
  size?: "sm" | "md" | "lg";
}) {
  if (value === null) return null;
  return (
    <span className={`${sizeMap[size]} tracking-tight`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={star <= value ? "text-white" : "text-[#444]"}>
          ★
        </span>
      ))}
    </span>
  );
}
