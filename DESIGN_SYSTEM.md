# Portfolio Design System

This project is an interactive macOS-style portfolio. Future work should feel like it belongs inside a desktop operating system, not a marketing page. New features should extend the existing shell, app registry, window model, dock, desktop icons, and mobile home-screen experience.

## Product Model

- The first-class experience is a desktop environment: boot screen, login screen, menu bar, desktop icons, draggable windows, dock, Finder, Trash, and playful apps.
- The mobile experience is a separate home-screen and sheet model, not a shrunken desktop.
- Portfolio content should be discoverable through apps and files. Avoid adding landing-page sections, hero blocks, or standalone pages unless the product model changes.
- Playful features are welcome when they feel like native desktop apps, easter eggs, terminal commands, files, or utilities.

## Architecture

- `src/App.tsx` controls the phase flow: boot, login, desktop, optional Liquid Desktop, or mobile desktop.
- `src/components/Desktop/Desktop.tsx` owns the standard desktop shell, icons, selection, menus, and special windows.
- `src/context/DesktopContext.tsx` owns window state, desktop files/folders, trash state, restored items, and app opening.
- `src/components/apps/appRegistry.ts` is the source of truth for app IDs, titles, components, default sizes, min sizes, and max sizes.
- `src/components/Dock/` owns dock order, icons, minimized thumbnails, and dock interactions.
- `src/components/SystemUI/` owns Spotlight, Control Center, Notification Center and Launchpad; they are driven by `src/context/SystemUIContext.tsx`.
- `src/components/Window/` owns standard window chrome and resizing behavior.
- `src/components/MobileDesktop/` owns the mobile home screen, dock, and full-screen app panels.
- `src/components/LiquidDesktop/` is experimental and should stay isolated from the standard desktop path.
- `api/` contains Vercel serverless routes. Shared server helpers live in root `lib/`.

## Adding Or Changing Apps

1. Create the app component in `src/components/apps/NameApp.tsx`.
2. Create styles in `src/components/apps/NameApp.module.css`.
3. Register the app in `src/components/apps/appRegistry.ts` with a unique `PortfolioAppId`, title, component, and window size limits.
4. Add dock metadata in `src/components/Dock/dockConfig.ts` only if the app belongs in the dock.
5. Add or reuse an icon in `src/components/Dock/dockIcons.tsx` and mirror it in `src/components/MobileDesktop/MobileDesktop.tsx` when the app should exist on mobile.
6. Add a desktop shortcut in `DESKTOP_ITEMS` inside `src/components/Desktop/Desktop.tsx` only when the app should be launched from the desktop.
7. For special window chrome, follow the existing Snake and Rubber Duck pattern in `Desktop.tsx`; otherwise use the shared `Window` component.

Every app should accept the existing app prop shape:

```ts
type PortfolioAppComponent = ComponentType<{ props?: Record<string, unknown> }>;
```

Use typed local parsing inside the app when `props` carries app-specific data.

## Visual Language

The shell is styled after macOS "Golden Gate": a warm amber glass wallpaper, frosted cream windows,
dark warm text and a blue accent. Mobile follows the latest iOS look (light glass dock, squircle icons,
translucent nav bars). The full token list and reference measurements live in
`docs/golden-gate-theme.md`; the tokens themselves are defined on `:root` in `src/index.css`.

- Use the tokens, never raw hex, for normal portfolio apps:
  - Text: `--text`, `--text-strong`, `--muted`, `--muted-2`
  - Surfaces: `--panel` (window body), `--panel-2` (inset areas), `--glass` (sidebars, toolbars, title bars),
    `--glass-strong` (menus, popovers)
  - Lines: `--line`, `--line-strong`
  - Accent: `--accent`, `--accent-soft`
  - Fills: `--hover`, `--selected`
- Glass surfaces pair a translucent warm fill with `backdrop-filter: blur(30-38px) saturate(1.6)` and a
  `1px solid rgba(255,255,255,0.4-0.6)` border plus an inset top highlight.
- Windows: radius `--radius-window` (14px), 46px title bar, 12px traffic lights, warm drop shadow
  `0 24px 65px var(--warm-shadow)`.
- Do not reintroduce the old dark navy palette (`#1a1c28`, `#06090f`, etc.). Highly themed apps such as
  Terminal, Snake, DOOM and Slotslop keep their own self-contained palettes.
- Wallpapers are JPEGs in `public/wallpapers/` (Golden Gate, Catalina, Tahoe, Sequoia). Desktop defaults to Golden
  Gate; mobile uses the dark Catalina image so iOS-style white labels read well.
- Keep border radius modest inside apps: controls and rows use `--radius-control` (7px); large panels use 12-16px.

## Typography

- Standard app UI uses the system font stack via `var(--font-ui)`; large display text can use `var(--font-display)`.

- Code, terminal, retro games, and faux system files use `var(--font-mono)`.

