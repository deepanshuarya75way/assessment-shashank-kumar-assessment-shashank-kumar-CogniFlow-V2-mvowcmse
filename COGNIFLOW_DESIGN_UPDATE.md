# CogniFlow — UI Redesign Spec

**Goal:** Replace the current dark-blue "AI startup" look (glass panels, glowing gradients, constellation background) with a calm, professional interface that feels like **WhatsApp Web's layout with Apple's restraint and polish**.

**Hard rule:** This is a *visual-only* update. Do NOT change business logic, API calls, socket events, state management, routing, auth flow, Cloudinary/Gemini integration, quiz logic, or any props/data shapes. Only change styling (Tailwind classes / CSS), icon choices, spacing, copy on marketing screens, and purely presentational markup wrappers. Keep every existing `id`, `data-*`, `aria-*`, and event handler intact.

Stack (assumed from the current site): React + Tailwind CSS, socket-based chat, Cloudinary attachments, Gemini-powered CogniBot.

---

## 1. Design Principles

1. **Quiet over flashy.** No glow, no gradients on text, no glass blur, no animated particle backgrounds. If an element does not help the user, remove it.
2. **Neutral surfaces, one accent.** Grays/whites (light) or true neutral charcoal (dark) with a single green accent. No navy, no purple, no pink, no teal icon tiles.
3. **Content first.** Chat messages are the hero. Chrome (sidebar, header, input) is flat and low-contrast.
4. **Consistent systems.** One radius scale, one spacing scale, one icon style, one type scale.
5. **Familiar patterns.** Follow WhatsApp Web conventions: list on the left, conversation on the right, tailed bubbles, tick receipts, beige/dark wallpaper.
6. **Subtle motion.** 150–200 ms ease-out for hover/press/appear. Nothing pulses, floats, or glows.

### What must be removed (the "AI-made" tells)
- Constellation / network-dots animated background (all pages)
- `backdrop-blur` / glassmorphism on cards, sidebar, header, modals
- Gradient text ("Context-Aware AI", "CogniFlow" two-tone title)
- Colored glow shadows around buttons and inputs
- Colorful tinted icon tiles (blue, purple, pink, teal, green squares)
- "Powered by Google Gemini Vision" pill badge
- Rocket emoji / decorative emojis in UI labels (keep emoji only inside user-typed messages)
- Bold markdown asterisks leaking into UI text (e.g. `**Interactive Quiz: ...` in the chat list preview — strip markdown in previews)
- Large "floating panel" look with heavy outer margins around the whole app

---

## 2. Design Tokens

Implement as CSS variables in the global stylesheet and map them in `tailwind.config.js`. Use these tokens everywhere; no hard-coded hex values in components.

### 2.1 Colors

```css
:root {
  /* Surfaces */
  --bg-app:            #F0F2F5;   /* outer canvas / behind panels */
  --bg-panel:          #FFFFFF;   /* sidebar, header, cards */
  --bg-chat:           #EFEAE2;   /* conversation wallpaper */
  --bg-hover:          #F5F6F6;
  --bg-selected:       #F0F2F5;
  --bg-input:          #F0F2F5;

  /* Text */
  --text-primary:      #111B21;
  --text-secondary:    #667781;
  --text-tertiary:     #8696A0;
  --text-on-accent:    #FFFFFF;

  /* Lines */
  --border:            #E9EDEF;
  --border-strong:     #D1D7DB;

  /* Accent (single brand color) */
  --accent:            #00A884;
  --accent-hover:      #008F72;
  --accent-soft:       #E7F8F3;   /* subtle tinted backgrounds */

  /* Chat bubbles */
  --bubble-out:        #D9FDD3;
  --bubble-out-text:   #111B21;
  --bubble-in:         #FFFFFF;
  --bubble-in-text:    #111B21;

  /* Status */
  --tick-sent:         #8696A0;   /* gray */
  --tick-seen:         #53BDEB;   /* blue */
  --danger:            #D92D20;
  --success:           #1FA855;

  /* Elevation (very light) */
  --shadow-sm: 0 1px 1px rgba(11, 20, 26, 0.08);
  --shadow-md: 0 2px 8px rgba(11, 20, 26, 0.10);
}

[data-theme="dark"], .dark {
  --bg-app:            #0B141A;
  --bg-panel:          #111B21;
  --bg-chat:           #0B141A;
  --bg-hover:          #202C33;
  --bg-selected:       #2A3942;
  --bg-input:          #202C33;

  --text-primary:      #E9EDEF;
  --text-secondary:    #8696A0;
  --text-tertiary:     #667781;

  --border:            #222D34;
  --border-strong:     #2F3B43;

  --accent:            #00A884;
  --accent-hover:      #06CF9C;
  --accent-soft:       #0F2A26;

  --bubble-out:        #005C4B;
  --bubble-out-text:   #E9EDEF;
  --bubble-in:         #202C33;
  --bubble-in-text:    #E9EDEF;

  --shadow-sm: none;
  --shadow-md: 0 2px 10px rgba(0, 0, 0, 0.35);
}
```

