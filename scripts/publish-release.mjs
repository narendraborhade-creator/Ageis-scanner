import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

function getGitHubToken() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  if (process.env.GH_TOKEN) return process.env.GH_TOKEN;
  try {
    const creds = execSync('git credential fill', {
      input: 'protocol=https\nhost=github.com\n',
      encoding: 'utf-8'
    });
    const match = creds.match(/password=(.+)/);
    if (match) return match[1].trim();
  } catch {}
  return '';
}

const GITHUB_TOKEN = getGitHubToken();
const OWNER = 'narendraborhade-creator';
const REPO = 'Ageis-scanner';
const TAG = 'v2.1.0';

const filesToUpload = [
  {
    name: 'Aegis-3D-Safe-Browser-Setup.exe',
    filePath: path.resolve('release', 'Aegis-3D-Safe-Browser-Setup.exe'),
    contentType: 'application/vnd.microsoft.portable-executable'
  },
  {
    name: 'Aegis-3D-Safe-Browser.exe',
    filePath: path.resolve('release', 'Aegis-3D-Safe-Browser.exe'),
    contentType: 'application/vnd.microsoft.portable-executable'
  },
  {
    name: 'Aegis-3D-Safe-Browser.apk',
    filePath: path.resolve('release', 'Aegis-3D-Safe-Browser.apk'),
    contentType: 'application/vnd.android.package-archive'
  }
];

async function main() {
  if (!GITHUB_TOKEN) {
    throw new Error('No GitHub token found in env or git credential helper.');
  }

  console.log(`Checking existing release for tag ${TAG}...`);

  const headers = {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'Aegis-Release-Publisher'
  };

  let release;
  const getRes = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/releases/tags/${TAG}`, { headers });
  if (getRes.ok) {
    release = await getRes.json();
    console.log(`Found existing release ID: ${release.id}`);
  } else if (getRes.status === 404) {
    console.log(`Creating fresh release ${TAG}...`);
    const createRes = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/releases`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tag_name: TAG,
        target_commitish: 'main',
        name: `Aegis 3D Safe Browser ${TAG} (SOC Analyst Edition)`,
        body: `## Aegis 3D Safe Browser ${TAG} - SOC Analyst Cyber Suite`,
        draft: false,
        prerelease: false
      })
    });
    if (!createRes.ok) {
      throw new Error(`Failed to create release: ${createRes.status} ${await createRes.text()}`);
    }
    release = await createRes.json();
    console.log(`Created release ID: ${release.id}`);
  } else {
    throw new Error(`Error fetching release: ${getRes.status} ${await getRes.text()}`);
  }

  for (const file of filesToUpload) {
    if (!fs.existsSync(file.filePath)) {
      console.error(`File missing: ${file.filePath}`);
      continue;
    }
    const stat = fs.statSync(file.filePath);
    const sizeMb = (stat.size / (1024 * 1024)).toFixed(2);

    const existingAsset = (release.assets || []).find((a) => a.name === file.name);
    if (existingAsset) {
      console.log(`Deleting old release asset ${file.name} (id: ${existingAsset.id})...`);
      const delRes = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/releases/assets/${existingAsset.id}`, {
        method: 'DELETE',
        headers
      });
      if (delRes.ok) {
        console.log(`Deleted old asset ${file.name}.`);
      } else {
        console.warn(`Warning deleting old asset: ${delRes.status}`);
      }
    }

    console.log(`Uploading ${file.name} (${sizeMb} MB)...`);

    const fileStream = fs.readFileSync(file.filePath);
    const uploadUrl = `https://uploads.github.com/repos/${OWNER}/${REPO}/releases/${release.id}/assets?name=${encodeURIComponent(file.name)}`;

    const upRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': file.contentType,
        'Content-Length': stat.size.toString()
      },
      body: fileStream
    });

    if (!upRes.ok) {
      console.error(`Failed to upload ${file.name}: ${upRes.status} ${await upRes.text()}`);
    } else {
      const assetData = await upRes.json();
      console.log(`Successfully uploaded ${file.name}! Download URL: ${assetData.browser_download_url}`);
    }
  }

  console.log('Release assets process completed.');
}

main().catch((err) => {
  console.error('Fatal release error:', err);
  process.exit(1);
});
