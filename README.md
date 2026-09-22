
CIO Media World is a B2B technology media and digital magazine platform focused on technology, innovation, leadership, executives, business transformation, and industry insights.

Website:

https://www.ciomediaworld.com/

---

## About CIO Media World

CIO Media World is a digital technology media platform designed to bring together:

- Technology news
- Executive and leadership insights
- CIO-focused content
- AI and analytics
- Cloud and infrastructure
- Cybersecurity
- Digital transformation
- Business and technology innovation
- Digital magazines
- Industry articles
- Executive Brief newsletters

The platform combines a public media website with a protected content management and administration system.

---

# Technology Stack

The application is built as a modern React-based web application.

Core infrastructure includes:

- React
- TypeScript
- Supabase
- Supabase Database
- Supabase Authentication
- Supabase Storage
- Responsive CSS/UI components
- Server-side/backend functions where required
- Git/GitHub
- Vercel deployment

The application uses Supabase as the primary backend infrastructure for database, authentication, storage, and related backend functionality.

---

# Brand & Visual Identity

The official brand is:

## CIO Media World

The current visual identity uses a professional technology/media design system.

Primary visual direction:

- Deep Navy
- Navy Blue
- Bright Blue
- Cyan
- White
- Light Gray

The platform uses a premium B2B technology publication aesthetic.

Gold/orange is not part of the current primary brand theme.

---

# Public Website

The public website is available at:

https://www.ciomediaworld.com/

The website contains the following major areas.

---

## Homepage

The homepage presents the latest CIO Media World content and provides access to the main content categories.

Major homepage functionality includes:

- Main navigation
- Technology/media hero areas
- Latest News
- Trending content
- Most Read content
- Article cards
- Magazine content
- Dynamic content from the database
- Stock market ticker
- Newsletter/Executive Brief subscription
- Responsive layouts

Homepage content is connected to the live content system rather than being static mock content.

---

# Content Categories

The platform supports technology-focused editorial content.

Current editorial areas include:

- AI & Analytics
- CEO Insights
- CIO Insights
- Cloud & Infrastructure
- Cybersecurity

The architecture supports categories and editorial content expansion in the future.

---

# Articles

CIO Media World contains a dynamic article/content publishing system.

Articles can be managed through the protected Admin system.

Article functionality includes:

- Article title
- Slug
- Category
- Author
- Author information
- Excerpt
- Article body
- Featured image
- Publishing status
- Published date
- Created/updated information
- Related content
- View tracking where implemented
- SEO metadata

Only published content is displayed publicly.

Draft content remains available to authorized administrators/editors.

---

# Article Pages

Each published article has its own dynamic page.

Article pages can include:

- Article title
- Category
- Featured image
- Author information
- Publication date
- Article content
- Related articles
- Social/share functionality where implemented
- SEO metadata
- Structured data where implemented

Article routes use the article slug.

---

# Magazine Platform

CIO Media World has a dedicated digital magazine system.

The magazine system supports:

- Magazine issues
- Magazine cover images
- Issue information
- Digital editions
- PDF files
- Heyzine flipbooks
- Existing Issuu support
- Related Articles
- Magazine administration
- Responsive magazine pages

---

# Magazine Listing

The Magazine page provides access to published magazine issues.

The page supports a premium editorial presentation using real magazine cover artwork.

Magazine cover images are sourced from the existing magazine records/storage.

The magazine hero experience can dynamically use available magazine covers.

The system is designed to support additional magazine issues without requiring frontend redesign.

---

# Magazine Hero

The Magazine page contains a magazine-focused hero experience.

The hero can use real magazine cover images from the existing magazine data.

The visual treatment includes:

- Magazine cover collage
- Navy/blue overlay
- CIO Media World branding
- Large magazine heading
- Editorial tagline
- Responsive design
- Subtle animation where implemented

The system should use actual magazine covers rather than generated placeholder artwork.

As additional magazine issues are added, their covers can become available to the magazine presentation.

---

# Magazine Detail Pages

Each magazine issue has its own detail page.

A magazine detail page can contain:

- Magazine cover
- Magazine title
- Issue/edition information
- Description
- Publication information
- Digital reader
- PDF functionality
- Related Articles
- Other magazine metadata
- Navigation to other issues

---

# Digital Magazine Reader

CIO Media World supports embedded digital magazine reading.

