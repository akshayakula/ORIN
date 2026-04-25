import { Separator } from "../ui";

interface FooterCol {
  heading: string;
  links: { label: string; href: string }[];
}

const columns: FooterCol[] = [
  {
    heading: "Product",
    links: [
      { label: "Marketplace", href: "#marketplace" },
      { label: "How It Works", href: "#how-it-works" },
      { label: "Pricing", href: "#pricing" },
      { label: "FAQ", href: "#faq" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Press", href: "#" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "Documentation", href: "#" },
      { label: "QAP Directory", href: "#" },
      { label: "EPA RFS Primer", href: "#" },
      { label: "Changelog", href: "#" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Terms", href: "#" },
      { label: "Privacy", href: "#" },
      { label: "Disclosures", href: "#" },
      { label: "Security", href: "#" },
    ],
  },
];

export function FooterSection() {
  return (
    <footer className="relative overflow-hidden py-16 bg-space-900 border-t border-white/10">
      <div className="relative z-10 mx-auto max-w-7xl px-4 md:px-6">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-5">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <span className="text-base font-bold tracking-tight text-white">
                ORIN
              </span>
            </div>
            <p className="mt-4 text-xs text-white/50 leading-relaxed max-w-xs">
              Origin-Verified RIN Marketplace. Audit-first diligence for the
              Renewable Fuel Standard.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.heading}>
              <p className="eyebrow">{col.heading}</p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-white/65 hover:text-white transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-10" />

        <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
          <p className="text-[11px] text-white/40">
            &copy; {new Date().getFullYear()} ORIN Labs, Inc. All rights
            reserved.
          </p>
          <p className="text-[11px] text-white/40 max-w-3xl">
            ORIN flags diligence risk before purchase. ORIN does not accuse
            sellers of fraud and does not certify EPA validity. Satellite
            signals are informational and are not legal evidence.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default FooterSection;
