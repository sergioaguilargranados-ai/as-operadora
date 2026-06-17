const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function fixDates() {
  const client = await pool.connect();
  try {
    console.log('Fixing dates for migrated leads...');
    
    // 1. Fetch all expo_leads
    const leadsRes = await client.query('SELECT email, created_at FROM expo_leads WHERE email IS NOT NULL');
    const leads = leadsRes.rows;
    
    let updatedCount = 0;
    
    for (const lead of leads) {
      // 2. Find contact
      const contactRes = await client.query(`
        SELECT id FROM crm_contacts 
        WHERE email = $1 AND source_detail = 'Registro Landing PWA'
      `, [lead.email]);
      
      if (contactRes.rows.length > 0) {
        const contactId = contactRes.rows[0].id;
        
        // Update dates
        await client.query(`
          UPDATE crm_contacts 
          SET created_at = $2, first_contact_at = $2, last_contact_at = $2
          WHERE id = $1
        `, [contactId, lead.created_at]);
        
        // Ensure there is an interaction
        const intRes = await client.query(`
          SELECT id FROM crm_interactions WHERE contact_id = $1 AND interaction_type = 'system_auto'
        `, [contactId]);
        
        if (intRes.rows.length === 0) {
          await client.query(`
            INSERT INTO crm_interactions (
              contact_id, interaction_type, channel, direction, subject, body, is_automated, created_at, performed_by
            ) VALUES (
              $1, 'system_auto', 'system', 'internal', 'Contacto creado',
              'Contacto registrado vía Landing PWA.', true, $2, 1
            )
          `, [contactId, lead.created_at]);
        }
        
        updatedCount++;
      }
    }
    
    console.log(`Fix complete. Updated ${updatedCount} CRM contacts with dates and interactions.`);
  } catch (error) {
    console.error('Fix error:', error);
  } finally {
    client.release();
    pool.end();
  }
}

fixDates();
