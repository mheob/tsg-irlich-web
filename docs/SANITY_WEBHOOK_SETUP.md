# Sanity Webhook Setup for On-Demand Revalidation

This guide describes how to set up Sanity Webhooks so that changes are immediately available in the Next.js app on Vercel. Production and staging each read their own dataset, so each needs its own revalidation webhook.

## 1. Generate Revalidation Secret

Create a random string as a secret for webhook validation:

```bash
# Run in command line (macOS/Linux):
openssl rand -base64 32

# Or in Node.js:
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## 2. Set Environment Variables in Vercel

1. Go to your Vercel project: <https://vercel.com/dashboard>
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variable:
   - **Name**: `SANITY_REVALIDATE_SECRET`
   - **Value**: The generated secret from step 1
   - **Environment**: Production, Preview, Staging and Development (select all)
4. Click **Save**

The variable is a single entry for every environment, so both revalidation webhooks sign with the same secret. It is stored as sensitive and cannot be read back. To create a further webhook later, copy the secret from an existing one through the Webhooks API (see step 4), or rotate it in Vercel and in every webhook at once.

## 3. Set Local Environment Variable (optional)

For local testing, add to `apps/web/.env.local`:

```bash
SANITY_REVALIDATE_SECRET="your-generated-secret"
```

## 4. Set Up Webhook in Sanity

Create the webhook once per environment:

| Name                             | URL                                         | Dataset       |
| -------------------------------- | ------------------------------------------- | ------------- |
| `Vercel Production Revalidation` | `https://tsg-irlich.de/api/revalidate`      | `production`  |
| `Vercel Staging Revalidation`    | `https://next.tsg-irlich.de/api/revalidate` | `development` |

Without the staging webhook, every content change on staging that is not read through `sanityFetch` waits out its time-based cache, the menu for 12 hours. Both webhooks share every setting below except name, URL and dataset, and the staging one additionally needs the bypass header.

1. Go to your Sanity project: <https://www.sanity.io/manage>
2. Select your project
3. Navigate to **API** → **Webhooks**
4. Click **Create webhook**
5. Configure the webhook:\
   **Name**, **URL**, **Dataset**: from the table above

   **Trigger on**:
   - ✅ Create
   - ✅ Update
   - ✅ Delete

   **Filter** (optional, to track only specific documents). Every type the route handles has to be in it, `site-settings` above all: the menu and the footer data live there, and without it a menu change waits out the layout's 12-hour cache. The filter lives in Sanity, not in the repository, so adding or renaming a type in the route's `REVALIDATION_MAP` means updating the filter of **both** webhooks too. Until October 2026 the production filter still listed `settings`, `navigation` and `group`, which no document is called, and menu changes never fired it.

   The filter below is the one for the departments model (WEB-384): the single `group` type replaces the six `group.*` types, and `department` and `groupsPage` are new. The live webhooks are switched over when the department migration is rolled out, not when this change merges, so until then they keep the old filter.

   ```groq
   _type in ["aboutUs", "contact", "department", "departmentsPage", "echo.issue", "echoOverview", "group", "groupsPage", "home", "imprint", "membership", "news.article", "news.category", "newsOverview", "person", "privacy", "site-settings", "testimonial", "venue"]
   ```

   **Projection** (what is sent to the webhook):

   ```groq
   {
   	_type,
   	"slug": slug.current
   }
   ```

   **Secret**: The same secret as in step 1

   **HTTP method**: POST

   **API version**: v2021-06-07 (or newer)

   **Staging only**: add the header `x-vercel-protection-bypass` with the project's "Protection Bypass for Automation" secret, because staging sits behind Vercel's SSO. Without it the request never reaches the route.

6. Click **Save**

