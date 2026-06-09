# MediaVault UI Redesign Handoff

## Scope

This was a frontend-only visual redesign for the Next.js + Tailwind CSS MediaVault app. Backend logic, API calls, state management, routing, and business rules were intentionally left unchanged.

## Design Direction

The app was moved from a purple, soft-card visual style to a dense professional media-management interface inspired by Google Photos, VSCO, Linear, Notion, and Arc Browser.

The design goal was:

- Practical university-club media platform
- Dark charcoal workspace
- Warm amber primary actions
- Dense spacing
- Strong photo-first hierarchy
- Minimal rounding
- No glow, no glassmorphism, no neon, no gradients as page backgrounds

## Design Tokens Used

```txt
Background: #111111
Secondary Surface: #171717
Cards: #1A1A1A
Borders: #2A2622
Primary Accent: #F59E0B
Hover Accent: #D97706
Text Primary: #F0EDE8
Text Secondary: #B5B1AA
Text Muted: #7C7A74
```

## Files Changed

```txt
frontend/src/app/globals.css
frontend/src/components/Navbar.jsx
frontend/src/components/MediaGrid.jsx
frontend/src/app/page.js
frontend/src/app/dashboard/page.js
frontend/src/app/events/page.js
frontend/src/app/events/[id]/page.js
frontend/src/app/events/create/page.js
frontend/src/app/profile/page.js
frontend/src/app/analytics/page.js
frontend/src/app/search/page.js
frontend/src/app/login/page.js
frontend/src/app/register/page.js
frontend/src/app/clubs/join/page.js
```

## What Changed

### Global

- Updated body background and text colors.
- Updated scrollbar color.
- Added amber selection color.

### Navbar

- Made club switcher visually dominant.
- Added amber role badge next to club name.
- Reduced nav visual clutter.
- Hid nav links on smaller screens to prevent overflow.
- Replaced purple accents with amber.

### Landing Page

- Rebuilt into minimal hero with one headline, one sentence, one primary CTA, one secondary CTA.
- Feature section is now icon + label only.
- Footer is one line.

### Dashboard

- Stats cards now have a thin amber left border.
- Recent events use a photo-card layout with cover areas.
- Missing cover images use a subtle placeholder inside the card, not a page background.
- CTA uses amber primary styling.

### Events Page

- Compact inline filters.
- Event cards have minimum `h-40` cover image areas.
- Club name and role remain visible.
- Strong amber hover border and title hover state.

### Event Detail

- Header is denser and has a bottom separator.
- Upload button is the primary amber CTA.
- Share button is secondary.
- Upload modal uses compact professional drag/drop styling.
- QR modal is restrained; QR backing remains white for scan reliability.

### Media Grid + Lightbox

- Media grid is responsive: 2 columns mobile, 3 tablet, 4 desktop, 5 wide desktop.
- Square crops, tight spacing, minimal rounding.
- Lightbox gives photo/video maximum viewing area.
- Sidebar is structured: uploader/date, tags, actions, comments.
- Like button has `active:scale-95` and amber selected state.

### Profile

- Profile card updated to the new palette.
- Selfie image has circular crop and camera overlay on hover.
- Face-match empty state uses inline SVG illustration.
- Tabs use amber active border.

### Analytics

- Metrics use left-border indicators.
- Removed rainbow metric icon colors.
- Top events and recent uploads feel more like compact tables.
- Most liked media uses tight photo tiles.

### Search

- Search form is compact and dense.
- Inputs use warm dark surfaces and amber focus state.
- Loading grid aligns with the MediaGrid system.

### Auth + Club Forms

- Login, register, create event, and join/create club pages use the same form system:
  - `#171717` panel
  - `#2A2622` border
  - `#111111` inputs
  - amber focus/primary buttons
  - labels at `text-xs`

## Important Notes

- No backend files were edited during this UI pass.
- No API paths were changed.
- No route names were changed.
- No state variables or submit handlers were intentionally changed.
- Login/register files were replaced with equivalent logic plus new styling to remove broken placeholder encoding and old purple classes.
- The QR code backing remains `bg-white`; that is intentional so the QR code scans reliably.

## Remaining Verification

Run:

```txt
npm run build
```

Optional:

```txt
npm run lint
```

Lint may still report existing React compiler warnings unrelated to this visual pass.
