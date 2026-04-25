import { cn } from "../../lib/cn";

interface CompanySuggestionChipsProps<T extends { name: string; hint?: string }> {
  label?: string;
  options: T[];
  onPick: (option: T) => void;
  className?: string;
}

export default function CompanySuggestionChips<
  T extends { name: string; hint?: string },
>({
  label = "Try a sample firm",
  options,
  onPick,
  className,
}: CompanySuggestionChipsProps<T>) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="label-mono">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt.name}
            type="button"
            onClick={() => onPick(opt)}
            title={opt.hint}
            className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-white/75 hover:text-white hover:bg-white/10 hover:border-white/25 transition"
          >
            {opt.name}
          </button>
        ))}
      </div>
    </div>
  );
}
