// ================================================================
//  AURA BOT v2.0 — LIVE DATABASE MODEL / SCHEMA INTEGRITY CHECK
//  Compares every real Sequelize model (packages/database/models.js)
//  against the REAL live PostgreSQL schema and reports exactly which
//  models / columns are broken.
//
//  The command harness (test-all-commands.js) stubs the database with fake
//  models, so a mismatch between the Sequelize models and the production
//  schema is invisible there. This script is the missing safety net.
//
//  Usage:  node deploy/scripts/tests/test-db-models.js
//  Exit:   0 = every model matches the live schema
//          1 = at least one model has missing columns or a probe error
//          2 = skipped — DATABASE_URL is not configured
//
//  STRICTLY READ-ONLY: no INSERT / UPDATE / DELETE, no DDL, no sync(),
//  no migrations, no Prisma commands. Only SELECT + schema introspection.
// ================================================================
import 'dotenv/config';
import sequelize from '../../../packages/database/index.js';

const EXIT_OK = 0;
const EXIT_FAIL = 1;
const EXIT_SKIP = 2;

const ERROR_MAX = 200;   // DB error strings are truncated to this length
const WIDTH = 96;

// ── Formatting helpers ──────────────────────────────────────────

// Redact anything that looks like credentials so nothing secret reaches stdout.
function sanitize(value) {
  return String(value ?? '')
    .replace(/(postgres(?:ql)?:\/\/)[^:@/\s]+:[^@\s]+@/gi, '$1***:***@')
    .replace(/(password=)[^&\s]+/gi, '$1***')
    .replace(/\r?\n/g, ' ')
    .trim();
}

