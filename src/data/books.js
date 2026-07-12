// ─────────────────────────────────────────────────────────────
// BOOKS — add a book when you finish it (newest first reads
// nicest). Fields:
//   liked: true    → puts a ♥ on the card
//   reading: true  → shows under "currently reading" at the top
// When you finish a book, delete `reading: true` and add the year.
// ─────────────────────────────────────────────────────────────

export const books = [
  // ── currently reading ──────────────────────────────────────
  { title: "Requiem for a Dream", author: "Hubert Selby Jr.", reading: true },
  { title: "The Invention of Morel", author: "Adolfo Bioy Casares", reading: true },

  // ── 2026 ───────────────────────────────────────────────────
  { title: "Slapstick", author: "Kurt Vonnegut", year: 2026, liked: true },
  { title: "The Prince", author: "Niccolò Machiavelli", year: 2026 },
  { title: "Propaganda", author: "Edward Bernays", year: 2026 },
  { title: "Mother Night", author: "Kurt Vonnegut", year: 2026 },
  { title: "The Conquest of Bread", author: "Peter Kropotkin", year: 2026, liked: true },
  { title: "Tlön, Uqbar, Orbis Tertius (short story)", author: "Jorge Luis Borges", year: 2026 },
  { title: "Johnny Got His Gun", author: "Dalton Trumbo", year: 2026, liked: true },
  { title: "Watchmen", author: "Alan Moore", year: 2026 },
  { title: "Down and Out in Paris and London", author: "George Orwell", year: 2026 },
  { title: "Revolutionary Suicide", author: "Huey P. Newton", year: 2026, liked: true },
  { title: "De Profundis (essay)", author: "Oscar Wilde", year: 2026, liked: true },
  { title: "100 Selected Poems", author: "E. E. Cummings", year: 2026 },
  { title: "Less Than Zero", author: "Bret Easton Ellis", year: 2026, liked: true },

  // ── 2025 ───────────────────────────────────────────────────
  { title: "Waiting for Godot", author: "Samuel Beckett", year: 2025 },
  { title: "Simone de Beauvoir on Women", author: "Jean Leighton", year: 2025 },
  { title: "The Dharma Bums", author: "Jack Kerouac", year: 2025, liked: true },
  { title: "The Trial", author: "Franz Kafka", year: 2025 },
  { title: "Queer", author: "William Burroughs", year: 2025, liked: true },
  { title: "Last Exit to Brooklyn", author: "Hubert Selby Jr.", year: 2025, liked: true },
  { title: "Kaddish and Other Poems", author: "Allen Ginsberg", year: 2025 },
  { title: "Plutonian Ode and Other Poems", author: "Allen Ginsberg", year: 2025, liked: true },
  { title: "Reform or Revolution", author: "Rosa Luxemburg", year: 2025 },
  { title: "The Merchant of Venice", author: "William Shakespeare", year: 2025 },
  { title: "Lolita", author: "Vladimir Nabokov", year: 2025 },
  { title: "On the Road", author: "Jack Kerouac", year: 2025 },
  { title: "The Subterraneans", author: "Jack Kerouac", year: 2025 },
];
