import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const API_BASE = 'https://api.cloudflare.com/client/v4';

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];
    if (!item.startsWith('--')) {
      args._.push(item);
      continue;
    }
    const key = item.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      args[key] = true;
    } else {
      args[key] = next;
      i += 1;
    }
  }
  return args;
}

function readWranglerOAuthToken() {
  const candidates = [
    path.join(os.homedir(), '.wrangler', 'config', 'default.toml'),
    path.join(os.homedir(), 'AppData', 'Roaming', 'xdg.config', '.wrangler', 'config', 'default.toml'),
  ];

  for (const candidate of candidates) {
    try {
      if (!fs.existsSync(candidate)) continue;
      const raw = fs.readFileSync(candidate, 'utf8');
      const match = raw.match(/oauth_token\s*=\s*"([^"]+)"/);
      if (match?.[1]) return match[1];
    } catch {
      // Continue to next candidate.
    }
  }

  return null;
}

function normalizeOriginHost(originInput) {
  const trimmed = String(originInput || '').trim();
  if (!trimmed) return '';
  try {
    const u = new URL(trimmed);
    return u.hostname;
  } catch {
    return trimmed.replace(/^https?:\/\//i, '').replace(/\/$/, '');
  }
}

function buildAuthHeader(token) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

async function cfApi(pathname, token, options = {}) {
  const response = await fetch(`${API_BASE}${pathname}`, {
    method: options.method || 'GET',
    headers: buildAuthHeader(token),
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) {
    const details = payload?.errors?.map((e) => `${e.code}: ${e.message}`).join('; ') || response.statusText;
    throw new Error(`Cloudflare API ${options.method || 'GET'} ${pathname} failed: ${details}`);
  }

  return payload;
}

async function findZoneByName(domain, token) {
  const payload = await cfApi(`/zones?name=${encodeURIComponent(domain)}&per_page=1`, token);
  return payload.result?.[0] || null;
}

async function createZone({ domain, accountId, token }) {
  const body = {
    name: domain,
    jump_start: true,
    type: 'full',
  };

  if (accountId) {
    body.account = { id: accountId };
  }

  const payload = await cfApi('/zones', token, { method: 'POST', body });
  return payload.result;
}

async function upsertDnsRecord({ zoneId, record, token }) {
  const { type, name } = record;
  const listPayload = await cfApi(
    `/zones/${zoneId}/dns_records?type=${encodeURIComponent(type)}&name=${encodeURIComponent(name)}&per_page=100`,
    token,
  );

  const existing = listPayload.result?.[0];
  if (existing) {
    const needsUpdate =
      existing.content !== record.content ||
      Boolean(existing.proxied) !== Boolean(record.proxied) ||
      String(existing.ttl) !== String(record.ttl || existing.ttl);

    if (!needsUpdate) {
      return { action: 'unchanged', id: existing.id, name, type };
    }

    const patchPayload = await cfApi(`/zones/${zoneId}/dns_records/${existing.id}`, token, {
      method: 'PATCH',
      body: {
        type,
        name,
        content: record.content,
        proxied: record.proxied,
        ttl: record.ttl,
      },
    });

    return { action: 'updated', id: patchPayload.result.id, name, type };
  }

  const createPayload = await cfApi(`/zones/${zoneId}/dns_records`, token, {
    method: 'POST',
    body: record,
  });

  return { action: 'created', id: createPayload.result.id, name, type };
}

async function patchSetting({ zoneId, settingId, value, token }) {
  try {
    await cfApi(`/zones/${zoneId}/settings/${settingId}`, token, {
      method: 'PATCH',
      body: { value },
    });
    return { settingId, ok: true };
  } catch (error) {
    return { settingId, ok: false, error: error.message };
  }
}

async function ensureBasicFirewallRule({ zoneId, token }) {
  const expression = '(http.request.uri.path contains "/.env" or http.request.uri.path contains "/xmlrpc.php" or http.request.uri.path contains "/wp-admin/install.php")';
  const description = 'Challenge common automated probing paths';

  try {
    const entrypoint = await cfApi(`/zones/${zoneId}/rulesets/phases/http_request_firewall_custom/entrypoint`, token);
    const ruleset = entrypoint.result;
    const existing = (ruleset.rules || []).find((rule) => rule.description === description);

    if (existing) {
      return { action: 'unchanged', id: existing.id };
    }

    const created = await cfApi(`/zones/${zoneId}/rulesets/${ruleset.id}/rules`, token, {
      method: 'POST',
      body: {
        action: 'managed_challenge',
        expression,
        description,
        enabled: true,
      },
    });

    return { action: 'created', id: created.result?.id || 'unknown' };
  } catch (error) {
    return { action: 'skipped', reason: error.message };
  }
}

function printUsage() {
  console.log(`Usage:
  node shared/scripts/cloudflare/setup-cloudflare-zone.mjs --domain example.com --origin https://origin.example-host.com [--account-id <id>] [--ssl strict|full]\n\nNotes:\n  - Uses CLOUDFLARE_API_TOKEN if set, otherwise Wrangler OAuth token.\n  - Adds DNS records for apex, www, and origin.<domain>.\n  - Applies SSL/security/cache baseline settings.\n`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printUsage();
    return;
  }

  const domain = String(args.domain || process.env.npm_config_domain || args._[0] || '').trim().toLowerCase();
  const originInput = String(args.origin || process.env.npm_config_origin || args._[1] || '').trim();
  const sslModeInput = String(args.ssl || process.env.npm_config_ssl || 'full').toLowerCase();
  const sslMode = sslModeInput === 'strict' ? 'strict' : 'full';
  const accountId = String(args['account-id'] || process.env.npm_config_account_id || process.env.CLOUDFLARE_ACCOUNT_ID || '').trim();

  if (!domain || !originInput) {
    printUsage();
    throw new Error('Missing required --domain and/or --origin');
  }

  const originHost = normalizeOriginHost(originInput);
  if (!originHost) {
    throw new Error('Invalid --origin value');
  }

  const token = process.env.CLOUDFLARE_API_TOKEN || readWranglerOAuthToken();
  if (!token) {
    throw new Error('No Cloudflare token found. Set CLOUDFLARE_API_TOKEN or login with Wrangler.');
  }

  console.log(`\n[Cloudflare] Starting integration for domain: ${domain}`);

  let zone = await findZoneByName(domain, token);
  if (!zone) {
    console.log('[Cloudflare] Zone not found. Creating...');
    zone = await createZone({ domain, accountId, token });
  } else {
    console.log(`[Cloudflare] Zone exists (status=${zone.status}).`);
  }

  const zoneId = zone.id;
  const nameServers = zone.name_servers || [];

  console.log('[Cloudflare] Upserting DNS records...');
  const dnsChanges = [];
  dnsChanges.push(
    await upsertDnsRecord({
      zoneId,
      token,
      record: {
        type: 'CNAME',
        name: domain,
        content: originHost,
        proxied: true,
        ttl: 1,
      },
    }),
  );
  dnsChanges.push(
    await upsertDnsRecord({
      zoneId,
      token,
      record: {
        type: 'CNAME',
        name: `www.${domain}`,
        content: domain,
        proxied: true,
        ttl: 1,
      },
    }),
  );
  dnsChanges.push(
    await upsertDnsRecord({
      zoneId,
      token,
      record: {
        type: 'CNAME',
        name: `origin.${domain}`,
        content: originHost,
        proxied: false,
        ttl: 300,
      },
    }),
  );

  console.log('[Cloudflare] Applying SSL/security/cache baseline...');
  const settingResults = [];
  const settingPlan = [
    ['ssl', sslMode],
    ['always_use_https', 'on'],
    ['automatic_https_rewrites', 'on'],
    ['min_tls_version', '1.2'],
    ['tls_1_3', 'on'],
    ['security_level', 'medium'],
    ['browser_check', 'on'],
    ['browser_cache_ttl', 14400],
    ['cache_level', 'standard'],
    ['brotli', 'on'],
  ];

  for (const [settingId, value] of settingPlan) {
    settingResults.push(await patchSetting({ zoneId, settingId, value, token }));
  }

  console.log('[Cloudflare] Configuring baseline firewall rule...');
  const firewallResult = await ensureBasicFirewallRule({ zoneId, token });

  const updatedZone = await cfApi(`/zones/${zoneId}`, token).then((x) => x.result);

  console.log('\n=== Cloudflare Integration Summary ===');
  console.log(`Domain: ${domain}`);
  console.log(`Zone ID: ${zoneId}`);
  console.log(`Zone status: ${updatedZone.status}`);
  if (nameServers.length > 0) {
    console.log(`Assigned nameservers: ${nameServers.join(', ')}`);
  }

  console.log('\nDNS changes:');
  dnsChanges.forEach((r) => console.log(`- ${r.type} ${r.name}: ${r.action}`));

  console.log('\nSettings:');
  settingResults.forEach((r) => {
    if (r.ok) {
      console.log(`- ${r.settingId}: ok`);
    } else {
      console.log(`- ${r.settingId}: skipped (${r.error})`);
    }
  });

  console.log('\nFirewall rule:');
  if (firewallResult.action === 'created') {
    console.log(`- created (${firewallResult.id})`);
  } else if (firewallResult.action === 'unchanged') {
    console.log(`- already exists (${firewallResult.id})`);
  } else {
    console.log(`- skipped (${firewallResult.reason})`);
  }

  if (updatedZone.status !== 'active') {
    console.log('\nAction required: update your domain registrar nameservers to the two assigned Cloudflare nameservers above.');
  } else {
    console.log('\nZone is active. You can run verification now.');
  }
}

main().catch((error) => {
  console.error(`\n[Cloudflare] Integration failed: ${error.message}`);
  process.exit(1);
});
