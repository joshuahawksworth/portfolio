# Joshua Hawksworth Portfolio

A macOS desktop in the browser, with an iOS home screen on phones. Flip one switch in System Settings and the whole
thing becomes Windows 11 on desktops and a Pixel-style Android launcher on phones. Built with React 19, TypeScript, Vite
and CSS Modules.

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

- **System Settings**: a real settings app in the dock, Launchpad, Spotlight, Start menu and on the phone home screen. Every
  control does something: platform switch, wallpaper, accent colour, dock size and magnification, taskbar alignment, icon
  shape, brightness, Night Shift, volume and a test tone, Wi-Fi networks, Bluetooth, Do Not Disturb, 24-hour clock, seconds
  in the clock, reduce motion / transparency / contrast, user name, lock / log out / restart / shut down, About and Storage
  (with Empty Trash) and a full reset. Everything persists in `localStorage`, so it survives a reload.
- **Platform switch**: Apple (macOS + iOS) or Windows + Android. First visits start on whichever platform matches the
  visitor's device (Windows PCs and Android phones get Windows / Android; iPhones, Macs and everything else get Apple), and
  switching plays the current OS's shutdown screen before the new one boots to its lock screen. The boot screen, lock screen, wallpaper, window chrome,
  icons, dock or taskbar, Start menu, quick settings and notification centre are all remade for the platform: Fluent icons,
  Recycle Bin, File Explorer and a Windows 11 sign-in on the desktop; Material discs, an At a Glance row, the Google search
  bar and a Pixel lock screen on phones. iOS gets an iPhone-style lock screen (swipe up, flashlight, camera).

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
- **Ask Claude**: a chat assistant. Visitors can bring their own Anthropic API key (kept in their browser, forwarded only
  to this site's `/api/ask` route for their messages, never stored) to talk to Claude itself, or continue as a guest and
  get answers built from the portfolio data in the browser (free, offline). With `ANTHROPIC_API_KEY` set on the server,
  the site's own key is used when a visitor has none.
- **Toys**: Apple-style Calculator (with a scientific pad on wide windows), a Nokia 3310 running Snake with a
  personal high-score table (and a hidden Space Impact), DOOM via js-dos and Rubber Duck.
- **Terminal**: a real shell per platform: zsh on macOS/iOS, Windows PowerShell (with cmd aliases such as `dir`, `type`,
  `del`, `ni`, `start`) on Windows, and bash inside Termux on Android. Home folders are mounted on the same virtual file
  system as Finder/Explorer/Files, so `ls ~/Desktop`, `mkdir`, `touch`, `rm`, `mv`, `cp`, `nano` and `open`/`start` change
  what you see on the desktop. Supports `&&`, `||`, `;`, `$HOME`/`$env:USERPROFILE`/`%VAR%`, Tab completion, history,
  Ctrl+C/Ctrl+L, plus `neofetch`/`winfetch`, `systeminfo`, `pkg install`, `getprop`, `say` and `spaceinvaders`.
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
    Dock/              Dock, dock configuration and macOS icon artwork
    icons/             Shared file-system icons plus the Windows (Fluent) and Android (Material) icon sets
    MobileDesktop/     iOS / Android home screens and app sheets
    SystemUI/          Spotlight, Control Center / Quick Settings, Notification Center, Launchpad, Start menu
    Taskbar/           Windows 11 taskbar
    Window/            Window chrome (Liquid Glass on macOS, Mica + caption buttons on Windows)
  context/             Window management, the virtual file system, settings and session (lock / restart)
  data/                Portfolio content, wallpapers, file-system seed
  hooks/               Shared browser and UI hooks
  lib/                 Small helpers (settings store, clock formatting, opening nodes, offline answers, high scores)
  theme/               Platform helpers: which OS is rendered, per-OS names, icon resolver
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
VITE_MAPBOX_TOKEN="your_mapbox_access_token"
```

Ask Claude answers guests from the portfolio data in the browser, so it works with no backend at all. Visitors who enter
their own Anthropic API key are answered by Claude through `/api/ask` with that key (sent as a request header, never
logged or stored). If `ANTHROPIC_API_KEY` is set, it is used for visitors without a key; when neither is available,
everyone gets the offline answers and no error is shown. There is no public "Sign in with Claude" for third-party sites,
which is why the key is the way in.

The Snake high-score table is personal: it keeps the visitor's own best runs in `localStorage`, so there is no database.

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
