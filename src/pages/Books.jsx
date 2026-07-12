import { books } from "../data/books.js";

function BookCard({ book }) {
  return (
    <div className="project-card">
      <div className="card-row">
        <span className="card-title">
          {book.title}
          {book.liked && (
            <span className="book-heart" role="img" aria-label="liked this one">
              {" "}
              ♥
            </span>
          )}
        </span>
        {book.reading ? (
          <span className="card-meta">
            <span className="live-dot" aria-hidden="true" /> now
          </span>
        ) : (
          book.year && <span className="card-meta">{book.year}</span>
        )}
      </div>
      <p className="card-body">{book.author}</p>
    </div>
  );
}

export default function Books() {
  const reading = books.filter((b) => b.reading);
  const read = books.filter((b) => !b.reading);

  return (
    <>
      <h1 className="page-title">books</h1>

      {reading.length > 0 && (
        <section>
          <h2 className="section-label">Currently Reading</h2>
          <div className="project-grid">
            {reading.map((b) => (
              <BookCard key={`${b.title}-${b.author}`} book={b} />
            ))}
          </div>
        </section>
      )}

      {read.length > 0 && (
        <section>
          <h2 className="section-label">Read</h2>
          <div className="project-grid">
            {read.map((b) => (
              <BookCard key={`${b.title}-${b.author}`} book={b} />
            ))}
          </div>
        </section>
      )}

      {books.length === 0 && (
        <p style={{ color: "var(--muted)" }}>
          The shelf is empty for now — check back soon.
        </p>
      )}
    </>
  );
}
