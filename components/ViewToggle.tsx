"use client";

export type ViewMode = "card" | "list" | "venn";

export function ViewToggle({
  view,
  onChange,
  options: allowed,
}: {
  view: ViewMode;
  onChange: (v: ViewMode) => void;
  options?: ViewMode[];
}) {
  const options: { value: ViewMode; icon: React.ReactNode; label: string }[] = [
    {
      value: "card",
      label: "Card",
      icon: (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="1" y="1" width="5" height="5" rx="0.5" fill="currentColor" />
          <rect x="8" y="1" width="5" height="5" rx="0.5" fill="currentColor" />
          <rect x="1" y="8" width="5" height="5" rx="0.5" fill="currentColor" />
          <rect x="8" y="8" width="5" height="5" rx="0.5" fill="currentColor" />
        </svg>
      ),
    },
    {
      value: "list",
      label: "List",
      icon: (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="1" y="2" width="12" height="2" rx="0.5" fill="currentColor" />
          <rect x="1" y="6" width="12" height="2" rx="0.5" fill="currentColor" />
          <rect x="1" y="10" width="12" height="2" rx="0.5" fill="currentColor" />
        </svg>
      ),
    },
    {
      value: "venn",
      label: "Venn",
      icon: (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="5" cy="7" r="4" stroke="currentColor" strokeWidth="1.2" fill="none" />
          <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.2" fill="none" />
        </svg>
      ),
    },
  ];

  const visible = allowed ? options.filter((o) => allowed.includes(o.value)) : options;

  return (
    <div className="flex items-center border border-[#222]">
      {visible.map(({ value, icon, label }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          title={label}
          className={`flex items-center justify-center w-8 h-7 transition-colors ${
            view === value
              ? "bg-white text-black"
              : "text-[#555] hover:text-white"
          }`}
        >
          {icon}
        </button>
      ))}
    </div>
  );
}
