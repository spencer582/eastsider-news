# Publishing Eastsider News

The publication can use the newsroom or ask for help in the conversation attached to this Site. The Site already has a source repository with version history. A separate GitHub repository is optional and is not needed to publish an article.

## In the newsroom

Open `/newsroom` using an approved account. Authors draft their own stories and send them for review. Editors publish. The owner manages access. While the Site is private, a contributor also needs permission to open the Site itself.

Create a contributor profile with the supplied biography and an approved photograph, if provided. Save it as a draft or send it for review. An editor publishes the profile. Choose it in the article editor to link the byline, biography and contributions. Additional contributors can be credited separately, one name per line.

Choose New story, write a headline and summary, and write the article or paste the complete text from Word. Pasted text becomes paragraphs without rewriting. Select the section, neighbourhood and article type. Opinion is labelled on the article. Add a photograph, its description and its creator credit. A material correction belongs in the public correction field.

Save draft keeps work in the newsroom. A recovery copy on the current device can protect unsaved article text, but it is not a substitute for saving. Preview shows the article layout. Download draft exports the article data for editorial handover. A saved version can be loaded from history and reviewed before another save.

Publishing a story replaces its public snapshot. Saving later changes as a draft leaves the published article unchanged. Unpublishing retains the draft. Biographies use the same separation between a draft and its approved public version.

## Through this conversation

Provide the approved article, headline, standfirst, contributor name and any additional bylines. Include the section, suburb, source links and whether it is reporting, opinion or a community contribution. Provide the contributor’s approved biography and permitted images with descriptions and credits. State the original publication date if the article has appeared before.

Say whether the material should remain a draft or be published. Never treat a request to review wording as permission to publish it. Preserve the author’s words and identify proposed substantive edits for editorial review. Do not invent reporting, quotations, people, credentials, biographies, photo ownership or consent.

Approved articles can be added to `content/articles.ts`, and approved profiles to `content/contributors.ts`. The types are in `lib/types.ts`. Use a stable ID and slug, ISO dates with an explicit timezone, local image paths, and source links where relevant. The repository is for this publication’s content, never confidential law firm client material.

A matching newsroom database record takes precedence over the repository version. Before changing an existing article through code, check whether a database record already exists. A repository edit must never be reported as published when a database snapshot still overrides it. Use the newsroom for such edits or build an explicitly authorised migration with a recoverable copy of the current data.

Run the type check, newsroom checks and rendering checks. Build, synchronise and deploy through the Sites workflow. Preserve the Site audience unless Spencer expressly changes it.

## Archive and edition maintenance

Existing archive cards use published headlines and link directly to the original reports. They do not contain replacement article bodies. Their local reference pages are excluded from article sitemaps and point their canonical address to the original report. Do not relabel an old story as newly published.

Update `currentEdition` in `lib/seed.ts` for a new issue and add its archive entry to `lib/editions.json`. The homepage and edition panels use the shared edition record. Event dates must use the Melbourne calendar and retain their year. Expired events disappear from the upcoming list.

The source and image credit audit is in `content/source-audit.json`. Unknown photographer credits are explicitly unverified. An existing author byline does not prove ownership of a photograph.

## Community events

Eastsider’s existing calendar is connected to this website through its public event feed. Events added or corrected there are picked up on subsequent visits after the cache expires. A background source check begins after 30 minutes, without delaying page rendering. The last successful source copy remains available at the edge for up to seven days. A saved and dated snapshot keeps the diary readable during a source outage, and readers are told when the fallback is in use.

To add an approved council or organiser event through this conversation, provide its official source URL, exact date and Melbourne start time, finish time if stated, venue, address, organiser, booking information and cost if known. Include access information only when the organiser supplies it. Do not describe an event as free when the price is unknown, or assume that free entry means all attractions are free.

Add verified supplementary records to `content/events.ts`, using the `CommunityEvent` type in `lib/event-types.ts`. Use stable unique IDs and slugs, explicit timezone offsets for timed sessions, source URLs and real checked dates. An event spanning several days must distinguish a continuous exhibition from separate sessions. Record separate sessions individually, and never invent future dates from an ambiguous recurrence rule. Mark known cancellations, postponements or sold-out events with the available status field.

Supplementary council and organiser records require editorial updates. They are not live council feeds. Check the original listing again before promoting an event. Keep research and any uncertainty in `content/event-source-audit.json`. When the current WordPress calendar is retired, replace its feed deliberately before the domain changes, and refresh the fallback snapshot as part of that migration.

Run the event checks and type check, then build and publish through the existing Site workflow. Full browser interaction and layout checks remain required before the public domain launch.

## Before a public domain launch

The current Site is owner private and public indexing is off. Complete the article and image migration, obtain the contributor biographies, check the full URL inventory and implement the required redirects before replacing the current website. Keep the current subscription destination until a mailing provider is deliberately connected.

Confirm the production origin, domain and audience, then enable indexing for the approved public launch. Verify Search Console and submit the XML and news sitemaps. Run browser checks at mobile, tablet and desktop sizes, keyboard and screen reader checks, rich result validation and measured page performance. The authoring environment for this revision did not provide browser visual testing, so those checks remain open.

Search visibility depends on published content, indexing and external systems. Structured data and clear authorship support discovery but do not guarantee placement in search results or AI answers.
