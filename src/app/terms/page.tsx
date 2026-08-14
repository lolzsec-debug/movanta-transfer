import type { Metadata } from "next";
import { TermsContent } from "./TermsContent";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "The terms that will govern use of the Movanta marketplace.",
};

export default function TermsPage() {
  return <TermsContent />;
}
