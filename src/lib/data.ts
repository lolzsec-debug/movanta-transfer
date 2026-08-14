// Central content and configuration for the Movanta landing page.
// Keeping copy and structural data here (rather than scattered in components)
// makes it straightforward to update messaging without touching layout code.

export const brand = {
  name: "Movanta",
  slogan: "Ready when you are. Nearby when you need it.",
  socialTagline: "Less idle vehicles. More shared freedom.",
  waitlistCta: "Join the waitlist",
  appCta: "Open the app",
} as const;

export type NavLink = {
  label: string;
  href: string;
};

export const navLinks: NavLink[] = [
  { label: "How it works", href: "#how-it-works" },
  { label: "For vehicle owners", href: "#private" },
  { label: "Movanta Business", href: "#business" },
  { label: "About Movanta", href: "#about" },
];

export type ProcessStep = {
  number: string;
  title: string;
  description: string;
};

export const howItWorksSteps: ProcessStep[] = [
  {
    number: "01",
    title: "Find a vehicle nearby",
    description:
      "Search cars, motorcycles, boats and other motorised vehicles in your area, filtered by distance, price, and availability.",
  },
  {
    number: "02",
    title: "Verify and book",
    description:
      "Confirm your identity and driving licence once, then book in a few taps.",
  },
  {
    number: "03",
    title: "Pick up and document",
    description:
      "Meet the owner or a partner location, and record condition and mileage together.",
  },
  {
    number: "04",
    title: "Drive and return",
    description:
      "Use the vehicle for your booking window, then return it and close out the agreement.",
  },
];

export type ProblemPoint = {
  title: string;
  description: string;
};

export const problemPoints: ProblemPoint[] = [
  {
    title: "Vehicles sit idle",
    description:
      "Most privately owned cars, motorcycles and boats sit parked or docked, unused for the majority of each day.",
  },
  {
    title: "Needs are often temporary",
    description:
      "People frequently need a vehicle for a few hours or days, not a long-term commitment.",
  },
  {
    title: "Traditional rental is limited",
    description:
      "Rental counters are often far away, expensive, or bound to rigid pickup hours.",
  },
  {
    title: "Owners lack a simple path",
    description:
      "Vehicle owners rarely have a safe, structured way to earn from unused time.",
  },
];

export const solutionPoints: string[] = [
  "Renters looking for a nearby vehicle",
  "Private owners with unused capacity",
  "Verified businesses with fleets to manage",
  "Insurance partners protecting every booking",
  "Digital agreements and documentation",
];

export const visionLine =
  "The future of vehicle access is already parked nearby.";

export type PositioningPillar = {
  title: string;
  description: string;
};

export const positioningPillars: PositioningPillar[] = [
  { title: "Asset-light", description: "No owned fleet" },
  { title: "Local access", description: "Nearby vehicles" },
  { title: "Trust layer", description: "Contracts and evidence" },
  { title: "Two engines", description: "Private and Business" },
];

export type MarketComparison = {
  label: string;
  description: string;
  highlight?: boolean;
};

export const marketComparison: MarketComparison[] = [
  {
    label: "Classifieds",
    description: "Discovery without a structured rental flow.",
  },
  {
    label: "Traditional rental",
    description: "Fleet-owned, capital-heavy, and less local.",
  },
  {
    label: "Movanta",
    description: "Marketplace, trust, evidence and partner infrastructure, together.",
    highlight: true,
  },
];

export type PrivateFeature = string;

export const renterFeatures: PrivateFeature[] = [
  "Find cars, motorcycles, boats and more nearby",
  "Book in minutes, no paperwork queue",
  "Clear terms before you confirm",
  "Insured rental on every booking",
  "Support when you need it",
  "Reviews from real bookings",
];

export const ownerFeatures: PrivateFeature[] = [
  "Set your own price",
  "Decide when your vehicle is available",
  "Earn from time it would otherwise sit idle",
  "Accept or decline each booking",
  "Document condition before and after",
  "Track your earnings in one place",
];

export type BusinessFeature = {
  title: string;
  description: string;
};

export const businessFeatures: BusinessFeature[] = [
  {
    title: "List your fleet",
    description: "Bring multiple vehicles onto Movanta from a single account.",
  },
  {
    title: "Reach new customers",
    description: "Get discovered by renters searching in your area.",
  },
  {
    title: "Set your own pricing",
    description: "Control rates and availability per vehicle, on your terms.",
  },
  {
    title: "Extended test drives",
    description:
      "Offer longer, real-world experiences ahead of a potential purchase.",
  },
  {
    title: "Multiple locations",
    description: "Support several pickup and drop-off points across your sites.",
  },
  {
    title: "Reporting and tools",
    description: "Follow bookings, utilisation and revenue in one dashboard.",
  },
];

export const dealerJourneySteps: string[] = [
  "Customer views a vehicle in stock",
  "Dealer introduces Movanta as an option",
  "Booking is handled through Movanta",
  "Customer uses the vehicle in daily life",
  "Customer returns, rents again, or buys",
];

export type TrustFeature = {
  title: string;
  description: string;
};

export const trustFeatures: TrustFeature[] = [
  {
    title: "Identity verification",
    description: "Every renter confirms their identity before booking.",
  },
  {
    title: "Driving licence verification",
    description: "Licence checks are built into the booking flow.",
  },
  {
    title: "Digital agreements",
    description: "Each rental is backed by a clear, digital agreement.",
  },
  {
    title: "Before and after documentation",
    description:
      "Photos, mileage and condition notes are recorded at pickup and return.",
  },
  {
    title: "Timestamped records",
    description: "Every step is time-stamped, creating a reliable record.",
  },
  {
    title: "Support and dispute records",
    description: "Documentation is available if a booking needs to be reviewed.",
  },
];

