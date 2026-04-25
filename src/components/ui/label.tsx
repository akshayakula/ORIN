import { forwardRef } from "react";
import { cn } from "../../lib/cn";

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        "text-xs font-medium uppercase tracking-[0.18em] text-white/70 mb-1.5 block",
        className
      )}
      {...props}
    />
  )
);
Label.displayName = "Label";

export default Label;
