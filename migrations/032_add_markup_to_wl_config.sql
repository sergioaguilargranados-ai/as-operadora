-- Migración: Agregar markup_percentage a white_label_config
-- v2.313 - 11 Feb 2026 - OBS-006: Markup de precios por agencia

-- Agregar campo de markup porcentual
ALTER TABLE white_label_config
ADD COLUMN IF NOT EXISTS markup_percentage DECIMAL(5,2) DEFAULT 0.00;

-- Agregar campo de markup fijo (monto fijo por transacción, alternativa)
ALTER TABLE white_label_config
ADD COLUMN IF NOT EXISTS markup_fixed DECIMAL(10,2) DEFAULT 0.00;

-- Agregar campo de markup tipo (percentage, fixed, or both)
ALTER TABLE white_label_config
ADD COLUMN IF NOT EXISTS markup_type VARCHAR(20) DEFAULT 'percentage';

-- Comentarios
COMMENT ON COLUMN white_label_config.markup_percentage IS 'Porcentaje de sobreprecio aplicado a todas las transacciones (ej: 5.00 = 5%)';
COMMENT ON COLUMN white_label_config.markup_fixed IS 'Monto fijo de sobreprecio por transacción en USD';
COMMENT ON COLUMN white_label_config.markup_type IS 'Tipo de markup: percentage, fixed, or both';
