# Golden Gate Theme Spec

The portfolio is being restyled to look like the "macOS Golden Gate" (macOS 27) reference: a warm, light,
translucent desktop. Amber glass wallpaper, frosted cream windows, dark warm text, blue accent. Mobile
follows the latest iOS look (light glass, large rounded controls, translucent tab/nav bars).

All shell tokens live on `:root` in `src/index.css`. Use them instead of hard-coded colours.

## Tokens

| Token | Value | Use |
| --- | --- | --- |
| `--accent` | `#007aff` | selection, links, primary buttons, focus rings |
| `--accent-soft` | `rgba(0,122,255,0.12)` | selected row tint |
| `--text` | `#262422` | body text |
| `--text-strong` | `#1c1a18` | headings |
| `--muted` | `#827c76` | secondary text, section labels, icons at rest |
| `--muted-2` | `#a8a29b` | placeholders, disabled |
| `--panel` | `rgba(252,250,247,0.1)` | app root tint inside a window (the window shell supplies the glass) |
| `--panel-2` | `rgba(246,242,234,0.34)` | inset areas, code blocks, table headers |
| `--line` | `rgba(0,0,0,0.063)` | dividers, borders |
| `--line-strong` | `rgba(0,0,0,0.11)` | input borders, card borders |
| `--glass` | `rgba(248,242,230,0.2)` | sidebars, toolbars, title bars (tints; the window shell already blurs) |
| `--glass-strong` | `rgba(252,250,247,0.92)` | popovers, menus |
| `--hover` | `rgba(0,0,0,0.045)` | hover fill |
| `--selected` | `rgba(0,0,0,0.075)` | selected fill (neutral) |
| `--warm-shadow` | `rgba(87,52,10,0.3)` | big drop shadows |
| `--font-ui` | system stack | all UI text |
| `--font-mono` | SF Mono stack | code, terminal |
| `--radius-window` | `14px` | windows, large panels |
| `--radius-control` | `7px` | buttons, inputs, list rows |

## Reference measurements (from the macOS Golden Gate site)

- Menu bar: 29px tall, `rgba(255,227,165,0.15)` + `blur(30px)`, text `#282624` 13px, app name weight 650.
- Window (Liquid Glass): the `.window` shell is the only blurred layer — `rgba(252,248,240,0.38)` + top sheen gradient,
  `backdrop-filter: blur(5px) saturate(1.5)` (light: windows behind stay recognisable), `1px solid rgba(255,255,255,0.58)` border, inset white rim. App roots
  only tint it with `--panel`; never give an app root an opaque background or a second backdrop-filter.
  Keep the intro animation without a fill mode: a persisting opacity animation turns the outer element into a
  backdrop root and the blur stops seeing the windows behind.
- Window: radius 14px, `1px solid rgba(255,255,255,0.42)` border, outline `1px solid rgba(58,39,9,0.17)`,
  shadow `0 24px 65px rgba(87,52,10,0.3), 0 3px 14px rgba(0,0,0,0.13)`. Inactive: `0 10px 30px rgba(75,53,25,0.2)`.
- Title bar: 46px tall, background `--glass`, `border-bottom: 1px solid --line`, inset top highlight
  `inset 0 1px rgba(255,255,255,0.47)`, title 13px weight 600 centred.
- Traffic lights: 12px circles, gap 8px, `1px solid rgba(0,0,0,0.094)` border. Inactive windows: `#bdb8b0`.
- Sidebar: `--glass` background, `border-right: 1px solid --line`, 185px wide, padding 13px 9px.
  Section label 11px weight 600 `--muted`, padding 15px 10px 7px. Row: 13px, padding 7px 10px, radius 7px,
  gap 9px, icon 16px in `--accent`. Hover `rgba(0,0,0,0.03)`, selected `rgba(0,0,0,0.05)` + weight 600.
- Toolbar (Finder): 44px, transparent over `--panel`, buttons 12px text with 14px icons, `--muted` when disabled.
- Search field: `rgba(0,0,0,0.05)` fill, `1px solid --line`, radius 7px, 12px text, height 26px.
- Buttons: default `rgba(0,0,0,0.05)` fill, `1px solid --line-strong`, radius 7px, 12px text, padding 5px 11px.
  Primary: `--accent` fill, white text. Hover: darken fill slightly.
- Dock: `rgba(255,246,225,0.46)` + `blur(38px) saturate(1.6)`, radius 23px, `1px solid rgba(255,255,255,0.6)`,
  icons 50px, running dot `#423326` 4px. Tooltip `rgba(244,238,227,0.86)` 12px, radius 6px.
- Menus/popovers: `--glass-strong` + `blur(30px)`, radius 10px, padding 6px, `1px solid rgba(255,255,255,0.6)`,
  shadow `0 12px 40px rgba(60,40,10,0.22)`. Items 13px, min-height 28px, padding 5px 10px, radius 5px.
  Hover: `--accent` fill + white text.
- Folders, documents, Macintosh HD and the Trash are drawn in `src/components/icons/FileSystemIcons.tsx` (macOS blue folders) and shared by the desktop, Finder, Get Info and Trash via `NodeIcon`.
- Desktop icon labels: 12px, `--text`, on a translucent light pill when selected. No heavy dark text-shadows.

## Rules

- App interiors sit inside a `--panel` window. Use sidebars, toolbars, lists and sections; no cards inside cards.
- Keep contrast: body text `--text` on `--panel`; never white text on light surfaces.
- Highly themed apps keep their own palette: Terminal (dark), Snake/Nokia, DOOM, Slotslop, MobileSnake.
- Do not use hard-coded dark navy (`#1a1c28`, `#1c1e26`, `#171921`, `#06090f`) anywhere in normal apps.
- Prefer `var(--font-ui)` over repeating font stacks.
- Keep the class names and component structure; this is a restyle, not a rewrite.
- Respect `prefers-reduced-motion` (already handled globally).
