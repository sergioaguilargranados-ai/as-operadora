import { config } from 'dotenv';
config({ path: '.env.local' });
import { query } from '../src/lib/db';

async function seedHR() {
  console.log('🌱 Starting HR data seeding...');

  try {
    // 1. Obtener o crear un Tenant (Agencia o principal)
    const resTenant = await query(`SELECT id FROM tenants WHERE company_name ILIKE $1 LIMIT 1`, ['%AS Operadora%']);
    let tenantId = resTenant.rows[0]?.id;

    if (!tenantId) {
      console.log('Tenant "AS Operadora" not found, falling back to first tenant or creating one...');
      const firstTenant = await query(`SELECT id FROM tenants LIMIT 1`);
      if (firstTenant.rows.length > 0) {
        tenantId = firstTenant.rows[0].id;
      } else {
        const newTenant = await query(`INSERT INTO tenants (company_name, tenant_type, custom_domain) VALUES ('AS Operadora', 'operator', 'asoperadora.com') RETURNING id`);
        tenantId = newTenant.rows[0].id;
      }
    }
    console.log(`Using Tenant ID: ${tenantId}`);

    // Limpiar datos existentes de HR para el tenant
    console.log('🧹 Limpiando datos antiguos de HR...');
    await query(`DELETE FROM hr_departments WHERE tenant_id = $1`, [tenantId]);
    await query(`DELETE FROM hr_employees WHERE tenant_id = $1`, [tenantId]);
    
    // 2. Crear Departamentos
    console.log('🏢 Creando departamentos...');
    const depts = [
      { name: 'Ventas', description: 'Equipo Comercial y Agentes' },
      { name: 'Operaciones', description: 'Reservas y Logística' },
      { name: 'Administración', description: 'Finanzas y RRHH' }
    ];

    const deptIds: Record<string, number> = {};
    for (const d of depts) {
      const res = await query(
        `INSERT INTO hr_departments (tenant_id, name, description) VALUES ($1, $2, $3) RETURNING id`,
        [tenantId, d.name, d.description]
      );
      deptIds[d.name] = res.rows[0].id;
    }

    // 3. Crear Posiciones
    console.log('👔 Creando posiciones...');
    const pos = [
      { dept: 'Ventas', title: 'Agente de Ventas Senior', level: 'senior', min: 15000, max: 25000 },
      { dept: 'Ventas', title: 'Agente de Ventas Junior', level: 'junior', min: 8000, max: 12000 },
      { dept: 'Operaciones', title: 'Coordinador de Reservas', level: 'mid', min: 12000, max: 18000 },
      { dept: 'Administración', title: 'Gerente de Finanzas', level: 'director', min: 30000, max: 50000 },
      { dept: 'Administración', title: 'Asistente Administrativo', level: 'junior', min: 8000, max: 12000 }
    ];

    const posIds: Record<string, number> = {};
    for (const p of pos) {
      const res = await query(
        `INSERT INTO hr_positions (tenant_id, department_id, title, level, salary_min, salary_max) 
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [tenantId, deptIds[p.dept], p.title, p.level, p.min, p.max]
      );
      posIds[p.title] = res.rows[0].id;
    }

    // 4. Crear Empleados (10 empleados)
    console.log('👥 Creando empleados y contratos...');
    const employees = [
      { fname: 'Carlos', lname: 'Ramírez', pos: 'Gerente de Finanzas', type: 'internal', salary: 35000, contract: 'indefinite', rfc: 'RACC850512XYZ', curp: 'RACC850512HDFMXX01', nss: '12345678901' },
      { fname: 'María', lname: 'González', pos: 'Asistente Administrativo', type: 'internal', salary: 10000, contract: 'fixed_term', rfc: 'GOMM900101XYZ', curp: 'GOMM900101MDFMXX01', nss: '12345678902' },
      { fname: 'Juan', lname: 'Pérez', pos: 'Coordinador de Reservas', type: 'internal', salary: 15000, contract: 'indefinite', rfc: 'PEQJ880202XYZ', curp: 'PEQJ880202HDFMXX01', nss: '12345678903' },
      { fname: 'Ana', lname: 'Martínez', pos: 'Agente de Ventas Senior', type: 'agent', salary: 8000, comm: 15, contract: 'commission', rfc: 'MAAA800303XYZ', curp: 'MAAA800303MDFMXX01', nss: '12345678904' },
      { fname: 'Luis', lname: 'Hernández', pos: 'Agente de Ventas Junior', type: 'agent', salary: 4000, comm: 10, contract: 'commission', rfc: 'HELL950404XYZ', curp: 'HELL950404HDFMXX01', nss: '12345678905' },
      { fname: 'Sofía', lname: 'López', pos: 'Agente de Ventas Junior', type: 'agent', salary: 4000, comm: 10, contract: 'commission', rfc: 'LOMS980505XYZ', curp: 'LOMS980505MDFMXX01', nss: '12345678906' },
      { fname: 'Miguel', lname: 'García', pos: 'Coordinador de Reservas', type: 'internal', salary: 13000, contract: 'fixed_term', rfc: 'GACM920606XYZ', curp: 'GACM920606HDFMXX01', nss: '12345678907' },
      { fname: 'Laura', lname: 'Díaz', pos: 'Asistente Administrativo', type: 'internal', salary: 9000, contract: 'fixed_term', rfc: 'DILM930707XYZ', curp: 'DILM930707MDFMXX01', nss: '12345678908' },
      { fname: 'Pedro', lname: 'Sánchez', pos: 'Agente de Ventas Senior', type: 'agent', salary: 8000, comm: 15, contract: 'commission', rfc: 'SAPP810808XYZ', curp: 'SAPP810808HDFMXX01', nss: '12345678909' },
      { fname: 'Elena', lname: 'Ruiz', pos: 'Coordinador de Reservas', type: 'internal', salary: 14000, contract: 'indefinite', rfc: 'RURE860909XYZ', curp: 'RURE860909MDFMXX01', nss: '12345678910' }
    ];

    const empIds = [];
    for (const [idx, e] of employees.entries()) {
      // Determinar departamento basado en posición
      let deptId = null;
      if (e.pos.includes('Ventas')) deptId = deptIds['Ventas'];
      if (e.pos.includes('Reservas')) deptId = deptIds['Operaciones'];
      if (e.pos.includes('Administrativo') || e.pos.includes('Finanzas')) deptId = deptIds['Administración'];

      const resEmp = await query(
        `INSERT INTO hr_employees (tenant_id, first_name, last_name, email, employee_type, department_id, position_id, base_salary, hire_date, rfc, curp, nss, agent_commission_rate, employee_number)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW() - INTERVAL '1 year', $9, $10, $11, $12, $13) RETURNING id`,
        [tenantId, e.fname, e.lname, `${e.fname.toLowerCase()}.${e.lname.toLowerCase()}@asoperadora.com`, e.type, deptId, posIds[e.pos], e.salary, e.rfc, e.curp, e.nss, e.comm || null, `EMP-${2000 + idx}`]
      );
      const empId = resEmp.rows[0].id;
      empIds.push(empId);

      // Crear contrato
      await query(
        `INSERT INTO hr_contracts (tenant_id, employee_id, contract_type, start_date, salary, commission_percentage)
         VALUES ($1, $2, $3, NOW() - INTERVAL '1 year', $4, $5)`,
        [tenantId, empId, e.contract, e.salary, e.comm || null]
      );
      
      // Crear asistencia de la última semana (lunes a viernes)
      for (let i = 1; i <= 5; i++) {
        await query(
          `INSERT INTO hr_attendance (tenant_id, employee_id, attendance_date, check_in, check_out, worked_hours, status)
           VALUES ($1, $2, CURRENT_DATE - $3::integer, 
                   (CURRENT_DATE - $3::integer) + TIME '09:00:00',
                   (CURRENT_DATE - $3::integer) + TIME '18:00:00',
                   8, 'present')`,
          [tenantId, empId, i]
        );
      }
    }

    // 5. Crear Solicitudes de Ausencia
    console.log('🏖️ Creando solicitudes de ausencia...');
    // Una aprobada (para empleado 0)
    await query(
      `INSERT INTO hr_leave_requests (tenant_id, employee_id, leave_type, start_date, end_date, total_days, reason, status)
       VALUES ($1, $2, 'vacation', CURRENT_DATE + 10, CURRENT_DATE + 15, 5, 'Vacaciones anuales', 'approved')`,
      [tenantId, empIds[0]]
    );
    
    // Una pendiente (para empleado 1)
    await query(
      `INSERT INTO hr_leave_requests (tenant_id, employee_id, leave_type, start_date, end_date, total_days, reason, status)
       VALUES ($1, $2, 'sick', CURRENT_DATE, CURRENT_DATE + 2, 2, 'Cita médica', 'pending')`,
      [tenantId, empIds[1]]
    );

    // 6. Proceso de reclutamiento (pipeline)
    console.log('🎯 Creando pipeline de reclutamiento...');
    await query(
      `INSERT INTO hr_recruitment (tenant_id, candidate_name, candidate_email, position_id, stage, applied_at, source)
       VALUES ($1, 'Roberto Ruiz', 'roberto.ruiz@example.com', $2, 'interview', NOW() - INTERVAL '3 days', 'social_media')`,
      [tenantId, posIds['Agente de Ventas Junior']]
    );

    console.log('✅ HR Data Seeded Successfully!');
  } catch (error) {
    console.error('❌ Error seeding HR data:', error);
  } finally {
    process.exit(0);
  }
}

seedHR();
