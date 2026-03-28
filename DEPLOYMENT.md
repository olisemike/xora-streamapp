# StreamVibe Deployment Guide

Complete guide to deploy your mobile media streaming app to Cloudflare Workers.

## Prerequisites

1. **Cloudflare Account** - Active account with billing enabled
2. **Node.js** - Version 16 or higher
3. **Wrangler CLI** - `npm install -g wrangler`

## Step 1: Get Your Cloudflare Credentials

### 1.1 Find Your Account ID
- Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
- Click on any domain or navigate to upper right
- Account ID appears in the sidebar
- Update `account_id` in `wrangler.toml`

### 1.2 Create API Token
- Dashboard → Account → API Tokens
- Click "Create Token"
- Use "Edit Cloudflare Workers" template
- Add all these permissions:
  - Account → Cloudflare Images → Edit
  - Account → Cloudflare Stream → Edit
  - Account → Workers KV → Edit
  - Account → Workers Scripts → Edit
- Copy token and save securely

## Step 2: Set Up Cloudflare Services

### 2.1 Enable Cloudflare Images
```bash
wrangler service-worker
```
- Go to Cloudflare Dashboard
- Images Dashboard → Get Started
- Note your **Image Hash** (looks like: `1eL4FEtJQavAd5JjFtJe7Q`)
- Update `CLOUDFLARE_IMAGES_HASH` in `wrangler.toml`

### 2.2 Enable Cloudflare Stream
- Streamcdn Dashboard → Customers
- Find **Customer Subdomain** (looks like: `customer-xxxxx.cloudflarestream.com`)
- Update `CLOUDFLARE_STREAM_SUBDOMAIN` in `wrangler.toml`

### 2.3 Create KV Namespace
```bash
# Create namespace
wrangler kv:namespace create "MEDIA_KV"
wrangler kv:namespace create "MEDIA_KV" --preview

# Copy the returned namespace IDs to wrangler.toml
```

## Step 3: Install & Configure

### 3.1 Install Dependencies
```bash
cd streamapp
npm install
```

### 3.2 Store API Token
```bash
wrangler secret put CF_API_TOKEN
# Paste your API token from Step 1.2
```

### 3.3 Update Configuration Files

**wrangler.toml:**
```toml
account_id = "your-account-id"
ADMIN_KEY = "change-this-to-a-secure-key"
CF_ACCOUNT_ID = "your-account-id"
CLOUDFLARE_IMAGES_HASH = "your-images-hash"
CLOUDFLARE_STREAM_SUBDOMAIN = "customer-xxx.cloudflarestream.com"
```

**config.js:** (Optional - for local development)
```javascript
module.exports = {
  admin: {
    key: 'your-admin-key',
  },
  cloudflare: {
    accountId: 'your-account-id',
    images: {
      hash: 'your-images-hash',
    },
    stream: {
      subdomain: 'customer-xxx.cloudflarestream.com',
    },
  },
};
```

## Step 4: Test Locally

```bash
npm start
# Opens http://localhost:8787
```

Test features:
- Browse media grid
- Test pagination
- Check responsive design on mobile

## Step 5: Deploy to Cloudflare

### Production Deployment
```bash
npm run deploy
# Workers URL: streamapp.{your-username}.workers.dev
```

### Create Custom Domain (Optional)
1. Dashboard → Your Domain → Workers → Manage Custom Domains
2. Add your domain (e.g., `stream.yourdomain.com`)

## Step 6: Admin Upload Testing

### Option A: Using Upload Script
```bash
# Upload an image
node upload.js image.jpg "My Image" "A description" image

# Upload a video
node upload.js video.mp4 "My Video" "A video description" video
```

Environment variables:
```bash
export ADMIN_KEY="your-secure-admin-key"
export API_URL="https://streamapp.workers.dev"  # Your deployed URL
node upload.js video.mp4 "Title" "Description" video
```

### Option B: Using cURL
```bash
curl -X POST https://streamapp.workers.dev/api/upload \
  -H "X-Admin-Key: your-admin-key" \
  -F "file=@video.mp4" \
  -F "title=My Video" \
  -F "description=A cool video" \
  -F "type=video"
```

### Option C: Using Postman
1. Create POST request to `https://your-deployed-url/api/upload`
2. Headers: `X-Admin-Key: your-admin-key`
3. Body → form-data:
   - `file`: Select your media file
   - `title`: Media title
   - `description`: Media description
   - `type`: `video` or `image`

## Security Checklist

- [ ] Change `ADMIN_KEY` from default value
- [ ] Restrict admin endpoint with strong key
- [ ] Enable rate limiting
- [ ] Use HTTPS only in production
- [ ] Regularly rotate API tokens
- [ ] Monitor worker analytics

## Advertising Integration

### Add Google Ad Manager (DFP)
1. Get your Publisher ID from Google Ad Manager
2. Add to environment:
   ```bash
   export GOOGLE_PUBLISHER_ID="your-pub-id"
   ```
3. Modify `app.js` `loadAdsConfig()` function:
   ```javascript
   const googleAds = new google.ima.AdDisplayContainer(
     document.getElementById('ad-top'), 
     adsManager
   );
   ```

### Custom Ad Server
Set environment variable:
```bash
export CUSTOM_AD_SERVER_URL="https://your-ad-server.com/api"
```

## Monitoring

### View Worker Logs
```bash
wrangler tail
# Shows real-time worker logs
```

### Check Analytics
- Dashboard → Workers → Your Worker → Analytics
- Monitor:
  - Requests
  - Errors
  - CPU time

## Troubleshooting

### Upload Returns 401 (Unauthorized)
- Check `X-Admin-Key` header
- Verify `ADMIN_KEY` matches in wrangler.toml
- Redeploy after changing the key

### Media Not Loading
- Check Cloudflare Images hash is correct
- Verify Stream subdomain format
- Check API token permissions

### 404 on Custom Domain
- Ensure route is configured: `example.com/*`
- Wait 5 minutes for DNS propagation
- Clear browser cache

### Out of Memory During Upload
- Reduce chunk size in `src/index.js`
- Use Cloudflare Stream's TUS protocol
- Break large files into segments

## Performance Optimization

### Image Optimization
```javascript
// Cloudflare Images automatically optimizes
// Add format params: ?format=webp&fit=cover
imageUrl + "?format=webp&fit=cover&width=300"
```

### Video Streaming
- Stream uses adaptive bitrate
- Automatically selects best quality
- Supports HLS and DASH protocols

### Caching Strategy
- Metadata: 30 minutes
- Media list: 1 hour
- Static assets: 24 hours

## Scaling

### Handling High Traffic
- Cloudflare Workers scales automatically
- KV storage handles unlimited metadata
- Consider R2 for user-uploaded content

### Database Migration
When ready, upgrade to D1 (Cloudflare Database):
1. Export KV data as JSON
2. Create D1 database
3. Import data
4. Update bindings in wrangler.toml

## Support

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Cloudflare Images Docs](https://developers.cloudflare.com/images/)
- [Cloudflare Stream Docs](https://developers.cloudflare.com/stream/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)
