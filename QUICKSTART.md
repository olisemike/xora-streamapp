# StreamVibe - Quick Start Guide

Get your media streaming app running in 5 minutes!

## 1️⃣ Install Dependencies
```bash
npm install
```

## 2️⃣ Add Your Cloudflare Token
```bash
wrangler secret put CF_API_TOKEN
# Paste your token and press Enter
```

## 3️⃣ Update wrangler.toml
Edit the values marked with `TODO`:
```toml
account_id = "7fe26552990070e661d5f182566d039f"  # ✓ Already set
ADMIN_KEY = "change-this-to-secure-key"         # ← CHANGE THIS
CLOUDFLARE_IMAGES_HASH = "1eL4FEtJQavAd5JjFtJe7Q"  # ✓ Already set
CLOUDFLARE_STREAM_SUBDOMAIN = "customer-virwr1ukt49zj3yu.cloudflarestream.com"  # ✓ Already set
```

## 4️⃣ Run Locally
```bash
npm start
# Visit http://localhost:8787
```

## 5️⃣ Test Upload (Optional)
```bash
# Upload a video
ADMIN_KEY="change-this-to-secure-key" node upload.js video.mp4 "Title" "Description" video

# Or use cURL
curl -X POST http://localhost:8787/api/upload \
  -H "X-Admin-Key: change-this-to-secure-key" \
  -F "file=@video.mp4" \
  -F "title=My Video" \
  -F "type=video"
```

## 6️⃣ Deploy to Cloudflare
```bash
npm run deploy
# Your app is now live at: https://media-stream-app.{your-username}.workers.dev
```

## ✅ Verify Deployment

Visit your deployed URL and check:
- [ ] Home page loads
- [ ] Grid displays (will be empty initially)
- [ ] Pagination works
- [ ] Ad slots are visible
- [ ] Responsive on mobile

## 📱 Features

- **30 media per page** – Fast, snappy loading
- **Beautiful UI** – Dark theme with gradients, inspired by streaming sites
- **Mobile optimized** – Works perfectly on all devices
- **Admin upload** – Secret endpoint for authenticated uploads
- **VAST ready** – 3 ad slots for monetization
- **Images & Video** – Powered by Cloudflare Images and Stream

## 🔗 API Endpoints

```
GET  /api/media?page=1          # Get paginated media list
GET  /api/media/{id}            # Get single media details
POST /api/upload                # Upload (requires X-Admin-Key header)
GET  /api/ads-config            # Get ads configuration
GET  /styles.css                # CSS
GET  /app.js                     # JavaScript
```

## 🚀 Next Steps

1. **Upload Content** – Use the upload script or API
2. **Customize Ads** – Integrate VAST ads from your provider
3. **Add Branding** – Modify colors and logos in CSS/HTML
4. **Monitor Traffic** – Check Cloudflare Analytics
5. **Scale Up** – KV grows automatically with your needs

## 📚 Full Documentation

- [Deployment Guide](./DEPLOYMENT.md) – Detailed setup
- [README.md](./README.md) – Features and architecture

## 💡 Tips

- Change `ADMIN_KEY` to something secure
- Keep `CF_API_TOKEN` secret (use environment variables)
- Test uploads before going public
- Monitor worker logs: `wrangler tail`
- Use custom domains: Dashboard → Workers → Routes

## ❓ Troubleshooting

**Can't upload?**
- Check `X-Admin-Key` header matches
- Verify file size < 512MB
- Ensure token has Images/Stream permissions

**Page won't load?**
- Clear browser cache
- Check Cloudflare account is active
- Verify Images hash and Stream subdomain are correct

**Slow media loading?**
- Ensure Cloudflare Images is enabled
- Check if Stream videos are transcoded yet (takes time)
- Monitor worker CPU time in Analytics

---

🎉 **You're all set!** Your media streaming platform is ready to go!
