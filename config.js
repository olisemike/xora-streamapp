/**
 * StreamVibe Configuration
 * Override defaults by setting environment variables
 */

module.exports = {
  // API Configuration
  api: {
    url: process.env.API_URL || 'http://localhost:8787',
    timeout: process.env.API_TIMEOUT || 30000,
  },

  // Admin Configuration
  admin: {
    key: process.env.ADMIN_KEY || 'admin-secret-key-change-me',
    email: process.env.ADMIN_EMAIL || 'admin@example.com',
  },

  // Media Configuration
  media: {
    perPage: parseInt(process.env.MEDIA_PER_PAGE || '30'),
    maxUploadSize: parseInt(process.env.MAX_UPLOAD_SIZE || 536870912), // 512MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    allowedVideoTypes: ['video/mp4', 'video/webm', 'video/ogg'],
  },

  // Cloudflare Configuration
  cloudflare: {
    accountId: process.env.CF_ACCOUNT_ID || 'your-account-id',
    apiToken: process.env.CF_API_TOKEN || 'your-api-token',
    images: {
      hash: process.env.CLOUDFLARE_IMAGES_HASH || 'your-images-hash',
      deliveryUrl: process.env.CLOUDFLARE_IMAGES_DELIVERY_URL || 'https://imagedelivery.net',
    },
    stream: {
      subdomain: process.env.CLOUDFLARE_STREAM_SUBDOMAIN || 'customer-xxx.cloudflarestream.com',
    },
  },

  // Advertising Configuration
  ads: {
    slots: parseInt(process.env.VAST_AD_SLOTS || '3'),
    timeout: parseInt(process.env.VAST_TIMEOUT || '5000'),
    positions: ['top-banner', 'middle-banner', 'bottom-banner'],
    providers: {
      google: {
        // Configure your Google Ad Manager settings
        enabled: false,
        publisherId: process.env.GOOGLE_PUBLISHER_ID || '',
      },
      custom: {
        // Configure your custom ad server
        enabled: false,
        url: process.env.CUSTOM_AD_SERVER_URL || '',
      },
    },
  },

  // UI Configuration
  ui: {
    theme: 'dark', // 'dark' or 'light'
    primaryColor: '#ff006e',
    accentColor: '#8338ec',
    enableSearch: true,
    enableDownload: true,
    enableSharing: false,
  },

  // Security Configuration
  security: {
    corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:8787').split(','),
    rateLimiting: {
      enabled: true,
      upload: '10/hour',
      api: '100/minute',
    },
    requireAuth: {
      upload: true,
      download: false,
      view: false,
    },
  },

  // Analytics Configuration
  analytics: {
    enabled: true,
    trackViews: true,
    trackDownloads: true,
    trackSearches: false,
  },

  // Cache Configuration
  cache: {
    enabled: true,
    ttl: {
      media: 3600,
      metadata: 1800,
      ads: 600,
    },
  },
};