function truncate(value, max = ERROR_MAX) {
  const text = String(value ?? '');
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function pad(value, width) {
  const text = String(value ?? '');
  return text.length >= width ? text : text + ' '.repeat(width - text.length);
}

function typeLabel(attribute) {
  try {
    return attribute?.type?.toString?.() ?? 'unknown';
  } catch {
    return 'unknown';
  }
}

// ── Model introspection ─────────────────────────────────────────

// Expected columns come from the model's OWN attribute metadata.
// `attribute.field` is the effective column name in Sequelize 6 (it defaults
// to the attribute name, or to snake_case when the model sets `underscored`).
function expectedColumns(model) {
  const raw = model.rawAttributes ?? {};
  const underscored = Boolean(model.options?.underscored);
  const columns = [];
  for (const [name, attribute] of Object.entries(raw)) {
    const column = attribute?.field
      || (underscored ? name.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase() : name);
    columns.push({ attribute: name, column, type: typeLabel(attribute) });
  }
  return columns;
}

// ── Per-model check ─────────────────────────────────────────────

async function checkModel(model) {
  const result = {
    model: model.name,
    table: model.tableName,
    underscored: Boolean(model.options?.underscored),
    expected: [],
    missing: [],
    extra: [],
    tableExists: true,
    probe: 'OK',
    error: null,
    note: null,
  };

  try {
    result.expected = expectedColumns(model);

    // Live schema introspection (read-only).
    const described = await sequelize.getQueryInterface().describeTable(model.tableName);
    const dbColumns = new Set(Object.keys(described ?? {}));
    const modelColumns = new Set(result.expected.map(c => c.column));

    for (const column of result.expected) {
      if (!dbColumns.has(column.column)) result.missing.push(column);
    }
    result.extra = [...dbColumns].filter(column => !modelColumns.has(column));
  } catch (err) {
    // describeTable throws when the table itself does not exist.
    result.tableExists = false;
    result.probe = 'ERROR';
    result.error = sanitize(err?.message ?? err);
  }

  // Probe query: one read-only SELECT per model.
  try {
    let modelError = null;
    try {
      await model.findOne({ raw: true });
    } catch (err) {
      modelError = sanitize(err?.message ?? err);
    }

    if (!modelError) {
      result.probe = 'OK';
      if (result.error) result.error = null;
    } else {
      result.probe = 'ERROR';
      // Fallback probe: bare table read. If it succeeds the table exists and
      // the failure is a model/attribute mapping problem.
      let rawError = null;
      try {
        const quoted = String(model.tableName).replace(/"/g, '""');
        await sequelize.query(`SELECT 1 FROM "${quoted}" LIMIT 1`);
      } catch (err) {
        rawError = sanitize(err?.message ?? err);
      }
      if (rawError) {
        result.error = rawError;
      } else {
        result.error = modelError;
        result.note = 'table exists — the model selects a column the table does not have';
      }
    }
  } catch (err) {
    result.probe = 'ERROR';
    result.error = sanitize(err?.message ?? err);
  }

  return result;
}

// ── Report ──────────────────────────────────────────────────────

function printTable(results) {
  const modelW = Math.max(6, ...results.map(r => r.model.length));
  const tableW = Math.max(6, ...results.map(r => r.table.length));
  const missW = 44;

  console.log(`  ${pad('MODEL', modelW)}  ${pad('TABLE', tableW)}  ${pad('EXPECTED', 8)}  ${pad('MISSING IN DB', missW)}  PROBE`);
  console.log(`  ${'─'.repeat(modelW)}  ${'─'.repeat(tableW)}  ${'─'.repeat(8)}  ${'─'.repeat(missW)}  ${'─'.repeat(5)}`);

  for (const r of results) {
    const missingCell = r.missing.length
      ? truncate(r.missing.map(c => c.column).join(', '), missW)
      : '—';
    const probeCell = r.probe === 'OK' ? 'OK' : 'ERROR';
    console.log(`  ${pad(r.model, modelW)}  ${pad(r.table, tableW)}  ${pad(r.expected.length, 8)}  ${pad(missingCell, missW)}  ${probeCell}`);
  }
}

function printDetails(results) {
  const broken = results.filter(r => r.missing.length || r.probe === 'ERROR');
  if (!broken.length) return;

  console.log('\n\n❌ BROKEN MODELS — ranked (worst first)');
  console.log('─'.repeat(WIDTH));

  const ranked = [...broken].sort((a, b) => {
    if (a.tableExists !== b.tableExists) return a.tableExists ? 1 : -1;
    if (a.missing.length !== b.missing.length) return b.missing.length - a.missing.length;
    return a.model.localeCompare(b.model);
  });

  ranked.forEach((r, index) => {
    const severity = !r.tableExists
      ? 'TABLE MISSING'
      : (r.missing.length ? `${r.missing.length} MISSING COLUMN(S)` : 'PROBE ERROR');
    console.log(`\n  ${index + 1}. ${r.model} → ${r.table}   [${severity}]`);
    if (r.missing.length) {
      console.log('     missing columns:');
      for (const column of r.missing) {
        console.log(`       - ${column.column}   (model attribute "${column.attribute}", type ${column.type})`);
      }
    }
    if (r.extra.length) {
      console.log(`     extra columns in db (not in model): ${r.extra.join(', ')}`);
    }
    if (r.error) {
      console.log(`     db error: ${truncate(r.error, ERROR_MAX)}`);
    }
    if (r.note) {
      console.log(`     note:    ${r.note}`);
    }
  });
}

// ── Main ────────────────────────────────────────────────────────

async function main() {
  console.log('═'.repeat(WIDTH));
  console.log('  AURA BOT v2.0 — LIVE DB MODEL / SCHEMA INTEGRITY CHECK (read-only)');
  console.log('═'.repeat(WIDTH));

  if (!process.env.DATABASE_URL) {
    console.log('');
    console.log('  ⏭️  SKIPPED — DATABASE_URL is not set.');
    console.log('     Run from the repository root (so dotenv loads .env) with a populated');
    console.log('     DATABASE_URL to run this check. Nothing was connected or changed.');
    return EXIT_SKIP;
  }

  console.log('');
  console.log('  Connecting to the live database…');

  try {
    await sequelize.authenticate();
  } catch (err) {
    console.log('');
    console.log('  ❌ DB UNREACHABLE — could not connect to the live PostgreSQL instance.');
    console.log(`     error: ${truncate(sanitize(err?.message ?? err), ERROR_MAX)}`);
    if (err?.parent?.message) {
      console.log(`     cause: ${truncate(sanitize(err.parent.message), ERROR_MAX)}`);
    }
    console.log('     No schema comparison was performed. Nothing was changed.');
    return EXIT_FAIL;
  }

  console.log('  ✅ Connected.');

  const modelNames = Object.keys(sequelize.models ?? {}).sort();
  const results = [];

  for (const name of modelNames) {
    const model = sequelize.models[name];
    try {
      results.push(await checkModel(model));
    } catch (err) {
      // A single broken model must never abort the whole run.
      results.push({
        model: model?.name ?? name,
        table: model?.tableName ?? '(unknown)',
        underscored: Boolean(model?.options?.underscored),
        expected: [],
        missing: [],
        extra: [],
        tableExists: false,
        probe: 'ERROR',
        error: truncate(sanitize(err?.message ?? err), ERROR_MAX),
        note: 'model check crashed — see error above',
      });
    }
  }

  const ok = results.filter(r => r.probe === 'OK' && r.missing.length === 0);
  const missingCols = results.filter(r => r.missing.length > 0);
  const probeErrors = results.filter(r => r.probe === 'ERROR');
  const tablesMissing = results.filter(r => !r.tableExists);

  console.log('');
  printTable(results);

  console.log('');
  console.log('═'.repeat(WIDTH));
  console.log('  SUMMARY');
  console.log('═'.repeat(WIDTH));
  console.log(`  Models checked:                ${results.length}`);
  console.log(`  Models OK:                     ${ok.length}`);
  console.log(`  Models with missing columns:   ${missingCols.length}`);
  console.log(`  Models with probe errors:      ${probeErrors.length}`);
  console.log(`  Models whose table is missing: ${tablesMissing.length}`);
  console.log(`  Total missing columns:         ${missingCols.reduce((sum, r) => sum + r.missing.length, 0)}`);

  const errorLines = results
    .filter(r => r.error)
    .map(r => `    ${r.model} (${r.table}): ${truncate(r.error, ERROR_MAX)}`);
  if (errorLines.length) {
    console.log('\n  EXACT DB ERRORS:');
    for (const line of errorLines) console.log(line);
  }

  if (missingCols.length) {
    console.log('\n  MISSING COLUMNS BY MODEL:');
    for (const r of missingCols) {
      console.log(`    ${r.model} (${r.table}): ${r.missing.map(c => c.column).join(', ')}`);
    }
  }

  printDetails(results);

  console.log('');
  console.log('═'.repeat(WIDTH));
  if (!missingCols.length && !probeErrors.length) {
    console.log('  ✅ ALL MODELS MATCH THE LIVE SCHEMA.');
    return EXIT_OK;
  }
  console.log('  ❌ SCHEMA MISMATCH — the models above do not match the live database.');
  console.log('     This is what breaks commands in production: a query referencing a');
  console.log('     column that does not exist in Postgres.');
  console.log('═'.repeat(WIDTH));
  return EXIT_FAIL;
}

let exitCode = EXIT_FAIL;
try {
  exitCode = await main();
} catch (err) {
  console.error('  ❌ Unexpected failure:', sanitize(err?.message ?? err));
  exitCode = EXIT_FAIL;
} finally {
  try {
    await sequelize.close();
  } catch {
    // pool teardown must never mask the real result
  }
}

process.exit(exitCode);
