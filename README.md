# The Trade Chronicle

Build a B2B technology magazine and news website called "[YOUR BRAND NAME]" 

with a full admin content management system, using Supabase for database, 

authentication, and file storage.

VISUAL STYLE (old-school magazine/news portal look):

- Dense, information-heavy layout similar to classic business trade 

  magazines — not a modern minimalist blog

- Small thumbnail images (roughly 100x70px and 280x190px) paired with short 

  headlines packed tightly in multi-column grids

- Top ticker/slider strip of 5-6 rotating small thumbnail+headline items 

  right under the header

- Heavy use of horizontal divider lines between sections

- Navy blue (#0B1F3A) header/nav, orange/gold (#E8A33D) accent for tags and 

  buttons, white background, dense Helvetica/Arial-style body text

- Category tags in small caps above every headline

- Sidebar-heavy layout: main content column + narrow right sidebar with 

  "Trending", "Most Read", and small magazine cover thumbnails

DATABASE (Supabase tables):

- articles: id, title, slug, category, subcategory, author_name, 

  author_title, excerpt, body (rich text/HTML), featured_image_url, status 

  (draft/published), published_at, created_at, updated_at, view_count

- categories: id, name, slug, parent_category

- magazines: id, title, cover_image_url, pdf_file_url, issue_month, 

  issue_year, status (draft/published), created_at

- admin_users: id, email, role (admin/editor), linked to Supabase Auth

- newsletter_subscribers: id, email, subscribed_at

- activity_log: id, admin_email, action, target_type, target_id, timestamp

PUBLIC SITE PAGES:

1. Homepage — ticker slider, "Latest News" dense grid pulling live from 

   published articles, "Digital Magazine Issues" row from published 

   magazines, category-grouped sections, newsletter signup

2. Category pages — dynamic, filtered by category/subcategory, paginated

3. Article detail page — dynamic route by slug, renders body, author info, 

   related articles (same category), increments view_count

4. Magazine listing page — grid of all published magazine covers

5. Magazine detail page — large cover, "Read Digital Version" button 

   linking to the uploaded PDF (embedded viewer or new tab)

6. About Us, Awards, Newsletter pages (static content for now)

Seed the database with 15-20 realistic placeholder articles across 4-5 

categories, and 3 placeholder magazine issues, so the layout is testable 

immediately. Only published items appear on the public site.

Fully responsive, client-side search bar filtering published articles by 

title keyword.

ADMIN PANEL (protected route /admin, requires Supabase Auth login):

- Login page (email/password), redirect to login if not authenticated

- Dashboard: total articles, published vs draft count, total magazine 

  issues, newsletter subscriber count, recent activity feed

Article management:

- Table view of all articles (title, category, status, date, author) with 

  search/filter by status and category

- "New Article" form: title, category/subcategory dropdown, author name, 

  author title, excerpt, rich text editor for body (headings, bold/italic, 

  bullet lists, blockquotes, inline images), featured image upload to 

  Supabase Storage, "Save as Draft" and "Publish" buttons

- Edit existing article (same form, pre-filled)

- Delete article with confirmation modal

- Toggle publish/unpublish directly from the table row

Magazine management:

- Table view of all magazine issues (title, issue month/year, status, date)

- "Upload New Issue" form: title, issue month, issue year, cover image 

  upload, PDF file upload (both to Supabase Storage), "Save as Draft" and 

  "Publish" buttons

- Edit and delete existing issues

- Toggle publish/unpublish

Category management:

- Add/edit/delete categories and subcategories

Newsletter subscribers:

- Table of all subscriber emails with subscribe date

- "Export as CSV" button

Activity log:

- Table showing who published/edited/deleted which article or magazine 

  issue, and when

FUNCTIONALITY REQUIREMENTS:

- Only published articles/magazines appear on the public site; drafts only 

  visible in admin

- Admin routes protected — redirect unauthenticated users to login

- Image uploads go to Supabase Storage; store the public URL on the record

- PDF uploads for magazines also go to Supabase Storage

- Rich text editor supports headings, bold/italic, bullet lists, 

  blockquotes, inline images

- Fully responsive public site; admin panel usable on tablet

- Every admin create/edit/delete/publish action writes an entry to 

  activity_log

Build this as a multi-page React app connected to Supabase, with clean 

reusable components for article cards, ticker items, and admin table rows.https://www.cioreview.com/ refernce webiste

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://gazette-glow-grid.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/ab1c7ba6-e738-46cd-beb1-fcf465204f7b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
