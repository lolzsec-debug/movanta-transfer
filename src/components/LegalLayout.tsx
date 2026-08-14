"use client";

import { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { Container } from "./ui/Container";
import { Badge } from "./ui/Badge";
import { useLanguage } from "@/lib/i18n";

export function LegalLayout({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  const { t } = useLanguage();
  return (
    <>
      <Navbar />
      <main className="pb-24 pt-32 sm:pt-36">
        <Container>
          <div className="mx-auto max-w-3xl">
            <Badge tone="planned">{t("Draft — pre-launch, not yet legally binding", "Utkast — före lansering, ej juridiskt bindande ännu")}</Badge>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">{title}</h1>
            <p className="mt-2 text-sm text-text-muted">{t("Last updated", "Senast uppdaterad")} {updated}</p>
            <div
              className="mt-10 space-y-1 text-sm leading-relaxed text-text-secondary
              [&_h2]:mt-10 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-text-primary [&_h2:first-child]:mt-0
              [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5"
            >
              {children}
            </div>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
