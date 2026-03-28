# StreamVibe - Mobile Media Streaming App

A beautiful, mobile-optimized media streaming platform built on Cloudflare Workers with admin upload capabilities, pagination, and VAST ad integration.

## Features

✨ **Mobile-First Design**
- Responsive, touch-optimized interface
- Safe area insets for notched devices
- Smooth animations and transitions
- Beautiful gradient UI (inspired by eporner/spankbang)

📱 **Media Management**
- Support for images and videos
- 30 media items per page with pagination
- Beautiful grid layout
- View counts and download tracking

🔐 **Admin Upload**
- Secret endpoint for authenticated uploads
- Cloudflare Images support
- Cloudflare Stream support
- File size validation

📊 **Advertising**
- 3 banner ad slots (top, middle, bottom)
- VAST/VPAID support ready
- Responsive ad containers

🚀 **Performance**
- Cloudflare Workers deployment
- KV storage for metadata
- Fast image delivery via Cloudflare Images
- Video streaming via Cloudflare Stream

## Setup

### Prerequisites
- Node.js 16+
- Wrangler CLI (`npm install -g wrangler`)
- Cloudflare account with:
  - API token with Images & Stream permissions
  - KV namespace

### Installation

1. **Clone and Install**
```bash
cd streamapp
npm install
```

2. **Configure Secrets**
```bash
wrangler secret put CF_API_TOKEN
# Paste your Cloudflare API token
```

3. **Update wrangler.toml**
Replace the placeholder values:
- `account_id`: Your Cloudflare Account ID
- `ADMIN_KEY`: Change to a secure admin key
- `CLOUDFLARE_IMAGES_HASH`: Your Images account hash
- `CLOUDFLARE_STREAM_SUBDOMAIN`: Your Stream subdomain

### Development

```bash
npm start
# App runs on http://localhost:8787
```

### Deployment

```bash
npm run deploy
```

## API Endpoints

### Get Media List (Paginated)
```
GET /api/media?page=1
Response: { page, perPage, totalItems, totalPages, media[] }
```

### Get Media Detail
```
GET /api/media/{mediaId}
Response: { id, title, description, type, views, ... }
```

### Admin Upload
```
POST /api/upload
Headers: X-Admin-Key: {admin-key}
Body: FormData { file, title, description, type }
```

### Get Ads Configuration
```
GET /api/ads-config
Response: { adSlots, timeout, positions[] }
```

## Mobile Optimizations

- **Viewport**: Safe area insets for notches and home indicators
- **Touch**: Larger tap targets (44px minimum)
- **Performance**: Lazy loading, optimized images
- **Network**: Progressive loading, caching headers
- **UX**: Bottom pagination for thumb reach, smooth scrolling

## Ad Integration

Three ad slots are available:
- **Top Banner**: Above media grid
- **Middle Banner**: Between grid and pagination
- **Bottom Banner**: After pagination

To integrate VAST/VPAID ads, modify the `loadAdsConfig()` function in `app.js` with your ad server details.

## Security

- Admin endpoint requires `X-Admin-Key` header
- File size validation (512MB limit)
- MIME type checking
- Origin validation ready (configure in wrangler.toml)

## File Size Limits

- Images: 512MB
- Videos: 512MB (5GB+ with segmented upload)

## License

MIT
