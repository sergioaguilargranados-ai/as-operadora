-- ═══════════════════════════════════════════════════════════════
-- Migración 043: Agregar campo slogan a tabla tenants
-- Proyecto: AS Operadora v2.344 — Retoma Mayo 2026
-- ═══════════════════════════════════════════════════════════════

-- Agregar slogan al tenant para personalización de marca
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS slogan VARCHAR(255);

-- Actualizar tenant existente de AS Operadora
UPDATE tenants SET slogan = 'AS Viajando' WHERE id = 1;

-- Actualizar tenant de M&M Travel Agency
UPDATE tenants SET slogan = 'Haz el viaje de tus sueños' WHERE id = 2;

-- Confirmar
SELECT id, company_name, slogan FROM tenants ORDER BY id;
