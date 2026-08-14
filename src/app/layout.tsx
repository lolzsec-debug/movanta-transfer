import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ScrollProgress } from "@/components/ui/ScrollProgress";
import { LanguageProvider } from "@/lib/i18n";
import { ThemeProvider } from "@/lib/theme";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

// Placeholder production domain — update once the real domain is confirmed.
const siteUrl = "https://movanta.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Movanta — Rent nearby cars, motorcycles, boats and more",
    template: "%s | Movanta",
  },
  description:
    "Movanta connects renters with nearby vehicles from private owners and verified businesses. Join the waitlist and follow the journey.",
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Movanta",
    title: "Movanta — Rent nearby cars, motorcycles, boats and more",
    description:
      "Movanta connects renters with nearby vehicles from private owners and verified businesses. Join the waitlist and follow the journey.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Movanta — Rent nearby cars, motorcycles, boats and more",
    description:
      "Movanta connects renters with nearby vehicles from private owners and verified businesses. Join the waitlist and follow the journey.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}#organization`,
      name: "Movanta",
      url: siteUrl,
      slogan: "Ready when you are. Nearby when you need it.",
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}#website`,
      url: siteUrl,
      name: "Movanta",
      publisher: { "@id": `${siteUrl}#organization` },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Applies the stored theme before first paint to avoid a dark flash
            on light-theme visits. Must stay inline and synchronous. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              '(function(){try{if(localStorage.getItem("movanta_theme")==="light")document.documentElement.classList.add("light")}catch(e){}})()',
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider>
          <LanguageProvider>
            <ScrollProgress />
            {children}
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
