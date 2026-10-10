# Sanity Webhook Setup for On-Demand Revalidation

This guide describes how to set up Sanity Webhooks so that changes are immediately available in the production Next.js app on Vercel.

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
   - **Environment**: Production, Preview, Development (select all)
4. Click **Save**

## 3. Set Local Environment Variable (optional)

For local testing, add to `apps/web/.env.local`:

```bash
SANITY_REVALIDATE_SECRET="your-generated-secret"
```

## 4. Set Up Webhook in Sanity

1. Go to your Sanity project: <https://www.sanity.io/manage>
2. Select your project
3. Navigate to **API** → **Webhooks**
4. Click **Create webhook**
5. Configure the webhook:\
   **Name**: `Vercel Production Revalidation`

   **URL**: `https://your-domain.com/api/revalidate`

   **Dataset**: Your dataset (e.g., `production`)

   **Trigger on**:
   - ✅ Create
   - ✅ Update
   - ✅ Delete

   **Filter** (optional, to track only specific documents):

   ```groq
   _type in ["news", "group", "person", "testimonial", "settings", "navigation"]
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

6. Click **Save**

## 5. Test the Webhook

1. In Sanity Studio: Edit a document (e.g., news article)
2. Save the change
3. Check in Sanity under **API** → **Webhooks** → **Deliveries**:
   - Status should be `200 OK`
   - Response should contain `{"revalidated": true, ...}`

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
- **Groups** (`_type: "group"`): `/angebot` and `/angebot/[slug]`
- **Person** (`_type: "person"`): `/verein`
- **Testimonial** (`_type: "testimonial"`): Homepage `/`
- **Settings/Navigation**: All pages (layout revalidation)

## Troubleshooting

### Webhook Fails (Status 401)

- ✅ Secret in Vercel and Sanity are identical
- ✅ Environment variable is available in Production
- ✅ Redeployed after environment variable change

### Webhook Successful but No Update

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

// Revalidation in the API route
revalidateTag('news');
```

## TSG-Echo page rendering

A second webhook, separate from the revalidation one, makes the web app render the pages of a TSG-Echo issue as soon as an editor uploads its PDF.

1. Create a robot token in sanity.io/manage → **API** → **Tokens** with the **Editor** role and store it in Vercel as `SANITY_API_WRITE_TOKEN` (Production and Preview).
2. Generate a secret (see step 1 above) and store it in Vercel as `SANITY_ECHO_RENDER_SECRET`.
3. Create the webhook, once per environment:
   - **Name**: `TSG-Echo Seiten erzeugen (<environment>)`
   - **URL**: `https://www.tsg-irlich.de/api/echo/render` (production) or the staging domain
   - **Dataset**: `production` (or the dataset of the environment)
   - **Trigger on**: ✅ Create, ✅ Update
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
   - **Staging only**: add the header `x-vercel-protection-bypass` with the project's "Protection Bypass for Automation" secret, because preview deployments sit behind Vercel's SSO.

The filter compares states, not changes: the route sets `render.source` to the PDF when it claims a document, so neither its own write-back nor publishing the draft (which carries `render.source` along) triggers a second run. "Seiten neu erzeugen" in the studio removes `render` and hands the document back to the route.

The projection deliberately carries no URL. The route builds the CDN URL from the asset reference itself, so a crafted payload cannot make it fetch another host.

## Further Reading

- [Next.js On-Demand Revalidation](https://nextjs.org/docs/app/building-your-application/data-fetching/incremental-static-regeneration#on-demand-revalidation)
- [Sanity Webhooks Documentation](https://www.sanity.io/docs/webhooks)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
