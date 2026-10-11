# TrustVault – Design Contract

This file is the brand contract every screen follows. The look is **neo-brutalist**: flat colour, thick ink
borders, hard offset shadows, big type. It was generated with the
[UI/UX Pro Max skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) (style: Brutalism · palette: "gold trust +
purple tech" · type: IBM Plex Sans) and the 21st.dev **Neo Brutalism** theme, then tuned for contrast.

Built with **Tailwind CSS v4** and **shadcn/ui** (Radix primitives). Tokens live in
[`src/index.css`](src/index.css); primitives in `src/components/ui/`; app pieces in
`src/components/app/`.

## Color
Light is the default, dark is a full second theme (`.dark` on `<html>`, toggle in the top bar, remembered per browser).

| Token | Light | Dark | Use |
|---|---|---|---|
| `background` | `#fff7e6` | `#0f172a` | Page (cream paper / navy) |
| `foreground` / `border` | `#0f172a` | `#f8fafc` / `#e2e8f0` | Text and every border |
| `card` | `#ffffff` | `#1e293b` | Cards, dialogs, inputs |
| `muted` / `muted-foreground` | `#f4ebd3` / `#475569` | `#273449` / `#a8b5c8` | Quiet fills, secondary text |
| `primary` | `#f59e0b` | `#f59e0b` | The one main action, active nav, hero blocks |
| `violet` | `#8b5cf6` | `#a78bfa` | Second brand colour: kickers, role badge, QR action |
| `accent` | `#c4b5fd` | `#a78bfa` | Hover and focus fills |
| `secondary` | `#0f172a` | `#f8fafc` | Inverted (ink) buttons and bands |
| `success` / `destructive` / `info` | `#4ade80` / `#ef4444` / `#7dd3fc` | same / `#f87171` / same | Verified · rejected, tampered, delete · stored |

- Text on any coloured fill is always ink (`text-ink`, `#0f172a`) – never white on amber, green or red.
- Status is never colour alone: every badge and check has a word or an icon.

## Typography
- **IBM Plex Sans** 400 / 500 / 600 / 700. Headings are 700 with tight tracking; display sizes use `leading-[0.95]`.
- **IBM Plex Mono** for numbers, hashes, codes, kickers and badges (uppercase, wide tracking).
- Body text is 16px on phones; nothing below 11px, and only for mono labels.

## Shape, borders, shadows
- Radius is **0** everywhere. Only avatars are round.
- Borders are **2px** in the border colour. Dashed 2px = "drop here" or empty state.
- Shadows are hard offsets, no blur: `shadow-brutal-sm` (2px), `shadow-brutal` (4px), `shadow-brutal-lg` (8px, heroes and dialogs).
- Spacing follows Tailwind's 4px scale; sections are separated by `gap-6` / `gap-8`, public sections by `gap-16`.

## Components
- **Buttons** (`ui/button`): `default` amber for the one primary action · `secondary` ink · `outline` card ·
  `accent` violet · `success` / `destructive` for approve / reject · `ghost` · `link`. They lift 2px on hover and press flat on click.
- **Badges** (`ui/badge`, `StatusBadge` in `app/kit`): verified = green, pending = amber, rejected / tampered = red, stored = sky.
- **Stat tiles** (`Stat`): a mono number over a label on a coloured fill.
- **Bento grid** (`ui/bento-grid`): adapted from the 21st.dev component by kokonutd; used for the landing-page features.
- **Dialogs** (`Modal`): Radix Dialog – focus trap, Esc to close, focus returns to the opener.
- **Code boxes** (`OtpInput`): six boxes, paste works, auto-submits, shakes on a wrong code.
- **Documents** are grouped Identity / Academic / Other; each card has a coloured type strip and its status badge.
- **Security cues** stay visible: session countdown in the top bar, masked numbers, SHA-256 in mono.

## Layout
- Signed-in: 16rem sidebar from `lg` up; below that a bottom bar with four destinations and **More**. Content max width 72rem.
- Public pages (`PublicShell`): sticky header, paper grid background (`bg-grid`), ink footer.
- Checked at 375, 768, 1024 and 1440px – no horizontal scroll.

## Motion
- Micro-interactions 100–150 ms (transform and shadow only). Entrances use `animate-rise` (400 ms); lists stagger by 60 ms.
- One looping element: the standards marquee on the landing page (pauses on hover).
- `prefers-reduced-motion` turns every animation and transition off.

## Accessibility
- Text contrast is at least 4.5:1 in both themes; focus is a 3px ring on every interactive element.
- Icons are Lucide SVGs – no emoji. Icon-only buttons have an `aria-label`.
- Forms: visible labels, errors next to the field in an alert box, hints under the field.

## Don'ts
- No gradients, glass, blur or soft shadows. No rounded corners.
- No colour-only meaning, no placeholder-only labels, no white text on a coloured fill.
- No decorative animation, custom cursors or scroll-driven effects.
