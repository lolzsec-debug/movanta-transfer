import type { Metadata } from "next";
import AppShell from "./AppShell";

export const metadata: Metadata = {
  title: "Movanta App",
  description: "Movanta app-prototyp — bläddra, boka och hantera dina fordonshyror.",
};

export default function AppPage() {
  return <AppShell />;
}
