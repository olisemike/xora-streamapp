export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // API routes
    if (pathname.startsWith('/api/')) {
      return handleAPI(request, env, url);
    }

    // Delete route (not under /api/)
    if (pathname.startsWith('/media/') && request.method === 'DELETE') {
      const mediaId = pathname.split('/')[2];
      return handleDelete(request, env, mediaId);
    }

    // Serve all static files via Wrangler assets
    return env.ASSETS.fetch(request);
  },
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function handleAPI(request, env, url) {
  const pathname = url.pathname;

  if (pathname === '/api/upload' && request.method === 'POST') {
    return handleUpload(request, env);
  }

  if (pathname === '/api/media' && request.method === 'GET') {
    const page = parseInt(url.searchParams.get('page') || '1');
    return getMediaList(env, page);
  }

  if (pathname.startsWith('/api/media/') && request.method === 'GET') {
    const mediaId = pathname.split('/')[3];
    return getMediaDetail(env, mediaId);
  }

  if (pathname === '/api/search' && request.method === 'GET') {
    const query = url.searchParams.get('q') || '';
    const page = parseInt(url.searchParams.get('page') || '1');
    return searchMedia(env, query, page);
  }

  if (pathname === '/api/categories' && request.method === 'GET') {
    return getCategories(env);
  }

  if (pathname === '/api/category' && request.method === 'GET') {
    const category = url.searchParams.get('name') || '';
    const page = parseInt(url.searchParams.get('page') || '1');
    return getMediaByCategory(env, category, page);
  }

  if (pathname === '/api/view' && request.method === 'POST') {
    const body = await request.json();
    return recordView(env, body.mediaId);
  }

  return jsonResponse({ success: false, error: 'Not found' }, 404);
}

async function handleUpload(request, env) {
  const adminKey = request.headers.get('X-Admin-Key');
  if (adminKey !== env.ADMIN_KEY) {
    return jsonResponse({ success: false, error: 'Unauthorized' }, 401);
  }

  const formData = await request.formData();
  const file = formData.get('file');
  const title = formData.get('title');
  const description = formData.get('description');
  const type = formData.get('type');
  const category = formData.get('category');

  if (!file) {
    return jsonResponse({ success: false, error: 'No file provided' }, 400);
  }

  try {
    const mediaId = Date.now().toString();
    let cfId = '';

    if (type === 'image') {
      cfId = await uploadToImages(file, env);
    } else {
      cfId = await uploadToStream(file, env);
    }

    if (!cfId) {
      return jsonResponse({ success: false, error: 'Failed to upload to Cloudflare. Check your API token and account ID.' }, 500);
    }

    const metadata = {
      id: mediaId,
      title: title || 'Untitled',
      description: description || '',
      type: type || 'video',
      category: category || 'Uncategorized',
      cfId: cfId,
      uploadedAt: new Date().toISOString(),
      views: 0,
    };

    await env.MEDIA_KV.put('media:' + mediaId, JSON.stringify(metadata));
    await env.MEDIA_KV.put('index:' + mediaId, mediaId);

    return jsonResponse({ success: true, mediaId });
  } catch (error) {
    return jsonResponse({ success: false, error: error.message }, 500);
  }
}

async function handleDelete(request, env, mediaId) {
  const adminKey = request.headers.get('X-Admin-Key');
  if (adminKey !== env.ADMIN_KEY) {
    return jsonResponse({ success: false, error: 'Unauthorized' }, 401);
  }

  try {
    const mediaData = await env.MEDIA_KV.get('media:' + mediaId);
    if (!mediaData) {
      return jsonResponse({ success: false, error: 'Media not found' }, 404);
    }

    const media = JSON.parse(mediaData);

    // Delete from Cloudflare Images or Stream
    // Uses CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN (consistent naming)
    if (media.type === 'image' && media.cfId) {
      await fetch(`https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/images/v1/${media.cfId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}` },
      });
    } else if (media.type === 'video' && media.cfId) {
      await fetch(`https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/stream/${media.cfId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}` },
      });
    }

    await env.MEDIA_KV.delete('media:' + mediaId);
    await env.MEDIA_KV.delete('index:' + mediaId);

    return jsonResponse({ success: true });
  } catch (error) {
    return jsonResponse({ success: false, error: error.message }, 500);
  }
}

async function uploadToImages(file, env) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/images/v1`,
    {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}` },
      body: formData,
    },
  );

  const data = await response.json();
  if (!data.success) {
    console.error('Images upload failed:', JSON.stringify(data.errors));
    throw new Error('Cloudflare Images upload failed: ' + (data.errors?.[0]?.message || 'unknown error'));
  }
  return data.result?.id || '';
}

