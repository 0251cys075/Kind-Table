# Kind Table — Canonical Design Language Specification
**Source of Truth for All New Features & Components**

This document establishes the only allowed design tokens, components, and patterns in Kind Table. Any new screen or component (Sign up, Log in, My profile, Location Place Picker, Near Me Bar, Users Section) MUST strictly adhere to these values.

---

## 1. Palette & Colours

| Token Role | Hex / Class | Usage |
| :--- | :--- | :--- |
| **Primary Brand** | `emerald-800` (`#065f46`) / `#023616` | Main CTAs, active nav pills, primary badges, logo container |
| **Primary Deep** | `emerald-950` (`#022c22`) | High-contrast page titles, prominent brand headings |
| **Primary Tint** | `emerald-100` (`#d1fae5`) | Tag backgrounds, verified chips, tour banners |
| **Primary Border** | `emerald-200` / `emerald-300` | Borders around emerald tags and tour alert boxes |
| **Secondary Accent**| `amber-600` (`#d97706`) / `amber-700` (`#b45309`) | Urgency timers, "Donate Food" button, italic accent text |
| **Secondary Tint**| `amber-100` (`#fef3c7`) | Claimed status chips, in-transit badges |
| **Secondary Border**| `amber-200` / `amber-300` | Borders around amber chips and alert banners |
| **Page Canvas** | `bg-slate-50` (`#f8fafc`) | Page root backgrounds, body background |
| **Card Surface** | `bg-white` (`#ffffff`) | Forms, batch cards, tables, modals, preview wrappers |
| **Subtle Surface**| `bg-slate-100` (`#f1f5f9`) | Inactive button pills, input backgrounds, table alternating rows |
| **Card Borders** | `border-slate-200` (`#e2e8f0`) | Universal crisp dividing line for all light surfaces |
| **Dividers** | `border-slate-100` / `border-slate-200/80` | Table row dividers, modal footers |
| **Heading Text** | `text-slate-900` (`#0f172a`) | H1-H4 headings, card titles, bold metrics |
| **Body Text** | `text-slate-600` (`#475569`) | Paragraph descriptions, form helper hints, subtitles |
| **Muted Text** | `text-slate-500` / `text-slate-400` | Timestamps, units ("meals"), secondary labels |

---

## 2. Typography

- **Font Family**:
  - Primary UI & Body: `'Plus Jakarta Sans', system-ui, sans-serif`
  - Display Accent: `font-serif` (used for italic tagline phrase *"shared in time."*)
  - Monospace Data: `font-mono` (used for Batch IDs, logs, audit hashes, coordinates)
- **Hierarchy**:
  - Page Hero H1: `text-3xl sm:text-5xl font-extrabold tracking-tight`
  - Section H2: `text-2xl sm:text-3xl font-extrabold text-slate-900`
  - Card H3: `text-lg sm:text-xl font-bold text-slate-900`
  - Field Labels: `text-sm sm:text-base font-bold text-slate-900`
  - Badges / Micro: `text-xs font-bold uppercase tracking-wider`

---

## 3. Shapes & Corner Radii

- **Buttons & Pills**: `rounded-full` (`9999px`)
- **Interactive Cards & Forms**: `rounded-2xl` (`1rem` / `16px`)
- **Large Accent Banners (SDG 2)**: `rounded-3xl` (`1.5rem` / `24px`)
- **Form Inputs & Modals**: `rounded-xl` (`0.75rem` / `12px`) or `rounded-2xl`

---

## 4. Iconography

- **Icon Set**: Google Material Symbols Outlined (`font-family: 'Material Symbols Outlined'`)
- Standard icons:
  - `volunteer_activism` (Brand logo)
  - `soup_kitchen`, `bakery_dining`, `nutrition`, `inventory_2`, `egg` (Category cards)
  - `local_shipping` (Fleet & courier in-transit)
  - `verified`, `verified_user`, `security` (Hygiene & safety)
  - `location_on`, `my_location`, `near_me` (Place picker & distance)
  - `person`, `account_circle`, `badge` (User profiles & auth)
  - `timer`, `schedule` (Expiry & urgency)
  - `task_alt`, `check`, `done_all` (Success state)

---

## 5. Component Patterns

- **Buttons**:
  - Primary Action: `bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-full transition-all shadow-md`
  - Secondary Action: `bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-bold rounded-full`
  - Ghost / Subtle: `bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-full`
- **Inputs**:
  - `w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-700 outline-none transition-all`
- **Status Chips**:
  - Available: `bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full px-3 py-0.5 text-xs font-bold uppercase`
  - In Transit / Claimed: `bg-amber-100 text-amber-800 border border-amber-200 rounded-full px-3 py-0.5 text-xs font-bold uppercase`
  - Expired / Lapsed: `bg-slate-100 text-slate-600 border border-slate-200 rounded-full px-3 py-0.5 text-xs font-bold uppercase`
