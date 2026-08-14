"use client";

import { LegalLayout } from "@/components/LegalLayout";
import { useLanguage } from "@/lib/i18n";

export function TermsContent() {
  const { lang } = useLanguage();

  if (lang === "sv") {
    return (
      <LegalLayout title="Villkor" updated="1 augusti 2026">
        <h2>1. Introduktion</h2>
        <p>
          Dessa villkor (&ldquo;Villkoren&rdquo;) beskriver reglerna för att använda Movanta, en marknadsplats som
          kopplar samman hyresgäster med fordonsägare och företagspartners. Movanta är för närvarande under
          utveckling, och dessa Villkor är ett arbetsutkast publicerat för transparens inför lansering. De är ännu
          inte ett slutgiltigt, juridiskt bindande avtal.
        </p>

        <h2>2. Vilka vi är</h2>
        <p>
          Movanta driver en digital plattform. Vi äger, driver, tillverkar eller underhåller inte några av fordonen
          som listas på plattformen. Varje fordon tillhör en privat ägare eller en verifierad företagspartner, som
          ensam ansvarar för sitt fordons skick, laglighet och trafiksäkerhet.
        </p>

        <h2>3. Behörighet</h2>
        <p>
          För att hyra ett fordon måste du inneha ett giltigt körkort som gäller för fordonskategorin, genomföra
          identitetsverifiering och vara tillräckligt gammal för att lagligt framföra fordonet i fråga. För att lista
          ett fordon måste du vara dess juridiska ägare eller ha uttrycklig befogenhet att hyra ut det.
        </p>

        <h2>4. Bokningar och betalningar</h2>
        <p>
          Priser sätts av ägare och företagspartners, inte av Movanta. En bokning bekräftas när betalningen har
          godkänts via vår betalningsleverantör. Totalpriset som visas vid utcheckning inkluderar hyrespriset, en
          serviceavgift och en skyddsavgift, om inget annat anges.
        </p>

        <h2>5. Avbokningar och ändringar</h2>
        <p>
          Avbokningsvillkor kan variera per annons och visas innan du bekräftar en bokning. Upprepade sena
          avbokningar kan påverka din möjlighet att boka på Movanta i framtiden.
        </p>

        <h2>6. Fordonsägarens ansvar</h2>
        <ul>
          <li>Hålla annonser korrekta, inklusive pris, tillgänglighet och skick.</li>
          <li>Säkerställa att fordonet är trafiksäkert, försäkrat och lagligt tillåtet att hyra ut.</li>
          <li>Överlämna och ta emot fordonet vid avtalad tid och plats.</li>
          <li>Dokumentera fordonets skick före och efter varje uthyrning.</li>
        </ul>

        <h2>7. Hyresgästens ansvar</h2>
        <ul>
          <li>Använda fordonet endast enligt lag och ägarens angivna regler.</li>
          <li>Lämna tillbaka fordonet i tid, i det skick det mottogs, om inget annat avtalats.</li>
          <li>Omedelbart rapportera skador, olyckor eller mekaniska problem.</li>
        </ul>

        <h2>8. Försäkring och skydd</h2>
        <p>
          Försäkringsskydd är tänkt att tillhandahållas via en extern försäkringspartner som en del av
          bokningsflödet. Täckningsdetaljer, undantag och självriskbelopp bekräftas inför lansering och visas
          tydligt innan varje bokning slutförs.
        </p>

        <h2>9. Otillåten användning</h2>
        <p>
          Fordon som bokas via Movanta får inte användas för olagliga syften, obehörig kommersiell verksamhet såsom
          taxiverksamhet utan tillstånd, tävlingskörning, eller annan användning som bryter mot ägarens angivna
          regler eller gällande lag.
        </p>

        <h2>10. Ansvar</h2>
        <p>
          I den utsträckning lagen tillåter är Movanta inte ansvarigt för fordonsägares eller hyresgästers
          handlingar eller underlåtenheter, eller för skicket på något listat fordon. Movantas roll är att
          tillhandahålla marknadsplatsen, verifiering, avtal och supportinfrastrukturen kring varje bokning.
        </p>

        <h2>11. Ändringar av dessa villkor</h2>
        <p>
          Vi kan uppdatera dessa Villkor allteftersom produkten utvecklas. Väsentliga ändringar kommuniceras innan
          de träder i kraft. Fortsatt användning av Movanta efter att ändringar trätt i kraft utgör godkännande av
          de uppdaterade Villkoren.
        </p>

        <h2>12. Tillämplig lag</h2>
        <p>Dessa Villkor är avsedda att regleras av svensk lag, utan hänsyn till lagvalsregler.</p>

        <h2>13. Kontakta oss</h2>
        <p>
          Frågor om dessa Villkor kan skickas till{" "}
          <a href="mailto:hello@movanta.com" className="text-yellow hover:underline">
            hello@movanta.com
          </a>
          .
        </p>
      </LegalLayout>
    );
  }

  return (
    <LegalLayout title="Terms & Conditions" updated="1 August 2026">
      <h2>1. Introduction</h2>
      <p>
        These Terms & Conditions (&ldquo;Terms&rdquo;) describe the rules for using Movanta, a marketplace that connects
        renters with vehicle owners and business partners. Movanta is currently in development, and these Terms are a
        working draft published for transparency ahead of launch. They are not yet a final, legally binding agreement.
      </p>

      <h2>2. Who we are</h2>
      <p>
        Movanta operates a digital platform. We do not own, operate, manufacture, or maintain any of the vehicles
        listed on the platform. Every vehicle belongs to a private owner or a verified business partner, who is
        solely responsible for the condition, legality, and roadworthiness of their vehicle.
      </p>

      <h2>3. Eligibility</h2>
      <p>
        To rent a vehicle you must hold a valid driving licence appropriate to the vehicle category, complete
        identity verification, and be old enough to legally operate the vehicle in question. To list a vehicle, you
        must be its legal owner or have explicit authority to rent it out.
      </p>

      <h2>4. Bookings and payments</h2>
      <p>
        Prices are set by owners and business partners, not by Movanta. A booking is confirmed once payment is
        authorised through our payment provider. The total price shown at checkout includes the rental price, a
        service fee, and a protection fee, unless stated otherwise.
      </p>

      <h2>5. Cancellations and changes</h2>
      <p>
        Cancellation terms will vary by listing and will be shown before you confirm a booking. Repeated late
        cancellations may affect your ability to book on Movanta in the future.
      </p>

      <h2>6. Vehicle owner responsibilities</h2>
      <ul>
        <li>Keep listings accurate, including price, availability, and condition.</li>
        <li>Ensure the vehicle is roadworthy, insured, and legally permitted to be rented out.</li>
        <li>Hand over and receive the vehicle at the agreed time and place.</li>
        <li>Document the vehicle&rsquo;s condition before and after each rental.</li>
      </ul>

      <h2>7. Renter responsibilities</h2>
      <ul>
        <li>Use the vehicle only as permitted by law and by the owner&rsquo;s stated rules.</li>
        <li>Return the vehicle on time, in the condition it was received, unless otherwise agreed.</li>
        <li>Report damage, accidents, or mechanical issues immediately.</li>
      </ul>

      <h2>8. Insurance and protection</h2>
      <p>
        Insurance protection is intended to be provided through an external insurance partner as part of the
        booking flow. Coverage details, exclusions, and self-risk amounts will be confirmed ahead of launch and
        shown clearly before each booking is completed.
      </p>

      <h2>9. Prohibited use</h2>
      <p>
        Vehicles booked through Movanta may not be used for illegal purposes, unauthorised commercial activity such
        as ride-hailing without permission, racing, or any use that violates the owner&rsquo;s stated rules or
        applicable law.
      </p>

      <h2>10. Liability</h2>
      <p>
        To the extent permitted by law, Movanta is not liable for the acts or omissions of vehicle owners or
        renters, or for the condition of any listed vehicle. Movanta&rsquo;s role is to provide the marketplace,
        verification, agreements, and support infrastructure around each booking.
      </p>

      <h2>11. Changes to these Terms</h2>
      <p>
        We may update these Terms as the product evolves. Material changes will be communicated before they take
        effect. Continued use of Movanta after changes take effect constitutes acceptance of the updated Terms.
      </p>

      <h2>12. Governing law</h2>
      <p>These Terms are intended to be governed by the laws of Sweden, without regard to conflict-of-law rules.</p>

      <h2>13. Contact us</h2>
      <p>
        Questions about these Terms can be sent to{" "}
        <a href="mailto:hello@movanta.com" className="text-yellow hover:underline">
          hello@movanta.com
        </a>
        .
      </p>
    </LegalLayout>
  );
}
