"use client";

import { LegalLayout } from "@/components/LegalLayout";
import { useLanguage } from "@/lib/i18n";

export function CookiesContent() {
  const { lang } = useLanguage();

  if (lang === "sv") {
    return (
      <LegalLayout title="Cookiepolicy" updated="1 augusti 2026">
        <h2>1. Vad är cookies</h2>
        <p>
          Cookies är små textfiler som lagras på din enhet när du besöker en webbplats. De hjälper en webbplats att
          komma ihåg vem du är, hålla dig inloggad och förstå hur webbplatsen används.
        </p>

        <h2>2. Hur vi använder cookies</h2>
        <ul>
          <li>
            <strong className="text-text-primary">Nödvändiga cookies</strong> — krävs för kärnfunktioner såsom att
            hålla dig inloggad och slutföra en bokning. Webbplatsen fungerar inte korrekt utan dessa.
          </li>
          <li>
            <strong className="text-text-primary">Preferenscookies</strong> — kommer ihåg val såsom dina
            sökfilter eller språk, så att du inte behöver ställa in dem igen.
          </li>
          <li>
            <strong className="text-text-primary">Analyscookies</strong> — hjälper oss förstå hur webbplatsen och
            appen används, så att vi kan förbättra produkten. Dessa sätts endast med ditt samtycke där lagen kräver
            det.
          </li>
        </ul>

        <h2>3. Hantera cookies</h2>
        <p>
          De flesta webbläsare låter dig se, radera och blockera cookies från en webbplats inställningar. Att
          blockera nödvändiga cookies kan hindra delar av Movanta, såsom att förbli inloggad, från att fungera
          korrekt.
        </p>

        <h2>4. Ändringar av denna policy</h2>
        <p>
          Vi kan uppdatera denna cookiepolicy allteftersom produkten utvecklas. Väsentliga ändringar kommuniceras
          innan de träder i kraft.
        </p>

        <h2>5. Kontakta oss</h2>
        <p>
          Frågor om denna policy kan skickas till{" "}
          <a href="mailto:hello@movanta.com" className="text-yellow hover:underline">
            hello@movanta.com
          </a>
          .
        </p>
      </LegalLayout>
    );
  }

  return (
    <LegalLayout title="Cookie Policy" updated="1 August 2026">
      <h2>1. What are cookies</h2>
      <p>
        Cookies are small text files stored on your device when you visit a website. They help a site remember who
        you are, keep you signed in, and understand how the site is used.
      </p>

      <h2>2. How we use cookies</h2>
      <ul>
        <li>
          <strong className="text-text-primary">Essential cookies</strong> — required for core functionality such as
          staying signed in and completing a booking. The site will not function correctly without these.
        </li>
        <li>
          <strong className="text-text-primary">Preference cookies</strong> — remember choices such as your search
          filters or language, so you don&rsquo;t have to set them again.
        </li>
        <li>
          <strong className="text-text-primary">Analytics cookies</strong> — help us understand how the site and app
          are used, so we can improve the product. These are only set with your consent where required by law.
        </li>
      </ul>

      <h2>3. Managing cookies</h2>
      <p>
        Most browsers let you view, delete, and block cookies from a site&rsquo;s settings. Blocking essential
        cookies may prevent parts of Movanta, such as staying signed in, from working correctly.
      </p>

      <h2>4. Changes to this policy</h2>
      <p>
        We may update this Cookie Policy as the product evolves. Material changes will be communicated before they
        take effect.
      </p>

      <h2>5. Contact us</h2>
      <p>
        Questions about this policy can be sent to{" "}
        <a href="mailto:hello@movanta.com" className="text-yellow hover:underline">
          hello@movanta.com
        </a>
        .
      </p>
    </LegalLayout>
  );
}
