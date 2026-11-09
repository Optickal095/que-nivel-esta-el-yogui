// Spike: verifies Blizzard's (undocumented) WoW Forever profile API against the real character
// and saves the raw responses so the domain model and adapter tests are built on real data.
//
// Usage (from the repo root):
//   node --env-file=api/.env scripts/spike-blizzard.mjs
//
// Optional: SLUGS="dr-yogui,yogui-dr" to try other name/surname orders.

import { mkdir, writeFile } from 'node:fs/promises';

const { BLIZZARD_CLIENT_ID, BLIZZARD_CLIENT_SECRET } = process.env;
const region = process.env.BLIZZARD_REGION ?? 'us';
const name = process.env.CHARACTER_NAME ?? 'Dr';
const surname = process.env.CHARACTER_SURNAME ?? 'Yogui';

if (!BLIZZARD_CLIENT_ID || !BLIZZARD_CLIENT_SECRET) {
  console.error('Faltan BLIZZARD_CLIENT_ID / BLIZZARD_CLIENT_SECRET en api/.env');
  process.exit(1);
}

const host = `https://${region}.api.blizzard.com`;
const namespace = `profile-forever-${region}`;
const outDir = new URL('./out/', import.meta.url);

async function getToken() {
  const res = await fetch('https://oauth.battle.net/token', {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${BLIZZARD_CLIENT_ID}:${BLIZZARD_CLIENT_SECRET}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error(`Token: HTTP ${res.status} ${await res.text()}`);
  return (await res.json()).access_token;
}

async function get(token, path, ns = namespace) {
  const url = `${host}${path}${path.includes('?') ? '&' : '?'}namespace=${ns}&locale=es_MX`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const body = res.ok ? await res.json() : await res.text();
  return { status: res.status, body };
}

const token = await getToken();
console.log('Token OK');
await mkdir(outDir, { recursive: true });

const slugs = (process.env.SLUGS ?? `${name}-${surname}`.toLowerCase()).split(',');
let found = null;
for (const slug of slugs) {
  const profile = await get(token, `/profile/wow/character/${encodeURIComponent(slug)}`);
  console.log(`Perfil ${slug}: HTTP ${profile.status}`);
  if (profile.status === 200) {
    found = slug;
    await writeFile(new URL('profile.json', outDir), JSON.stringify(profile.body, null, 2));
    break;
  }
}

if (!found) {
  console.log('\nNo encontré el personaje. Causas posibles: nombre/apellido en otro orden, nivel < 10, o no ha cerrado sesión desde que llegó a 10.');
  process.exit(2);
}

for (const sub of ['equipment', 'character-media', 'statistics', 'specializations']) {
  const r = await get(token, `/profile/wow/character/${encodeURIComponent(found)}/${sub}`);
  console.log(`${sub}: HTTP ${r.status}`);
  if (r.status === 200) await writeFile(new URL(`${sub}.json`, outDir), JSON.stringify(r.body, null, 2));
}

console.log(`\nRespuestas guardadas en scripts/out/ (slug: ${found})`);
