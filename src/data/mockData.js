export const seedEvents = [
  {
    id: 1,
    name: "Annual Event 2027",
    venue: "Grand Hall",
    date: "2027-01-15",
    status: "Ready",
  },
  {
    id: 2,
    name: "VIP Dinner",
    venue: "Sky Lounge",
    date: "2026-11-20",
    status: "Live",
  },
  {
    id: 3,
    name: "Majlis",
    venue: "Community Centre",
    date: "2026-12-01",
    status: "Draft",
  },
];

export const seedHosts = [
  { id: 1, eventId: 1, name: "Host A", capacity: 40, isSuperHost: true },
  { id: 2, eventId: 1, name: "Host B", capacity: 25, isSuperHost: false },
  { id: 3, eventId: 2, name: "Host C", capacity: 35, isSuperHost: true },
];

export const seedGuests = [
  { id: 1, eventId: 1, hostId: 1, name: "Aisha Khan", code: "EF-1A-001", entered: false },
  { id: 2, eventId: 1, hostId: 1, name: "Omar Ali", code: "EF-1A-002", entered: true },
  { id: 3, eventId: 1, hostId: 2, name: "Fatima Noor", code: "EF-1B-001", entered: false },
  { id: 4, eventId: 2, hostId: 3, name: "Zain Malik", code: "EF-2C-001", entered: true },
  { id: 5, eventId: 2, hostId: 3, name: "Sara Ahmed", code: "EF-2C-002", entered: true },
];

export const seedEntries = [
  {
    id: 1,
    guestId: 2,
    eventId: 1,
    hostId: 1,
    guestName: "Omar Ali",
    code: "EF-1A-002",
    scannedAt: "2026-10-25T09:12:00.000Z",
    gate: "Main Gate",
  },
  {
    id: 2,
    guestId: 4,
    eventId: 2,
    hostId: 3,
    guestName: "Zain Malik",
    code: "EF-2C-001",
    scannedAt: "2026-10-25T18:05:00.000Z",
    gate: "Main Gate",
  },
  {
    id: 3,
    guestId: 5,
    eventId: 2,
    hostId: 3,
    guestName: "Sara Ahmed",
    code: "EF-2C-002",
    scannedAt: "2026-10-25T18:11:00.000Z",
    gate: "Main Gate",
  },
];
