import type { Metadata } from "next";
import { PrivacyContent } from "./PrivacyContent";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Movanta plans to collect, use, and protect your personal data.",
};

export default function PrivacyPage() {
  return <PrivacyContent />;
}
