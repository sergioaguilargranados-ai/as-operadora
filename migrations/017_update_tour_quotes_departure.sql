-- Migración 017: Campos adicionales para cotizaciones de tours
-- Fecha: 25 Febrero 2026
-- Propósito: Agregar fecha de salida, impuestos, suplemento y ciudad de origen
--            Implementar nuevo formato de folio AS-99999-AAMMDD-99999

-- Agregar columnas nuevas a tour_quotes
ALTER TABLE tour_quotes ADD COLUMN IF NOT EXISTS departure_date DATE;
ALTER TABLE tour_quotes ADD COLUMN IF NOT EXISTS taxes DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE tour_quotes ADD COLUMN IF NOT EXISTS supplement DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE tour_quotes ADD COLUMN IF NOT EXISTS origin_city VARCHAR(100);
ALTER TABLE tour_quotes ADD COLUMN IF NOT EXISTS total_per_person DECIMAL(10, 2) DEFAULT 0;

-- Secuencia para folios
CREATE SEQUENCE IF NOT EXISTS tour_quote_folio_seq START 1;

-- Índice para fecha de salida
CREATE INDEX IF NOT EXISTS idx_tour_quotes_departure ON tour_quotes(departure_date);

-- Comentarios
COMMENT ON COLUMN tour_quotes.departure_date IS 'Fecha de salida seleccionada por el cliente';
COMMENT ON COLUMN tour_quotes.taxes IS 'Impuestos aéreos en USD';
COMMENT ON COLUMN tour_quotes.supplement IS 'Suplemento de temporada en USD';
COMMENT ON COLUMN tour_quotes.origin_city IS 'Ciudad de salida del vuelo';
COMMENT ON COLUMN tour_quotes.total_per_person IS 'Precio total por persona (base + impuestos + suplemento)';
