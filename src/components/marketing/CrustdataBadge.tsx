import { motion } from "framer-motion";
import { Database, ExternalLink } from "lucide-react";
import { cn } from "../../lib/cn";

interface CrustdataBadgeProps {
  className?: string;
  variant?: "compact" | "full";
}

export default function CrustdataBadge({
  className,
  variant = "compact",
}: CrustdataBadgeProps) {
  return (
    <motion.a
      href="https://fulldocs.crustdata.com"
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.6 }}
      className={cn(
        "group inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 backdrop-blur px-3 py-1.5 text-xs text-white/70 hover:text-white hover:bg-white/10 transition",
        className,
      )}
    >
      <span className="relative inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/15 border border-amber-500/30">
        <Database className="h-3 w-3 text-amber-300" />
      </span>
      <span className="font-medium">
        {variant === "compact" ? "Powered by" : "Company signals via"}
        <span className="ml-1 font-semibold text-white">Crustdata</span>
      </span>
      <ExternalLink className="h-3 w-3 text-white/40 group-hover:text-white/80 transition" />
    </motion.a>
  );
}
