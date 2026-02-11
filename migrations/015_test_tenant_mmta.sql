-- Script de datos de prueba: M&M Travel Agency
-- Build: 11 Feb 2026 - v2.304 - Fase 1 Multi-Empresa
-- 
-- Ejecutar en Neon Console o via: node scripts/run-migration.js
--
-- Datos de la agencia:
--   Nombre: M&MTravelAgency
--   Email: ventas@mmta.com.mx
--   Teléfono: 7225187558
--   Colores: Primario Naranja (#FF6B00), Secundario Azul (#0066FF)
--   Subdominio: mmta (accede vía mmta.app.asoperadora.com o mmta.app-asoperadora.com)
--   Slogan: Haz el viaje de tus sueños!!

-- ═══════════════════════════════════════════
-- 1. Crear tenant M&MTravelAgency
-- ═══════════════════════════════════════════

INSERT INTO tenants (
  tenant_type,
  company_name,
  legal_name,
  tax_id,
  email,
  phone,
  logo_url,
  primary_color,
  secondary_color,
  accent_color,
  custom_domain,
  is_active,
  subscription_plan
) VALUES (
  'agency',
  'M&MTravelAgency',
  'M&M Travel Agency S.A. de C.V.',
  NULL,
  'ventas@mmta.com.mx',
  '7225187558',
  NULL,
  '#FF6B00',
  '#0066FF',
  '#FF6B00',
  'mmta.app-asoperadora.com',
  true,
  'professional'
)
ON CONFLICT DO NOTHING;

-- Si ya existía, actualizar
UPDATE tenants SET
  email = 'ventas@mmta.com.mx',
  phone = '7225187558',
  primary_color = '#FF6B00',
  secondary_color = '#0066FF',
  accent_color = '#FF6B00',
  custom_domain = 'mmta.app-asoperadora.com',
  is_active = true,
  updated_at = CURRENT_TIMESTAMP
WHERE company_name = 'M&MTravelAgency';

-- ═══════════════════════════════════════════
-- 2. Crear configuración white-label
-- ═══════════════════════════════════════════

DO $$
DECLARE
  v_tenant_id INTEGER;
BEGIN
  SELECT id INTO v_tenant_id FROM tenants WHERE company_name = 'M&MTravelAgency' AND is_active = true;

  IF v_tenant_id IS NOT NULL THEN
    INSERT INTO white_label_config (
      tenant_id,
      footer_text,
      support_email,
      support_phone,
      meta_title,
      meta_description
    ) VALUES (
      v_tenant_id,
      '© M&M Travel Agency. Haz el viaje de tus sueños!! Todos los derechos reservados.',
      'ventas@mmta.com.mx',
      '7225187558',
      'M&M Travel Agency | Haz el viaje de tus sueños',
      'Descubre los mejores destinos y paquetes de viaje con M&M Travel Agency. Viajes personalizados al mejor precio.'
    ) ON CONFLICT (tenant_id) DO UPDATE SET
      footer_text = EXCLUDED.footer_text,
      support_email = EXCLUDED.support_email,
      support_phone = EXCLUDED.support_phone,
      meta_title = EXCLUDED.meta_title,
      meta_description = EXCLUDED.meta_description,
      updated_at = CURRENT_TIMESTAMP;

    RAISE NOTICE 'White-label config creado/actualizado para tenant_id: %', v_tenant_id;
  ELSE
    RAISE NOTICE 'ERROR: No se encontró el tenant M&MTravelAgency';
  END IF;
END $$;

-- ═══════════════════════════════════════════
-- 3. Verificación
-- ═══════════════════════════════════════════

SELECT 
  t.id,
  t.company_name,
  t.tenant_type,
  t.email,
  t.phone,
  t.primary_color,
  t.secondary_color,
  t.accent_color,
  t.custom_domain,
  t.is_active,
  wl.meta_title,
  wl.support_email,
  wl.footer_text
FROM tenants t
LEFT JOIN white_label_config wl ON t.id = wl.tenant_id
WHERE t.company_name = 'M&MTravelAgency';
