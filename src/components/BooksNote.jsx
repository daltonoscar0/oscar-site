import { reading, shelf } from "../data/books.js";

// A small notes-app style list under Now, most recent first. The data file
// stays in the order books were read; this just flips it for display.
const newestFirst = [...shelf]
  .reverse()
  .map((p) => ({ ...p, books: [...p.books].reverse() }));

export default function BooksNote() {
  const count = shelf.reduce((n, p) => n + p.books.length, 0);

  return (
    <div className="books-note">
      <div className="books-side">
        <p className="label">reading</p>
        {reading.map((b) => (
          <p key={b.title} className="books-reading">
            <span className="live-dot" aria-hidden="true" />
            <span>
              {b.title} <span className="books-by">- {b.author}</span>
            </span>
          </p>
        ))}
        <p className="books-count">
          {count} read · <b>bold</b> = loved it
        </p>
      </div>

      <div className="note" tabIndex={0} aria-label="Books I've read">
        {newestFirst.map((p) => (
          <div key={p.period} className="note-period">
            <p className="note-when">{p.period}</p>
            <ul>
              {p.books.map((b) => (
                <li key={b.title} className={b.liked ? "loved" : undefined}>
                  {b.title} - {b.author}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
