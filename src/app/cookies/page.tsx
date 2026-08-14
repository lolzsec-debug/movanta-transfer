import type { Metadata } from "next";
import { CookiesContent } from "./CookiesContent";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "How Movanta plans to use cookies across the website and app.",
};

export default function CookiesPage() {
  return <CookiesContent />;
}