## Heyzine

Heyzine is the preferred digital flipbook provider.

When a magazine has a Heyzine URL, the flipbook is embedded directly into the CIO Media World magazine page.

Users remain on:

https://www.ciomediaworld.com/

while reading the digital edition.

The system uses the Heyzine URL associated with the individual magazine record.

Example Heyzine URL:

https://heyzine.com/flip-book/e44ce7f9b7.html

This is an example/test publication and should not be hardcoded as the URL for all magazines.

---

# Magazine Reader Fallback

The magazine reading system supports fallback behavior.

Preferred order:

1. Heyzine embedded flipbook
2. Existing Issuu implementation
3. Existing PDF reader
4. Digital edition unavailable message

Existing magazine data must not be removed simply because Heyzine is now preferred.

---

# PDF Magazine Support

The magazine system retains PDF upload and reading functionality.

PDF functionality includes:

- PDF upload
- Supabase Storage
- Magazine PDF association
- Existing PDF reader
- PDF fallback when no digital flipbook is available

Existing PDFs must remain available.

---

# Issuu Support

The project previously used Issuu for digital magazine editions.

Existing Issuu URLs/data remain supported as a fallback.

Issuu data should not be deleted simply because Heyzine is now preferred.

---

# Related Articles

Magazines can display related articles.

Related Articles use the existing article system.

The magazine page can show selected/associated articles below the digital magazine reader.

Existing article cards/components should be reused.

---

# Admin System

CIO Media World contains a protected administration system.

The Admin system is used to manage platform content and communications.

Admin functionality includes areas such as:

- Dashboard
- Articles
- Magazines
- Contact Inquiries
- Executive Brief Subscribers
- Newsletter Delivery History
- Other existing content-management functions

Access to protected Admin functionality requires authorized authentication.

---

# Article Administration

Authorized administrators/editors can manage articles.

Article management includes:

- Create article
- Edit article
- Save draft
- Publish article
- Unpublish article
- Delete article
- Manage article information
- Upload featured images
- Manage categories
- Manage article content

Publishing changes the visibility of content on the public website.

---

# Magazine Administration

The Admin system allows authorized users to manage magazine issues.

Magazine management includes:

- Create magazine issue
- Edit magazine issue
- Upload magazine cover
- Upload PDF
- Add/edit Heyzine URL
- Maintain existing Issuu URL
- Publish/unpublish issue
- Manage magazine metadata
- Manage related articles

---

# Heyzine Administration

Each magazine can store its own Heyzine flipbook URL.

Example:

`heyzine_url`

The URL is associated with the individual magazine issue.

Administrators should not need to modify frontend code when adding a new magazine.

The workflow is:

Admin creates magazine
→ uploads cover
→ uploads PDF if available
→ adds Heyzine URL
→ publishes magazine
→ magazine becomes available on the public website

---

# Contact Us

CIO Media World includes a working Contact Us system.

The Contact Us form collects visitor inquiries and stores them through the application's backend.

The Admin system provides access to submitted contact inquiries.

Contact inquiry functionality includes:

- Submission
- Persistence
- Admin viewing
- Search/filtering where implemented
- Status management
- Inquiry details
- Administrative handling

Contact inquiries and newsletter subscribers are treated as separate data types.

---

# Executive Brief Newsletter

CIO Media World includes an Executive Brief newsletter system.

The website contains an Executive Brief subscription experience.

The system supports:

- Subscriber registration
- Name/email collection
- Subscriber storage
- Duplicate prevention
- Active subscriber status
- Unsubscribe functionality
- Admin subscriber management
- Newsletter delivery
- Delivery history

---

# Executive Brief Popup

The website includes an Executive Brief subscription popup.

The popup is designed around the CIO Media World brand.

It uses:

- Navy
- White
- Blue
- Cyan

The popup is responsive and designed to avoid repeatedly interrupting the same visitor.

---

# Newsletter Delivery

The platform supports automated newsletter delivery for published content where configured.

Newsletter functionality can be connected to:

- New articles
- New magazine editions
- Platform announcements
- Executive Brief communications

Email delivery is handled through the configured email provider/backend integration.

Email provider credentials must remain server-side and must never be exposed in frontend code.

---

# Newsletter Unsubscribe

The platform provides an unsubscribe flow.

Subscribers can unsubscribe from Executive Brief communications.

