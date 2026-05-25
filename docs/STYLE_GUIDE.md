# Style Guide — Monash Club Task Manager

This is the canonical reference for visual design. Every UI primitive, page, and component must consume tokens from this guide.

Live preview: open the running app at `/design/preview` — every primitive renders there in isolation.

---

## 1 — Anchors

1. **Color identity:** Monash Blue (#006CAB) is the primary. White and Monash Blue is the institutional pairing. Neutrals are slate (Tailwind slate-100…slate-900). No generic indigo, no purple.
2. **Execution:** borders over shadows, restrained color (neutral by default — color reserved for primary, success, warning, danger), sharp typography with weight contrast (400 body, 500 emphasized, 600 headings — never bold body), 8px grid throughout, quick subtle hover states (color shift not animations).

When in doubt, look at linear.app for craft cues — separation through structure, not visual noise.

---

## 2 — Color tokens

| Role | Token | Hex |
| --- | --- | --- |
| Primary | `primary` | `#006CAB` |
| Primary hover | `primary-hover` | `#005A8F` |
| Primary pressed | `primary-pressed` | `#004875` |
| Primary subtle (tints, badges) | `primary-subtle` | `#E6F2F8` |
| Surface | `surface` | `#FFFFFF` |
| Surface elevated (modals, popovers) | `surface-elevated` | `#FFFFFF` |
| Surface muted (page background) | `surface-muted` | `#F8FAFC` |
| Border default | `border-default` | `#E2E8F0` |
| Border strong (hover) | `border-strong` | `#CBD5E1` |
| Border focus | `border-focus` | `#006CAB` |
| Text primary | `text-primary` | `#0F172A` |
| Text secondary | `text-secondary` | `#475569` |
| Text tertiary (placeholders, captions) | `text-tertiary` | `#94A3B8` |
| Text on primary | `text-on-primary` | `#FFFFFF` |
| Success | `success` | `#059669` |
| Success subtle | `success-subtle` | `#D1FAE5` |
| Warning | `warning` | `#D97706` |
| Warning subtle | `warning-subtle` | `#FEF3C7` |
| Danger | `danger` | `#DC2626` |
| Danger subtle | `danger-subtle` | `#FEE2E2` |

### When to use color
- **Neutral** for the vast majority of UI: text, borders, backgrounds, icons.
- **Primary** for the active brand action and current selection — usually one prominent place per screen.
- **Success / warning / danger** only for state that genuinely needs that signal (completed, expiring, destructive).
- **Subtle variants** for badge/pill backgrounds, never for plain copy.

---

## 3 — Typography

Sans family is **Inter** with weights 400 / 500 / 600. Mono family is **JetBrains Mono** with weight 400 / 500. Both are loaded from Google Fonts.

| Role | Tailwind class | Size / line-height / weight / tracking |
| --- | --- | --- |
| Display | `text-display` | 30 / 36 / 600 / -0.02em |
| Heading 1 | `text-h1` | 24 / 32 / 600 / -0.01em |
| Heading 2 | `text-h2` | 20 / 28 / 600 |
| Heading 3 | `text-h3` | 16 / 24 / 600 |
| Body large | `text-lg` | 16 / 24 / 400 |
| Body | `text-base` | 14 / 20 / 400 |
| Small UI | `text-sm` | 13 / 18 / 400 |
| Caption | `text-xs` | 12 / 16 / 400 / 0.01em |
| Mono code | `font-mono text-sm` | 13 / 18 / 400 |

Body weight is **400**. Use **500** only for emphasis (labels, table column headers, key actions in nav). Use **600** only for headings. Never bold body copy.

---

## 4 — Spacing — 8px grid

| Token | Pixels | Tailwind |
| --- | --- | --- |
| 0 | 0 | `0` |
| 1 | 4 | `1` |
| 2 | 8 | `2` |
| 3 | 12 | `3` |
| 4 | 16 | `4` |
| 6 | 24 | `6` |
| 8 | 32 | `8` |
| 12 | 48 | `12` |
| 16 | 64 | `16` |

Conventions:
- Card padding: **24** standard (`p-6`), **16** compact (`p-4`).
- Section spacing: **48** between major sections, **32** between subsections, **16** between related items.
- Form fields: **16** between fields, **8** between label and input.
- Inline gaps: **8** for chips/badges, **12** for icon + text in nav, **16** for button groups.

Never invent values outside this grid (no `p-[18px]`, no arbitrary margins).

---

## 5 — Radius

| Surface | Radius |
| --- | --- |
| Buttons | `rounded-md` (6px) |
| Inputs / selects / textareas | `rounded-md` (6px) |
| Cards | `rounded-lg` (8px) |
| Modals | `rounded-xl` (12px) |
| Badges / chips | `rounded-sm` (4px) |
| Avatars | `rounded-full` |

---

## 6 — Shadows

Shadows are exceptional, not decorative.

| Token | Use |
| --- | --- |
| `shadow-sm` | Card hover lift only. |
| `shadow-md` | Modals only. |
| `shadow-lg` | Dropdowns and popovers only. |
| `shadow-focus` | Available for custom focus treatments — usually you should use the global `:focus-visible` ring instead. |

Cards at rest have **no shadow**. Their separation comes from a 1px `border-default` border. Hovering a card with `interactive` darkens the border to `border-strong` and adds `shadow-sm`.

---

## 7 — Borders and focus

- Default border: `1px solid border-default`.
- Hover border: `border-strong` (thickness stays 1px — no visual jump).
- Focus border: `border-focus` plus a 1px Monash Blue ring at offset 1 (`focus:ring-1 focus:ring-border-focus`).
- Selected border (e.g. active sidebar item): `border-focus`.

For arbitrary focusable elements, the global `:focus-visible` rule paints a 2px primary ring on a 2px white offset — visible on any background.

---

## 8 — Motion

CSS transitions only. Defaults: `120ms` duration, `cubic-bezier(0.2, 0, 0, 1)` easing. Use `transition-colors duration-DEFAULT ease-DEFAULT` on interactive elements. Do not animate layout, opacity-only fades, or anything beyond a color/border/shadow shift.

No Framer Motion, no animated routes, no spinners that move with anything other than `animate-pulse` or `animate-spin`.

---

## 9 — Primitives reference

Every primitive lives at `src/components/ui/`. APIs are documented inline; visual examples render at `/design/preview`.

| Primitive | Notes |
| --- | --- |
| `Button` | Variants: `primary` (Monash Blue) / `secondary` (white + slate border) / `ghost` (transparent + secondary text) / `danger`. Sizes: `sm` (h-8) / `md` (h-9). Loading swaps the label to "Working…". |
| `Input`, `Select`, `Textarea` | h-9 height, 1px slate border, hover border `border-strong`, focus 1px Monash Blue. `invalid` swaps the border to `danger`. |
| `Field` | Wraps a label + control + optional hint or error. 8px gap between elements. |
| `Card` | 1px slate border, `rounded-lg`, white surface. `padded` toggles `p-6`. `compact` swaps to `p-4`. `interactive` adds hover lift. |
| `Badge`, `StatusBadge`, `PriorityBadge` | Subtle backgrounds (`*-subtle`) with matching text and matching-tint border. h-5, `rounded-sm`. |
| `Modal` | `surface-elevated`, `rounded-xl`, `shadow-md`, 1px slate border. Header and footer separated with 1px slate dividers. Closes on Escape and overlay click. |
| `Toast` | Bottom-right portal, auto-dismiss after 3500ms. Tones: info (slate), success (green), error (red). |
| `Dropdown` | Portal-less popover, `surface-elevated`, `rounded-md`, `shadow-lg`. Items hover to `surface-muted`; destructive items hover to `danger-subtle`. |
| `EmptyState` | `Card` with centered title + optional description + action button. |
| `PageHeader` | `text-h1` title, optional secondary description, right-aligned actions. |
| `Skeleton`, `SkeletonText` | `bg-border-default` + `animate-pulse`. Three shapes: rect / text / circle. |

---

## 10 — Out of scope (for now)

Dark mode, full WCAG audit, custom illustration system, and animation framework are explicitly deferred. Do not add toggles, theme providers, or animation libraries during the redesign sprint.
