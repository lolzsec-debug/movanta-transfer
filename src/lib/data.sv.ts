// Swedish translation of data.ts — same shape/export names, so components can
// pick the right dataset by language without changing how they consume it.
import type {
  NavLink,
  ProcessStep,
  ProblemPoint,
  PositioningPillar,
  MarketComparison,
  BusinessFeature,
  TrustFeature,
  DropFeature,
  CommunityFeature,
  FaqItem,
  InterestOption,
  PreviewVehicle,
} from "./data";

export const brand = {
  name: "Movanta",
  slogan: "Din nästa resa, redo i närheten.",
  socialTagline: "Färre stillastående fordon. Mer delad frihet.",
  waitlistCta: "Gå med i väntelistan",
  appCta: "Öppna appen",
} as const;

export const navLinks: NavLink[] = [
  { label: "Så fungerar det", href: "#how-it-works" },
  { label: "För fordonsägare", href: "#private" },
  { label: "Movanta Business", href: "#business" },
  { label: "Om Movanta", href: "#about" },
];

export const howItWorksSteps: ProcessStep[] = [
  {
    number: "01",
    title: "Hitta ett fordon i närheten",
    description:
      "Sök bilar, motorcyklar, båtar och andra motordrivna fordon i ditt område, filtrerat efter avstånd, pris och tillgänglighet.",
  },
  {
    number: "02",
    title: "Verifiera och boka",
    description: "Bekräfta din identitet och ditt körkort en gång, boka sedan med några knapptryck.",
  },
  {
    number: "03",
    title: "Hämta och dokumentera",
    description: "Träffa ägaren eller en partnerplats, och dokumentera skick och miltal tillsammans.",
  },
  {
    number: "04",
    title: "Kör och lämna tillbaka",
    description: "Använd fordonet under din bokade period, lämna sedan tillbaka det och avsluta avtalet.",
  },
];

export const problemPoints: ProblemPoint[] = [
  {
    title: "Fordon står stilla",
    description:
      "De flesta privatägda bilar, motorcyklar och båtar står parkerade eller förtöjda, oanvända större delen av dagen.",
  },
  {
    title: "Behoven är ofta tillfälliga",
    description: "Många behöver ett fordon för några timmar eller dagar, inte ett långsiktigt åtagande.",
  },
  {
    title: "Traditionell uthyrning är begränsad",
    description: "Uthyrningsdiskar ligger ofta långt bort, är dyra eller bundna till strikta öppettider.",
  },
  {
    title: "Ägare saknar en enkel väg",
    description: "Fordonsägare har sällan ett säkert, strukturerat sätt att tjäna på outnyttjad tid.",
  },
];

export const solutionPoints: string[] = [
  "Hyresgäster som söker ett fordon i närheten",
  "Privata ägare med outnyttjad kapacitet",
  "Verifierade företag med fordonsflottor att hantera",
  "Försäkringspartners som skyddar varje bokning",
  "Digitala avtal och dokumentation",
];

export const visionLine = "Framtidens fordonstillgång står redan parkerad i närheten.";

export const positioningPillars: PositioningPillar[] = [
  { title: "Tillgångslätt", description: "Ingen egen fordonsflotta" },
  { title: "Lokal tillgång", description: "Fordon i närheten" },
  { title: "Förtroendelager", description: "Avtal och bevisning" },
  { title: "Två motorer", description: "Privat och Företag" },
];

export const marketComparison: MarketComparison[] = [
  { label: "Annonssajter", description: "Upptäckt utan ett strukturerat uthyrningsflöde." },
  { label: "Traditionell uthyrning", description: "Egen fordonsflotta, kapitalkrävande och mindre lokal." },
  {
    label: "Movanta",
    description: "Marknadsplats, förtroende, bevisning och partnerinfrastruktur, tillsammans.",
    highlight: true,
  },
];

export const renterFeatures: string[] = [
  "Hitta bilar, motorcyklar, båtar och mer i närheten",
  "Boka på minuter, ingen pappersexercis",
  "Tydliga villkor innan du bekräftar",
  "Försäkrad uthyrning vid varje bokning",
  "Support när du behöver det",
  "Recensioner från verkliga bokningar",
];

