# GitHub hosting

This repository preserves the Eastsider News source from commit `28ef986489c6fcf8c2431f20e31dc0892870d681`, together with a GitHub Pages build for public review.

## Public review

Create the repository as `spencer582/eastsider-news`. Choose GitHub Actions under Settings, Pages, Build and deployment. The workflow named Publish Eastsider review website builds and publishes the reader site. The website address is supplied by the successful GitHub Pages deployment. No visitor account or ChatGPT session is required by this build.

The review remains marked noindex. Public access and search indexing are separate choices. The temporary address should not compete with the official newspaper while the team reviews it.

The build reuses the actual pages, components, typography, colours, images and editorial data. It writes a separate HTML page for each route, metadata, publisher and event structured data, XML sitemaps, RSS and downloadable calendar files. Search, saved articles, section filters, edition filters, menus, calendar controls, font size and sharing run in the browser. Its links and assets include the repository path.

The only published database export contains approved public snapshots and record identifiers. Draft text, contributor account details, permissions, revisions, credentials and private media are excluded. Both content tables were empty at the initial migration, so all current articles and contributor names are sourced from the repository content already used by the Site.

## What the preview does not host

GitHub Pages serves static files. It does not run D1, R2, server API routes or author authentication. The editorial workspace remains on the existing Sites host. A link in the preview opens that protected workspace for approved contributors. Readers can use the public preview without signing in.

The original application source, author interface, database schema, migrations, source audits and automated checks are retained for continued development and deployment. The Sites authentication headers are valid only behind the Sites authentication boundary. Do not deploy that server code on a different host that accepts unverified identity headers. Configure and verify a supported authentication system before moving the editorial backend.

## Content changes

Approved articles belong in `content/articles.ts`. Approved biographies belong in `content/contributors.ts`. Record original wording, author credits, publication dates and photo permissions. See `content/PUBLISHING.md` for the editorial process.

The preview includes the source content at the repository revision being built. It does not automatically copy subsequent edits from the protected newsroom database. Export newly published records before relying on the preview as a mirror of the newsroom. The original Eastsider calendar is refreshed during each build. Supplementary council records still require manual source checking.

## Connecting the domain later

Before launch, complete the archive migration, verify photo permissions, confirm author biographies and test the reader and editorial workflows in browsers. Agree the canonical domain and redirect plan with the people who control the existing domain and hosting.

For a reader website that will remain on GitHub Pages, update the Pages domain setting and the workflow's `PREVIEW_SITE_URL`, then configure the domain through its DNS provider. Remove the review noindex metadata only once the intended public domain is serving the approved website and its canonical addresses are correct. The original server application separately supports the `PUBLIC_SITE_URL` and `PUBLIC_INDEXING` runtime settings.

If the full editorial application moves to another server host, keep this repository as the source and configure the database, media storage and authentication there. Attaching a domain alone does not provide those services.

## Verification

`node scripts/test-github-pages.mjs` checks every generated page for a primary heading, metadata, canonical URL and repository-safe links. It verifies local assets, search results, calendar month selection, original article provenance, fonts, event downloads and the exclusion of database access from the reader bundle. These checks do not replace browser, accessibility or editorial review.
