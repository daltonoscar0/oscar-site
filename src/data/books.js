// ─────────────────────────────────────────────────────────────
// BOOKS — most recent at the top. Fields:
//   liked: true    → puts a ♥ on the card
//   reading: true  → shows under "currently reading" at the top
// When you finish a book, delete `reading: true`, add the year,
// and move it to the top of the read list.
// ─────────────────────────────────────────────────────────────

export const books = [
  // ── currently reading ──────────────────────────────────────
  { title: "Post Office", author: "Charles Bukowski", reading: true },

  // ── read, newest first ─────────────────────────────────────
  { title: "Requiem for a Dream", author: "Hubert Selby Jr.", year: 2026, liked: true },
  { title: "Less Than Zero", author: "Bret Easton Ellis", year: 2026, liked: true },
  { title: "100 Selected Poems", author: "E. E. Cummings", year: 2026 },
  { title: "De Profundis (essay)", author: "Oscar Wilde", year: 2026, liked: true },
  { title: "Revolutionary Suicide", author: "Huey P. Newton", year: 2026, liked: true },
  { title: "Down and Out in Paris and London", author: "George Orwell", year: 2026 },
  { title: "Watchmen", author: "Alan Moore", year: 2026 },
  { title: "Johnny Got His Gun", author: "Dalton Trumbo", year: 2026, liked: true },
  { title: "Tlön, Uqbar, Orbis Tertius (short story)", author: "Jorge Luis Borges", year: 2026 },
  { title: "The Conquest of Bread", author: "Peter Kropotkin", year: 2026, liked: true },
  { title: "Mother Night", author: "Kurt Vonnegut", year: 2026 },
  { title: "Propaganda", author: "Edward Bernays", year: 2026 },
  { title: "The Prince", author: "Niccolò Machiavelli", year: 2026 },
  { title: "Slapstick", author: "Kurt Vonnegut", year: 2026, liked: true },
  { title: "The Subterraneans", author: "Jack Kerouac", year: 2025 },
  { title: "On the Road", author: "Jack Kerouac", year: 2025 },
  { title: "Lolita", author: "Vladimir Nabokov", year: 2025 },
  { title: "The Merchant of Venice", author: "William Shakespeare", year: 2025 },
  { title: "Reform or Revolution", author: "Rosa Luxemburg", year: 2025 },
  { title: "Plutonian Ode and Other Poems", author: "Allen Ginsberg", year: 2025, liked: true },
  { title: "Kaddish and Other Poems", author: "Allen Ginsberg", year: 2025 },
  { title: "Last Exit to Brooklyn", author: "Hubert Selby Jr.", year: 2025, liked: true },
  { title: "Queer", author: "William Burroughs", year: 2025, liked: true },
  { title: "The Trial", author: "Franz Kafka", year: 2025 },
  { title: "The Dharma Bums", author: "Jack Kerouac", year: 2025, liked: true },
  { title: "Simone de Beauvoir on Women", author: "Jean Leighton", year: 2025 },
  { title: "Waiting for Godot", author: "Samuel Beckett", year: 2025 },
];