Unsubscribe status is maintained in the backend.

---

# Newsletter Delivery History

The Admin system provides delivery history for newsletter broadcasts.

This allows administrators to review newsletter delivery activity.

---

# Stock Market Ticker

The website includes a stock market ticker as part of the technology/business media experience.

Current tracked companies include:

- Oracle — ORCL
- Microsoft — MSFT
- IBM — IBM

The ticker is designed to display current/latest available market information.

The market-data integration is designed so API credentials remain protected on the backend.

---

# Supabase

Supabase is used as the core backend platform.

Current usage includes:

- PostgreSQL database
- Authentication
- Storage
- Backend/server functions where required
- Secure data access
- Content persistence

The existing Supabase schema is the source of truth for the application's current data model.

Do not create duplicate tables for functionality that already exists.

---

# Storage

Supabase Storage is used for uploaded media where configured.

Assets can include:

- Magazine covers
- Magazine PDFs
- Article featured images
- Other editorial media

Public/private access follows the existing application configuration.

---

# Authentication

Protected administrative functionality uses authentication.

Admin access is restricted to authorized users.

Authentication and authorization must remain separate from public website access.

Public visitors can access published editorial and magazine content without access to the Admin system.

---

# Security

Important security principles:

- Never expose Supabase service-role credentials in frontend code.
- Never expose API secrets in client-side JavaScript.
- Keep email provider credentials server-side.
- Protect Admin routes.
- Validate uploaded content.
- Validate external embed URLs.
- Keep database access controlled through Supabase policies/configuration.
- Do not expose private administrative data publicly.

---

# SEO

CIO Media World includes SEO functionality.

Current SEO architecture includes areas such as:

- Page titles
- Meta descriptions
- Canonical URLs
- Structured data
- Organization information
- Article structured data
- Breadcrumb structured data
- Sitemap
- RSS

The public canonical website is:

https://www.ciomediaworld.com/

---

# Responsive Design

The platform is designed to work across:

- Desktop
- Laptop
- Tablet
- Mobile

Important public experiences including articles, magazines, navigation, forms, and digital readers must remain responsive.

---

# Editorial Direction

CIO Media World focuses on professional B2B technology and business audiences.

Editorial areas include topics such as:

- Artificial Intelligence
- Analytics
- CIO leadership
- CEO leadership
- Cloud
- Infrastructure
- Cybersecurity
- Digital transformation
- Enterprise technology
- Innovation
- Business technology
- Executive insights

The platform is intended for technology professionals, executives, business leaders, innovators, and enterprise audiences.

---

# Current Public Website

Official website:

https://www.ciomediaworld.com/

All public-facing branding should use:

CIO Media World

The website should not use legacy project names such as:

- The Trade Chronicle
- Gazette Glow Grid
- Placeholder brand names

---

# Development Principles

When extending the project:

1. Reuse existing architecture.
2. Reuse existing components.
3. Reuse existing Supabase tables.
4. Reuse existing Supabase Storage.
5. Avoid duplicate systems.
6. Do not remove working functionality without a specific requirement.
7. Keep the CIO Media World visual identity.
8. Keep public and Admin functionality separated.
9. Keep secrets server-side.
10. Maintain responsive behavior.
11. Maintain SEO.
12. Test changes before deployment.

---

# Content & Branding Information

Official client-provided information should be used for public contact details.

The following information should only be added after the client provides the approved details:

- Editorial Desk email
- Advertising & Partnerships email
- General Contact email
- Corporate/Business email
- Official phone number
- Office address
- Social media profiles
- Newsletter sender identity

Do not invent or publish placeholder contact information as official company information.

---

# Deployment

The production website is:

https://www.ciomediaworld.com/

The project uses the existing Git repository and deployment configuration.

Deployment configuration should remain consistent with the current production environment.

---

# Project Status

CIO Media World is an active B2B technology media platform with:

- Public website
- Dynamic articles
- Magazine publishing
- Digital magazine reader
- Heyzine integration
- PDF magazine support
- Issuu fallback
- Related Articles
- Admin CMS
- Contact inquiry management
- Executive Brief newsletter
- Newsletter delivery
- Unsubscribe system
- SEO infrastructure
- Stock market ticker
- Supabase backend
- Responsive design

The project should continue to evolve from the existing implementation rather than being rebuilt from an outdated legacy specification.
