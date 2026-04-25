import { useEffect, useRef, useState } from "react";
import { Menu, X, Building2, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "../../lib/cn";
import { Button } from "../ui";
import { AnimatedGradientText } from "../magic";
import OrinLogo from "../OrinLogo";
import { AuctionTickerNav } from "../auction";

export interface TopNavProps {
  onBrowse: () => void;
  onOpenContact: () => void;
  onOpenSupport: () => void;
  buyerCompanyName?: string;
  onOpenAuctions?: () => void;
  onChangeIdentity?: () => void;
  onClearIdentity?: () => void;
}

interface NavLink {
  label: string;
  href: string;
}

const navLinks: NavLink[] = [
  { label: "Marketplace", href: "#marketplace-list" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

export function TopNav({
  onBrowse,
  onOpenContact,
  onOpenSupport,
  buyerCompanyName,
  onOpenAuctions,
  onChangeIdentity,
  onClearIdentity,
}: TopNavProps) {
  const [atTop, setAtTop] = useState(true);
  const [visible, setVisible] = useState(true);
  const [hasGlass, setHasGlass] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [identityPopoverOpen, setIdentityPopoverOpen] = useState(false);

  const lastScrollY = useRef(0);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const identityWrapRef = useRef<HTMLDivElement | null>(null);

  // Scroll behavior: auto-hide on scroll down, restore on up; transparent at top; idle-clear after 4s.
  useEffect(() => {
    const clearIdleTimer = () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
    };

    const scheduleIdleClear = () => {
      clearIdleTimer();
      idleTimerRef.current = setTimeout(() => {
        // Only clear glass if we're not at the top (top already has no glass).
        if (window.scrollY >= 24) {
          setHasGlass(false);
        }
      }, 4000);
    };

    const onScroll = () => {
      const y = window.scrollY;
      const top = y < 24;
      setAtTop(top);

      if (top) {
        setVisible(true);
        setHasGlass(false);
        clearIdleTimer();
      } else {
        // restore glass on any scroll movement
        setHasGlass(true);
        const delta = y - lastScrollY.current;
        if (delta > 4 && y > 80) {
          // scrolling down past threshold → hide
          setVisible(false);
        } else if (delta < -4) {
          // scrolling up → show
          setVisible(true);
        }
        scheduleIdleClear();
      }
      lastScrollY.current = y;
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      clearIdleTimer();
    };
  }, []);

  // Mouse near top → reveal header.
  useEffect(() => {
    const onMouse = (e: MouseEvent) => {
      if (e.clientY < 80) {
        setVisible(true);
        if (window.scrollY >= 24) setHasGlass(true);
      }
    };
    window.addEventListener("mousemove", onMouse);
    return () => window.removeEventListener("mousemove", onMouse);
  }, []);

  // Mobile menu open should re-show header.
  useEffect(() => {
    if (mobileOpen) setVisible(true);
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [mobileOpen]);

  // Click outside identity popover to close.
  useEffect(() => {
    if (!identityPopoverOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (!identityWrapRef.current) return;
      if (!identityWrapRef.current.contains(e.target as Node)) {
        setIdentityPopoverOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [identityPopoverOpen]);

  const handleNav = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (href === "#marketplace-list") {
        onBrowse();
      }
      setMobileOpen(false);
    }
  };

  const showGlass = hasGlass && !atTop;

  return (
    <>
      <motion.header
        initial={false}
        animate={{ y: visible ? 0 : -72, opacity: visible ? 1 : 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className={cn(
          "fixed top-0 inset-x-0 z-40 h-16 transition-colors duration-300",
          showGlass
            ? "bg-space-900/70 border-b border-white/10 shadow-glass backdrop-blur-xl"
            : "bg-space-900/0 border-b border-transparent shadow-none",
        )}
        aria-label="Primary navigation"
      >
        <div className="mx-auto flex h-full w-full max-w-7xl items-center gap-6 px-4 md:px-6">
          <a
            href="#top"
            onClick={(e) => handleNav(e, "#top")}
            className="flex items-center gap-2.5 shrink-0"
          >
            <OrinLogo size={32} alive />

            <span className="flex flex-col leading-tight">
              <AnimatedGradientText
                from="#22e0ff"
                via="#a78bfa"
                to="#ffb547"
                durationSec={8}
                className="text-base font-bold tracking-tight"
              >
                ORIN
              </AnimatedGradientText>
              <span className="hidden sm:inline label-mono leading-none">
                Origin-Verified RINs
              </span>
            </span>
          </a>

          <nav className="hidden lg:flex items-center gap-1 mx-auto">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleNav(e, link.href)}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2 ml-auto">
            <AuctionTickerNav onClick={onOpenAuctions} />

            <div className="relative" ref={identityWrapRef}>
              {buyerCompanyName ? (
                <button
                  type="button"
                  onClick={() => setIdentityPopoverOpen((v) => !v)}
                  className="glass-dark inline-flex h-7 items-center gap-2 rounded-full border border-white/15 px-3 hover:border-white/25 transition"
                  title={`Acting as ${buyerCompanyName}`}
                  aria-haspopup="menu"
                  aria-expanded={identityPopoverOpen}
                >
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" aria-hidden />
                  <div className="flex flex-col leading-none text-left">
                    <span className="text-[11px] font-medium text-white">
                      Acting as · {buyerCompanyName}
                    </span>
                    <span className="label-mono mt-0.5 leading-none">via Crustdata</span>
                  </div>
                  <ChevronDown
                    className={cn(
                      "h-3 w-3 text-white/60 transition-transform",
                      identityPopoverOpen && "rotate-180",
                    )}
                    aria-hidden
                  />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onChangeIdentity?.()}
                  className="inline-flex h-7 items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 text-[11px] font-medium text-white/80 hover:bg-white/10 hover:text-white transition"
                >
                  <Building2 className="h-3 w-3" aria-hidden />
                  Set company
                </button>
              )}

              {identityPopoverOpen && buyerCompanyName && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-48 rounded-xl border border-white/15 bg-space-800/95 backdrop-blur-xl p-1 shadow-2xl z-50"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIdentityPopoverOpen(false);
                      onChangeIdentity?.();
                    }}
                    className="w-full text-left rounded-lg px-3 py-2 text-sm text-white/90 hover:bg-white/10 transition"
                  >
                    Change company
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIdentityPopoverOpen(false);
                      onClearIdentity?.();
                    }}
                    className="w-full text-left rounded-lg px-3 py-2 text-sm text-red-300 hover:bg-red-500/10 transition"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>

            <Button variant="ghost" size="sm" onClick={onOpenContact}>
              Contact
            </Button>
            <Button variant="ghost" size="sm" onClick={onOpenSupport}>
              Support
            </Button>
          </div>

          <button
            type="button"
            className="ml-auto md:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-white hover:bg-white/10 transition"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="h-4 w-4" aria-hidden /> : <Menu className="h-4 w-4" aria-hidden />}
          </button>
        </div>
        {showGlass && <div className="hairline absolute bottom-0 left-0 right-0" aria-hidden />}
      </motion.header>

      {mobileOpen && (
        <div className="fixed inset-0 z-30 md:hidden" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <div className="glass absolute right-0 top-16 bottom-0 w-[88vw] max-w-sm overflow-y-auto p-6">
            <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleNav(e, link.href)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <div className="mt-6 border-t border-white/10 pt-6 space-y-2">
              <div className="flex justify-center pb-1">
                <AuctionTickerNav
                  onClick={() => {
                    setMobileOpen(false);
                    onOpenAuctions?.();
                  }}
                />
              </div>
              {buyerCompanyName ? (
                <>
                  <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[11px] text-white/80">
                    Acting as · {buyerCompanyName}
                  </div>
                  <Button
                    variant="ghost"
                    className="w-full justify-center"
                    onClick={() => {
                      setMobileOpen(false);
                      onChangeIdentity?.();
                    }}
                  >
                    Change company
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-center"
                    onClick={() => {
                      setMobileOpen(false);
                      onClearIdentity?.();
                    }}
                  >
                    Clear company
                  </Button>
                </>
              ) : (
                <Button
                  variant="ghost"
                  className="w-full justify-center"
                  onClick={() => {
                    setMobileOpen(false);
                    onChangeIdentity?.();
                  }}
                >
                  Set company
                </Button>
              )}
              <Button
                variant="ghost"
                className="w-full justify-center"
                onClick={() => {
                  setMobileOpen(false);
                  onOpenContact();
                }}
              >
                Contact
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-center"
                onClick={() => {
                  setMobileOpen(false);
                  onOpenSupport();
                }}
              >
                Support
              </Button>
            </div>
            <p className="mt-6 label-mono">Origin-Verified RIN Marketplace</p>
          </div>
        </div>
      )}
    </>
  );
}

export default TopNav;
