# VOIDWAVE — official site

A fast, single-page marketing site for **VOIDWAVE** (*belt automation in the dark*),
built to drive Steam wishlists for the upcoming free demo. Plain HTML/CSS/JS — **no build
step, no dependencies, no framework.** Open it, edit it, drop it on any host.

```
voidwave-game/
├── index.html        # the landing page
├── presskit.html     # press / creators kit
├── css/style.css     # all styles (game's cyan/magenta/void palette)
├── js/
│   ├── config.js     # 👈 EDIT THIS — all links, studio name, demo state
│   └── main.js       # behaviour (nav, reveals, lazy video, lightbox)
└── assets/
    ├── img/favicon.svg
    └── video/        # gameplay clips (Q1–Q6, Attack) pulled from the build
```

## 1. Make it yours (the only required step)

Open **`js/config.js`** and replace the placeholder URLs:

| Field | What it is |
|-------|-----------|
| `steam` | Your Steam store / "Coming Soon" page (every **Wishlist** button) |
| `discord` | Your Discord invite |
| `instagram` | Your Instagram profile |
| `youtube` | Your YouTube channel (or trailer) |
| `twitter` | Optional X/Twitter — leave `""` to hide the icon |
| `press` | Press/contact email (`mailto:`) |
| `studio` | Name shown in the footer + press kit |
| `demoLive` | Set `true` on launch day to flip the wording to "demo is live" |

Every button and icon on the site reads from this one file — change it once, it updates everywhere.

## 2. Preview locally

It's static, so just open `index.html` — but for video autoplay to behave, serve it:

```bash
# any of these from the project folder:
python -m http.server 8080
npx serve .
```

Then visit <http://localhost:8080>.

## 3. Deploy (pick one — all free)

- **Netlify / Vercel** — drag-and-drop the folder, or connect the repo. Done.
- **GitHub Pages** — push to a repo, enable Pages on the `main` branch (root).
- **itch.io** — zip the folder and upload as an HTML project.
- **Cloudflare Pages** — connect repo, no build command, output dir = `/`.

No build command needed anywhere. Output directory is the project root.

## 3a. Avoiding stale caches (important when you redeploy)

Browsers aggressively cache `css`/`js`, so after you change a stylesheet or script, visitors
can keep seeing the **old** version. The CSS/JS `<link>`/`<script>` tags carry a `?v=…`
cache-buster token, and a script bumps it for you:

```powershell
./bump-version.ps1      # rewrites every ?v=… to a fresh timestamp
git add -A
git commit -m "update site"
git push
```

Run `bump-version.ps1` **whenever you've edited `css/` or `js/`** (including `js/config.js`),
right before you commit. It updates `index.html` + `presskit.html` so the new files are fetched
fresh. (No bash? It's a one-liner — just hand-edit the `?v=2` numbers to anything new.)

## 4. Swapping media

- **Hero background clip:** edit the `<source>` in `index.html` (`.hero-video`) to any file in `assets/video/`.
- **Gallery / feature clips:** swap the `data-lazyvid` / `data-vid` paths. Clips lazy-load and only the visible ones play, so adding more is cheap.
- **Screenshots:** when you have stills, you can drop them in `assets/img/` and use them in place of the `<video>` tiles.

## 5. Recommended before launch

- A branded **`assets/img/og-image.jpg`** (1200×630) already ships for social-share previews
  (Discord/X/Facebook). Source vector is `og-image.svg` — re-export if you tweak it, or swap in
  a real gameplay screenshot once you have a hero shot you love.
- Point the `<link rel="canonical">` and `og:url` in `index.html` at your real domain.
- Drop downloadable press assets (logo pack, screenshots `.zip`) into `assets/` and link them
  from `presskit.html`.

---

Palette follows the game: **cyan = your infrastructure, magenta/purple = the Void, orange = heat.**
Respects `prefers-reduced-motion`, works down to small phones, and ships with zero tracking.
