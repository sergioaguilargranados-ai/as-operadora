
const { pool } = require('./src/lib/db');
async function check() {
    const res = await pool.query('SELECT email, role FROM users WHERE role IS NOT NULL');
    console.log(res.rows);
    process.exit(0);
}
check();
