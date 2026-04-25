import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui";

interface Faq {
  q: string;
  a: string;
}

const faqs: Faq[] = [
  {
    q: "Does ORIN process the EMTS transfer?",
    a: "Yes — ORIN handles the EMTS filing, settlement docs, and party notifications as a managed service. Buyers and sellers do not need to log into EMTS for an ORIN-mediated transfer.",
  },
  {
    q: "Does ORIN certify a RIN's EPA validity?",
    a: "No. ORIN does not accuse sellers of fraud and does not certify EPA validity. ORIN flags diligence risk before purchase and surfaces data buyers should review.",
  },
  {
    q: "What happens when a methane mismatch is detected?",
    a: "ORIN surfaces the mismatch with recommended actions (request downtime logs, leak detection records, gas-capture maintenance records). The buyer decides whether to proceed.",
  },
  {
    q: "Which satellite sources does ORIN use?",
    a: "Google Air Quality readings, Google Photorealistic 3D imagery, and commercial methane datasets where available. Results are informational, not legal evidence.",
  },
  {
    q: "Is my diligence packet shareable?",
    a: "Yes. Packets are portable PDFs suitable for internal compliance review, EMTS documentation companion files, and third-party audit cooperation.",
  },
  {
    q: "What data does ORIN store?",
    a: "ORIN stores lot metadata, audit logs, and diligence packets. Seller-uploaded documents are retained for the compliance window your team selects.",
  },
];

export function FAQSection() {
  return (
    <section
      id="faq"
      className="relative isolate overflow-hidden py-24 bg-space-800"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent" />

      <div className="relative z-10 mx-auto max-w-4xl px-4 md:px-6">
        <div className="text-center">
          <p className="eyebrow">FAQ</p>
          <h2 className="mt-3 text-3xl md:text-5xl font-bold tracking-[-0.01em] text-white">
            Questions and answers.
          </h2>
        </div>

        <div className="mt-12 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-glass p-2 md:p-4">
          <Accordion type="single" defaultValue="faq-0">
            {faqs.map((faq, idx) => (
              <AccordionItem
                key={idx}
                value={`faq-${idx}`}
                className="px-2 md:px-4"
              >
                <AccordionTrigger className="!text-base font-semibold !py-5">
                  <span className="text-left">{faq.q}</span>
                </AccordionTrigger>
                <AccordionContent className="!text-sm pr-2 leading-relaxed text-white/70">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <p className="mt-8 text-center text-xs text-white/40">
          Still have questions? Reach the team via the contact form below.
        </p>
      </div>
    </section>
  );
}

export default FAQSection;
