const {Pool} = require('pg');

const pool = new Pool({
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT || 5432,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB_US || process.env.POSTGRES_DB,
});

async function main() {
    // 1. Показать все колонки таблицы entries
    const cols = await pool.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'entries'
        ORDER BY ordinal_position
    `);
    console.log('=== entries columns ===');
    console.table(cols.rows);

    // 2. Показать 5 дашбордов со всеми колонками
    const dashes = await pool.query(`
        SELECT * FROM entries WHERE scope = 'dash' AND is_deleted = false LIMIT 5
    `);
    console.log('=== sample dashboards ===');
    console.table(dashes.rows);

    // 3. Если есть таблица dash_entries — показать её схему
    try {
        const dashCols = await pool.query(`
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = 'dash_entries'
            ORDER BY ordinal_position
        `);
        console.log('=== dash_entries columns ===');
        console.table(dashCols.rows);
    } catch (e) {
        console.log('No dash_entries table:', e.message);
    }

    await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
