# Sanity Webhook Setup for On-Demand Revalidation

This guide describes how to set up Sanity Webhooks so that changes are immediately available in the production Next.js app on
Vercel.

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

## Further Reading

- [Next.js On-Demand Revalidation](https://nextjs.org/docs/app/building-your-application/data-fetching/incremental-static-regeneration#on-demand-revalidation)
- [Sanity Webhooks Documentation](https://www.sanity.io/docs/webhooks)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
