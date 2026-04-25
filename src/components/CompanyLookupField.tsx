import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import {
  Globe,
  MapPin,
  Calendar,
  Users,
  ExternalLink,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input, Button, Badge } from "./ui";
import {
  lookupCompany,
  mockLookup,
  type CrustdataResult,
} from "../lib/crustdata";
import { cn } from "../lib/cn";
import { fmtRins } from "../lib/format";

export interface CompanyLookupFieldProps {
  id?: string;
  label?: string;
  placeholder?: string;
  initialValue?: string;
  onResolved?: (result: CrustdataResult | null) => void;
  autoLookup?: boolean;
  hint?: string;
  className?: string;
  showResultCard?: boolean;
}

function detectInput(raw: string): { domain?: string; name?: string } {
  const trimmed = raw.trim();
  if (!trimmed) return {};
  // crude domain detection: contains a dot, no spaces, no /
  if (
    !/\s/.test(trimmed) &&
    /\./.test(trimmed) &&
    !/[^a-z0-9.\-:/]/i.test(trimmed)
  ) {
    const cleaned = trimmed
      .replace(/^https?:\/\//i, "")
      .replace(/\/.*$/, "")
      .toLowerCase();
    return { domain: cleaned };
  }
  return { name: trimmed };
}

const SourcePill = ({ source }: { source: CrustdataResult["source"] }) => {
  if (source === "live") {
    return (
      <Badge
        variant="success"
        className="bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
      >
        Live
      </Badge>
    );
  }
  return (
    <Badge
      variant="warning"
      className="bg-amber-500/10 border-amber-500/30 text-amber-300"
    >
      Mock
    </Badge>
  );
};

const VerifiedPill = () => (
  <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider border border-amber-500/40 bg-amber-500/10 text-amber-300">
    Verified via Crustdata
  </span>
);

function CompanyResultCard({
  result,
  stale,
  onRetry,
}: {
  result: CrustdataResult;
  stale: boolean;
  onRetry: () => void;
}) {
  const c = result.company;
  const industries = c.taxonomy?.industries?.slice(0, 6) ?? [];
  const isEnriching = result.status === "enriching";
  const isMissing = result.status === "not_found" || result.status === "error";

  return (
    <motion.div
      key={result.fetchedAt}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: stale ? 0.55 : 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn(
        "glass-dark rounded-2xl p-4 mt-3 border border-white/10",
        "transition-opacity duration-200",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-base font-semibold text-white truncate">
            {c.name ?? result.query.name ?? result.query.domain ?? "Unknown company"}
          </div>
          {c.description ? (
            <p className="text-xs text-white/60 mt-1 line-clamp-2">
              {c.description}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <VerifiedPill />
          <SourcePill source={result.source} />
        </div>
      </div>

      {isEnriching ? (
        <div className="mt-3">
          <Badge
            variant="warning"
            className="bg-amber-500/10 border-amber-500/30 text-amber-300"
          >
            Enriching… check back in ~10 min
          </Badge>
        </div>
      ) : null}

      {isMissing ? (
        <div className="mt-3 rounded-xl bg-white/5 border border-white/10 p-3 text-xs text-white/70">
          We could not find that company. We'll publish what you typed and run
          enrichment in the background.
          <div className="mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onRetry}
              type="button"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry
            </Button>
          </div>
        </div>
      ) : null}

      {!isMissing && !isEnriching ? (
        <>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="rounded-xl bg-white/5 border border-white/10 p-3">
              <div className="flex items-center gap-1.5 text-white/50 uppercase tracking-wide text-[10px]">
                <Globe className="h-3.5 w-3.5 text-steel-400" />
                Domain
              </div>
              <div className="mt-1 text-white truncate">
                {c.domain ? (
                  <a
                    href={
                      c.website ?? `https://${c.domain}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="text-steel-300 hover:text-white underline-offset-4 hover:underline"
                  >
                    {c.domain}
                  </a>
                ) : (
                  <span className="text-white/40">—</span>
                )}
              </div>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 p-3">
              <div className="flex items-center gap-1.5 text-white/50 uppercase tracking-wide text-[10px]">
                <MapPin className="h-3.5 w-3.5 text-steel-400" />
                Headquarters
              </div>
              <div className="mt-1 text-white truncate">
                {c.hqAddress ?? c.hqCountry ?? (
                  <span className="text-white/40">—</span>
                )}
              </div>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 p-3">
              <div className="flex items-center gap-1.5 text-white/50 uppercase tracking-wide text-[10px]">
                <Calendar className="h-3.5 w-3.5 text-steel-400" />
                Founded
              </div>
              <div className="mt-1 text-white">
                {c.yearFounded ?? <span className="text-white/40">—</span>}
              </div>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 p-3">
              <div className="flex items-center gap-1.5 text-white/50 uppercase tracking-wide text-[10px]">
                <Users className="h-3.5 w-3.5 text-steel-400" />
                Employees
              </div>
              <div className="mt-1 text-white">
                {typeof c.employeeCount === "number" ? (
                  fmtRins(c.employeeCount)
                ) : (
                  <span className="text-white/40">—</span>
                )}
              </div>
            </div>
          </div>

          {industries.length ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {industries.map((i) => (
                <Badge key={i} variant="secondary" className="normal-case">
                  {i}
                </Badge>
              ))}
            </div>
          ) : null}

          {c.linkedinUrl ? (
            <div className="mt-3 text-xs">
              <a
                href={c.linkedinUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-white/60 hover:text-white"
              >
                <ExternalLink className="h-3 w-3" />
                LinkedIn profile
              </a>
            </div>
          ) : null}
        </>
      ) : null}

      <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[10px] uppercase tracking-wider text-white/40">
        <span>Source: Crustdata · fulldocs.crustdata.com</span>
        <span>{new Date(result.fetchedAt).toLocaleTimeString()}</span>
      </div>
    </motion.div>
  );
}

export default function CompanyLookupField({
  id,
  label = "Company",
  placeholder = "e.g. NorthStar Renewable Fuels",
  initialValue = "",
  onResolved,
  autoLookup = true,
  hint,
  className,
  showResultCard = true,
}: CompanyLookupFieldProps) {
  const generatedId = useId();
  const inputId = id ?? `company-lookup-${generatedId}`;

  const [query, setQuery] = useState(initialValue);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CrustdataResult | null>(null);
  const [stale, setStale] = useState(false);

  const lastQueryRef = useRef<string>("");
  const abortRef = useRef<AbortController | null>(null);
  const onResolvedRef = useRef(onResolved);
  useEffect(() => {
    onResolvedRef.current = onResolved;
  }, [onResolved]);

  const runLookup = useCallback(
    async (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed) {
        setResult(null);
        setError(null);
        setStale(false);
        lastQueryRef.current = "";
        onResolvedRef.current?.(null);
        return;
      }
      if (
        trimmed.toLowerCase() === lastQueryRef.current.toLowerCase() &&
        result
      ) {
        // Already looked this up, don't re-run.
        setStale(false);
        return;
      }

      // cancel any in-flight request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setError(null);
      try {
        const detected = detectInput(trimmed);
        const r = await lookupCompany(detected, controller.signal);
        if (controller.signal.aborted) return;
        setResult(r);
        setStale(false);
        lastQueryRef.current = trimmed;
        onResolvedRef.current?.(r);
      } catch (e) {
        if ((e as { name?: string })?.name === "AbortError") return;
        const fallback = mockLookup(trimmed);
        setResult(fallback);
        setError("Live lookup failed — showing offline preview.");
        lastQueryRef.current = trimmed;
        onResolvedRef.current?.(fallback);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    },
    [result],
  );

  // mark result stale when the query diverges from the last successful one
  useEffect(() => {
    if (!result) return;
    const current = query.trim().toLowerCase();
    setStale(current !== lastQueryRef.current.toLowerCase() && current.length > 0);
  }, [query, result]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        void runLookup(query);
      }
    },
    [query, runLookup],
  );

  const handleBlur = useCallback(() => {
    if (autoLookup && query.trim()) {
      void runLookup(query);
    }
  }, [autoLookup, query, runLookup]);

  const handleClick = useCallback(() => {
    void runLookup(query);
  }, [query, runLookup]);

  const handleRetry = useCallback(() => {
    lastQueryRef.current = "";
    void runLookup(query);
  }, [query, runLookup]);

  const visibleHint = useMemo(() => {
    if (loading) return "Looking up via Crustdata…";
    if (error) return error;
    return hint ?? null;
  }, [loading, error, hint]);

  return (
    <div className={cn("w-full", className)}>
      {label ? (
        <label
          htmlFor={inputId}
          className="block text-xs uppercase tracking-wider text-white/60 mb-1.5"
        >
          {label}
        </label>
      ) : null}
      <div className="flex items-center gap-2">
        <Input
          id={inputId}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={placeholder}
          autoComplete="off"
        />
        <Button
          variant="primary"
          size="sm"
          type="button"
          onClick={handleClick}
          disabled={loading || !query.trim()}
        >
          {loading && (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          )}
          Look up
        </Button>
      </div>
      {visibleHint ? (
        <div
          className={cn(
            "mt-1.5 text-[11px]",
            error ? "text-red-300/80" : "text-white/50",
          )}
        >
          {visibleHint}
        </div>
      ) : null}

      {showResultCard ? (
        <AnimatePresence mode="wait">
          {result ? (
            <CompanyResultCard
              key={result.fetchedAt}
              result={result}
              stale={stale}
              onRetry={handleRetry}
            />
          ) : null}
        </AnimatePresence>
      ) : null}
    </div>
  );
}
