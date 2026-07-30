# CIO Times — Redesign, Magazine Slider, Industries & Team Accounts

## The image/magazine bug (root cause confirmed)

All three storage buckets (`article-images`, `magazine-covers`, `magazine-pdfs`) are **private**, but the upload helper returns a *public* URL. The upload succeeds, so the admin form looks fine, but every image/PDF URL saved to the database returns an unauthorized error — that's why uploaded covers and article images never appear on the site and magazines "error out".

Fix: switch the three buckets to public delivery (with admin-only write rules kept). If the workspace blocks public buckets, the fallback is signed URLs generated on read, and I'll say so.

## 1. Visual redesign — red & blue theme

- Replace the navy/gold tokens in `src/styles.css` with a deep-blue + signal-red palette (blue `#0A2A66` primary, red `#C8102E` accent, off-white paper background), applied site-wide: header, nav, footer, dividers, tags, buttons, links.
- Homepage rebuilt to feel like a magazine cover page: bold masthead, large lead story, red section rules, dense multi-column grids, and a prominent magazine showcase.

## 2. Magazine showcase carousel (like the uploaded reference)

- New coverflow-style slider on the homepage and the magazine archive page: centre cover enlarged, side covers scaled down and faded, red-outlined prev/next arrows, title caption under the active cover, click through to the issue page.
- Pulls live from published magazine issues; auto-advances and supports swipe on mobile.
- The uploaded screenshot is used as layout reference only, not embedded.

## 3. Header / top bar

- Top strip reduced to date and time only (live clock). About / Awards / Newsletter / Admin links removed from it.
- Main nav: Home, About Us, Industry, Magazine, Articles, Contact Us.

## 4. Pages & Industry structure

Routes after the change:

```text
/                 Home
/about            About Us
/contact          Contact Us  (new — form saved to backend + email display)
/industry         Industry hub, lists all industries
/industry/$slug   Industry page with its sub-industries
/industry/$slug/$sub   Sub-industry article listing
/articles         All articles
/magazines        Magazine archive + carousel
/magazines/$id    Issue detail
/article/$slug    Article detail
```

- Categories become **Industries** with **sub-industries** (the existing categories table already supports a parent). Old flat labels like "AI & Analytics" are re-modelled as industries with nested sub-branches; admin can add/edit both levels.
- Footer restyled to the new theme with the updated page list and industry columns.

## 5. Admin: team accounts with permissions

- Admin can create up to **10 additional users** (hard limit, enforced server-side). Creating a user generates their email + password credential to hand over.
- Per-user permissions chosen by the admin: which areas they can access (Articles, Magazines, Industries, Subscribers, Activity) and what they can do in each (view / create / edit / publish / delete).
- New "Users" screen in the admin sidebar: list, permissions editor, reset password, deactivate. Non-admin users only see the sections they were granted, and the rules are enforced in the database too — not just hidden in the UI.

## Technical notes

- Storage: flip the three buckets to public read via the storage tool; keep admin-only insert/update/delete policies on `storage.objects`. Add cache-busting on image URLs so replaced images refresh immediately.
- DB migration: `industries` + `sub_industries` (or reuse `categories.parent_category` with a slug-unique index), `contact_messages`, `app_users` permission table (`user_id`, JSONB permissions, `created_by`, `active`), and a trigger/check enforcing the 10-user cap. Full GRANTs + RLS on each new table.
- User creation runs through an admin-only server function using privileged access (the browser client cannot create auth users); it verifies the caller is an admin, counts existing team users, then creates the account and its permission row.
- Article/category references across existing routes are migrated to the new industry routes so no links break.
