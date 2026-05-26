// ─────────────────────────────────────────────────────────────
//  CARRIER NEXUS — Real Data Layer
//  Carrier Trucking US, LLC · MC 1688495-C · DOT 4326039
// ─────────────────────────────────────────────────────────────

const NEXUS = {
  company: {
    name: "Carrier Trucking US, LLC",
    mc: "MC 1688495-C",
    dot: "DOT 4326039",
    address: "2001 NW 107th Ave Suite 450, Doral FL 33172",
    email: "crtruckus@gmail.com",
    owned_by: "Women-Owned Small Business"
  },

  drivers: [
    { id: "001", name: "Avis Modesto",      short: "AVIS",       truck: "01", status: "active",   phone: "", dispatch_pct: 0.14 },
    { id: "005", name: "Miguel Fonseca",    short: "MIGUEL",     truck: "05", status: "active",   phone: "", dispatch_pct: 0.13 },
    { id: "003", name: "Guillermo Pinera",  short: "GUILLERMO",  truck: "03", status: "active",   phone: "", dispatch_pct: 0.13 },
    { id: "007", name: "David Fonseca",     short: "DAVID",      truck: "09", status: "active",   phone: "", dispatch_pct: 0.14 },
    { id: "006", name: "Yosviel Pinera",    short: "YOSVIEL",    truck: "06", status: "active",   phone: "", dispatch_pct: 0.13 },
    { id: "009", name: "Laura Moreno",      short: "LAURA",      truck: null, status: "inactive", phone: "", dispatch_pct: 0.00 },
    { id: "002", name: "Amet Abreu",        short: "AMET",       truck: "04", status: "active",   phone: "", dispatch_pct: 0.13 },
    { id: "008", name: "Betty",             short: "BETTY",      truck: null, status: "inactive", phone: "", dispatch_pct: 0.00 },
    { id: "006", name: "Nelson",            short: "NELSON",     truck: "06", status: "active",   phone: "", dispatch_pct: 0.14 },
  ],

  trucks: [
    { unit: "01", year: 2020, make: "Peterbilt", model: "379",       vin: "1XPBD49X9LD683445", status: "active",  driver: "AVIS",      color: "#2e6da4" },
    { unit: "03", year: 2019, make: "Freightliner", model: "Cascadia", vin: "3AKJHHDR5KSKG0547", status: "active",  driver: "GUILLERMO", color: "#2e6da4" },
    { unit: "04", year: 2020, make: "Kenworth",    model: "T680",    vin: "1XKYDP9X9LJ395872", status: "active",  driver: "AMET",      color: "#2e6da4" },
    { unit: "05", year: 2017, make: "Peterbilt",   model: "389",     vin: "1XPBD49X5HD374219", status: "active",  driver: "MIGUEL",    color: "#2e6da4" },
    { unit: "06", year: 2018, make: "Freightliner",model: "Cascadia", vin: "3AKJHHDR5JSJH7234", status: "active",  driver: "NELSON",    color: "#2e6da4" },
    { unit: "09", year: 2016, make: "Kenworth",    model: "T800",    vin: "1NKDX4EX5GJ358902", status: "active",  driver: "DAVID",     color: "#2e6da4" },
  ],

  insurance: [
    {
      broker: "New Alliance Insurance Brokers",
      insurer: "Transverse Specialty Insurance Co.",
      policy: "TRN-AUTO-2025-CT001",
      type: "Commercial Auto / Trucking",
      effective: "2025-04-01", expires: "2026-04-01",
      premium: "$2,910/mo",
      coverage: "$1,000,000 combined single limit",
      status: "active"
    },
    {
      broker: "New Alliance Insurance Brokers",
      insurer: "Transverse Specialty Insurance Co.",
      policy: "TRN-CARGO-2025-CT002",
      type: "Motor Truck Cargo",
      effective: "2025-04-01", expires: "2026-04-01",
      premium: "$1,296.05/mo",
      coverage: "$250,000 per occurrence",
      status: "active"
    }
  ],

  // 60 documents from WhatsApp Documentos group
  documents: [
    {date:"2026-05-22",filename:"AVIS - ALLQUIP LOAD CONFIRMATION 36159.pdf",driver:"AVIS",type:"Load Confirmation",add_deduct:"ADD",cost:null},
    {date:"2026-05-22",filename:"AVIS - ALLQUIP LOAD CONFIRMATION 36158.pdf",driver:"AVIS",type:"Load Confirmation",add_deduct:"ADD",cost:null},
    {date:"2026-05-22",filename:"MIGUEL - ALLQUIP LOAD CONFIRMATION 35544.pdf",driver:"MIGUEL",type:"Load Confirmation",add_deduct:"ADD",cost:null},
    {date:"2026-05-22",filename:"GUILLERMO - ALLQUIP BOL 35544.pdf",driver:"GUILLERMO",type:"BOL",add_deduct:"ADD",cost:null},
    {date:"2026-05-20",filename:"DAVID - STT LOGISTICS BOL 32840.pdf",driver:"DAVID",type:"BOL",add_deduct:"ADD",cost:null},
    {date:"2026-05-19",filename:"DOT_OSOW_AZ_052126114014.pdf",driver:"UNKNOWN",type:"Oversize Permit",add_deduct:"DEDUCT",cost:null},
    {date:"2026-05-19",filename:"DOT_OSOW_TX_052126114015.pdf",driver:"UNKNOWN",type:"Oversize Permit",add_deduct:"DEDUCT",cost:null},
    {date:"2026-05-19",filename:"NMDOT_052126114016.pdf",driver:"UNKNOWN",type:"State Permit",add_deduct:"DEDUCT",cost:null},
    {date:"2026-05-18",filename:"AMET - COAST TO COAST BOL 120630.pdf",driver:"AMET",type:"BOL",add_deduct:"ADD",cost:null},
    {date:"2026-05-18",filename:"AVIS - COAST TO COAST LOAD CONFIRMATION 120630.pdf",driver:"AVIS",type:"Load Confirmation",add_deduct:"ADD",cost:null},
    {date:"2026-05-18",filename:"NELSON - WLE BOL 2070-0047-1225.pdf",driver:"NELSON",type:"BOL",add_deduct:"ADD",cost:null},
    {date:"2026-05-18",filename:"S260518GAPROS001.pdf",driver:"UNKNOWN",type:"GA Permit",add_deduct:"DEDUCT",cost:null},
    {date:"2026-05-16",filename:"GUILLERMO - SET LOGISTICS BOL 332500.pdf",driver:"GUILLERMO",type:"BOL",add_deduct:"ADD",cost:null},
    {date:"2026-05-16",filename:"GUILLERMO - SET LOGISTICS LOAD CONFIRMATION 332500.pdf",driver:"GUILLERMO",type:"Load Confirmation",add_deduct:"ADD",cost:null},
    {date:"2026-05-15",filename:"YOSVIEL - LRS LOGISTICS BOL 130209.pdf",driver:"YOSVIEL",type:"BOL",add_deduct:"ADD",cost:null},
    {date:"2026-05-15",filename:"YOSVIEL - LRS LOGISTICS LOAD CONFIRMATION 130209.pdf",driver:"YOSVIEL",type:"Load Confirmation",add_deduct:"ADD",cost:null},
    {date:"2026-05-15",filename:"YOSVIEL - LRS LOGISTICS BOL 130148.pdf",driver:"YOSVIEL",type:"BOL",add_deduct:"ADD",cost:null},
    {date:"2026-05-14",filename:"DAVID - EXPRESSWAY LOGISTICS BOL L10483.pdf",driver:"DAVID",type:"BOL",add_deduct:"ADD",cost:null},
    {date:"2026-05-14",filename:"DAVID - EXPRESSWAY LOGISTICS BOL L10399.pdf",driver:"DAVID",type:"BOL",add_deduct:"ADD",cost:null},
    {date:"2026-05-14",filename:"DAVID - EXPRESSWAY LOGISTICS LOAD CONFIRMATION L10483.pdf",driver:"DAVID",type:"Load Confirmation",add_deduct:"ADD",cost:null},
    {date:"2026-05-14",filename:"DAVID - EXPRESSWAY LOGISTICS LOAD CONFIRMATION L10399.pdf",driver:"DAVID",type:"Load Confirmation",add_deduct:"ADD",cost:null},
    {date:"2026-05-13",filename:"NELSON - EXPRESSWAY LOGISTICS BOL L10399.pdf",driver:"NELSON",type:"BOL",add_deduct:"ADD",cost:null},
    {date:"2026-05-13",filename:"NELSON - EXPRESSWAY LOGISTICS LOAD CONFIRMATION L10399.pdf",driver:"NELSON",type:"Load Confirmation",add_deduct:"ADD",cost:null},
    {date:"2026-05-12",filename:"CamScanner 5-12-26.pdf",driver:"UNKNOWN",type:"Scan",add_deduct:"REVIEW",cost:null},
    {date:"2026-05-12",filename:"AMET - ALLQUIP BOL 35544.pdf",driver:"AMET",type:"BOL",add_deduct:"ADD",cost:null},
    {date:"2026-05-12",filename:"AMET - ALLQUIP BOL 35545.pdf",driver:"AMET",type:"BOL",add_deduct:"ADD",cost:null},
    {date:"2026-05-11",filename:"DOT_OSOW_05112026114017.pdf",driver:"UNKNOWN",type:"Oversize Permit",add_deduct:"DEDUCT",cost:null},
    {date:"2026-05-11",filename:"GAPROS_05112026.pdf",driver:"UNKNOWN",type:"GA Permit",add_deduct:"DEDUCT",cost:null},
    {date:"2026-05-11",filename:"NMDOT_05112026.pdf",driver:"UNKNOWN",type:"State Permit",add_deduct:"DEDUCT",cost:null},
    {date:"2026-05-10",filename:"GUILLERMO - ALLQUIP BOL 35544.pdf",driver:"GUILLERMO",type:"BOL",add_deduct:"ADD",cost:null},
    {date:"2026-05-10",filename:"MIGUEL - ALLQUIP BOL 35544.pdf",driver:"MIGUEL",type:"BOL",add_deduct:"ADD",cost:null},
    {date:"2026-05-09",filename:"AMET - COAST TO COAST BOL 120630B.pdf",driver:"AMET",type:"BOL",add_deduct:"ADD",cost:null},
    {date:"2026-05-09",filename:"AVIS - COAST TO COAST BOL 120630.pdf",driver:"AVIS",type:"BOL",add_deduct:"ADD",cost:null},
    {date:"2026-05-08",filename:"DOT_OSOW_TX_05082026.pdf",driver:"UNKNOWN",type:"Oversize Permit",add_deduct:"DEDUCT",cost:null},
    {date:"2026-05-08",filename:"S260508GAPROS002.pdf",driver:"UNKNOWN",type:"GA Permit",add_deduct:"DEDUCT",cost:null},
    {date:"2026-05-08",filename:"YOSVIEL - LRS LOGISTICS BOL 130148B.pdf",driver:"YOSVIEL",type:"BOL",add_deduct:"ADD",cost:null},
    {date:"2026-05-07",filename:"NELSON - WLE LOAD CONFIRMATION 2070-0047-1225.pdf",driver:"NELSON",type:"Load Confirmation",add_deduct:"ADD",cost:null},
    {date:"2026-05-07",filename:"NELSON - NBENNET BOL 9965275.pdf",driver:"NELSON",type:"BOL",add_deduct:"ADD",cost:null},
    {date:"2026-05-07",filename:"NELSON - NBENNET LOAD CONFIRMATION 9965275.pdf",driver:"NELSON",type:"Load Confirmation",add_deduct:"ADD",cost:null},
    {date:"2026-05-06",filename:"CamScanner 5-6-26.pdf",driver:"UNKNOWN",type:"Scan",add_deduct:"REVIEW",cost:null},
    {date:"2026-05-06",filename:"DAVID - STT LOGISTICS LOAD CONFIRMATION 32840.pdf",driver:"DAVID",type:"Load Confirmation",add_deduct:"ADD",cost:null},
    {date:"2026-05-06",filename:"DOT_OSOW_AZ_050626.pdf",driver:"UNKNOWN",type:"Oversize Permit",add_deduct:"DEDUCT",cost:null},
    {date:"2026-05-06",filename:"NMDOT_050626.pdf",driver:"UNKNOWN",type:"State Permit",add_deduct:"DEDUCT",cost:null},
    {date:"2026-05-06",filename:"GAPROS_050626.pdf",driver:"UNKNOWN",type:"GA Permit",add_deduct:"DEDUCT",cost:null},
    {date:"2026-05-06",filename:"GUILLERMO - ALLQUIP LOAD CONFIRMATION 35544.pdf",driver:"GUILLERMO",type:"Load Confirmation",add_deduct:"ADD",cost:null},
    {date:"2026-05-06",filename:"MIGUEL - ALLQUIP LOAD CONFIRMATION 35544B.pdf",driver:"MIGUEL",type:"Load Confirmation",add_deduct:"ADD",cost:null},
    {date:"2026-05-06",filename:"AVIS - ALLQUIP LOAD CONFIRMATION 36155.pdf",driver:"AVIS",type:"Load Confirmation",add_deduct:"ADD",cost:null},
    {date:"2026-05-06",filename:"AMET - ALLQUIP LOAD CONFIRMATION 35544.pdf",driver:"AMET",type:"Load Confirmation",add_deduct:"ADD",cost:null},
    {date:"2026-05-06",filename:"NELSON - WLE BOL 2070-0047-1225B.pdf",driver:"NELSON",type:"BOL",add_deduct:"ADD",cost:null},
    {date:"2026-05-06",filename:"YOSVIEL - LRS LOGISTICS LOAD CONFIRMATION 130209.pdf",driver:"YOSVIEL",type:"Load Confirmation",add_deduct:"ADD",cost:null},
    {date:"2026-05-06",filename:"CamScanner 5-6-26b.pdf",driver:"UNKNOWN",type:"Scan",add_deduct:"REVIEW",cost:null},
    {date:"2026-05-06",filename:"DAVID - EXPRESSWAY LOGISTICS BOL L10399B.pdf",driver:"DAVID",type:"BOL",add_deduct:"ADD",cost:null},
    {date:"2026-05-06",filename:"GUILLERMO - SET LOGISTICS LOAD CONFIRMATION 332500B.pdf",driver:"GUILLERMO",type:"Load Confirmation",add_deduct:"ADD",cost:null},
    {date:"2026-05-06",filename:"AMET - COAST TO COAST LOAD CONFIRMATION 120630.pdf",driver:"AMET",type:"Load Confirmation",add_deduct:"ADD",cost:null},
    {date:"2026-05-06",filename:"YOSVIEL - LRS LOGISTICS BOL 130148C.pdf",driver:"YOSVIEL",type:"BOL",add_deduct:"ADD",cost:null},
    {date:"2026-05-06",filename:"DAVID - EXPRESSWAY LOGISTICS LOAD CONFIRMATION L10399B.pdf",driver:"DAVID",type:"Load Confirmation",add_deduct:"ADD",cost:null},
    {date:"2026-05-06",filename:"NELSON - NBENNET BOL 9965275B.pdf",driver:"NELSON",type:"BOL",add_deduct:"ADD",cost:null},
    {date:"2026-05-06",filename:"MIGUEL - ALLQUIP BOL 35544B.pdf",driver:"MIGUEL",type:"BOL",add_deduct:"ADD",cost:null},
    {date:"2026-05-06",filename:"AVIS - ALLQUIP BOL 36155.pdf",driver:"AVIS",type:"BOL",add_deduct:"ADD",cost:null},
    {date:"2026-05-06",filename:"AMET - ALLQUIP BOL 35544B.pdf",driver:"AMET",type:"BOL",add_deduct:"ADD",cost:null},
    {date:"2026-05-06",filename:"GUILLERMO - SET LOGISTICS BOL 332500B.pdf",driver:"GUILLERMO",type:"BOL",add_deduct:"ADD",cost:null},
  ]
};
