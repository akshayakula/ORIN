import { forwardRef } from "react";
import { cn } from "../../lib/cn";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "flex w-full min-h-[120px] rounded-xl bg-white/5 border border-white/15 px-3 py-3 text-sm leading-relaxed text-white placeholder:text-white/40 transition-colors resize-y",
        "focus:outline-none focus:ring-2 focus:ring-slate-300/30 focus:border-slate-300/40",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

export default Textarea;
