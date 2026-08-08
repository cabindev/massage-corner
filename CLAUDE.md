@AGENTS.md

# Massage Corner Sofia — booking system

Next.js 16 (App Router) + Prisma + MySQL booking site for a Thai massage shop in
Sofia, Bulgaria. Public storefront is **bilingual (EN/BG)**; the admin back
office is **English-only**. Single self-contained app in this folder — assets
live in `public/` (no external/PHP dependencies).

## Commands

- `npm run dev` / `build` / `start` / `lint`
- `npm run seed` — ⚠️ **RESETS** Services/Therapists/Bookings (`deleteMany`) then
  seeds 10 services + 3 therapists + admin user. **Wipes real bookings** — don't
  run on live data.
- `npm run seed:sample` / `seed:sample:clear` — demo bookings tagged
  `notes="[sample]"` (clear removes only those, not real ones).

## Environment (`.env`)

- `DATABASE_URL="mysql://root:root@127.0.0.1:3306/massage_shop"` (MAMP MySQL)
- `NEXTAUTH_URL`, `NEXTAUTH_SECRET` — **must stay set and stable**. If
  `NEXTAUTH_SECRET` is missing, NextAuth generates a random secret per process,
  so existing sessions break on every restart (`JWT_SESSION_ERROR: decryption
  failed`). If you hit that error, check `.env` first.
- `EMAIL_USER`, `EMAIL_PASS`, `BOOKING_NOTIFY_EMAIL` — owner email alert on each
  new booking via Gmail SMTP (`lib/email-notify.ts`, nodemailer). `EMAIL_PASS` is
  a Google **App Password** (needs 2FA on the account), not the login password.
  User/pass empty ⇒ **silent no-op**, booking still succeeds.
  `BOOKING_NOTIFY_EMAIL` takes a comma-separated list; unset ⇒ sends to
  `EMAIL_USER`. Gmail rewrites `From` to the authenticated account.

## Data model (`prisma/schema.prisma`, provider = mysql)

- **Service** — `name`/`nameBg`, `description`/`descriptionBg`, `price` (EUR
  `Decimal`), `durationMinutes`, `imageUrl`, `priceTiers` (`Json`:
  `[{minutes,price}]` for the price list), `isActive`.
- **Booking** — `customerName`, `phone`, `bookingTime`, `endTime`, `status`
  (`PENDING|CONFIRMED|REJECTED|COMPLETED|CANCELLED`), `notes`, `serviceId`,
  `therapistId` (nullable, `onDelete: SetNull` → deleting a therapist unassigns
  their bookings).
- **Therapist** — `name`, `bio`, `imageUrl`, `isActive`. **# of active
  therapists = booking capacity.**
- **User** — `email`, `password` (bcrypt hash), `name`, `role` (`ADMIN|STAFF`).

## Booking & capacity (never overbook)

- Business hours / slots: **10:00–21:00, every 30 min** — constants in
  `lib/schedule-config.ts` (client-safe, no Prisma).
- Overlap/availability logic in `lib/availability.ts` (`overlapWhere`,
  `getDayAvailability`) — shared by the customer booking form and admin.
- All create/move/update run inside `prisma.$transaction` at **Serializable**
  isolation. A booking is rejected when overlapping active bookings ≥ active
  therapists, or when an assigned therapist already has a clashing booking
  (excluding itself on edit/move).
- Server actions:
  - `app/booking/actions.ts` — `createBooking`, `getAvailability` (public form)
  - `app/admin/bookings/actions.ts` — status / assign / `createBookingAdmin` /
    `updateBooking` / `deleteBooking`
  - `app/admin/walkin-actions.ts` — `createWalkin` (from the dashboard calendar)
  - `app/admin/schedule/actions.ts` — `moveBooking` (drag on week view)

## Auth

- NextAuth v4 + **bcryptjs** (`lib/auth-options.ts`), JWT strategy, cookie
  `ms-shop.session-token`, sign-in page `/auth/signin`.
- `lib/auth.ts`: `requireAdminPage()` (redirects, used in `app/admin/layout.tsx`)
  and `requireAdminAction()` (throws `UNAUTHORIZED`) — **every admin server
  action calls it**.
- Dev admin: `admin@massage.local` / `massage@2026`. **No public sign-up** (back
  office only); customers book without an account.

## i18n

- `app/components/I18nProvider.tsx` — client context, persists to `localStorage`
  key `mcs-lang`. Dictionary in `lib/i18n.ts` (`en` / `bg`). Use
  `useI18n()` → `{ t, lang, setLang }`. Default `en`. Service name/description
  switch via `nameBg`/`descriptionBg`. Admin UI is English-only.

## Design system

- Tailwind v4 theme in `app/globals.css`. Palette **"Emerald & Champagne"**:
  `leaf-*` = emerald (primary), `gold-*` = champagne (accent), `cream` =
  alabaster bg, `onyx` = darkest sections, `bark` = ink text.
- Fonts: **Cormorant Garamond** (`font-display`, headings) + **Inter** (body,
  latin+cyrillic), loaded in `app/layout.tsx`.
- Per-therapist colours: `lib/therapist-color.ts` (stable per id, rendered as
  dots in calendar / schedule / bookings).

## Key pages

- Storefront: `app/components/HomeContent.tsx` (hero → services → prices →
  gallery → video → about → contact), `app/booking/*` (form + live availability).
  `components/Navbar.tsx` (scroll-aware, mobile hamburger, shows Dashboard link
  when logged in as admin) + `components/Footer.tsx`.
- Admin (`app/admin/*`, guarded by layout):
  - `page.tsx` — dashboard: KPIs, month calendar (click a day → schedule + free
    slots; click a free slot → walk-in), today's schedule, upcoming, attention.
  - `bookings/` — table (desktop) / cards (mobile), filter tabs + search,
    full CRUD via shared `BookingFormModal`, assign therapist, status buttons.
  - `therapists/` — CRUD (add/rename/on-off/delete).
  - `schedule/` — `WeekSchedule`: weekly grid by therapist, drag to reschedule,
    double-click to edit, add/rename/delete therapists inline, mini calendars.
  - `services/` — read-only list.

## Conventions / gotchas

- **Read `node_modules/next/dist/docs/` before writing Next code** (see AGENTS.md
  — this is Next 16 with breaking changes).
- `'use server'` files may export **only async functions** (no const/value
  exports).
- Never import server-only libs (Prisma) into client components — keep shared
  constants in `lib/schedule-config.ts` / `lib/therapist-color.ts`.
- Pass `Date`s to client components as **ISO strings**, parse with `new Date()`.
- `public/` holds every asset (images, videos, logo); the app has no PHP/external
  dependencies.
