export function HowItWorksSection() {
  const oldWay = [
    {
      title: "Broker chains",
      body: "Multiple intermediaries quote the same lot. Provenance is hearsay.",
    },
    {
      title: "Phone-call pricing",
      body: "Negotiate by voice. No transparency on what other buyers are paying.",
    },
    {
      title: "Inboxes full of PDFs",
      body: "Attestations and QAP letters arrive over email, often incomplete.",
    },
    {
      title: "Manual diligence",
      body: "Compliance teams spend days assembling lot history and seller paperwork.",
    },
    {
      title: "1–3% brokerage fees",
      body: "Fees baked into the spread. Buyers and sellers both pay.",
    },
    {
      title: "Weeks to close",
      body: "From first email to settlement, multi-week cycles are normal.",
    },
  ];

  const orinWay = [
    {
      title: "One verified marketplace",
      body: "Every listing has a known seller, facility, and ORIN risk score before you click.",
    },
    {
      title: "Transparent pricing",
      body: "See the lot price, vintage, quantity, and reference band — no hidden spread.",
    },
    {
      title: "Audit in 90 seconds",
      body: "Run the ORIN Integrity Audit before purchase. QAP, satellite, and air quality all in one packet.",
    },
    {
      title: "Diligence packet, ready to file",
      body: "Download an institutional-grade PDF for your compliance vault.",
    },
    {
      title: "Marketplace fees, not broker fees",
      body: "Single transparent platform fee. No phone tag.",
    },
    {
      title: "Same-session purchase request",
      body: "From discovery to a routed purchase in minutes, not weeks.",
    },
  ];

  return (
    <section
      id="how-it-works"
      className="relative isolate overflow-hidden py-24 bg-space-900"
    >
      <div className="relative z-10 mx-auto max-w-7xl px-4 md:px-6">
        <div className="mx-auto max-w-3xl">
          <p className="label-mono">RIN PROCUREMENT</p>
          <h2 className="mt-3 text-3xl md:text-5xl font-bold tracking-tight text-white">
            Stop trading RINs over the phone.
          </h2>
          <p className="mt-4 max-w-2xl text-base md:text-lg text-white/60 leading-relaxed">
            RIN procurement still runs on broker calls, emailed PDFs, and weeks
            of back-and-forth. ORIN replaces all of it with a verified digital
            marketplace.
          </p>
        </div>

        <div className="mt-14 grid md:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {/* OLD WAY */}
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025] backdrop-blur-xl p-7">
            <div
              aria-hidden
              className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-400/40 to-transparent"
            />
            <div className="flex items-baseline justify-between">
              <h3 className="text-lg font-semibold tracking-tight text-white/60 line-through decoration-white/30 decoration-1 underline-offset-4">
                The old way
              </h3>
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/35">
                Broker era
              </span>
            </div>

            <ul className="mt-6 space-y-4">
              {oldWay.map((item) => (
                <li
                  key={item.title}
                  className="flex gap-3 text-sm leading-relaxed"
                >
                  <span
                    aria-hidden
                    className="select-none pt-[2px] text-white/35"
                  >
                    —
                  </span>
                  <div className="min-w-0">
                    <span className="font-medium text-white/75">
                      {item.title}.
                    </span>{" "}
                    <span className="text-white/50">{item.body}</span>
                  </div>
                </li>
              ))}
            </ul>

            <p className="mt-6 text-[11px] italic text-white/40">
              Source: industry interviews with obligated parties and trading
              desks.
            </p>
          </div>

          {/* ORIN WAY */}
          <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-white/[0.03] backdrop-blur-xl p-7">
            <div
              aria-hidden
              className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent"
            />
            <div className="flex items-baseline justify-between">
              <h3 className="text-lg font-semibold tracking-tight text-white">
                The ORIN way
              </h3>
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-amber-300/70">
                Marketplace
              </span>
            </div>

            <ul className="mt-6 space-y-4">
              {orinWay.map((item) => (
                <li
                  key={item.title}
                  className="flex gap-3 text-sm leading-relaxed"
                >
                  <span
                    aria-hidden
                    className="select-none pt-[2px] text-amber-300/80"
                  >
                    —
                  </span>
                  <div className="min-w-0">
                    <span className="font-medium text-white">
                      {item.title}.
                    </span>{" "}
                    <span className="text-white/65">{item.body}</span>
                  </div>
                </li>
              ))}
            </ul>

            <p className="mt-6 text-[11px] italic text-white/40">
              Built for compliance teams, trading desks, and obligated parties.
            </p>
          </div>
        </div>

        {/* Comparison metric strip */}
        <div className="mt-10 max-w-4xl mx-auto">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-xl px-6 py-3">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 md:gap-0 text-[11px] md:text-xs text-white/55 font-medium tracking-wide">
              <p className="md:flex-1 text-center md:text-right md:pr-6">
                <span className="text-white/35 mr-2 uppercase tracking-[0.18em] text-[10px]">
                  Old way:
                </span>
                weeks to close · 1–3% brokerage · phone-driven
              </p>
              <span
                aria-hidden
                className="hidden md:block h-6 w-px bg-white/15"
              />
              <p className="md:flex-1 text-center md:text-left md:pl-6">
                <span className="text-amber-300/70 mr-2 uppercase tracking-[0.18em] text-[10px]">
                  ORIN:
                </span>
                minutes to audit · transparent fees · marketplace-driven
              </p>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-[10px] text-white/30 max-w-3xl mx-auto leading-relaxed">
          ORIN flags diligence risk before purchase. ORIN does not accuse
          sellers of fraud and does not certify EPA validity.
        </p>
      </div>
    </section>
  );
}

export default HowItWorksSection;