export const ownerFeatures: string[] = [
  "Sätt ditt eget pris",
  "Bestäm när ditt fordon är tillgängligt",
  "Tjäna på tid det annars skulle stå stilla",
  "Acceptera eller avböj varje bokning",
  "Dokumentera skick före och efter",
  "Följ dina intäkter på ett ställe",
];

export const businessFeatures: BusinessFeature[] = [
  { title: "Lista din flotta", description: "Lägg till flera fordon på Movanta från ett enda konto." },
  { title: "Nå nya kunder", description: "Bli upptäckt av hyresgäster som söker i ditt område." },
  { title: "Sätt din egen prissättning", description: "Styr priser och tillgänglighet per fordon, på dina villkor." },
  {
    title: "Utökade provkörningar",
    description: "Erbjud längre, verklighetsnära upplevelser inför ett potentiellt köp.",
  },
  { title: "Flera platser", description: "Stöd flera upphämtnings- och återlämningsplatser inom din verksamhet." },
  { title: "Rapportering och verktyg", description: "Följ bokningar, nyttjandegrad och intäkter i en instrumentpanel." },
];

export const dealerJourneySteps: string[] = [
  "Kunden ser ett fordon i lager",
  "Återförsäljaren presenterar Movanta som ett alternativ",
  "Bokningen hanteras via Movanta",
  "Kunden använder fordonet i vardagen",
  "Kunden lämnar tillbaka, hyr igen eller köper",
];

export const trustFeatures: TrustFeature[] = [
  { title: "Identitetsverifiering", description: "Varje hyresgäst bekräftar sin identitet innan bokning." },
  { title: "Körkortsverifiering", description: "Körkortskontroller är inbyggda i bokningsflödet." },
  { title: "Digitala avtal", description: "Varje uthyrning backas upp av ett tydligt, digitalt avtal." },
  {
    title: "Dokumentation före och efter",
    description: "Foton, miltal och skicknoteringar registreras vid upphämtning och återlämning.",
  },
  { title: "Tidsstämplade poster", description: "Varje steg tidsstämplas, vilket skapar en pålitlig dokumentation." },
  {
    title: "Support och tvisteunderlag",
    description: "Dokumentation finns tillgänglig om en bokning behöver granskas.",
  },
];

export const dropsFeatures: DropFeature[] = [
  { title: "Säkra nyckelskåp", description: "Hämta och lämna fordon utan att vänta på ägaren." },
  { title: "Partnerplatser", description: "Återförsäljare och lokala företag kan fungera som upphämtningsnav." },
  { title: "Synligt i appen", description: "Upphämtningspunkter visas tillsammans med fordon när du söker." },
  { title: "Snabbare överlämning", description: "Ett enklare sätt att hämta och lämna utanför ägarens öppettider." },
];

export const communityFeatures: CommunityFeature[] = [
  {
    title: "Mobility Credits",
    description: "Tjänas in genom ansvarsfulla uthyrningar och kan användas överallt på Movanta.",
  },
  {
    title: "Local Hero-programmet",
    description: "Uppskattning för ägare som konsekvent ställer upp för sina hyresgäster.",
  },
  { title: "Ägarträffar", description: "Enstaka träffar där ägare kan mötas och utbyta erfarenheter." },
  { title: "Gemenskapens transportdagar", description: "Lokala evenemang kring delad tillgång till fordon." },
  {
    title: "Lokala företagssamarbeten",
    description: "Samarbete med lokala företag för att skapa mer värde för gemenskapen.",
  },
];

export const impactPoints: string[] = [
  "Färre fordon som står oanvända större delen av dagen",
  "Bättre användning av fordon som redan finns",
  "Extra inkomst för ägare, från kapacitet de redan har",
  "Bättre tillgång till transport i mindre orter",
  "Stöd för lokala företag som agerar partners",
  "Transport tillgänglig närmare där människor faktiskt behöver den",
];

