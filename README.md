# oscar-dalton-site

Minimalist personal site for Oscar Dalton. Vite + React, monochrome
light/dark theme, type-forward layout.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build → /dist
```

## Pages

| Route       | Contents                                                                  |
| ----------- | ------------------------------------------------------------------------- |
| `/`         | Rolling "hello, Oscar here." title · tagline · Latest on GitHub · Now block · Recently Played |
| `/about`    | Long-form biography (no pictures, no timeline)                            |
| `/projects` | All public GitHub repos (auto-fetched) + writings + papers, filterable by tag |
| `/contact`  | Cascading list: Instagram, emails, GitHub, CS site, resume, LinkedIn      |

Dark/light toggle lives top-right and remembers the choice.

## Fill-in checklist (search the codebase for `TODO`)

1. **Last.fm API key** → `src/config.js` → `lastfm.apiKey`.
   Get one at <https://www.last.fm/api/account/create>. Until it's
   pasted in, the widget shows a friendly placeholder. The key is
   public/read-only by design, safe to ship in client code.
2. **Resume** → drop `resume.pdf` into `/public` (it serves at `/resume.pdf`).
3. **Biography** → `src/pages/About.jsx`, between the TODO markers.
4. **Writings & papers** → `src/data/works.js`. GitHub repos are pulled
   automatically; never list them by hand.
5. **Now block** → edit `src/data/now.json` whenever life changes.
   The "reading" line is currently a TODO.

## How the live widgets work

- **Latest on GitHub**, reads the public GitHub API for
  `daltonoscar0`'s most recent push (commit message, repo, time).
  No token needed; unauthenticated requests allow 60/hr per visitor IP,
  which is plenty for a personal site.
- **Recently Played**, reads Last.fm's `user.getrecenttracks` for
  `OscarTaco1` and refreshes every 60s, with a pulsing dot when a track
  is playing right now. Keep a scrobbler connected to Apple Music
  (Last.fm iOS app -> Settings -> Connect to Apple Music, or the Last.fm
  desktop app on Mac) so plays keep flowing.

## Deploying (Vercel, recommended)

1. Push this folder to a GitHub repo.
2. <https://vercel.com> -> New Project -> import the repo. Vercel detects
   Vite automatically; defaults are fine.
3. Because this is a single-page app, add a `vercel.json` rewrite if
   you ever see 404s on refresh:

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/" }] }
```

4. Point your domain at it under Project -> Settings -> Domains.

GitHub Pages works too, but needs a base-path tweak in
`vite.config.js` and a 404 redirect hack for client-side routing -
Vercel is less fuss.

## Customizing

- Colors/spacing/fonts: everything is a CSS variable at the top of
  `src/styles.css`.
- Rolling title phrases: `src/config.js` → `rollingTitles` (one entry =
  type once and stop; multiple = cycle).
- Tags: `src/config.js` → `tags`.
