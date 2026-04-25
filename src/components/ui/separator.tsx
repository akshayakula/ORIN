import { forwardRef } from "react";
import { cn } from "../../lib/cn";

export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical";
  decorative?: boolean;
}

export const Separator = forwardRef<HTMLDivElement, SeparatorProps>(
  (
    { className, orientation = "horizontal", decorative = true, ...props },
    ref
  ) => (
    <div
      ref={ref}
      role={decorative ? "none" : "separator"}
      aria-orientation={orientation}
      className={cn(
        orientation === "horizontal"
          ? "h-px w-full bg-gradient-to-r from-transparent via-white/15 to-transparent"
          : "w-px h-full bg-gradient-to-b from-transparent via-white/15 to-transparent",
        className
      )}
      {...props}
    />
  )
);
Separator.displayName = "Separator";

export default Separator;
