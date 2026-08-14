"use client";

import { LegalLayout } from "@/components/LegalLayout";
import { withBasePath } from "@/lib/basePath";
import { useLanguage } from "@/lib/i18n";

export function PrivacyContent() {
  const { lang } = useLanguage();

  if (lang === "sv") {
    return (
      <LegalLayout title="Integritetspolicy" updated="1 augusti 2026">
        <h2>1. Introduktion</h2>
        <p>
          Denna integritetspolicy förklarar hur Movanta planerar att hantera personuppgifter när du använder vår
          webbplats, går med i väntelistan, eller använder Movanta-appen när den lanseras. Movanta är för
          närvarande under utveckling, och denna policy är ett arbetsutkast publicerat för transparens inför
          lansering.
        </p>

        <h2>2. Uppgifter vi samlar in</h2>
        <ul>
          <li>Kontaktuppgifter du anger, såsom namn, e-postadress och telefonnummer.</li>
          <li>Identitets- och körkortsinformation, insamlad för att verifiera hyresgäster och ägare.</li>
          <li>Bokningsinformation, inklusive upphämtningsplats, datum och fordonsdetaljer.</li>
          <li>Betalningsinformation, hanterad av vår betalningsleverantör — Movanta lagrar inte fullständiga kortnummer.</li>
          <li>Platsdata, när du väljer att dela den, för att visa fordon nära dig och beräkna rutter.</li>
          <li>Teknisk data såsom enhetstyp, webbläsare och allmän användning av webbplatsen eller appen.</li>
        </ul>

        <h2>3. Hur vi använder dina uppgifter</h2>
        <p>
          Vi använder personuppgifter för att driva marknadsplatsen: skapa och hantera konton, behandla bokningar
          och betalningar, verifiera identitet och körkort, tillhandahålla kundsupport och förbättra produkten. Vi
          säljer inte personuppgifter till tredje part.
        </p>

        <h2>4. Delning av dina uppgifter</h2>
        <p>
          Vi delar det minimum som krävs med fordonsägare eller hyresgäster för att slutföra en bokning (till
          exempel ett förnamn och upphämtningsdetaljer), med vår betalningsleverantör för att behandla
          transaktioner, och med en försäkringspartner som en del av det bokningsskydd som beskrivs i våra Villkor.
          Vi kan även dela uppgifter där det krävs enligt lag.
        </p>

        <h2>5. Cookies</h2>
        <p>
          Vi använder cookies och liknande teknik för att hålla dig inloggad och för att förstå hur webbplatsen
          används. Se vår{" "}
          <a href={withBasePath("/cookies")} className="text-yellow hover:underline">
            cookiepolicy
          </a>{" "}
          för detaljer.
        </p>

        <h2>6. Lagring av uppgifter</h2>
        <p>
          Vi behåller personuppgifter så länge ditt konto är aktivt, och under en begränsad period därefter när det
          behövs för juridiska, bokföringsmässiga eller tvistlösningsändamål.
        </p>

        <h2>7. Dina rättigheter</h2>
        <p>
          När appen lanserats, och i linje med tillämplig dataskyddslagstiftning (inklusive GDPR för användare inom
          EU/EES), kommer du att kunna begära tillgång till, rättelse av eller radering av dina personuppgifter, och
          invända mot eller begränsa viss behandling, genom att kontakta oss via uppgifterna nedan.
        </p>

        <h2>8. Datasäkerhet</h2>
        <p>
          Vi avser att tillämpa rimliga tekniska och organisatoriska åtgärder för att skydda personuppgifter mot
          obehörig åtkomst, förlust eller missbruk. Inget system kan garanteras vara helt säkert.
        </p>

        <h2>9. Ändringar av denna policy</h2>
        <p>
          Vi kan uppdatera denna integritetspolicy allteftersom produkten utvecklas. Väsentliga ändringar
          kommuniceras innan de träder i kraft.
        </p>

        <h2>10. Kontakta oss</h2>
        <p>
          Frågor om denna policy eller dina uppgifter kan skickas till{" "}
          <a href="mailto:hello@movanta.com" className="text-yellow hover:underline">
            hello@movanta.com
          </a>
          .
        </p>
      </LegalLayout>
    );
  }

  return (
    <LegalLayout title="Privacy Policy" updated="1 August 2026">
      <h2>1. Introduction</h2>
      <p>
        This Privacy Policy explains how Movanta plans to handle personal data when you use our website, join the
        waitlist, or use the Movanta app once it launches. Movanta is currently in development, and this policy is a
        working draft published for transparency ahead of launch.
      </p>

      <h2>2. Information we collect</h2>
      <ul>
        <li>Contact details you provide, such as name, email address, and phone number.</li>
        <li>Identity and driving licence information, collected to verify renters and owners.</li>
        <li>Booking information, including pickup location, dates, and vehicle details.</li>
        <li>Payment information, processed by our payment provider — Movanta does not store full card numbers.</li>
        <li>Location data, when you choose to share it, to show vehicles near you and calculate routes.</li>
        <li>Technical data such as device type, browser, and general usage of the site or app.</li>
      </ul>

      <h2>3. How we use your information</h2>
      <p>
        We use personal data to operate the marketplace: creating and managing accounts, processing bookings and
        payments, verifying identity and driving licences, providing customer support, and improving the product. We
        do not sell personal data to third parties.
      </p>

      <h2>4. Sharing your information</h2>
      <p>
        We share the minimum necessary information with vehicle owners or renters to complete a booking (for
        example, a first name and pickup details), with our payment provider to process transactions, and with an
        insurance partner as part of the booking protection described in our Terms. We may also share data where
        required by law.
      </p>

      <h2>5. Cookies</h2>
      <p>
        We use cookies and similar technologies to keep you signed in and to understand how the site is used. See our{" "}
        <a href={withBasePath("/cookies")} className="text-yellow hover:underline">
          Cookie Policy
        </a>{" "}
        for details.
      </p>

      <h2>6. Data retention</h2>
      <p>
        We keep personal data for as long as your account is active, and for a limited period afterwards where
        needed for legal, accounting, or dispute-resolution purposes.
      </p>

      <h2>7. Your rights</h2>
      <p>
        Once launched, and in line with applicable data protection law (including the GDPR for users in the EU/EEA),
        you will be able to request access to, correction of, or deletion of your personal data, and to object to or
        restrict certain processing, by contacting us using the details below.
      </p>

      <h2>8. Data security</h2>
      <p>
        We intend to apply reasonable technical and organisational measures to protect personal data against
        unauthorised access, loss, or misuse. No system can be guaranteed fully secure.
      </p>

      <h2>9. Changes to this policy</h2>
      <p>
        We may update this Privacy Policy as the product evolves. Material changes will be communicated before they
        take effect.
      </p>

      <h2>10. Contact us</h2>
      <p>
        Questions about this policy or your data can be sent to{" "}
        <a href="mailto:hello@movanta.com" className="text-yellow hover:underline">
          hello@movanta.com
        </a>
        .
      </p>
    </LegalLayout>
  );
}
