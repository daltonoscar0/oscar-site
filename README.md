# oscar-site

Personal site, live at https://oscarpdalton.com. Vite + React.

```bash
npm install
npm run dev      # localhost:5173
npm run build    # → dist/
```

## Pages

- `/` is one long page: about, research, now (with books), projects,
  commits, contact.
  Old links (`/about`, `/projects`, `/books`, `/contact`) jump to the
  matching section.
- `/commits` lists every public commit, newest first, grouped by day.
  It loads 100 at a time as you scroll, and each row opens to show the
  full message, comment count, and changed files.

## Editing

| What                      | Where                     |
| ------------------------- | ------------------------- |
| name, degree, links       | `src/config.js`           |
| research areas            | `src/data/research.js`    |
| now                       | `src/data/now.json`       |
| papers, writing           | `src/data/works.js`       |
| books (shown under now)   | `src/data/books.js`       |
| pixel icons               | `GLYPHS` in `src/components/Pixel.jsx` |

Icons are bitmaps of `#` and `.`. Add a new one to `GLYPHS` and use it
with `<Pixel glyph="name" />`.

## Data sources

- GitHub repos and the latest-commit card use the public REST API.
- `/commits` uses GitHub commit search (`author:daltonoscar0`). That
  covers public repos and default branches only, and search returns at
  most 1000 results. Without a token the search limit is about 10
  requests a minute per visitor, so pages are cached in sessionStorage
  for 10 minutes. Opening a commit makes one more request for its file
  list.
- Recently played comes from Last.fm (`OscarTaco1`), refreshed every
  60 seconds.

## Deploy

`npm run deploy` rsyncs `dist/` to the Swarthmore CS server. Pushing to
the `deploy` branch builds the Docker image and pushes it to GHCR.
