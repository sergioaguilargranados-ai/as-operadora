-- Migración 046: Agregar columna logo_mobile_url a la tabla tenants
-- --------------------------------------------------------

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS logo_mobile_url VARCHAR(512);

-- Actualizar inquilinos existentes con algún valor por defecto si aplica
UPDATE tenants SET logo_mobile_url = '/logo.png' WHERE id = 1 AND logo_mobile_url IS NULL;
