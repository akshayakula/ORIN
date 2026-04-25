import { motion, AnimatePresence } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import { fmtRins, fmtUSD } from "../lib/format";
import type { RinLot } from "../types/rin";

interface PurchaseModalProps {
  open: boolean;
  lot: RinLot | null;
  onClose: () => void;
  onViewAuditPacket: () => void;
  onReturnToMarketplace: () => void;
}

export default function PurchaseModal({
  open,
  lot,
  onClose,
  onViewAuditPacket,
  onReturnToMarketplace,
}: PurchaseModalProps) {
  const show = open && lot !== null;

  return (
    <AnimatePresence>
      {show && lot && (
        <motion.div
          key="purchase-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4"
          onClick={onClose}
        >
          <motion.div
            key="purchase-modal-card"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="glass max-w-md w-[90vw] p-8 flex flex-col items-center gap-5"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 18,
                delay: 0.05,
              }}
              className="relative"
            >
              <div className="relative h-16 w-16 rounded-full bg-emerald-500/15 flex items-center justify-center border border-emerald-500/30">
                <Check
                  size={32}
                  strokeWidth={3}
                  className="text-emerald-300"
                />
              </div>
            </motion.div>

            <div className="flex flex-col items-center gap-2 text-center">
              <h2 className="font-display font-bold text-2xl text-white leading-tight">
                Purchase Request Created
              </h2>
              <p className="text-sm text-white/75 leading-relaxed max-w-sm">
                Diligence packet saved to compliance vault. Seller
                notified.
              </p>
            </div>

            <div className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <span className="uppercase tracking-[0.18em] text-white/55">
                {lot.id}
              </span>
              <span className="pill bg-white/10 text-white/90 border border-white/15">
                {lot.dCode}
              </span>
              <span className="text-white tabular-nums">
                {fmtRins(lot.quantity)} RINs
              </span>
              <span className="text-amber-300 tabular-nums">
                {fmtUSD(lot.quantity * lot.price)}
              </span>
            </div>

            <p className="text-[11px] leading-relaxed text-white/50 text-center">
              ORIN flags diligence risk before purchase. ORIN does not accuse
              sellers of fraud and does not certify EPA validity. Verify origin
              before purchase.
            </p>

            <div className="w-full flex flex-col gap-2.5 pt-1">
              <button
                type="button"
                onClick={onViewAuditPacket}
                className="btn-primary justify-center w-full"
              >
                View Audit Packet
                <ArrowRight size={14} strokeWidth={2.25} />
              </button>
              <button
                type="button"
                onClick={onReturnToMarketplace}
                className="btn-ghost justify-center w-full"
              >
                Return to Marketplace
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