async function uploadToStream(file, env) {
  // Stream requires multipart FormData, NOT raw file body
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/stream`,
    {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}` },
      body: formData,
    },
  );

  const data = await response.json();
  if (!data.success) {
    console.error('Stream upload failed:', JSON.stringify(data.errors));
    throw new Error('Cloudflare Stream upload failed: ' + (data.errors?.[0]?.message || 'unknown error'));
  }
  return data.result?.uid || '';
}

async function getMediaList(env, page = 1) {
  const perPage = 30;
  try {
    const list = await env.MEDIA_KV.list({ prefix: 'index:' });
    // Sort by ID descending (newest first) since IDs are timestamps
    const allIds = list.keys
      .map(k => k.name.replace('index:', ''))
      .sort((a, b) => b.localeCompare(a));

    const totalPages = Math.max(1, Math.ceil(allIds.length / perPage));
    const startIdx = (page - 1) * perPage;
    const pageIds = allIds.slice(startIdx, startIdx + perPage);

    const media = [];
    for (const id of pageIds) {
      const data = await env.MEDIA_KV.get('media:' + id, 'json');
      if (data) media.push(data);
    }

    return jsonResponse({ success: true, page, totalPages, media });
  } catch (error) {
    return jsonResponse({ success: false, error: error.message }, 500);
  }
}

async function getMediaDetail(env, mediaId) {
  try {
    const data = await env.MEDIA_KV.get('media:' + mediaId, 'json');
    if (!data) {
      return jsonResponse({ success: false, error: 'Not found' }, 404);
    }
    return jsonResponse(data);
  } catch (error) {
    return jsonResponse({ success: false, error: error.message }, 500);
  }
}

async function searchMedia(env, query, page = 1) {
  const perPage = 30;
  try {
    const list = await env.MEDIA_KV.list({ prefix: 'index:' });
    const allIds = list.keys
      .map(k => k.name.replace('index:', ''))
      .sort((a, b) => b.localeCompare(a));

    const q = query.toLowerCase();
    const media = [];
    for (const id of allIds) {
      const data = await env.MEDIA_KV.get('media:' + id, 'json');
      if (data && (
        data.title.toLowerCase().includes(q) ||
        (data.description || '').toLowerCase().includes(q) ||
        (data.category || '').toLowerCase().includes(q)
      )) {
        media.push(data);
      }
    }

    const totalPages = Math.max(1, Math.ceil(media.length / perPage));
    const startIdx = (page - 1) * perPage;
    const paginated = media.slice(startIdx, startIdx + perPage);

    return jsonResponse({ success: true, page, totalPages, media: paginated });
  } catch (error) {
    return jsonResponse({ success: false, error: error.message }, 500);
  }
}

async function getCategories(env) {
  try {
    const list = await env.MEDIA_KV.list({ prefix: 'index:' });
    const allIds = list.keys.map(k => k.name.replace('index:', ''));

    const categoryMap = {};
    for (const id of allIds) {
      const data = await env.MEDIA_KV.get('media:' + id, 'json');
      if (data) {
        const cat = data.category || 'Uncategorized';
        categoryMap[cat] = (categoryMap[cat] || 0) + 1;
      }
    }

    const categories = Object.entries(categoryMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return jsonResponse({ success: true, categories });
  } catch (error) {
    return jsonResponse({ success: false, error: error.message }, 500);
  }
}

async function getMediaByCategory(env, category, page = 1) {
  const perPage = 30;
  try {
    const list = await env.MEDIA_KV.list({ prefix: 'index:' });
    const allIds = list.keys
      .map(k => k.name.replace('index:', ''))
      .sort((a, b) => b.localeCompare(a));

    const media = [];
    for (const id of allIds) {
      const data = await env.MEDIA_KV.get('media:' + id, 'json');
      if (data && data.category === category) media.push(data);
    }

    const totalPages = Math.max(1, Math.ceil(media.length / perPage));
    const startIdx = (page - 1) * perPage;
    const paginated = media.slice(startIdx, startIdx + perPage);

    return jsonResponse({ success: true, page, totalPages, media: paginated });
  } catch (error) {
    return jsonResponse({ success: false, error: error.message }, 500);
  }
}

async function recordView(env, mediaId) {
  try {
    const data = await env.MEDIA_KV.get('media:' + mediaId, 'json');
    if (data) {
      data.views = (data.views || 0) + 1;
      await env.MEDIA_KV.put('media:' + mediaId, JSON.stringify(data));
    }
    return jsonResponse({ success: true });
  } catch (error) {
    return jsonResponse({ success: false }, 500);
  }
}