'use strict';

const { PLUGIN_ID } = require('./pluginId');

/**
 * Register the custom field on the server. The stored value is a string such as
 * "fa-solid fa-user" (a text-based custom field).
 *
 * Uses `type: 'text'` (Postgres `text`, no 255-char cap) rather than `string`
 * (`varchar(255)`). The `object` output format stores a JSON blob including SVG
 * path geometry, which routinely exceeds 255 characters.
 */
module.exports = async ({ strapi }) => {
  strapi.customFields.register({
    name: 'icon',
    plugin: PLUGIN_ID,
    type: 'text',
    inputSize: {
      // Full row (12/12 columns) so the picker button spans the form width.
      // Still resizable, so editors can shrink it in the Content-Type Builder.
      default: 12,
      isResizable: true,
    },
  });

  // Widen legacy columns created while the field was registered as `string`.
  //
  // The field now registers as `text`, so new tables get a Postgres `text`
  // column. But tables provisioned by an earlier version already have
  // `varchar(255)` columns (e.g. components_shared_icon_blocks.icon), and
  // Strapi does not reliably ALTER an existing column's type on boot. Without
  // this, saving the `object` output format still fails with
  // "value too long for type character varying(255)".
  await widenLegacyIconColumns(strapi);
};

/**
 * Convert legacy `varchar(255)` columns named `icon` to `text`.
 *
 * Postgres only; idempotent (skips columns already `text`); non-fatal so a
 * migration failure never blocks server boot. Runs on every environment the
 * build flows through (dev -> qa -> prod); each converges independently because
 * the query only matches columns still typed varchar(255).
 */
async function widenLegacyIconColumns(strapi) {
  // Resolve the configured client from Strapi's config (not knex internals).
  const client = strapi.config.get('database.connection.client');

  // Postgres-specific: the varchar(255) cap that triggers the production error
  // only exists on Postgres. SQLite (the local default here) ignores varchar
  // length, and MySQL is not the deploy target, so there is nothing to widen.
  if (client !== 'postgres') return;

  // The host app configures the schema via DATABASE_SCHEMA (default `public`).
  const schemaName =
    strapi.config.get('database.connection.connection.schema') || 'public';

  const knex = strapi.db.connection;

  try {
    // Only match columns that carry the signature of the old `string` mapping:
    // data_type varchar with a 255 length limit. This deliberately avoids
    // touching unrelated `icon` columns other plugins may define, and skips
    // columns already migrated to `text` (which report a NULL length limit).
    const { rows } = await knex.raw(
      `SELECT table_name
         FROM information_schema.columns
        WHERE table_schema = ?
          AND column_name = 'icon'
          AND data_type = 'character varying'
          AND character_maximum_length = 255`,
      [schemaName]
    );

    if (!rows || rows.length === 0) return;

    for (const { table_name: tableName } of rows) {
      // Identifiers come from information_schema (not user input), but bind
      // them via knex `??` placeholders anyway for safe quoting.
      await knex.raw(`ALTER TABLE ??.?? ALTER COLUMN "icon" TYPE text`, [
        schemaName,
        tableName,
      ]);
      strapi.log.info(
        `[${PLUGIN_ID}] widened ${schemaName}.${tableName}.icon from varchar(255) to text`
      );
    }
  } catch (err) {
    // Don't block boot on a migration problem — surface it and continue.
    strapi.log.error(
      `[${PLUGIN_ID}] failed to widen legacy icon columns: ${err.message}`
    );
  }
}
