import {
  createContext,
  forwardRef,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/cn";

type AccordionType = "single" | "multiple";

interface AccordionContextValue {
  type: AccordionType;
  openItems: string[];
  toggle: (value: string) => void;
}

const AccordionContext = createContext<AccordionContextValue | null>(null);

const useAccordion = () => {
  const ctx = useContext(AccordionContext);
  if (!ctx) throw new Error("Accordion components must be inside <Accordion>");
  return ctx;
};

interface ItemContextValue {
  value: string;
  isOpen: boolean;
  toggle: () => void;
}

const ItemContext = createContext<ItemContextValue | null>(null);

const useItem = () => {
  const ctx = useContext(ItemContext);
  if (!ctx) throw new Error("AccordionTrigger/Content must be in <AccordionItem>");
  return ctx;
};

export interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: AccordionType;
  defaultValue?: string | string[];
  value?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  children: ReactNode;
}

export function Accordion({
  type = "single",
  defaultValue,
  value: controlledValue,
  onValueChange,
  className,
  children,
  ...props
}: AccordionProps) {
  const initial = (() => {
    if (defaultValue === undefined) return [];
    return Array.isArray(defaultValue) ? defaultValue : [defaultValue];
  })();
  const [uncontrolled, setUncontrolled] = useState<string[]>(initial);
  const isControlled = controlledValue !== undefined;
  const openItems = isControlled
    ? Array.isArray(controlledValue)
      ? controlledValue
      : controlledValue
        ? [controlledValue]
        : []
    : uncontrolled;

  const toggle = (val: string) => {
    let next: string[];
    if (type === "single") {
      next = openItems.includes(val) ? [] : [val];
    } else {
      next = openItems.includes(val)
        ? openItems.filter((v) => v !== val)
        : [...openItems, val];
    }
    if (!isControlled) setUncontrolled(next);
    if (onValueChange) {
      onValueChange(type === "single" ? (next[0] ?? "") : next);
    }
  };

  return (
    <AccordionContext.Provider value={{ type, openItems, toggle }}>
      <div className={cn("w-full divide-y divide-white/10", className)} {...props}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

export interface AccordionItemProps
  extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export const AccordionItem = forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ className, value, children, ...props }, ref) => {
    const { openItems, toggle } = useAccordion();
    const isOpen = openItems.includes(value);
    return (
      <ItemContext.Provider value={{ value, isOpen, toggle: () => toggle(value) }}>
        <div
          ref={ref}
          data-state={isOpen ? "open" : "closed"}
          className={cn("py-2", className)}
          {...props}
        >
          {children}
        </div>
      </ItemContext.Provider>
    );
  }
);
AccordionItem.displayName = "AccordionItem";

export interface AccordionTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export const AccordionTrigger = forwardRef<
  HTMLButtonElement,
  AccordionTriggerProps
>(({ className, children, onClick, ...props }, ref) => {
  const { isOpen, toggle } = useItem();
  return (
    <button
      ref={ref}
      type="button"
      aria-expanded={isOpen}
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented) toggle();
      }}
      className={cn(
        "flex w-full items-center justify-between gap-4 py-3 px-1 text-left text-sm font-medium text-white hover:text-steel-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300/30 rounded-md",
        className
      )}
      {...props}
    >
      <span className="flex-1">{children}</span>
      <ChevronDown
        className={cn(
          "h-4 w-4 shrink-0 text-white/60 transition-transform duration-200",
          isOpen && "rotate-180 text-steel-300"
        )}
      />
    </button>
  );
});
AccordionTrigger.displayName = "AccordionTrigger";

export interface AccordionContentProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export const AccordionContent = forwardRef<
  HTMLDivElement,
  AccordionContentProps
>(({
  className,
  children,
  onAnimationStart: _onAnimationStart,
  onAnimationEnd: _onAnimationEnd,
  onAnimationIteration: _onAnimationIteration,
  onDrag: _onDrag,
  onDragStart: _onDragStart,
  onDragEnd: _onDragEnd,
  ...props
}, ref) => {
  const { isOpen } = useItem();
  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          ref={ref}
          key="content"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="overflow-hidden"
          {...props}
        >
          <div className={cn("pb-3 pt-1 pl-1 pr-2 text-sm text-white/70 leading-relaxed", className)}>
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
AccordionContent.displayName = "AccordionContent";
