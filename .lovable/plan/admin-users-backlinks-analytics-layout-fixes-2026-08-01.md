# Admin Users, Backlinks, Analytics + Layout Fixes

## 1. Team user management (admin only)
The `team_members` table and permission function already exist in the backend, but there is no admin screen for it. Add **Admin > Users**:
- Admin enters email, full name, password -> a real login account is created for that person.
- Permission grid with checkboxes per area (Articles, Magazines, Industries, Subscribers, Messages, Backlinks) x action (view, create, edit, delete).
- Edit permissions, deactivate, reset password, delete user.
- Hard limit of 10 team users (already enforced in the database); the UI shows "X of 10 used" and blocks past the limit.
- Sidebar links are filtered by each user's permissions; only the main admin sees Users.

## 2. Backlinks manager
New backlinks section in admin: add a link (label, target URL, optional note) attached to an article or a magazine, or site-wide. List, edit, delete, and open/click counts. Backlinks appear on the related article/magazine page as a "Related Links / Sources" block.

## 3. Analytics on the admin dashboard
Track visits site-wide (page path, referrer, country/region, device, timestamp) and show on the dashboard:
- Visitors and page views for today / 7 days / 30 days with a trend chart
- Top pages, top articles, top referrers
- Visitors by country/region (list + share bars)
Region comes from the visitor's request headers at page-load time; no third-party analytics account needed.

## 4. Layout changes
- Move the "Executive Brief" newsletter signup out of the middle of the homepage into the footer (one subscribe block, footer-wide).
- Sidebar articles auto-rotate: Trending / Most Read lists cycle continuously through available articles with a smooth animation, pausing on hover.
- Remove the "Current Issues" block from the homepage sidebar; magazine covers stay only on the Magazine section. The homepage magazine slider stays exactly as it is.

## Technical notes
- New tables: `backlinks` (target_type, target_id, label, url, note, click_count) and `page_views` (path, referrer, country, region, device, created_at), both with RLS: public insert for page views, staff read via `can_do`; backlinks publicly readable, staff-writable.
- User creation/deletion uses the Auth admin API from a server function guarded by an admin role check; passwords are never stored in app tables.
- Permission areas extend the existing `can_do(user_id, area, action)` function and the `permissions` JSON on `team_members`.
- Page-view logging is a lightweight server function called on route change, with country derived from request headers.
