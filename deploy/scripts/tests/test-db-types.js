/**
 * AURA BOT v2 — LIVE DB COLUMN TYPE / PRIMARY KEY DRIFT CHECK (read-only)
 *
 * Complements test-db-models.js (which checks column NAMES) by also checking:
 *   - column data types (model attribute type vs the live Postgres type)
 *   - primary key definition (model primaryKey attribute vs live PK columns)
 *   - model-declared indexes (model indexes vs live pg_indexes)
 *
 * It connects with the application's own DATABASE_URL (loaded via dotenv) and
 * NEVER prints the connection string or any credential.
 *
 * Exit code: 0 = no drift, 1 = drift found.
 */
import 'dotenv/config';
import { DataTypes } from 'sequelize';
import sequelize from '../../../packages/database/index.js';

const ACCEPTED = {
  [DataTypes.STRING]: ['character varying', 'text', 'character', 'character varying(255)'],
  [DataTypes.TEXT]: ['text'],
  [DataTypes.BOOLEAN]: ['boolean'],
  [DataTypes.INTEGER]: ['integer', 'bigint', 'smallint'],
  [DataTypes.BIGINT]: ['bigint', 'integer'],
  [DataTypes.FLOAT]: ['double precision', 'real', 'numeric'],
  [DataTypes.DOUBLE]: ['double precision', 'real', 'numeric'],
  [DataTypes.DECIMAL]: ['numeric', 'double precision'],
  [DataTypes.DATE]: ['timestamp with time zone', 'timestamp without time zone', 'date'],
  [DataTypes.UUID]: ['uuid'],
  [DataTypes.JSONB]: ['jsonb', 'json'],
  [DataTypes.JSON]: ['jsonb', 'json'],
  [DataTypes.ENUM]: ['USER-DEFINED', 'text'],
};

function acceptedTypes(attribute) {
  const key = Object.keys(ACCEPTED).find((k) => attribute.type instanceof k);
  return key ? ACCEPTED[key] : null;
}

function modelTypeName(attribute) {
  const key = Object.keys(ACCEPTED).find((k) => attribute.type instanceof k);
  if (!key) return String(attribute.type);
  return key.replace('DataTypes.', '').toUpperCase();
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('  AURA BOT v2 — LIVE DB COLUMN TYPE / PK DRIFT CHECK (read-only)');
  console.log('═══════════════════════════════════════════════════════════════════');

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set — cannot run the live check.');
    process.exit(2);
  }

  await sequelize.authenticate();
  console.log('  ✅ Connected to the live database.\n');

  const columnRows = await sequelize.query(
    `SELECT table_name, column_name, data_type, udt_name, is_nullable, column_default
       FROM information_schema.columns
      WHERE table_schema = 'public'`,
    { type: sequelize.QueryTypes.SELECT },
  );
  const indexRows = await sequelize.query(
    `SELECT tablename, indexname, indexdef FROM pg_indexes WHERE schemaname = 'public'`,
    { type: sequelize.QueryTypes.SELECT },
  );
  const pkRows = await sequelize.query(
    `SELECT c.relname AS table, con.conname, pg_get_constraintdef(con.oid) AS def
       FROM pg_constraint con JOIN pg_class c ON c.oid = con.conrelid
      WHERE con.contype = 'p' AND c.relname IN (${modelsList()})`,
    { type: sequelize.QueryTypes.SELECT },
  );

  const liveColumns = new Map();
  for (const row of columnRows) {
    if (!liveColumns.has(row.table_name)) liveColumns.set(row.table_name, new Map());
    liveColumns.get(row.table_name).set(row.column_name, row);
  }
  const liveIndexes = new Set(indexRows.map((r) => r.indexname));

  const typeDrift = [];
  const pkDrift = [];
  const indexDrift = [];
  const models = Object.values(sequelize.models).filter((m) => m && m.tableName);

  for (const model of models) {
    const table = model.tableName;
    const live = liveColumns.get(table) || new Map();
    const modelPk = Object.entries(model.rawAttributes).find(([, a]) => a.primaryKey);
    const livePk = pkRows.find((r) => r.table === table);
    const livePkCols = livePk
      ? [...livePk.def.matchAll(/"([^"]+)"/g)].map((m) => m[1])
      : [];
    if (modelPk && livePkCols.length && modelPk[0] !== livePkCols[0]) {
      pkDrift.push({ table, model: modelPk[0], live: livePkCols });
    }
    for (const [name, attribute] of Object.entries(model.rawAttributes)) {
      const column = live.get(name);
      if (!column) continue;
      const accepted = acceptedTypes(attribute);
      if (accepted && !accepted.includes(column.data_type)) {
        typeDrift.push({
          table,
          column: name,
          modelType: modelTypeName(attribute),
          liveType: column.data_type,
          udt: column.udt_name,
        });
      }
    }
    for (const index of model.options?.indexes || []) {
      const name = `idx_${table}_${(index.fields || []).join('_')}`;
      const anyExists = indexRows.some(
        (r) => r.tablename === table && r.indexdef.includes((index.fields || [])[0]),
      );
      if (!anyExists) indexDrift.push({ table, expected: name, fields: index.fields });
    }
  }

  console.log(`  Models checked:                ${models.length}`);
  console.log(`  Column type mismatches:        ${typeDrift.length}`);
  console.log(`  Primary key mismatches:        ${pkDrift.length}`);
  console.log(`  Missing model indexes:         ${indexDrift.length}`);

  if (typeDrift.length) {
    console.log('\n  ── COLUMN TYPE MISMATCHES ──');
    for (const d of typeDrift) {
      console.log(`   ✗ ${d.table}.${d.column}: model ${d.modelType} vs live ${d.liveType} (${d.udt})`);
    }
  }
  if (pkDrift.length) {
    console.log('\n  ── PRIMARY KEY MISMATCHES ──');
    for (const d of pkDrift) {
      console.log(`   ✗ ${d.table}: model pk "${d.model}" vs live pk ${JSON.stringify(d.live)}`);
    }
  }
  if (indexDrift.length) {
    console.log('\n  ── MISSING MODEL INDEXES ──');
    for (const d of indexDrift) {
      console.log(`   ✗ ${d.table}: expected index on (${d.fields.join(', ')})`);
    }
  }

  const failed = typeDrift.length + pkDrift.length;
  console.log(failed ? '\n  ❌ TYPE/PK DRIFT FOUND' : '\n  ✅ NO TYPE/PK DRIFT — models match the live database');
  await sequelize.close();
  process.exit(failed ? 1 : 0);
}

function modelsList() {
  const names = Object.values(sequelize.models)
    .filter((m) => m && m.tableName)
    .map((m) => `'${m.tableName}'`)
    .join(',');
  return names || `''`;
}

main().catch((error) => {
  console.error('❌ Live DB check failed:', error.message);
  process.exit(2);
});
