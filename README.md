# Joshua Hawksworth Portfolio

A macOS desktop in the browser, with an iOS home screen on phones. Built with React 19, TypeScript, Vite and CSS Modules.

[Live site](https://hawksworth.dev/)

![Portfolio demo](./demo.gif)

## Overview

The portfolio is presented as an operating system instead of a page. Visitors boot into a login screen, then land on a
"Golden Gate" macOS desktop: a warm glass wallpaper, translucent Liquid Glass windows, a menu bar, a dock with the real
app icons, desktop icons, Finder, and a Trash that remembers where things came from. On a phone the same content is an
iOS-style home screen with paged, swipeable 4×4 icon grids and full-screen app sheets.

Everything is backed by a small virtual file system, so folders nest, items move between the desktop and any folder, and
the Finder behaves like the real one rather than a list of links.

## Highlights

- **Desktop shell**: boot, login, menu bar, dock with bounce and running dots, draggable and resizable windows, rubber-band
  selection, multi-select drag, context menus, Get Info, wallpaper picker, Launchpad, Spotlight, Control Center and
  Notification Center.
- **Liquid Glass windows**: one blurred, tinted pane per window; apps only tint it, so the wallpaper and the windows behind
  show through.
- **Finder on a real file system**: nested folders, New Folder / New Text File anywhere, rename, Move to Trash for the whole
  selection, ⌘A / ⌘⌫ / ⇧⌘N shortcuts, back and forward history, breadcrumb path bar, icon and list views, drag into
  folders and sidebar, drop files from your OS, search of the current folder tree.
- **Trash with Put Back**: trashed items return to the folder they came from.
- **Portfolio apps**: About, Experience, Skills, Contact, Location (Mapbox), CV, GitHub and a Chrome-style browser with a
  server-side proxy.
- **Ask Claude**: a chat assistant behind a mock "Sign in to Claude" sheet. Guests get answers built from the portfolio
  data in the browser (free, offline); with `ANTHROPIC_API_KEY` set, signed-in visitors are answered by Claude.
- **Toys**: Apple-style Calculator (with a scientific pad on wide windows), Terminal, a Nokia 3310 running Snake with a
  personal high-score table (and a hidden Space Impact), DOOM via js-dos, Rubber Duck and Slotslop.
- **iOS home screen**: blurred wallpaper, 2×2 clock widget, 4×4 pages with scroll-snap swiping and page dots, iOS-style
  search pill and dock, app sheets with a macOS close light.

## Tech Stack

- React 19 and TypeScript
- Vite
- CSS Modules
- Vitest and Testing Library
- Playwright
- Vercel serverless functions
- js-dos, Mapbox GL, Anthropic SDK

## Project Structure

```text
src/
  components/
    apps/              Desktop apps and the app registry
    Desktop/           Desktop shell: icons, selection, context menus, widgets
    Dock/              Dock, dock configuration and icon artwork
    icons/             Shared file-system icons (folder, document, Macintosh HD, Trash)
    MobileDesktop/     iOS-style home screen and app sheets
    SystemUI/          Spotlight, Control Center, Notification Center, Launchpad
    Window/            macOS window chrome (Liquid Glass)
  context/             Window management and the virtual file system
  data/                Portfolio content, wallpapers, file-system seed
  hooks/               Shared browser and UI hooks
  lib/                 Small helpers (opening nodes, leaderboard client)
tests/
  unit/                Vitest coverage for app logic
  e2e/                 Playwright smoke coverage
api/                   Vercel serverless endpoints
docs/                  Design notes (Golden Gate theme tokens and rules)
```

## Running Locally

```bash
npm install
npm run dev
```

Create `.env` from `.env.example` before testing API-backed features such as the contact form.

## Backend Configuration

API-backed features are handled by Vercel serverless routes under `api/`. Set these environment variables in Vercel and in
local `.env` when needed:

```bash
RESEND_API_KEY="your_resend_api_key_here"
ANTHROPIC_API_KEY="your_anthropic_api_key"
DATABASE_URL="postgres://portfolio:portfolio@localhost:5433/portfolio"
VITE_MAPBOX_TOKEN="your_mapbox_access_token"
```

Ask Claude answers guests from the portfolio data in the browser, so it works with no backend at all. If `ANTHROPIC_API_KEY`
is set, visitors who pick Apple or Google on the (mock) sign-in sheet are answered by Claude through `/api/ask`; when it
isn't set, everyone gets the offline answers and no error is shown.

The Snake high-score table is personal: it keeps the visitor's own best runs in `localStorage`, so there is nothing to
host. (A Postgres-backed `/api/leaderboard` route and its Docker setup remain in the repo as a reference; the game no
longer calls it.)

## Quality Checks

```bash
npm run lint
npm run test:run
npm run build
npm run test:e2e
```

## Deployment

The site is configured for Vercel. Production builds run TypeScript project references first, then Vite.

## Contact

Joshua Hawksworth - joshuahawksworth@me.com

[LinkedIn](https://www.linkedin.com/in/joshua-hawksworth-9741aa209/) | [GitHub](https://github.com/joshuahawksworth)