export type DropFeature = {
  title: string;
  description: string;
};

export const dropsFeatures: DropFeature[] = [
  {
    title: "Secure key lockers",
    description: "Collect and return vehicles without waiting for the owner.",
  },
  {
    title: "Partner pickup locations",
    description: "Dealerships and local businesses can act as collection hubs.",
  },
  {
    title: "Visible in the app",
    description: "Drop points show up alongside vehicles when you search.",
  },
  {
    title: "Faster handover",
    description: "A simpler way to collect and return outside owner hours.",
  },
];

export type CommunityFeature = {
  title: string;
  description: string;
};

export const communityFeatures: CommunityFeature[] = [
  {
    title: "Mobility Credits",
    description: "Earned through responsible rentals and redeemable across Movanta.",
  },
  {
    title: "Local Hero program",
    description: "Recognition for owners who consistently show up for their renters.",
  },
  {
    title: "Owner meetups",
    description: "Occasional gatherings for owners to connect and share experience.",
  },
  {
    title: "Community transport days",
    description: "Local events organised around shared access to vehicles.",
  },
  {
    title: "Local business partnerships",
    description: "Working with nearby businesses to bring more value to the community.",
  },
];

export const impactPoints: string[] = [
  "Fewer vehicles sitting unused for most of the day",
  "Better use of vehicles that already exist",
  "Extra income for owners, from capacity they already have",
  "Improved access to transport in smaller towns",
  "Support for local businesses acting as partners",
  "Transport available closer to where people actually need it",
];

export type FaqItem = {
  question: string;
  answer: string;
};

export const faqItems: FaqItem[] = [
  {
    question: "What is Movanta?",
    answer:
      "Movanta is a digital marketplace connecting people who need a vehicle with private owners and verified businesses who have one nearby. We provide the booking, agreements, verification and support around every rental.",
  },
  {
    question: "Does Movanta own the vehicles?",
    answer:
      "No. Movanta does not own or operate any vehicles. Every vehicle listed belongs to a private owner or a business partner. Movanta provides the platform that connects them with renters.",
  },
  {
    question: "Who decides the price?",
    answer:
      "Vehicle owners and business partners set their own prices and availability. Movanta does not fix rental rates.",
  },
  {
    question: "How does insurance work?",
    answer:
      "Insurance protection is intended to be provided through an external insurance partner as part of the booking flow. Details will be confirmed ahead of launch.",
  },
  {
    question: "Can businesses use Movanta?",
    answer:
      "Yes. Movanta Business is designed for car, motorcycle and boat dealers and other professional vehicle owners who want to list multiple vehicles, manage availability and reach new customers. This is currently a planned product.",
  },
  {
    question: "When does Movanta launch?",
    answer:
      "Movanta is currently under development. Joining the waitlist is the best way to be notified as we get closer to launch.",
  },
  {
    question: "Which vehicles will be available?",
    answer:
      "Movanta is built for any vehicle that runs on a motor or battery — cars, vans, motorcycles, boats, motorhomes and more. Availability will grow city by city as owners and partners join.",
  },
  {
    question: "How can I become a pilot partner?",
    answer:
      "Businesses interested in an early pilot can register their interest through the waitlist form and select that they represent a business.",
  },
];

export type InterestOption = {
  value: string;
  label: string;
};

export const interestOptions: InterestOption[] = [
  { value: "rent", label: "I want to rent" },
  { value: "list", label: "I want to list my vehicle" },
  { value: "dealer", label: "I represent a vehicle business" },
  { value: "other-business", label: "I represent another kind of business" },
  { value: "partner", label: "I want to become a partner" },
];

// --- Marketplace preview mock data (Hero) ---------------------------------
// Generic, non-branded vehicle listings used purely for the interface preview.

export type PreviewVehicleKind = "car" | "motorcycle" | "boat";

export type PreviewVehicle = {
  id: string;
  name: string;
  category: string;
  kind: PreviewVehicleKind;
  distanceKm: number;
  pricePerDay: number;
  verified: boolean;
  top: string;
  left: string;
};

export const previewVehicles: PreviewVehicle[] = [
  {
    id: "v1",
    name: "Compact hatchback",
    category: "City car",
    kind: "car",
    distanceKm: 0.6,
    pricePerDay: 420,
    verified: true,
    top: "28%",
    left: "34%",
  },
  {
    id: "v2",
    name: "Touring motorcycle",
    category: "Motorcycle",
    kind: "motorcycle",
    distanceKm: 1.4,
    pricePerDay: 380,
    verified: true,
    top: "56%",
    left: "62%",
  },
  {
    id: "v3",
    name: "Day boat",
    category: "Motorboat",
    kind: "boat",
    distanceKm: 2.1,
    pricePerDay: 890,
    verified: false,
    top: "68%",
    left: "22%",
  },
];

// --- Business dashboard preview mock data ---------------------------------

export const businessDashboardStats = [
  { label: "Active fleet", value: "24", suffix: "vehicles" },
  { label: "Bookings this month", value: "58", suffix: "rentals" },
  { label: "Revenue this month", value: "142,300", suffix: "SEK" },
  { label: "Avg. utilisation", value: "61", suffix: "%" },
] as const;

export const businessDashboardRequests = [
  { vehicle: "SUV · Automatic", location: "Central pickup", status: "New request" },
  { vehicle: "Motorcycle · Manual", location: "North depot", status: "Awaiting documents" },
  { vehicle: "Motorboat · Automatic", location: "Marina pickup", status: "Confirmed" },
] as const;