- Use compact, scannable type. Window/app interiors should not use hero-scale headings.
- Avoid negative letter spacing in new work. Preserve existing local styles unless actively refactoring them.
- Long labels must truncate or wrap intentionally. Never let labels resize fixed controls, overlap neighbors, or spill out of buttons.

## Layout Rules

- App roots should fill their window: `height: 100%`, `min-height: 0`, and controlled overflow.
- Use flex or grid with fixed constraints for toolbars, sidebars, canvases, game boards, icon grids, and dock items.
- Window content should scroll internally when needed; the global document is intentionally `overflow: hidden`.
- Desktop window default/min/max sizes belong in `appRegistry.ts`, not scattered through components.
- Avoid nested cards. A window is already a frame; app interiors should use sidebars, lists, panes, toolbars, and sections rather than cards inside cards.
- Use stable dimensions for icon buttons, controls, game tiles, canvas wrappers, counters, and menu rows to prevent layout shift.

## Interaction Patterns

- Desktop icons use single-click selection and double-click opening.
- Dock icons open or focus apps; minimized windows appear as thumbnails.
- Menus and context menus should look native: compact rows, subtle hover states, no large explanatory copy.
- Use icon buttons when a familiar icon exists; pair icon and text only when the command benefits from clarity.
- Keyboard and pointer interactions should not fight each other. Any app with keyboard controls must keep focus management explicit.
- Respect `prefers-reduced-motion`; global CSS already shortens animations.

## Mobile Rules

- Mobile is an iOS-style home screen (status bar, widget, squircle icon grid, Search pill, floating glass dock) with full-screen panels that use an iOS nav bar. Do not reuse desktop windows on mobile.
- Touch targets should be at least `40px` high, preferably larger for game controls.
- Use safe-area insets for status bars, bottom docks, and panel headers.
- Mobile app panels should be dense but readable. Avoid hover-only affordances.
- If adding a desktop app that should be available on mobile, provide mobile-specific sizing and controls rather than relying on the desktop layout to shrink.

## CSS Conventions

- Use CSS Modules for component styles. Do not add global styles unless they are true app-wide resets or platform fallbacks.
- Keep class names semantic and local: `.root`, `.header`, `.sidebar`, `.toolbar`, `.item`, `.active`, `.empty`, `.panel`.
- Prefer existing component-local patterns before creating shared abstractions.
- Comments are useful for complex interaction/state sections, but avoid narrating obvious declarations.
- Global fallback styles for unsupported `backdrop-filter` live in `src/index.css`.

## Assets And Icons

- Reuse existing assets in `src/assets/` and `public/` when possible.
- App/dock icons should be centralized in `src/components/Dock/dockIcons.tsx` or the relevant mobile icon map.
- Use existing icon components in `src/components/icons/` for branded desktop icons.
- Images should have stable dimensions and `object-fit` rules.
- Do not add large assets without checking bundle impact.

## Backend And External Services

- Browser code should call local API routes such as `/api/leaderboard`; do not expose server credentials through `VITE_*` variables.
- Vercel API route code can use root `lib/` helpers, but ESM imports must be runtime-valid. In TypeScript source, use `.js` specifiers for server helpers that Vercel will emit as JavaScript:

```ts
import { getLeaderboard } from '../lib/leaderboard.js';
```

- Public frontend env vars must be intentionally public. Server-only env vars stay unprefixed.
- API routes should return graceful JSON errors or fallbacks; they should not throw raw provider failures to the browser.
- For persistent features, avoid serverless in-memory storage except as a temporary fallback. It is not durable across invocations.

## Testing And Verification

Run the focused checks for the feature you touch:

```bash
npm run test:run
npm run build
```

For changed TypeScript files, run targeted ESLint:

```bash
npx eslint path/to/file.ts path/to/file.tsx
```

Use Playwright or the in-app Browser for visual/interaction changes:

- Desktop boot/login/desktop smoke.
- Mobile home-screen smoke for mobile-facing changes.
- Canvas/game checks for Snake, DOOM, Slotslop, and similar apps.
- API route checks with `curl` for server changes.

Before deploying Vercel API changes, run:

```bash
vercel build --prod
```

This catches serverless packaging issues that local Vite/TypeScript may miss.

## Deployment Notes

- The project is linked to Vercel as `joshuahawksworth-s-team/portfolio`.
- Production domain is `https://hawksworth.dev`.
- Vercel project settings:
  - Framework preset: Vite
  - Node.js: `22.x`
  - Install command: `npm install --legacy-peer-deps`
  - Build command: `npm run build`
- `.vercel/` and env files are ignored and must stay out of git.

## Design Review Checklist

- Does the change feel like a native app or shell feature, not a landing-page section?
- Is the app registered in `appRegistry.ts` with sensible default/min/max sizes?
- Does it work inside a resizable desktop window without overflow bugs?
- Does mobile have a deliberate layout or an intentional exclusion?
- Are colors and spacing consistent with the existing dark macOS-style system?
- Are credentials and provider calls kept behind API routes?
- Are interactive controls reachable by keyboard/pointer/touch where appropriate?
- Did tests/build pass, and did visual verification cover the changed surface?
