-- Migración 018: Agregar columna included_items a tour_quotes
-- Fecha: 25 Feb 2026
-- Propósito: Permitir al personal operativo registrar los servicios incluidos en la cotización

ALTER TABLE tour_quotes ADD COLUMN IF NOT EXISTS included_items TEXT;

-- Secuencia para folios (si no existe)
CREATE SEQUENCE IF NOT EXISTS tour_quote_folio_seq START 1 INCREMENT 1;

COMMENT ON COLUMN tour_quotes.included_items IS 'Servicios incluidos en la cotización, separados por salto de línea';