The webhooks can also be read and changed through the [Webhooks API](https://www.sanity.io/docs/http-reference/webhooks) (`/hooks/projects/<projectId>`), for example from a script run with `pnpm exec sanity exec <script> --with-user-token` in `apps/studio`. A `GET` returns `secret` and `headers` in clear text, so never print a response unfiltered.

## 5. Test the Webhook

1. In Sanity Studio: Edit a document (e.g., news article)
2. Save the change
3. Check in Sanity under **API** → **Webhooks** → **Deliveries**:
   - Status should be `200 OK`
   - Response should contain `{"revalidated": true, ...}`

The same log is available from the command line: `pnpm exec sanity hook logs "Vercel Staging Revalidation" --detailed` in `apps/studio`. A type that never shows up there although editors change it is missing from the filter.

## 6. Restart Vercel Deployment (one-time)

After adding the environment variable:

```bash
# Via Vercel CLI
vercel --prod

# Or via Vercel Dashboard:
# Go to Deployments → latest deployment → "..." → Redeploy
```

## How It Works

1. **Content Change**: You modify content in Sanity Studio
2. **Webhook Trigger**: Sanity sends a POST request to `/api/revalidate`
3. **Signature Validation**: The API route validates the secret
4. **Revalidation**: Next.js invalidates the cache for affected pages
5. **New Content**: On the next page visit, current data is fetched from Sanity

## Revalidation Logic

The route [`apps/web/src/app/api/revalidate/route.ts`](apps/web/src/app/api/revalidate/route.ts) automatically revalidates:

- **News** (`_type: "news"`): `/news` and `/news/[slug]`
- **Department** (`_type: "department"`): the home page, which links the departments, and the whole `/angebot` layout, `/sitemap.xml` and `/llms.txt`
- **Group** (`_type: "group"`): the whole `/angebot` layout, `/sitemap.xml` and `/llms.txt`. The payload only carries the slug of the group, not the one of its department, so a single group path cannot be built
- **Offer pages** (`_type: "departmentsPage"`, `"groupsPage"`): `/angebot`, or every department page `/angebot/[group]`
- **Person** (`_type: "person"`): every page that shows contact persons, among them `/verein` with the TSG-Echo pages below it (layout revalidation)
- **News overview** (`_type: "newsOverview"`): `/news` and the TSG-Echo pages, which show its contact persons
- **Testimonial** (`_type: "testimonial"`): Homepage `/`
- **TSG-Echo** (`_type: "echo.issue"`, `"echoOverview"`): the archive `/verein/echo`; an issue also revalidates every page of `/verein/echo/[slug]`, since the payload does not carry the slug it had before. A webhook with a type filter needs both types in it.
- **Site settings** (`_type: "site-settings"`, the menu and the footer data): all pages (layout revalidation). The root layout tags its two fetches `site-settings`, so the tag revalidation reaches them too.

Two settings keep the render the webhook triggers from caching old content again. Each one alone made a menu change on staging show up only one change late:

- **The server client reads from the API, not the API CDN** (`useCdn: false` in `apps/web/src/lib/sanity/client.ts`). In a measurement on 11 October 2026 the API answered with the new content after about 1 s, the API CDN only after 11 to 60 s. `parseBody` waits 3 s before the route revalidates, which covers the API but not the CDN, so the render fetched the old content and Next.js cached it for another 12 hours. The pages are cached by Next.js anyway and only fetch when they are revalidated, so the CDN saved next to nothing. `sanityFetch` is not affected: it queries the CDN with `cacheMode: 'noStale'`, which was current after about 3 s.
- **The route expires the document type's tag** with `revalidateTag(type, { expire: 0 })`, not with the `max` profile. `max` only marks the data stale: the first visit after a change is still rendered from the old data while it refetches in the background, and Vercel keeps that render as the page until the next revalidation. Next.js recommends `{ expire: 0 }` for webhooks, which cannot call `updateTag`.

## Troubleshooting

### Webhook Fails (Status 401)

- ✅ Secret in Vercel and Sanity are identical
- ✅ Environment variable is available in Production and Staging
- ✅ Redeployed after environment variable change

### Staging Webhook Fails (Status 401 with an HTML body)

- ✅ The `x-vercel-protection-bypass` header is set and matches the project's current bypass secret. An HTML answer comes from Vercel's SSO wall, not from the route.

### Webhook Successful but No Update

- ✅ Compare the page with the content that was current one change earlier. If it shows that state, a render was served stale data; check that the server client still has `useCdn: false` and the route still expires tags with `{ expire: 0 }` (see Revalidation Logic)
- ✅ Check cache headers: `Cache-Control`, `CDN-Cache-Control`
- ✅ Search for "revalidated" in Vercel Logs
- ✅ Clear browser cache (Cmd+Shift+R / Ctrl+Shift+R)

### Local Testing

```bash
# Test webhook locally (with ngrok or similar)
curl -X POST http://localhost:3000/api/revalidate \
  -H "Content-Type: application/json" \
  -d '{"_type": "news.article", "slug": {"current": "test"}}'
```

## Further Optimizations

### ISR with revalidate Option

For additional reliability, you can also use time-based ISR:

```typescript
// In page.tsx or layout.tsx
export const revalidate = 3600; // Revalidate every 60 minutes
```

### Tag-based Revalidation

For finer control, you can also use tags:

```typescript
// With fetch() or unstable_cache()
fetch(url, {
	next: { tags: ['news', 'group'] },
});

// Revalidation in the API route: expire at once, since a webhook cannot use updateTag
revalidateTag('news', { expire: 0 });
```

## TSG-Echo page rendering

A second webhook, separate from the revalidation one, makes the web app render the pages of a TSG-Echo issue as soon as an editor uploads its PDF.

1. Create a robot token in sanity.io/manage → **API** → **Tokens** with the **Editor** role and store it in Vercel as `SANITY_API_WRITE_TOKEN`, as a sensitive variable for every environment that renders: Preview and Staging now, Production with the release.
2. Generate a secret (see step 1 above) and store it in Vercel as `SANITY_ECHO_RENDER_SECRET`, for the same environments. A sensitive value cannot be read back, so paste it into the webhook's **Secret** field right away.
3. Create the webhook, once per environment:
   - **Name**: `TSG-Echo Seiten erzeugen (<environment>)`
   - **URL**: `https://www.tsg-irlich.de/api/echo/render` (production) or the staging domain
   - **Dataset**: `production` (or the dataset of the environment)
   - **Trigger on**: ✅ Create, ✅ Update. Both are required. Replacing the PDF updates an existing document, so without Update a new PDF is never rendered. Creating a draft and "Seiten neu erzeugen" on a published issue still work without it, because both create a new draft, which makes the gap easy to miss.
   - **Drafts**: ✅ enabled — editors upload the PDF into a draft and generate the intro before they publish
   - **Filter**:

     ```groq
     _type == "echo.issue" && defined(pdf.asset) && (!defined(render.source) || render.source != pdf.asset._ref)
     ```

   - **Projection**:

     ```groq
     { _id, "pdfRef": pdf.asset._ref }
     ```

   - **HTTP method**: `POST`
   - **Secret**: the value of `SANITY_ECHO_RENDER_SECRET`
   - **Preview and staging only**: add the header `x-vercel-protection-bypass` with the project's "Protection Bypass for Automation" secret, because those deployments sit behind Vercel's SSO.

The filter compares states, not changes: the route sets `render.source` to the PDF when it claims a document, so neither its own write-back nor publishing the draft (which carries `render.source` along) triggers a second run. "Seiten neu erzeugen" in the studio removes `render` and hands the document back to the route.

When two deliveries race for the same document, the one that loses the claim is answered `409`. Sanity retries no 4xx answer except 429, so the attempts log lists it as undeliverable; that is expected, because the delivery that won renders the PDF.

The projection deliberately carries no URL. The route builds the CDN URL from the asset reference itself, so a crafted payload cannot make it fetch another host.

## Further Reading

- [Next.js On-Demand Revalidation](https://nextjs.org/docs/app/building-your-application/data-fetching/incremental-static-regeneration#on-demand-revalidation)
- [Sanity Webhooks Documentation](https://www.sanity.io/docs/webhooks)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
