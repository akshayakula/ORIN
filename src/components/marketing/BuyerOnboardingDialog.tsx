import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Label,
} from "../ui";
import CompanyLookupField from "../CompanyLookupField";
import CrustdataBadge from "./CrustdataBadge";
import { useBuyerProfile } from "../../hooks/useBuyerProfile";
import type { CrustdataResult } from "../../lib/crustdata";

export interface BuyerOnboardingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

export function BuyerOnboardingDialog({
  open,
  onOpenChange,
  onComplete,
}: BuyerOnboardingDialogProps) {
  const { setProfile } = useBuyerProfile();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<CrustdataResult | null>(null);
  const [typedQuery, setTypedQuery] = useState("");
  const [showStepTwo, setShowStepTwo] = useState(false);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setName("");
      setEmail("");
      setResult(null);
      setTypedQuery("");
      setShowStepTwo(false);
    }
  }, [open]);

  const handleResolved = useCallback((r: CrustdataResult | null) => {
    setResult(r);
    if (r) {
      const q = r.query.name ?? r.query.domain ?? "";
      setTypedQuery(q);
      // Auto-advance only when found/enriching/mock (not error/not_found)
      if (
        r.status === "found" ||
        r.status === "enriching" ||
        r.status === "mock"
      ) {
        setShowStepTwo(true);
      }
    } else {
      setShowStepTwo(false);
    }
  }, []);

  const canSubmit =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    /.+@.+\..+/.test(email.trim()) &&
    !!result;

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!canSubmit || !result) return;
      const companyName = result.company.name ?? typedQuery;
      setProfile({
        name: name.trim(),
        email: email.trim(),
        companyName,
        companyDomain: result.company.domain,
        enrichment: result.company,
        enrichmentSource: result.source,
        enrichmentStatus: result.status,
        enrichedAt: result.fetchedAt,
      });
      onComplete();
      onOpenChange(false);
    },
    [
      canSubmit,
      result,
      typedQuery,
      name,
      email,
      setProfile,
      onComplete,
      onOpenChange,
    ],
  );

  const handleSkip = useCallback(() => {
    onComplete();
    onOpenChange(false);
  }, [onComplete, onOpenChange]);

  // Manual continue for not_found / error states
  const handleManualContinue = useCallback(() => {
    setShowStepTwo(true);
  }, []);

  const isMissing =
    result?.status === "not_found" || result?.status === "error";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-2xl">
        <DialogHeader>
          <div className="eyebrow mb-1">BUYER ONBOARDING</div>
          <DialogTitle>Tell us about your firm.</DialogTitle>
          <DialogDescription>
            We pull live company signals from Crustdata so your audits and
            diligence packets are tagged to your organization.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Crustdata attribution row */}
          <div className="flex flex-wrap items-center gap-2">
            <CrustdataBadge variant="full" />
            <a
              href="https://fulldocs.crustdata.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-white/50 hover:text-white"
            >
              <ExternalLink className="h-3 w-3" />
              docs
            </a>
          </div>

          {/* Step 1 — lookup */}
          <div>
            <CompanyLookupField
              id="buyer-company-lookup"
              label="Your firm"
              placeholder="e.g. Phillips 66, Marathon, Chevron Renewable Energy"
              hint="Live company signals via Crustdata"
              onResolved={handleResolved}
            />

            {isMissing && !showStepTwo ? (
              <div className="mt-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleManualContinue}
                >
                  Continue without enrichment
                </Button>
              </div>
            ) : null}
          </div>

          {/* Step 2 — name + email (slides in once resolved) */}
          <AnimatePresence initial={false}>
            {showStepTwo ? (
              <motion.div
                key="step-two"
                initial={{ opacity: 0, y: 10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -6, height: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="buyer-name">Your name *</Label>
                    <Input
                      id="buyer-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="buyer-email">Work email *</Label>
                    <Input
                      id="buyer-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleSkip}
              className="text-xs text-white/50 hover:text-white underline-offset-4 hover:underline"
            >
              Skip — I'll set this later
            </button>
            <Button
              type="submit"
              variant="primary"
              className="btn-primary"
              disabled={!canSubmit}
            >
              Continue to marketplace
            </Button>
          </div>

          <p className="text-[11px] leading-relaxed text-white/45">
            We use Crustdata to enrich firm info. We never share your name or
            email with sellers without your action.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default BuyerOnboardingDialog;
