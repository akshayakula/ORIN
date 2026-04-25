import { useState } from "react";
import { Check, LifeBuoy, Loader2 } from "lucide-react";
import { Button, Input, Label, Textarea } from "../ui";

export interface SupportFormProps {
  onSubmitted?: () => void;
}

const SUBJECTS = ["Technical", "Audit", "Billing", "Feature", "Other"] as const;
const SEVERITIES = ["Low", "Medium", "High", "Urgent"] as const;

function encode(data: Record<string, string>): string {
  return Object.keys(data)
    .map(
      (key) =>
        encodeURIComponent(key) + "=" + encodeURIComponent(data[key] ?? ""),
    )
    .join("&");
}

export function SupportForm({ onSubmitted }: SupportFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "Technical",
    lotId: "",
    severity: "Medium",
    description: "",
  });

  const update = (k: keyof typeof form, v: string) =>
    setForm((s) => ({ ...s, [k]: v }));

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: encode({
          "form-name": "support",
          "bot-field": "",
          ...form,
        }),
      });
      if (!res.ok) throw new Error("Submission failed");
      setDone(true);
      onSubmitted?.();
    } catch (err) {
      setError("Unable to submit right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10">
          <Check className="h-6 w-6 text-emerald-300" aria-hidden />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Ticket filed</h3>
          <p className="mt-1 text-sm text-white/60">
            An ORIN support engineer will reply shortly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form
      name="support"
      method="POST"
      data-netlify="true"
      data-netlify-honeypot="bot-field"
      onSubmit={onSubmit}
      className="grid grid-cols-1 md:grid-cols-2 gap-4"
      noValidate
    >
      <input type="hidden" name="form-name" value="support" />
      <p className="hidden">
        <label>
          Don't fill this out: <input name="bot-field" />
        </label>
      </p>

      <div>
        <Label htmlFor="support-name">Name *</Label>
        <Input
          id="support-name"
          name="name"
          required
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="support-email">Email <span className="text-white/40 normal-case">(optional)</span></Label>
        <Input
          id="support-email"
          name="email"
          type="email"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="support-subject">Subject</Label>
        <select
          id="support-subject"
          name="subject"
          value={form.subject}
          onChange={(e) => update("subject", e.target.value)}
          className="flex h-10 w-full rounded-xl bg-white/5 border border-white/15 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/40 focus:border-cyan-400/40"
        >
          {SUBJECTS.map((s) => (
            <option key={s} value={s} className="bg-space-900 text-white">
              {s}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label htmlFor="support-lot">Lot ID (optional)</Label>
        <Input
          id="support-lot"
          name="lotId"
          placeholder="ORIN-D3-003"
          value={form.lotId}
          onChange={(e) => update("lotId", e.target.value)}
        />
      </div>

      <div className="md:col-span-2">
        <Label htmlFor="support-severity">Severity</Label>
        <select
          id="support-severity"
          name="severity"
          value={form.severity}
          onChange={(e) => update("severity", e.target.value)}
          className="flex h-10 w-full rounded-xl bg-white/5 border border-white/15 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/40 focus:border-cyan-400/40"
        >
          {SEVERITIES.map((s) => (
            <option key={s} value={s} className="bg-space-900 text-white">
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="md:col-span-2">
        <Label htmlFor="support-description">Description *</Label>
        <Textarea
          id="support-description"
          name="description"
          required
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          placeholder="Describe the issue, steps to reproduce, and impact."
        />
      </div>

      {error && (
        <p className="md:col-span-2 text-xs text-rose-300" role="alert">
          {error}
        </p>
      )}

      <div className="md:col-span-2 flex items-center justify-end gap-3 pt-1">
        <Button type="submit" variant="primary" disabled={submitting}>
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <LifeBuoy className="h-4 w-4" aria-hidden />
          )}
          {submitting ? "Submitting" : "Submit Ticket"}
        </Button>
      </div>
    </form>
  );
}

export default SupportForm;
