# Movanta

Peer-to-peer fordonsuthyrning — hyr bilar, motorcyklar, båtar, husbilar, mopeder, släpvagnar och mer av privatpersoner och verifierade företag i närheten.

**Live-demo:** https://josefanderberg.github.io/movanta-transfer/
**Appen:** https://josefanderberg.github.io/movanta-transfer/app

> Detta är en klickbar prototyp. Det finns ingen backend — konton, annonser, bokningar, meddelanden och kontrakt lagras i webbläsarens localStorage. Ingen riktig betalning eller identitetskontroll sker.

## Innehåll

- **Marknadssajt** — hero, problem/lösning, så-funkar-det, väntelista, FAQ samt juridiska sidor (integritet, villkor, cookies). Tvåspråkig (svenska/engelska).
- **Appen (`/app`)** — utforska 24 fordon över alla kategorier med riktiga foton, filter och Leaflet-karta, bokningsflöde med e-signering och PDF-kontrakt, annonsguide med priskalkylator, körkortsverifiering och admin-panel.

### Demokonton

| Roll | E-post | Lösenord |
| --- | --- | --- |
| Användare | `demo@movanta.se` | `demo1234` |
| Hyresgäst | `test.renter@movanta.se` | `test1234` |
| Admin | `admin@movanta.se` | `admin1234` |

## Utveckling

```bash
npm install
npm run dev
```

Öppna [http://localhost:3000](http://localhost:3000).

### Statisk export / deploy

Sajten byggs som statisk export (`output: "export"`) och deployas automatiskt till GitHub Pages via GitHub Actions vid push till `main`. Pages-bygget sätter `NEXT_PUBLIC_BASE_PATH=/movanta-transfer`; lokala byggen utan variabeln hamnar på rot.

```bash
npm run build   # statisk export till out/
```

## Bildkällor

Fordonsfotona kommer från Wikimedia Commons under fria licenser — källor, upphovspersoner och licenser per bild finns i [IMAGE_ATTRIBUTIONS.json](IMAGE_ATTRIBUTIONS.json).
