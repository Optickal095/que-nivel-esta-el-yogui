// Spike 2: checks the extra endpoints (pets, professions, reputations...) and item icons.
// Usage: node --env-file=api/.env scripts/spike-extras.mjs
import { writeFile } from 'node:fs/promises';

const { BLIZZARD_CLIENT_ID, BLIZZARD_CLIENT_SECRET } = process.env;
const region = process.env.BLIZZARD_REGION ?? 'us';
const slug = `${process.env.CHARACTER_NAME}-${process.env.CHARACTER_SURNAME}`.toLowerCase();
const host = `https://${region}.api.blizzard.com`;
const outDir = new URL('./out/', import.meta.url);

const tokenRes = await fetch('https://oauth.battle.net/token', {
  method: 'POST',
  headers: {
    Authorization: 'Basic ' + Buffer.from(`${BLIZZARD_CLIENT_ID}:${BLIZZARD_CLIENT_SECRET}`).toString('base64'),
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: 'grant_type=client_credentials',
});
const token = (await tokenRes.json()).access_token;

async function get(path, ns) {
  const res = await fetch(`${host}${path}?namespace=${ns}&locale=es_MX`, { headers: { Authorization: `Bearer ${token}` } });
  return { status: res.status, body: res.ok ? await res.json() : null };
}

const profileNs = `profile-forever-${region}`;
for (const sub of ['hunter-pets', 'professions', 'reputations', 'achievements', 'titles', 'appearance', 'pvp-summary', 'quests/completed']) {
  const r = await get(`/profile/wow/character/${slug}/${sub}`, profileNs);
  console.log(`${sub}: HTTP ${r.status}`);
  if (r.body) await writeFile(new URL(`${sub.replace('/', '-')}.json`, outDir), JSON.stringify(r.body, null, 2));
}

// Item icon (static namespace) for the shotgun, id 4577
for (const ns of [`static-forever-${region}`, `static-${region}`]) {
  const r = await get('/data/wow/media/item/4577', ns);
  console.log(`item media (${ns}): HTTP ${r.status}`, r.body?.assets?.[0]?.value ?? '');
}
