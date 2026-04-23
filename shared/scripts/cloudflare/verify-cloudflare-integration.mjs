import { performance } from 'node:perf_hooks';
import dns from 'node:dns/promises';

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

function parseExpectedNs(value) {
  if (!value) return [];
  return String(value)
    .split(',')
    .map((item) => item.trim().replace(/\.$/, '').toLowerCase())
    .filter(Boolean);
}

async function resolveViaDoH(name, type) {
  const endpoint = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${encodeURIComponent(type)}`;
  const response = await fetch(endpoint, {
    headers: { Accept: 'application/dns-json' },
  });
  if (!response.ok) {
    throw new Error(`DoH ${type} lookup failed with status ${response.status}`);
  }

  const payload = await response.json();
  const answers = payload?.Answer || [];
  return answers.map((item) => String(item.data || '').replace(/\.$/, ''));
}

async function resolveWithFallback(kind, name) {
  try {
    if (kind === 'NS') return await dns.resolveNs(name);
    if (kind === 'A') return await dns.resolve4(name);
    if (kind === 'CNAME') return await dns.resolveCname(name);
    throw new Error(`Unsupported record type ${kind}`);
  } catch (firstError) {
    const viaDoh = await resolveViaDoH(name, kind);
    return { values: viaDoh, source: 'doh', fallbackReason: firstError.message };
  }
}

async function timedFetch(url, options = {}) {
  const start = performance.now();
  const response = await fetch(url, options);
  const ms = performance.now() - start;
  return { response, ms };
}

function headerValue(headers, key) {
  const value = headers.get(key);
  return value == null ? '' : String(value);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const domain = String(args.domain || process.env.npm_config_domain || args._[0] || '').trim().toLowerCase();
  const expectedNs = parseExpectedNs(args['expected-ns'] || process.env.npm_config_expected_ns || args._[1]);

  if (!domain) {
    console.error('Usage: node shared/scripts/cloudflare/verify-cloudflare-integration.mjs --domain example.com [--expected-ns ns1,ns2]');
    process.exit(1);
  }

  const summary = {
    domain,
    dns: {},
    http: {},
    diagnostics: {},
    perf: {},
    checks: {},
  };

  try {
    const ns = await resolveWithFallback('NS', domain);
    if (Array.isArray(ns)) {
      summary.dns.ns = ns;
      summary.dns.ns_source = 'system';
    } else {
      summary.dns.ns = ns.values;
      summary.dns.ns_source = ns.source;
      summary.dns.ns_fallback_reason = ns.fallbackReason;
    }
  } catch (error) {
    summary.dns.ns_error = error.message;
  }

  try {
    const a = await resolveWithFallback('A', domain);
    if (Array.isArray(a)) {
      summary.dns.a = a;
      summary.dns.a_source = 'system';
    } else {
      summary.dns.a = a.values;
      summary.dns.a_source = a.source;
      summary.dns.a_fallback_reason = a.fallbackReason;
    }
  } catch (error) {
    summary.dns.a_error = error.message;
  }

  try {
    const cname = await resolveWithFallback('CNAME', `www.${domain}`);
    if (Array.isArray(cname)) {
      summary.dns.www_cname = cname;
      summary.dns.www_cname_source = 'system';
    } else {
      summary.dns.www_cname = cname.values;
      summary.dns.www_cname_source = cname.source;
      summary.dns.www_cname_fallback_reason = cname.fallbackReason;
    }
  } catch (error) {
    summary.dns.www_cname_error = error.message;
  }

  const nsNormalized = (summary.dns.ns || []).map((x) => String(x).replace(/\.$/, '').toLowerCase());
  summary.checks.nameservers_match = expectedNs.length === 0
    ? 'not_checked'
    : expectedNs.every((ns) => nsNormalized.includes(ns));

  const homepageUrl = `https://${domain}`;
  const traceUrl = `https://${domain}/cdn-cgi/trace`;

  try {
    const first = await timedFetch(homepageUrl, { redirect: 'follow' });
    const second = await timedFetch(homepageUrl, { redirect: 'follow', cache: 'no-store' });

    summary.http.status = first.response.status;
    summary.http.server = headerValue(first.response.headers, 'server');
    summary.http.cf_ray = headerValue(first.response.headers, 'cf-ray');
    summary.http.cf_cache_status = headerValue(first.response.headers, 'cf-cache-status');
    summary.http.first_ttfb_ms = Math.round(first.ms);
    summary.http.second_ttfb_ms = Math.round(second.ms);

    summary.checks.https_ok = first.response.ok;
    summary.checks.behind_cloudflare = Boolean(summary.http.cf_ray || summary.http.server.toLowerCase().includes('cloudflare'));
  } catch (error) {
    summary.http.error = error.message;
    summary.checks.https_ok = false;
    summary.checks.behind_cloudflare = false;
  }

  try {
    const trace = await fetch(traceUrl, { redirect: 'follow' });
    const traceText = await trace.text();
    const lines = traceText.split(/\r?\n/).filter(Boolean);
    const traceMap = Object.fromEntries(lines.map((line) => {
      const idx = line.indexOf('=');
      if (idx <= 0) return [line, ''];
      return [line.slice(0, idx), line.slice(idx + 1)];
    }));

    summary.diagnostics.trace_ok = trace.ok;
    summary.diagnostics.colo = traceMap.colo || '';
    summary.diagnostics.ip = traceMap.ip || '';
    summary.diagnostics.tls = traceMap.tls || '';
    summary.diagnostics.http = traceMap.http || '';
  } catch (error) {
    summary.diagnostics.error = error.message;
  }

  try {
    const originHost = `origin.${domain}`;
    const proxied = await timedFetch(`https://${domain}`, { redirect: 'follow' });
    const origin = await timedFetch(`https://${originHost}`, { redirect: 'follow' });
    summary.perf.proxied_ms = Math.round(proxied.ms);
    summary.perf.origin_ms = Math.round(origin.ms);
    summary.perf.delta_ms = Math.round(origin.ms - proxied.ms);
  } catch (error) {
    summary.perf.note = `Origin comparison skipped: ${error.message}`;
  }

  const mustPass = [
    summary.checks.https_ok === true,
    summary.checks.behind_cloudflare === true,
    expectedNs.length === 0 ? true : summary.checks.nameservers_match === true,
    summary.diagnostics.trace_ok === true,
  ];

  summary.checks.overall = mustPass.every(Boolean);

  console.log(JSON.stringify(summary, null, 2));

  if (!summary.checks.overall) {
    process.exit(2);
  }
}

main().catch((error) => {
  console.error(`Verification failed: ${error.message}`);
  process.exit(1);
});
