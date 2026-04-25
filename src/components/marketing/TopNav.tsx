import { useEffect, useState } from "react";
import { Menu, X, Plus } from "lucide-react";
import { cn } from "../../lib/cn";
import { Button } from "../ui";
import { AnimatedGradientText } from "../magic";
import OrinLogo from "../OrinLogo";

export interface TopNavProps {
  onBrowse: () => void;
  onOpenContact: () => void;
  onOpenSupport: () => void;
  onListRins: () => void;
  buyerCompanyName?: string;
}

interface NavLink {
  label: string;
  href: string;
}

const navLinks: NavLink[] = [
  { label: "Marketplace", href: "#marketplace" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

export function TopNav({
  onBrowse,
  onOpenContact,
  onOpenSupport,
  onListRins,
  buyerCompanyName,
}: TopNavProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [mobileOpen]);

  const handleNav = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (href === "#marketplace") {
        onBrowse();
      }
      setMobileOpen(false);
    }
  };

  return (
    <>
      <header
        className={cn(
          "fixed top-0 inset-x-0 z-40 h-16 transition-all duration-300 backdrop-blur-xl",
          scrolled
            ? "bg-space-900/70 border-b border-white/10 shadow-glass"
            : "bg-space-900/30 border-b border-transparent",
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
            {buyerCompanyName ? (
              <div
                className="glass-dark inline-flex h-7 items-center gap-2 rounded-full border border-white/15 px-3"
                title={`Acting as ${buyerCompanyName}`}
              >
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" aria-hidden />
                <div className="flex flex-col leading-none">
                  <span className="text-[11px] font-medium text-white">
                    Acting as · {buyerCompanyName}
                  </span>
                  <span className="label-mono mt-0.5 leading-none">via Crustdata</span>
                </div>
              </div>
            ) : null}
            <Button variant="ghost" size="sm" onClick={onListRins}>
              <Plus className="h-3.5 w-3.5" aria-hidden />
              List Your RINs
            </Button>
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
        {scrolled && <div className="hairline absolute bottom-0 left-0 right-0" aria-hidden />}
      </header>

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
              <Button
                variant="ghost"
                className="w-full justify-center"
                onClick={() => {
                  setMobileOpen(false);
                  onListRins();
                }}
              >
                <Plus className="h-4 w-4" aria-hidden />
                List Your RINs
              </Button>
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
