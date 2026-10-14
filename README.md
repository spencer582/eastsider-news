# Eastsider News

A public review build and complete source for Eastsider’s digital newspaper, using Eastsider’s green and turquoise identity, deeper forest green and a yellow sun detail. The design uses a newspaper masthead, a clear lead story, local sections, neighbourhood pages, digital editions and an accessible reading layout.

The publication is free, independent and run by community volunteers. Existing archive cards use original headlines and open the publisher’s original reports. No generated replacement article bodies are presented as journalism. Verified bylines, dates and image provenance are recorded in `content/source-audit.json`. Missing biographies and photo ownership are not invented.

## Publishing

The newsroom stores article drafts, public snapshots, revisions, contributor profiles and permissions in D1. R2 holds uploaded images. Authors can write and submit their own work. Editors publish articles and profiles. The owner manages newsroom access. The reader preview needs no account. The existing editorial workspace continues to use its separate newsroom permissions.

Contributor profiles have a biography, optional photograph, location and website, with editorial review before publication. Articles support multiple bylines, reporting and opinion labels, source links and public corrections. Pasting text preserves its wording. Draft download, local recovery and saved revisions support handover and recovery. Public pages never expose unpublished biography text. Uploaded draft images require newsroom membership until used by published content.

Approved publication through ChatGPT is also supported by the versioned content files. See `content/PUBLISHING.md` for the workflow and the precedence of newsroom records over repository content. This repository includes the complete application and a separate GitHub Pages reader build. Approved content changes can be reviewed and committed here, then published through the configured build workflow.

## Reader experience and discovery

The site includes search by words, section and neighbourhood, date ordering, contributor pages, saved stories on the reader’s device, persistent article text size, reading progress, article contents, sharing and print styles. Navigation, forms, dialogs and controls use semantic labels, visible focus styles and reduced motion support. This is an implementation description, not a claim of audited accessibility conformance.

Server rendered pages have unique metadata, canonical addresses, social previews and publisher information. Original articles have article structured data with visible authors, dates and corrections. Contributor pages have ProfilePage data. XML sitemaps, a 48 hour news sitemap and RSS are generated from published material. Archive references are not marked as original news articles. The review build uses noindex metadata so it does not compete with the official newspaper website. Its canonical addresses, structured data and feeds are retained for launch configuration.

## Community calendar

The Calendar link opens searchable month and list views covering Boroondara, Whitehorse, Manningham and Maroondah. Venue area, interest and free admission filters help readers find events. Individual event pages show Melbourne times, the source, a checked date, directions and an iCalendar download. They have Event structured data and upcoming entries appear in the XML sitemap.

Published Eastsider listings are fetched from the existing website’s public event feed, with background refresh after 30 minutes and a saved copy retained at the edge for up to seven days. The feed window includes the preceding month and the next year. Slow source requests do not block page rendering. The calendar receives updated listings when the background check finishes. Fetch failure keeps the last successful cache or uses the dated snapshot in `content/eastsider-events.json` and tells the reader that live updates are unavailable. Successful empty results never revive removed future events. The service does not claim to cover every local event.

Additional council and organiser events are individually checked records in `content/events.ts`, with research in `content/event-source-audit.json`. These additions are not automatically refreshed from council websites. Their checked dates remain visible, and past sessions drop out of forthcoming listings. No recurring dates or free admission are inferred without source support. The page links to all four council calendars and opens an event submission email for editorial review.

## GitHub Pages review

The `preview` directory adapts the existing pages and components for static hosting. It preserves the green design, responsive navigation, search and edition filters, local bookmarks, reading tools, calendar views, event filters, author pages and calendar downloads. Public pages are rendered to HTML before publication, then their interactive controls are activated in the browser. A separate client bundle contains only public content.

The Pages workflow builds on changes to main, on manual runs and twice an hour to refresh the original Eastsider event feed. GitHub may delay or suspend scheduled workflows under its platform rules. Source check dates remain visible. Council and organiser additions still require editorial checking. If the feed is unavailable, the dated fallback is shown clearly.

GitHub Pages cannot run the database or author workspace. The full application, database schema, migrations, permissions and editorial source remain in this repository. The public preview links approved contributors to the existing secure workspace. Its database and uploaded media remain with the current hosting service and are not copied into a public repository. At export, the live stories and contributor tables contained no saved records.

Install the small public preview dependency set with `npm ci --prefix preview --ignore-scripts`. Make those dependencies available at the repository root with `ln -s preview/node_modules node_modules` if the root has no installed dependencies. Run `npm run build:pages`, then `npm run test:pages`. The output is `pages-site`. The build accepts `PREVIEW_SITE_URL`; its default is the planned GitHub project address. See `GITHUB-HOSTING.md`.

## Runtime configuration

Use Sites environment settings rather than committed environment files.

* `NEWSROOM_OWNER_EMAIL` identifies the authorised owner sign-in email and is a secret.
* `PUBLIC_SITE_URL` is the canonical origin and expected origin for write requests.
* `PUBLIC_INDEXING` stays `false` during private review.

The manifest retains the existing project identity and `DB` and `BUCKET` bindings. Database changes are append-only Drizzle migrations. Do not rewrite an applied migration.

## Verification

Run `node node_modules/typescript/bin/tsc --noEmit`, `node scripts/test-newsroom.mjs` and `node scripts/test-render.mjs` for relevant structural changes. Run `node scripts/test-events.mjs` for event ingestion, dates, filters and downloads. API tests use the actual handlers and a temporary SQLite database, with platform identity and storage substituted. Rendering tests exercise the actual pages and verify headings, image alternatives, metadata, authorship, archive handling and sitemaps. No test records are written to the hosted database.

The earlier newsroom revision passed 50 permission and publishing checks. The final review passed the type check, 49 calendar checks and 86 server rendering and discovery checks. The live Eastsider feed was also verified during the calendar revision. Browser interaction, visual layout, screen reader behaviour and measured Core Web Vitals were not available in the authoring environment and require live browser testing before a public launch. The production build is verified through the Sites source workflow.

## Public launch

The existing Site is public, with a separate protected newsroom. This GitHub review does not change the official domain. A complete production migration still needs the approved article archive, photo permissions, contributor profiles, all old URLs and their redirects, production domain configuration and the mailing list arrangements. The current official website and subscription form remain in use. See the publishing guide for the launch sequence.

## References

The official website, About Us, Editorial Values, Guidelines, current edition, archive and event listings were checked on 13 October 2026. Exact URLs are in the source audit and editorial data.

Google guidance was checked at `https://developers.google.com/search/docs/appearance/structured-data/article`, `https://developers.google.com/search/docs/appearance/structured-data/profile-page` and `https://developers.google.com/search/docs/appearance/ai-features`. These support the approach to authorship, article metadata and search discovery. They do not promise rankings.

Newsreader and Manrope are hosted locally with their licence files. The wordmark and icons are code-native assets using the existing publication’s palette. All displayed editorial photographs come from the original Eastsider website, with known and unknown credits distinguished in the source audit.
