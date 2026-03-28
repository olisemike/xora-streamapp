#!/usr/bin/env node

/**
 * Admin Upload Script for StreamVibe
 * Usage: node upload.js <file-path> <title> [description] [type]
 *
 * Example:
 *   node upload.js video.mp4 "Cool Video" "An awesome video" video
 *   node upload.js image.jpg "Beautiful Image" "A stunning image" image
 */

const fs = require('fs');
const path = require('path');

const apiUrl = process.env.API_URL || 'http://localhost:8787';
const adminKey = process.env.ADMIN_KEY || 'admin-secret-key-change-me';

async function uploadMedia(filePath, title, description = '', type = 'video') {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
  }

  const fileStats = fs.statSync(filePath);
  const fileSizeMB = (fileStats.size / (1024 * 1024)).toFixed(2);

  console.log('📤 Uploading file...');
  console.log(`  File: ${path.basename(filePath)}`);
  console.log(`  Size: ${fileSizeMB} MB`);
  console.log(`  Title: ${title}`);
  console.log(`  Type: ${type}`);

  const formData = new FormData();
  const fileStream = fs.readFileSync(filePath);
  const blob = new Blob([fileStream]);

  formData.append('file', blob, path.basename(filePath));
  formData.append('title', title);
  formData.append('description', description);
  formData.append('type', type);

  try {
    const response = await fetch(`${apiUrl}/api/upload`, {
      method: 'POST',
      headers: {
        'X-Admin-Key': adminKey,
      },
      body: formData,
    });

    const data = await response.json();

    if (response.ok && data.success) {
      console.log('✅ Upload successful!');
      console.log(`  Media ID: ${data.mediaId}`);
      console.log(`  View at: ${apiUrl}/?id=${data.mediaId}`);
    } else {
      console.error('❌ Upload failed:', data.error);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

const args = process.argv.slice(2);

if (args.length < 2) {
  console.log('Usage: node upload.js <file-path> <title> [description] [type]');
  console.log('\nExample:');
  console.log('  node upload.js video.mp4 "Cool Video" "An awesome video" video');
  console.log('  node upload.js image.jpg "Beautiful Image" "A stunning image" image');
  process.exit(1);
}

const [filePath, title, description = '', type = 'video'] = args;

uploadMedia(filePath, title, description, type);