**Default theme:** Light (respect `prefers-color-scheme` on first visit, then persist the user's toggle exactly as the current theme toggle does).

### 2.2 Typography

Use the system font stack so it renders as SF Pro on Apple devices and Segoe UI/Roboto elsewhere. Drop any decorative/heavy display font.

```css
font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter",
             "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
-webkit-font-smoothing: antialiased;
```

| Role | Size / Line | Weight | Color |
|---|---|---|---|
| Landing headline | 48 / 52 (32 / 38 on mobile) | 600 | primary |
| Section title | 28 / 34 | 600 | primary |
| Card / panel title | 16 / 22 | 600 | primary |
| Chat list name | 16 / 20 | 500 | primary |
| Message text | 14.5 / 20 | 400 | bubble text |
| Body / secondary | 14 / 20 | 400 | secondary |
| Meta (time, receipts, hints) | 11.5 / 14 | 400 | tertiary |

Rules: letter-spacing `-0.01em` on headings only; no all-caps labels except tiny section labels (11px, `0.04em`, secondary color). Never use font-weight 800/900.

### 2.3 Radius, spacing, sizing

- Radius scale: `4px` (chips/small), `8px` (bubbles, list items), `10px` (buttons, inputs), `12px` (cards, modals), `9999px` (avatars, pills, send button).
- Spacing: strict 4px grid (4, 8, 12, 16, 20, 24, 32, 48).
- Icons: **Lucide** (or existing icon set) at `20px`, `stroke-width: 1.75`, color `--text-secondary` by default. One icon set only.
- Hit targets: minimum 40×40px for icon buttons.

### 2.4 Motion

```css
--ease: cubic-bezier(0.2, 0, 0, 1);
transition: background-color .15s var(--ease), color .15s var(--ease),
            border-color .15s var(--ease), opacity .15s var(--ease);
```
- New message: fade + 4px translate-up, 150ms.
- Modal/menu: fade + scale from 0.98, 150ms.
- Remove all infinite animations except the typing-dots indicator.
- Respect `prefers-reduced-motion`.

---

## 3. Global Changes

1. **Delete the animated network background component** (canvas/particles/SVG) from every route. If it is a shared `<Background />` component, stop rendering it (keep file until confirmed unused, then remove).
2. Body background = `var(--bg-app)`; text = `var(--text-primary)`.
3. **Scrollbars:** thin, neutral.
   ```css
   *::-webkit-scrollbar { width: 6px; height: 6px; }
   *::-webkit-scrollbar-thumb { background: var(--border-strong); border-radius: 9999px; }
   *::-webkit-scrollbar-track { background: transparent; }
   ```
4. **Focus ring** (accessibility, Apple-like): `outline: 2px solid var(--accent); outline-offset: 2px;` on `:focus-visible` only.
5. Remove every `shadow-*` that uses a colored glow (`shadow-blue-*`, `shadow-[0_0_...]`). Use only `--shadow-sm` / `--shadow-md`.
6. Remove all `bg-gradient-*` and `bg-clip-text` usages.
7. Remove all `backdrop-blur-*` and semi-transparent panel backgrounds (`bg-white/5`, `bg-slate-900/60`, etc.) — panels are solid `var(--bg-panel)`.
8. Selection color: `::selection { background: var(--accent-soft); }`.

---

## 4. Screen-by-Screen Instructions

### 4.1 Landing Page

**Layout:** Simple, centered, generous whitespace. Max content width 1040px. Background `var(--bg-panel)` (white in light, `#111B21` in dark). No particles.

**Navbar**
- Height 64px, solid panel background, 1px bottom border `var(--border)`. No blur.
- Left: logo mark (24px) + "CogniFlow" wordmark, weight 600, single color (`--text-primary`). No two-tone.
- Right: "About" as a plain text link (secondary color, hover primary) and **Login** as a filled accent button (`--accent`, white text, radius 10px, height 36px, padding 0 16px, no shadow).

**Hero**
- Remove the "Powered by Google Gemini Vision" pill.
- Remove the large rounded logo tile above the headline.
- Headline (single solid color, no gradient), suggested copy:
  **"Team chat with an assistant that reads your files."**
- Sub-copy (max 2 lines, secondary color, 18px/28px, max-width 560px):
  "Message your team in real time and ask CogniBot about any image or PDF, right inside the conversation."
- Primary CTA: **Get started** (accent filled, height 44px, radius 10px). Secondary CTA: **Log in** (text/outline button, 1px `--border-strong`).
- Below the CTAs, show a **static product screenshot/mock** of the chat UI (rendered with real components in light theme) inside a 12px-radius container with `--shadow-md` and a 1px border. This replaces the "See it in action" section's fake card.

**Features section** ("Everything you need to collaborate")
- Replace the 6 glass cards with a clean 3×2 grid (1 column on mobile) of **flat, borderless items**: icon (20px, `--accent`, no tinted tile) → title (16px/600) → description (14px, secondary). Separate with generous 32px gaps; optionally a 1px `--border` outline card with 12px radius and 24px padding, solid `--bg-panel`, no hover glow (hover: `--bg-hover` only).
- All six icons use the same accent color and stroke weight.
- Tighten copy (remove hype like "lightning-fast", "zero lag", "intelligent"):
  - **Real-time messaging** — Group rooms and one-to-one chats that update instantly.
  - **CogniBot in any chat** — Type `@cogni` to ask the assistant a question in the room.
  - **Image and PDF understanding** — Upload a file and ask CogniBot to describe or summarize it.
  - **Read receipts** — See when a message is sent, delivered, and seen.
  - **Typing indicators** — Know when someone, or CogniBot, is replying.
  - **Attachments** — Share images and files, with a preview before you send.

**"See it in action" section**
- Remove or merge into the hero screenshot. If kept, use the real chat components in a static container (no fake dark glass card), title 28px/600, subtitle secondary.

**Footer:** 1px top border, small secondary text, no decoration.

### 4.2 Login / Register

**Layout:** Full-height, `--bg-app` background, one centered card.

- Card: width 400px (100% − 32px on mobile), `--bg-panel`, radius 12px, 1px `--border`, `--shadow-md`, padding 32px. No blur, no glow.
- Top: logo mark 40px (no tile behind it), then title **"Sign in to CogniFlow"** (22px/600, single color), subtitle "Welcome back" optional (secondary).
- **Inputs:** height 44px, radius 10px, background `--bg-input`, 1px transparent border, text primary, placeholder tertiary. Focus: border `--accent` + 2px `--accent-soft` ring. Use labels above fields (13px/500, secondary) instead of placeholder-only. Password field gets a show/hide eye icon on the right.
- **Remove the temp-mail icon** inside the email field unless it triggers a real function; if it does, restyle as a plain 20px secondary-color icon button.
- **Login button:** full width, height 44px, accent filled, white text 15px/600, radius 10px. Hover `--accent-hover`. Disabled: 50% opacity. Loading: small spinner replacing label.
- **Demo accounts (keep functionality):** The big "QUICK DEMO TESTING" box with rocket emoji is too loud. Replace with:
  - A quiet divider `— or —` below the form, then a single-line text button row: "Try a demo account:" followed by two small outlined buttons **Demo 1** and **Demo 2** (height 32px, radius 8px, 1px `--border-strong`, secondary text, hover `--bg-hover`).
  - Show the shared demo password as small, selectable helper text (12px, tertiary, monospace only for the password) under those buttons, or only in a tooltip — keep it accessible since it is needed for testing.
  - Wire the buttons to the exact same handlers as today.
- Footer link: "Don't have an account? **Register**" — 14px, secondary, link in accent color, no underline until hover.
- Register page uses the same card, same fields, same button.

### 4.3 App Shell (Chat Screen)

**Layout (desktop ≥ 1024px):** full viewport, no outer floating margin, no rounded outer container.
- Left sidebar fixed **380px** (min 320, max 420), right pane fills the remaining width.
- 1px `--border` line between the two panes. Both panes are flat and solid.
- Mobile (< 768px): show the list OR the conversation full-screen (WhatsApp mobile behavior) with a back arrow in the chat header. Keep the existing responsive logic if it has one; only restyle.

### 4.4 Sidebar (Chat List)

**Header (height 60px, `--bg-panel`)**
- Left: the user's avatar (40px circle) — replaces the large "CogniFlow" logo row. Keep the CogniFlow logo mark small (20px) only if needed for branding on the landing side; not necessary here.
- Right: icon buttons (40×40, 20px icons, secondary color, hover `--bg-hover`, radius 9999px): **New chat** (`+`), **Theme toggle** (sun/moon, same handler), **Settings** (gear) and a **⋮ menu** containing Logout.
- **Move Logout** out of the big red bottom button into the overflow menu (or the settings menu). Keep the same handler.
- Remove the floating circular CogniBot FAB in the bottom-right of the sidebar (the CogniBot chat is already listed at the top of the list and in the input bar). If it has unique functionality, move that entry point into the header `+` menu ("Chat with CogniBot").

**Search**
- Below the header: a full-width search field, height 36px, radius 8px, background `--bg-input`, search icon 18px tertiary on the left, placeholder "Search or start a new chat", no border. Focus: white/panel background with 1px `--border-strong`.

**Chat list item**
- Height 72px, padding 0 16px, avatar 48px circle at left, 16px gap.
- Row 1: name (16px/500, primary, single line ellipsis) left; time (12px, tertiary) right. Time turns `--accent` when there are unread messages.
- Row 2: last message preview (14px, secondary, single line ellipsis), with a receipt tick before it for outgoing messages, and an **unread badge** on the right: circle 20px min-width, `--accent` background, white 12px/600 text.
- **Strip markdown/emoji noise from previews** (`**`, `#`, backticks). For quiz messages show "Quiz: Shashank Kumar's Professional Profile" with a small quiz icon, not raw markdown.
- Hover: `--bg-hover`. Selected: `--bg-selected` (no blue border, no blue-tinted background, no colored name text — selected name stays primary color).
- Bottom divider: 1px `--border`, inset from the avatar's right edge (start line at x = 80px) — the iOS/WhatsApp inset separator.
- **CogniBot entry:** same row style as any contact; give it a small "AI" pill (10px, `--accent-soft` bg, `--accent` text, radius 4px) next to the name to distinguish it. Use a flat, simple bot avatar (the logo mark on a `--bg-hover` circle), not the glossy 3D logo.

### 4.5 Conversation Header

- Height 60px, `--bg-panel`, 1px bottom border. No blur.
- Left: avatar 40px + name (16px/500) + subtitle line (13px secondary: "online", "typing…", or "3 participants").
- Right: icon buttons only.
  - **Quiz Me** — currently a purple pill button. Restyle as a neutral outlined button: height 32px, radius 8px, 1px `--border-strong`, text primary 13px/500, icon 16px `--accent`. Hover `--bg-hover`.
  - **Cogni AI (badge "1")** — same neutral outlined style; the count becomes a small `--accent` dot/badge (16px, white text) — no blue glow.
  - **⋮ menu** — plain icon button; dropdown menu per §4.10.
- On mobile, collapse Quiz Me / Cogni AI into the ⋮ menu or icon-only buttons.

### 4.6 Message Area

- Background: `--bg-chat`. Optional: a very faint WhatsApp-style doodle pattern at 4–6% opacity in light mode, none in dark mode (or omit entirely for a cleaner Apple feel — preferred).
- Horizontal padding: 8% of width on desktop (max content width ~820px, centered), 12px on mobile.
- **Date separators** ("Today", "Yesterday", "12 Sept"): centered pill, 12px/500, secondary text, background `--bg-panel`, radius 8px, padding 4px 10px, `--shadow-sm`.
- Vertical rhythm: 2px between consecutive messages from the same sender, 10px when the sender changes.

### 4.7 Message Bubbles

- **Outgoing:** right-aligned, `--bubble-out`, text `--bubble-out-text`.
- **Incoming:** left-aligned, `--bubble-in`, text `--bubble-in-text`, `--shadow-sm` in light mode.
- Radius `8px`; the **first bubble in a group gets a tail** (a 8×13px CSS triangle/clip-path pointing top-right for outgoing, top-left for incoming) and a squared corner on that side (`border-top-right-radius: 0` for outgoing group-first, `border-top-left-radius: 0` for incoming group-first). Subsequent bubbles in the group have no tail and full radius.
- Padding: `6px 8px 8px 9px`. Max width: 65% of the chat area (85% on mobile). Text wraps with `overflow-wrap: anywhere`.
- **Timestamp + receipt:** inline at the bottom-right inside the bubble (11px, tertiary; on outgoing use a slightly darker green-gray `rgba(17,27,33,.55)` in light and `rgba(233,237,239,.6)` in dark). Reserve space using the float-right trick so text can flow beside it.
- **Receipts (keep existing logic/states, restyle only):**
  - Sent: single check, gray `--tick-sent`
  - Delivered: double check, gray
  - Seen: double check, `--tick-seen` (#53BDEB)
  - 16px lucide `Check` / `CheckCheck`, stroke 2.
- **Sender name in group chats:** 12.5px/500 above incoming messages, colored from a fixed palette of 6–8 muted hues (deterministic by user id), first bubble of the group only.
- **Long-press / hover actions:** on hover show a small chevron button at the bubble's top-right that opens the message menu (if such actions exist today).

### 4.8 CogniBot / AI Messages

AI replies must look like a *normal participant*, not a special glowing panel.

- Render as an incoming bubble (`--bubble-in`) with a small "CogniBot" sender label in `--accent` at the top (12.5px/500) plus the flat bot avatar in group chats.
- Markdown inside the bubble: body 14.5px, headings max 15px/600, lists with 20px left padding, inline code in `--bg-input` with 4px radius and a monospace font at 13px, code blocks `--bg-input` with 8px radius and horizontal scroll.
- **Sources / citations** (currently boxed with a book icon and pills):
  - Separator: 1px `--border` line, 8px margin.
  - Label "Sources" 12px/500 secondary — no book icon.
  - Each source is a small chip: 12px text, radius 6px, background `--bg-input`, 1px `--border`, padding 2px 8px, format `1 · Aarsh_Ai.pdf · p.1`. Hover: `--bg-hover`. Preserve the click behavior.
  - Inline citation markers `[1]` become superscript, `--accent` colored, no brackets styling change needed beyond color.
- **Typing indicator (human or AI):** an incoming-style bubble containing three 6px dots in `--text-tertiary` with a staggered 1s opacity/translateY(-2px) loop. No gradient dots, no glow. Caption "CogniBot is typing…" belongs in the header subtitle, not in a separate glowing pill.

### 4.9 Quiz Card

The quiz is a feature-critical UI; keep all logic and states (progress, answered count, correct/incorrect reveal), change presentation only.

- Container: a message-width card (max 420px) inside the AI bubble style — `--bubble-in` background, radius 12px, 1px `--border`, padding 16px. Remove the extra nested rounded panels (there is currently a card inside a card inside a bubble); flatten to one surface.
- Header: quiz title (15px/600) and "Question 1 of 5" (12px secondary) on the left; the "0/5 Answered" pill becomes plain text `0/5` (12px/500, secondary) on the right — no blue pill.
- Progress bar: 4px tall, radius 9999px, track `--border`, fill `--accent`, animated width 200ms. No glow.
- Question text: 15px/500, primary, 12px below the progress bar.
- **Options:** stacked buttons, full width, min-height 44px, radius 10px, 1px `--border`, background `--bg-panel`, padding 10px 12px, 8px gap. Letter badge (A/B/C/D) becomes a 24px circle with 1px `--border-strong`, 12px/600 secondary text.
  - Hover: `--bg-hover`.
  - Selected/pending: border `--accent`, background `--accent-soft`, badge filled `--accent` with white text.
  - Correct (after reveal): border `--success`, background `rgba(31,168,85,.10)`, check icon at right.
  - Incorrect (after reveal): border `--danger`, background `rgba(217,45,32,.08)`, x icon at right.
  - Disabled/other after reveal: 60% opacity.
- Result screen: score as large number (28px/600) + short line of text + a neutral "Try again" outlined button and an accent "Done" button (only if those actions exist today).

### 4.10 Message Input Bar

- Height 62px min, background `--bg-panel` (WhatsApp's slightly gray bar `#F0F2F5` in light, `#202C33` in dark is also acceptable — choose `--bg-input` for the bar and white/`--bg-panel` for the text field for the classic look), 1px top border.
- Layout (left → right): **Attach** icon button (paperclip, 24px, secondary) → **CogniBot** quick-insert button → text field (flex-1) → **Send** button.
- Text field: min-height 40px, radius 8px (WhatsApp) or 20px (iMessage) — use **20px pill** for the Apple feel, background `--bg-panel`, no border, padding 10px 14px, 15px text. Placeholder: "Type a message" (drop the "or use @cogni…" from the placeholder; instead show a one-time tooltip or a helper line inside the CogniBot button's tooltip: "Type @cogni to ask CogniBot").
- **CogniBot button:** currently a glowing bordered logo tile. Replace with a flat 40px circle icon button showing a simple sparkle/bot glyph in `--accent`. Hover `--bg-hover`. Same click handler (inserts `@cogni`).
- **Send button:** 40px circle. Empty input → transparent with a gray send icon (disabled). Has text → `--accent` background, white icon, no glow. Enter to send behavior is unchanged.
- **Attachment preview** (before sending): a tray above the input with a thumbnail (64px, radius 8px, 1px border) or a file chip (icon + name + size), and a small `×` remove button (20px circle, `--bg-panel`, `--shadow-sm`) at the top-right corner of the thumbnail.

### 4.11 Attachments in Messages

- **Image:** rounded 6px inside the bubble, max 320×360, `object-fit: cover`, 2px inner padding from the bubble edge; the timestamp overlays the image bottom-right on a subtle dark gradient scrim only when the image has no caption. Click opens the existing viewer/lightbox — restyle the lightbox as a solid `rgba(0,0,0,.9)` overlay with a plain close icon.
- **PDF / file:** a row inside the bubble: 40px file-type icon (flat, `--bg-input` rounded square with a `FileText` icon in `--text-secondary`), file name (14px/500, ellipsis), meta line "PDF · 240 KB" (12px secondary), and a download icon button. The current solid bright-blue file card (e.g. `Q3_Report.pdf`) should be removed — use the bubble's own color.
- Upload progress: thin 2px `--accent` bar at the bottom of the bubble.

### 4.12 Menus, Modals, Toasts, Settings

- **Dropdown / context menu:** solid `--bg-panel`, radius 12px, 1px `--border`, `--shadow-md`, padding 6px; items 40px tall, 14px text, radius 8px, hover `--bg-hover`; danger items (Logout, Delete) in `--danger`. Icons 18px secondary at left.
- **Modal / dialog (New chat, Create group, Settings):** overlay `rgba(11,20,26,.5)` — no blur. Sheet: `--bg-panel`, radius 14px, padding 24px, max-width 440px, `--shadow-md`. Title 18px/600. Buttons right-aligned: neutral "Cancel" (text button) then accent "Confirm/Create".
- **New chat / user search results:** same list-item pattern as §4.4 (avatar 40px, name, subtitle).
- **Settings panel:** grouped list in iOS style — section label (12px caps, secondary), rows in a rounded 12px container with inset dividers, toggles styled iOS-like (51×31 track, `--accent` when on, white 27px thumb).
- **Toasts:** bottom-center, solid dark (`#111B21`) pill, white 14px text, radius 10px, auto-dismiss; no colored glow, error variant uses a left 3px `--danger` bar.
- **Tooltips:** `#111B21` background, white 12px text, radius 6px, 6px 10px padding, 300ms delay.

### 4.13 Avatars & Empty States

- Avatars: circles, 1px `--border` outline only when they contain a light image. Fallback (initials): background from a muted deterministic palette, white 600 initials — never the saturated blue "D" tile.
- **Empty chat (no conversation selected, desktop):** centered, `--bg-app` background, a simple 64px outline icon in `--text-tertiary`, title "CogniFlow for Web" (22px/500 primary), one line of secondary text ("Select a chat to start messaging, or type @cogni in any group to ask the assistant."), no illustration glow.
- **Empty chat list / search:** plain centered secondary text.
- **Loading:** skeleton rows (gray `--bg-hover` rectangles with a very subtle 1.4s shimmer) instead of spinners where feasible; otherwise a 20px accent spinner.

---

## 5. Tailwind Config Mapping (suggested)

```js
// tailwind.config.js
module.exports = {
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        app: "var(--bg-app)",
        panel: "var(--bg-panel)",
        chat: "var(--bg-chat)",
        hover: "var(--bg-hover)",
        selected: "var(--bg-selected)",
        field: "var(--bg-input)",
        ink: {
          DEFAULT: "var(--text-primary)",
          2: "var(--text-secondary)",
          3: "var(--text-tertiary)",
        },
        line: { DEFAULT: "var(--border)", strong: "var(--border-strong)" },
        accent: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
          soft: "var(--accent-soft)",
        },
        bubble: { out: "var(--bubble-out)", in: "var(--bubble-in)" },
        tick: { sent: "var(--tick-sent)", seen: "var(--tick-seen)" },
        danger: "var(--danger)",
        success: "var(--success)",
      },
      borderRadius: { sm: "4px", md: "8px", lg: "10px", xl: "12px" },
      boxShadow: { sm: "var(--shadow-sm)", md: "var(--shadow-md)" },
      fontFamily: {
        sans: ['-apple-system','BlinkMacSystemFont','"SF Pro Text"','Inter','"Segoe UI"','Roboto','"Helvetica Neue"','Arial','sans-serif'],
      },
    },
  },
};
```

Bubble tail helper (add to global CSS):

```css
.bubble-tail-out::after,
.bubble-tail-in::after {
  content: ""; position: absolute; top: 0; width: 8px; height: 13px;
}
.bubble-tail-out::after {
  right: -8px; background: var(--bubble-out);
  clip-path: polygon(0 0, 100% 0, 0 100%);
}
.bubble-tail-in::after {
  left: -8px; background: var(--bubble-in);
  clip-path: polygon(0 0, 100% 0, 100% 100%);
}
```

---

## 6. Implementation Order

1. Add tokens (CSS variables) + Tailwind mapping + system font. Set theme toggle to drive `data-theme`.
2. Remove the animated background, glass, gradients, glows globally (§3).
3. Login / Register (§4.2).
4. App shell + sidebar + search + list items (§4.3–4.4).
5. Conversation header, message area, bubbles, receipts, typing indicator (§4.5–4.8).
6. Input bar and attachments (§4.10–4.11).
7. CogniBot messages, sources, and quiz card (§4.8–4.9).
8. Menus, modals, settings, toasts, empty states (§4.12–4.13).
9. Landing page (§4.1).
10. Responsive pass (375px, 768px, 1280px, 1920px) in both themes.

Commit after each step so any regression is easy to revert.

---

## 7. Do Not Touch (functional safeguards)

- Socket connection, event names, room join/leave, typing emit/listen
- Message send/receive, delivered/seen status logic
- Auth (login, register, demo login handlers, token storage), routing/guards
- Cloudinary upload logic and file type/size validation
- `@cogni` mention detection and Gemini request/response handling, PDF page sources data
- Quiz generation, answer checking, scoring
- Theme persistence, unread counters, search behavior
- Any `id`, `data-testid`, `aria-*`, `name`, or form field attributes

If a visual change appears to require touching one of the above, keep the logic and adapt the markup/styling around it instead.

---

## 8. Acceptance Checklist

- [ ] No animated network/particle background anywhere
- [ ] No `backdrop-blur`, gradients, colored glows, or gradient text in the codebase (search for `blur`, `gradient`, `shadow-[`, `bg-clip-text`)
- [ ] Only one accent color (`--accent` green) plus semantic danger/success
- [ ] Light and dark themes both fully styled from tokens; no hard-coded hex in components
- [ ] Sidebar is 380px, flat, with WhatsApp-style rows, inset dividers, unread badges
- [ ] Bubbles have tails on the first message of a group, inline time + tick receipts (gray → blue when seen)
- [ ] Typing indicator is a neutral three-dot bubble
- [ ] CogniBot replies look like normal incoming bubbles with a small "CogniBot" label; sources are small neutral chips
- [ ] Quiz card is a single flat surface with clear selected/correct/incorrect states
- [ ] Input bar is a clean pill field with a circular send button that activates only with content
- [ ] Logout lives in a menu, not as a big red button; the floating CogniBot FAB is removed
- [ ] Login shows a normal form first, with demo accounts as a quiet secondary option
- [ ] Landing page: solid background, plain headline, one CTA pair, real product screenshot, flat feature grid
- [ ] No raw markdown symbols or emojis leaking into list previews or UI labels
- [ ] All existing features work exactly as before (send, receive, receipts, typing, attachments, @cogni, Quiz Me, search, theme toggle)
- [ ] Contrast meets WCAG AA (4.5:1 for body text) in both themes
- [ ] Layout works at 375px, 768px, 1280px, 1920px
