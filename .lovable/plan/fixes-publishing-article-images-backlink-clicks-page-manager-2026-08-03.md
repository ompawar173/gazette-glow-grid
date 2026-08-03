# Fixes: publishing, article images, backlink clicks, page manager, lighter admin

## 1. Publish error on articles
The article slug column is unique, so publishing a second article whose title produces the same slug (or a slug typed twice) fails with a raw database error that surfaces as an unhelpful message. The save form also sends the whole row back on update, which can conflict with fields it shouldn't touch.

Fix:
- Auto-uniquify the slug on save (append `-2`, `-3`, ... when taken) and strip anything URL-like that gets pasted into the slug box.
- Send only the editable fields on update instead of the full record.
- Show friendly messages ("An article with this URL already exists", "You don't have permission to publish") instead of raw errors.

## 2. Image too big on the article page
Featured image and images inside the article body currently render at full width with no height limit, so a tall upload dominates the screen when the article opens.

Fix:
- Cap the featured image to a fixed 16:9 frame with a max height (about 60% of the viewport) and centered cropping.
- Cap body images to a sensible max height and center them, keeping aspect ratio.
- Same caps applied on mobile so nothing overflows.

## 3. Backlink click counter not counting
Confirmed cause: the click handler calls the counter but never actually sends the request (the database call is created and discarded), so the click count stays at zero. Access rights for counting are already correct.

Fix:
- Actually send the click, and send it in a way that survives the browser navigating away to the external site.
- Count each click reliably, then show it back in the admin: total clicks, clicks per link, and last-clicked time, sorted by most clicked.
- Stronger backlink handling overall: URL normalisation and validation on save, duplicate detection, `rel="noopener nofollow sponsored"` control per link, optional "open in new tab", and a per-article/per-magazine link picker.

## 4. Admin-managed pages
New "Pages" section in the admin so static site pages are editable without code.

- A pages table holding slug, title, content, SEO title/description, hero image, and published/draft status.
- Admin list + rich text editor, same editor used for articles.
- About Us, Awards, Newsletter and the Industry hub intro read their content from this table, falling back to the current hard-coded copy if no page row exists.
- Page permissions added to the team-member permission grid, so a user can be given pages access only.

## 5. Lighter, friendlier admin theme
- Admin sidebar switches from solid navy to a white/light surface with dark text, a thin border, and red accent only on the active item and primary buttons.
- Cards, tables and headers on light neutral backgrounds with softer borders, more spacing, clearer typography.
- Buttons unified (primary red, secondary outline), consistent form field styling, hover/focus states.
- The public site theme is unchanged.

## Technical notes
- Slug uniqueness handled in the save path with a lookup + suffix loop; error mapping for Postgres code 23505 and RLS denials.
- Backlink click uses a `sendBeacon`-style fire-and-forget call to the existing counting function so it isn't cancelled by navigation; admin backlink table reads `click_count` with new sorting.
- New `public.pages` table with grants, RLS (public read of published, staff write through `can_do('pages', ...)`), and an `updated_at` trigger; `can_do` already supports arbitrary permission areas.
- Admin theme changes live in `AdminGate` and admin route markup plus admin-scoped tokens in `src/styles.css`.
