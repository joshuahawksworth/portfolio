# Anti-"Vibecoded" UI Style Rules

Ruleset for spotting and avoiding the 30 tells that make a website look AI-generated ("vibecoded"). Use this when designing, reviewing, or prompting for UI. Each rule = the tell to spot, why it reads as generic, and what to do instead.

> Source: "30 reasons your site looks vibecoded" (@aj.on.ai). The video showed example screenshots for several points — noted inline where shown.

---

## Color & Backgrounds

### 1. Harsh gradients
- **Spot:** Saturated purple→pink→blue gradients slapped on heroes and CTAs. *(Example shown: a magenta/purple gradient hero card — "Ship faster. Think clearer.")*
- **Avoid:** If you use gradients at all, keep them subtle — low saturation shifts within one hue, or barely-visible background tints. Flat color is usually stronger.

### 3. Pure white background
- **Spot:** Stark `#FFFFFF` everywhere with no warmth or texture.
- **Avoid:** Use slightly off-white/tinted neutrals (e.g. warm greys, paper tones) that fit the brand.

### 4. Rainbow coloring
- **Spot:** Many unrelated hues across sections, icons, and cards.
- **Avoid:** One primary, one accent, and a disciplined neutral scale. Every extra hue needs a job.

### 20. Purple and black
- **Spot:** The default "AI startup" palette: black background, purple/violet accents.
- **Avoid:** Pick a palette that comes from the brand or product domain, not the model's favorite combo.

### 22. Radial orbs
- **Spot:** Blurred glowing gradient blobs floating behind the hero.
- **Avoid:** Remove decorative orbs. If the background needs interest, use imagery, illustration, or structure that means something.

### 23. Dot grids
- **Spot:** Faint dotted/grid background patterns as filler texture.
- **Avoid:** Only use grid/dot textures if they're part of a deliberate visual identity — otherwise plain backgrounds.

### 29. Neon colors
- **Spot:** Electric cyan/green/pink glows, especially on dark themes.
- **Avoid:** Restrained accent colors with sufficient contrast; save high-chroma color for tiny, meaningful moments.

### 30. Basic pastel colors
- **Spot:** Default washed-out pastel card palettes (mint, baby blue, blush, butter yellow). *(Example shown: a "Softer side of Lumina" card with four pastel feature tiles.)*
- **Avoid:** If soft colors fit, tune them — adjust saturation/lightness per hue so they feel designed, not defaulted.

## Effects & Decoration

### 5. Drop shadows
- **Spot:** Heavy, dark, or uniform `box-shadow` on every card.
- **Avoid:** Subtle layered shadows, borders, or background contrast for elevation — and only where hierarchy needs it.

### 8. Liquid glass
- **Spot:** Frosted-glass/glassmorphism panels (blur + transparency + border glow) everywhere.
- **Avoid:** Solid surfaces by default; glass effects only when there's real layered content behind them.

### 19. Soft corner radius
- **Spot:** Everything uniformly rounded with the same large radius (`rounded-2xl` on all things).
- **Avoid:** A deliberate radius scale — smaller for inputs/buttons, larger only where it serves the composition; consider sharper corners for distinctiveness.

### 24. Sparkle icons
- **Spot:** ✨ sparkle glyphs marking "AI features."
- **Avoid:** Describe the feature plainly; if it needs an icon, use one specific to what it does.

### 25. Animated arrows
- **Spot:** Arrows that slide/bounce on hover, animated "→" in every CTA.
- **Avoid:** Static, clear CTAs. Motion should communicate state, not decorate.

### 28. Hover animations
- **Spot:** Everything lifts, scales, or glows on hover. *(Example shown: a "Try hovering anything" demo card.)*
- **Avoid:** Reserve hover feedback for genuinely interactive elements, and keep it minimal (color/underline change beats scale+shadow).

## Typography & Copy

### 7. Emojis
- **Spot:** Emojis as section markers, feature icons, or in headings.
- **Avoid:** No emojis in product UI copy. Use real iconography or none.

