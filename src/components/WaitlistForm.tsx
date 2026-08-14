"use client";

import { FormEvent, ReactNode, useState } from "react";
import * as en from "@/lib/data";
import * as sv from "@/lib/data.sv";
import { useLanguage, type Lang } from "@/lib/i18n";
import { Container } from "./ui/Container";
import { SectionHeading } from "./ui/SectionHeading";
import { Reveal } from "./ui/Reveal";
import { Button } from "./ui/Button";

type FormValues = {
  name: string;
  email: string;
  city: string;
  interest: string;
  message: string;
};

type FormErrors = Partial<Record<keyof Omit<FormValues, "message">, string>>;

const initialValues: FormValues = {
  name: "",
  email: "",
  city: "",
  interest: "",
  message: "",
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(values: FormValues, lang: Lang): FormErrors {
  const errors: FormErrors = {};
  const isSv = lang === "sv";

  if (!values.name.trim()) errors.name = isSv ? "Ange ditt namn." : "Please enter your name.";
  if (!values.email.trim()) {
    errors.email = isSv ? "Ange din e-postadress." : "Please enter your email.";
  } else if (!emailPattern.test(values.email.trim())) {
    errors.email = isSv ? "Ange en giltig e-postadress." : "Please enter a valid email address.";
  }
  if (!values.city.trim()) errors.city = isSv ? "Ange din stad." : "Please enter your city.";
  if (!values.interest) errors.interest = isSv ? "Välj det alternativ som bäst beskriver dig." : "Please select what best describes you.";

  return errors;
}

export function WaitlistForm() {
  const { lang, t } = useLanguage();
  const { interestOptions } = lang === "sv" ? sv : en;
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");

  function updateField<K extends keyof FormValues>(field: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationErrors = validate(values, lang);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setStatus("submitting");

    // ---------------------------------------------------------------------
    // Backend integration point.
    // Replace this mock submission with a real request once a backend is
    // ready, e.g.:
    //   await fetch("/api/waitlist", { method: "POST", body: JSON.stringify(values) })
    // or a direct call to Supabase / Formspree / another provider.
    // ---------------------------------------------------------------------
    await new Promise((resolve) => setTimeout(resolve, 700));

    setStatus("success");
    setValues(initialValues);
  }

  if (status === "success") {
    return (
      <section id="waitlist" className="py-24 sm:py-32">
        <Container>
          <Reveal
            className="mx-auto flex max-w-xl flex-col items-center gap-4 rounded-2xl border border-yellow/25 bg-yellow/[0.06] px-8 py-14 text-center"
            role="status"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow text-[#08090A]">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M4 12.5l5 5L20 6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <h2 className="text-2xl font-semibold text-text-primary">{t("You're on the list.", "Du står på listan.")}</h2>
            <p className="text-text-secondary">
              {t(
                "Thank you for your interest in Movanta. We'll be in touch as we get closer to launch.",
                "Tack för ditt intresse för Movanta. Vi hör av oss allt eftersom vi närmar oss lansering."
              )}
            </p>
            <Button variant="secondary" onClick={() => setStatus("idle")} className="mt-2">
              {t("Submit another response", "Skicka ett till svar")}
            </Button>
          </Reveal>
        </Container>
      </section>
    );
  }

  return (
    <section id="waitlist" className="py-24 sm:py-32">
      <Container>
        <SectionHeading
          eyebrow={t("Join us", "Gå med")}
          title={t("Be part of Movanta from the start.", "Var med i Movanta från start.")}
          description={t(
            "Tell us who you are and how you'd like to use Movanta. We'll reach out as launch gets closer.",
            "Berätta vem du är och hur du vill använda Movanta. Vi hör av oss allt eftersom lanseringen närmar sig."
          )}
          align="center"
        />

        <Reveal delay={100} className="mx-auto mt-12 max-w-2xl">
          <form
            noValidate
            onSubmit={handleSubmit}
            className="rounded-2xl border border-ink/10 bg-card p-6 sm:p-9"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label={t("Name", "Namn")}
                htmlFor="name"
                error={errors.name}
              >
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  value={values.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? "name-error" : undefined}
                  className={inputClass(Boolean(errors.name))}
                />
              </Field>

              <Field label={t("Email", "E-post")} htmlFor="email" error={errors.email}>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={values.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  className={inputClass(Boolean(errors.email))}
                />
              </Field>

              <Field label={t("City", "Stad")} htmlFor="city" error={errors.city}>
                <input
                  id="city"
                  name="city"
                  type="text"
                  autoComplete="address-level2"
                  value={values.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  aria-invalid={Boolean(errors.city)}
                  aria-describedby={errors.city ? "city-error" : undefined}
                  className={inputClass(Boolean(errors.city))}
                />
              </Field>

              <Field label={t("I am interested in", "Jag är intresserad av")} htmlFor="interest" error={errors.interest}>
                <select
                  id="interest"
                  name="interest"
                  value={values.interest}
                  onChange={(e) => updateField("interest", e.target.value)}
                  aria-invalid={Boolean(errors.interest)}
                  aria-describedby={errors.interest ? "interest-error" : undefined}
                  className={inputClass(Boolean(errors.interest))}
                >
                  <option value="" disabled>
                    {t("Select an option", "Välj ett alternativ")}
                  </option>
                  {interestOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="mt-5">
              <Field label={t("Message (optional)", "Meddelande (valfritt)")} htmlFor="message">
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  value={values.message}
                  onChange={(e) => updateField("message", e.target.value)}
                  className={inputClass(false)}
                  placeholder={t("Anything you'd like us to know", "Något du vill att vi ska veta")}
                />
              </Field>
            </div>

            <Button
              type="submit"
              disabled={status === "submitting"}
              className="mt-7 w-full sm:w-auto"
            >
              {status === "submitting" ? t("Submitting…", "Skickar…") : t("Join the waitlist", "Gå med i väntelistan")}
            </Button>
          </form>
        </Reveal>
      </Container>
    </section>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-text-secondary">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="text-xs text-yellow" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function inputClass(hasError: boolean) {
  return `w-full rounded-lg border bg-bg-secondary px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:outline-none focus-visible:outline-2 focus-visible:outline-yellow ${
    hasError ? "border-yellow/60" : "border-ink/10 focus:border-ink/25"
  }`;
}