export const faqItems: FaqItem[] = [
  {
    question: "Vad är Movanta?",
    answer:
      "Movanta är en digital marknadsplats som kopplar samman personer som behöver ett fordon med privata ägare och verifierade företag som har ett i närheten. Vi tillhandahåller bokning, avtal, verifiering och support kring varje uthyrning.",
  },
  {
    question: "Äger Movanta fordonen?",
    answer:
      "Nej. Movanta äger eller driver inga fordon. Varje listat fordon tillhör en privat ägare eller en företagspartner. Movanta tillhandahåller plattformen som kopplar samman dem med hyresgäster.",
  },
  {
    question: "Vem bestämmer priset?",
    answer:
      "Fordonsägare och företagspartners sätter sina egna priser och sin egen tillgänglighet. Movanta fastställer inte hyrespriser.",
  },
  {
    question: "Hur fungerar försäkringen?",
    answer:
      "Försäkringsskydd är tänkt att tillhandahållas via en extern försäkringspartner som en del av bokningsflödet. Detaljer bekräftas inför lansering.",
  },
  {
    question: "Kan företag använda Movanta?",
    answer:
      "Ja. Movanta Business är utformat för bil-, motorcykel- och båthandlare och andra professionella fordonsägare som vill lista flera fordon, hantera tillgänglighet och nå nya kunder. Detta är för närvarande en planerad produkt.",
  },
  {
    question: "När lanseras Movanta?",
    answer:
      "Movanta är för närvarande under utveckling. Att gå med i väntelistan är det bästa sättet att bli meddelad allt eftersom vi närmar oss lansering.",
  },
  {
    question: "Vilka fordon kommer att finnas tillgängliga?",
    answer:
      "Movanta är byggt för alla fordon som drivs av motor eller batteri — bilar, skåpbilar, motorcyklar, båtar, husbilar och mer. Utbudet växer stad för stad allt eftersom ägare och partners ansluter sig.",
  },
  {
    question: "Hur blir jag pilotpartner?",
    answer:
      "Företag som är intresserade av en tidig pilot kan anmäla sitt intresse via väntelisteformuläret och ange att de representerar ett företag.",
  },
];

export const interestOptions: InterestOption[] = [
  { value: "rent", label: "Jag vill hyra" },
  { value: "list", label: "Jag vill lista mitt fordon" },
  { value: "dealer", label: "Jag representerar ett fordonsföretag" },
  { value: "other-business", label: "Jag representerar en annan typ av företag" },
  { value: "partner", label: "Jag vill bli partner" },
];

export const previewVehicles: PreviewVehicle[] = [
  {
    id: "v1",
    name: "Kompakt halvkombi",
    category: "Stadsbil",
    kind: "car",
    distanceKm: 0.6,
    pricePerDay: 420,
    verified: true,
    top: "28%",
    left: "34%",
  },
  {
    id: "v2",
    name: "Turistmotorcykel",
    category: "Motorcykel",
    kind: "motorcycle",
    distanceKm: 1.4,
    pricePerDay: 380,
    verified: true,
    top: "56%",
    left: "62%",
  },
  {
    id: "v3",
    name: "Dagsbåt",
    category: "Motorbåt",
    kind: "boat",
    distanceKm: 2.1,
    pricePerDay: 890,
    verified: false,
    top: "68%",
    left: "22%",
  },
];

export const businessDashboardStats = [
  { label: "Aktiv flotta", value: "24", suffix: "fordon" },
  { label: "Bokningar denna månad", value: "58", suffix: "uthyrningar" },
  { label: "Intäkter denna månad", value: "142 300", suffix: "SEK" },
  { label: "Genomsn. nyttjande", value: "61", suffix: "%" },
] as const;

export const businessDashboardRequests = [
  { vehicle: "SUV · Automat", location: "Central upphämtning", status: "Ny förfrågan" },
  { vehicle: "Motorcykel · Manuell", location: "Norra depån", status: "Väntar på dokument" },
  { vehicle: "Motorbåt · Automat", location: "Hämtning vid marina", status: "Bekräftad" },
] as const;