### 9. Em dashes
- **Spot:** Em dashes scattered through marketing copy — like this — a known LLM writing tell.
- **Avoid:** Rewrite with shorter sentences, commas, or colons.

### 10. Inter / Geist / Space Grotesk
- **Spot:** The default AI-output font stack. *(Example shown: an "Our type system" card listing Inter, Geist, Space Grotesk.)*
- **Avoid:** Choose type deliberately — a face with character that matches the brand, properly paired and sized. If you use a common font, earn it through the rest of the typography.

### 15. "It's not x, it's y"
- **Spot:** The contrast-flip copywriting formula ("It's not a tool, it's a teammate").
- **Avoid:** Say what the product actually does, concretely.

### 16. Checkmark bullets
- **Spot:** ✓-prefixed feature lists. *(Example shown: an "Everything included" card with a column of green checkmarks.)*
- **Avoid:** Plain lists, short prose, or comparison tables with real substance.

## Layout & Structure

### 2. Lucide icons
- **Spot:** Default Lucide (or generic line-icon) sets on every feature card.
- **Avoid:** Custom or curated iconography — or no icons. Icons should be a design decision, not a package default.

### 6. Three feature cards in a row
- **Spot:** The templated 3-up feature grid. *(Example shown: "Why teams choose Lumina" with three identical cards.)*
- **Avoid:** Vary layout by content: alternating sections, asymmetric grids, one strong feature at a time.

### 11. Colored left stripe
- **Spot:** Cards/callouts with a colored left border strip.
- **Avoid:** Use background tint, typography, or spacing to differentiate callouts.

### 13. Bento grids
- **Spot:** The trendy mixed-size "bento box" feature grid.
- **Avoid:** Only use if the content genuinely varies in importance/size; otherwise a simpler layout reads as more intentional.

### 14. Terminal window
- **Spot:** Fake macOS terminal mockups (three traffic-light dots) showing staged commands.
- **Avoid:** Show the real product. If code matters, show actual, runnable, honest snippets.

### 17. Three pricing tiers
- **Spot:** The reflexive Starter / Pro / Enterprise triptych with a highlighted middle card.
- **Avoid:** Price how the product is actually sold — one plan, usage-based, or whatever fits — and present it plainly.

## Content & Trust

### 12. Fake testimonials
- **Spot:** Invented quotes with stock avatars and made-up names/companies.
- **Avoid:** Real quotes with permission, real logos, or nothing. No social proof beats fabricated social proof.

### 18. No real product demos
- **Spot:** Abstract mockups and placeholder screenshots instead of the actual product.
- **Avoid:** Real screenshots, recordings, or interactive demos of the real thing.

### 21. No skeleton loaders
- **Spot:** Blank screens or lone spinners while content loads. *(Example shown: a "Your dashboard… Loading" card with a spinner.)*
- **Avoid:** Skeleton states that match the final layout, so loading feels designed.

### 26. No TOS
- **Spot:** Missing Terms of Service link.
- **Avoid:** Ship real terms, linked in the footer.

### 27. No privacy policy
- **Spot:** Missing privacy policy.
- **Avoid:** Ship a real privacy policy, linked in the footer.

---

## Review checklist (quick pass)

- [ ] Palette: ≤2 intentional hues, no purple-on-black default, no neon/pastel defaults, no gradient/orb/dot-grid decoration
- [ ] Surfaces: restrained shadows, no glassmorphism-by-default, deliberate radius scale
- [ ] Type & copy: intentional font choice, no emojis, no em-dash-heavy copy, no "not x, it's y", no ✓ bullet walls
- [ ] Layout: no reflexive 3-card rows, bento grids, left-stripe callouts, or fake terminal mockups
- [ ] Honesty: real demos, real testimonials (or none), real pricing structure
- [ ] States & motion: skeleton loaders present; hover/arrow animation minimal and purposeful
- [ ] Legal: TOS and privacy policy linked
