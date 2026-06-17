const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Migrating expo_leads to crm_contacts...');
    
    // 1. Fetch all expo_leads
    const leadsRes = await client.query('SELECT * FROM expo_leads');
    const leads = leadsRes.rows;
    
    console.log(`Found ${leads.length} leads in expo_leads.`);
    
    let createdCount = 0;
    
    for (const lead of leads) {
      // 2. Check if a contact with this email exists in crm_contacts
      const existingRes = await client.query(`
        SELECT id FROM crm_contacts 
        WHERE email = $1 AND source_detail = 'Registro Landing PWA'
      `, [lead.email]);
      
      if (existingRes.rows.length === 0) {
        // Doesn't exist, let's insert
        // The lead structure: contact_name, contact_phone, agency_name, email, job_title
        const contactTypeMap = {
          'Viajero': 'lead',
          'Agencia de Viajes': 'agency',
          'Agencia de Eventos': 'agency',
          'Empresa': 'corporate',
          'Proveedor': 'lead'
        };
        const contactType = contactTypeMap[lead.job_title] || 'lead';
        
        await client.query(`
          INSERT INTO crm_contacts (
            full_name, email, phone, company, position, source, source_detail,
            contact_type, pipeline_stage, is_hot_lead, lead_score
          ) VALUES (
            $1, $2, $3, $4, $5, 'campaign', 'Registro Landing PWA',
            $6, 'new', false, 30
          )
        `, [
          lead.contact_name,
          lead.email,
          lead.contact_phone,
          lead.agency_name,
          lead.job_title,
          contactType
        ]);
        
        createdCount++;
        console.log(`Migrated: ${lead.email}`);
      }
    }
    
    console.log(`Migration complete. Created ${createdCount} new CRM contacts.`);
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    client.release();
    pool.end();
  }
}

migrate();
