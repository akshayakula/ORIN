import { useState } from "react";
import { Check, Loader2, Send } from "lucide-react";
import { Button, Input, Label, Textarea } from "../ui";

export interface ContactFormProps {
  onSubmitted?: () => void;
}

const TOPICS = ["General", "Sales", "Compliance", "Integration", "Press"] as const;

function encode(data: Record<string, string>): string {
  return Object.keys(data)
    .map(
      (key) =>
        encodeURIComponent(key) + "=" + encodeURIComponent(data[key] ?? ""),
    )
    .join("&");
}

export function ContactForm({ onSubmitted }: ContactFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    role: "",
    topic: "General",
    message: "",
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
          "form-name": "contact",
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
          <h3 className="text-lg font-semibold text-white">Message received</h3>
          <p className="mt-1 text-sm text-white/60">
            An ORIN representative will reach out within one business day.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form
      name="contact"
      method="POST"
      data-netlify="true"
      data-netlify-honeypot="bot-field"
      onSubmit={onSubmit}
      className="grid grid-cols-1 md:grid-cols-2 gap-4"
      noValidate
    >
      <input type="hidden" name="form-name" value="contact" />
      <p className="hidden">
        <label>
          Don't fill this out: <input name="bot-field" />
        </label>
      </p>

      <div>
        <Label htmlFor="contact-name">Name *</Label>
        <Input
          id="contact-name"
          name="name"
          required
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="contact-email">Email <span className="text-white/40 normal-case">(optional)</span></Label>
        <Input
          id="contact-email"
          name="email"
          type="email"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="contact-company">Company *</Label>
        <Input
          id="contact-company"
          name="company"
          required
          value={form.company}
          onChange={(e) => update("company", e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="contact-role">Role</Label>
        <Input
          id="contact-role"
          name="role"
          value={form.role}
          onChange={(e) => update("role", e.target.value)}
        />
      </div>
      <div className="md:col-span-2">
        <Label htmlFor="contact-topic">Topic</Label>
        <select
          id="contact-topic"
          name="topic"
          value={form.topic}
          onChange={(e) => update("topic", e.target.value)}
          className="flex h-10 w-full rounded-xl bg-white/5 border border-white/15 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/40 focus:border-cyan-400/40"
        >
          {TOPICS.map((t) => (
            <option key={t} value={t} className="bg-space-900 text-white">
              {t}
            </option>
          ))}
        </select>
      </div>
      <div className="md:col-span-2">
        <Label htmlFor="contact-message">Message *</Label>
        <Textarea
          id="contact-message"
          name="message"
          required
          value={form.message}
          onChange={(e) => update("message", e.target.value)}
          placeholder="How can ORIN help?"
        />
      </div>

      {error && (
        <p className="md:col-span-2 text-xs text-rose-300" role="alert">
          {error}
        </p>
      )}

      <div className="md:col-span-2 flex items-center justify-between gap-3 pt-1">
        <p className="text-[11px] text-white/45">
          ORIN does not accuse sellers of fraud. ORIN does not certify EPA
          validity.
        </p>
        <Button type="submit" variant="primary" disabled={submitting}>
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Send className="h-4 w-4" aria-hidden />
          )}
          {submitting ? "Sending" : "Send Message"}
        </Button>
      </div>
    </form>
  );
}

export default ContactForm;
