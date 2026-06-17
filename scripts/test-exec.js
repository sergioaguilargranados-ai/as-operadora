const { Pool } = require('pg');
require('dotenv').config({ path: 'g:/Otros ordenadores/Mi PC/operadora-dev/.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function test() {
  const periodFilter = "created_at >= DATE_TRUNC('month', CURRENT_DATE)";
  
  try {
    const res = await pool.query(`
        SELECT
          COUNT(*) AS total_contacts,
          COUNT(*) FILTER (WHERE ${periodFilter}) AS new_in_period,
          COUNT(*) FILTER (WHERE is_hot_lead = true) AS hot_leads,
          COUNT(*) FILTER (WHERE pipeline_stage IN ('won', 'reserved', 'paid')) AS converted,
          COUNT(*) FILTER (WHERE pipeline_stage = 'lost') AS lost,
          COALESCE(SUM(COALESCE(budget_max, budget_min, 0)) FILTER (WHERE pipeline_stage NOT IN ('lost')), 0) AS pipeline_value,
          COALESCE(SUM(COALESCE(budget_max, budget_min, 0)) FILTER (WHERE pipeline_stage IN ('won', 'reserved', 'paid')), 0) AS revenue_closed,
          ROUND(AVG(lead_score)::numeric, 1) AS avg_score,
          COUNT(*) FILTER (WHERE assigned_agent_id IS NULL AND pipeline_stage NOT IN ('won', 'lost')) AS unassigned
        FROM crm_contacts
        WHERE status = 'active'
    `);
    console.log(res.rows[0]);
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
test();
