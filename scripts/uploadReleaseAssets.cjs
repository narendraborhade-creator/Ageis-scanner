const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');

// Extract GitHub token from Git Credential Manager
const credOut = execSync('git credential fill', { input: 'protocol=https\nhost=github.com\n\n' }).toString();
let token = '';
credOut.split('\n').forEach(line => {
  if (line.startsWith('password=')) token = line.substring(9).trim();
});

if (!token) {
  console.error('Failed to extract GitHub token from Git Credential Manager');
  process.exit(1);
}

const RELEASE_ID = '422700772';
const REPO = 'narendraborhade-creator/Ageis-scanner';

const assetsToUpload = [
  {
    localPath: path.resolve(__dirname, '../release/Aegis 3D Safe Browser Setup 1.0.0.exe'),
    remoteName: 'Aegis-3D-Safe-Browser-Setup-1.0.0.exe'
  },
  {
    localPath: path.resolve(__dirname, '../release/Aegis 3D Safe Browser 1.0.0.exe'),
    remoteName: 'Aegis-3D-Safe-Browser-1.0.0.exe'
  }
];

function apiRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(body ? JSON.parse(body) : null);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function removeExistingAsset(name) {
  try {
    const assets = await apiRequest({
      hostname: 'api.github.com',
      port: 443,
      path: `/repos/${REPO}/releases/${RELEASE_ID}/assets`,
      method: 'GET',
      headers: {
        'User-Agent': 'Node-Aegis-Uploader',
        'Authorization': `Bearer ${token}`
      }
    });

    const match = assets.find(a => a.name === name);
    if (match) {
      console.log(`Found existing asset ${name} (id: ${match.id}), deleting before re-upload...`);
      await apiRequest({
        hostname: 'api.github.com',
        port: 443,
        path: `/repos/${REPO}/releases/assets/${match.id}`,
        method: 'DELETE',
        headers: {
          'User-Agent': 'Node-Aegis-Uploader',
          'Authorization': `Bearer ${token}`
        }
      });
      console.log(`Deleted old asset ${name} successfully.`);
    }
  } catch (err) {
    console.warn(`Warning checking/deleting asset ${name}:`, err.message);
  }
}

function uploadAsset(asset) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(asset.localPath)) {
      return reject(new Error(`File not found: ${asset.localPath}`));
    }

    const stats = fs.statSync(asset.localPath);
    const fileSize = stats.size;
    console.log(`Starting upload: ${asset.remoteName} (${(fileSize / (1024 * 1024)).toFixed(2)} MB)...`);

    const options = {
      hostname: 'uploads.github.com',
      port: 443,
      path: `/repos/${REPO}/releases/${RELEASE_ID}/assets?name=${encodeURIComponent(asset.remoteName)}`,
      method: 'POST',
      headers: {
        'User-Agent': 'Node-Aegis-Uploader',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/octet-stream',
        'Content-Length': fileSize
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`Successfully uploaded: ${asset.remoteName}`);
          resolve(JSON.parse(body));
        } else {
          console.error(`Upload failed for ${asset.remoteName} with status ${res.statusCode}:`, body);
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', (err) => {
      console.error(`Network error uploading ${asset.remoteName}:`, err);
      reject(err);
    });

    // Stream file with progress logging
    const readStream = fs.createReadStream(asset.localPath, { highWaterMark: 1024 * 1024 });
    let uploadedBytes = 0;
    let lastPercent = 0;

    readStream.on('data', chunk => {
      uploadedBytes += chunk.length;
      const percent = Math.floor((uploadedBytes / fileSize) * 100);
      if (percent >= lastPercent + 10 || percent === 100) {
        lastPercent = percent;
        console.log(`  ${asset.remoteName}: ${percent}% (${(uploadedBytes / (1024 * 1024)).toFixed(1)} MB / ${(fileSize / (1024 * 1024)).toFixed(1)} MB)`);
      }
    });

    readStream.pipe(req);
  });
}

async function main() {
  for (const asset of assetsToUpload) {
    await removeExistingAsset(asset.remoteName);
    await uploadAsset(asset);
  }
  console.log('All release assets successfully uploaded to GitHub Release v1.0.0!');
}

main().catch(err => {
  console.error('Fatal error during asset upload:', err);
  process.exit(1);
});
