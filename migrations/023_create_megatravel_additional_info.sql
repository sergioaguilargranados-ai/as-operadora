-- Migration: Create megatravel_additional_info table
-- Description: Almacena información adicional útil para viajeros
-- Date: 31 Ene 2026

CREATE TABLE IF NOT EXISTS megatravel_additional_info (
    id SERIAL PRIMARY KEY,
    package_id INTEGER NOT NULL REFERENCES megatravel_packages(id) ON DELETE CASCADE,
    
    -- Notas y recomendaciones
    important_notes TEXT[],
    recommendations TEXT[],
    what_to_bring TEXT[],
    travel_tips TEXT[],
    
    -- Información del destino
    climate_info TEXT,
    best_time_to_visit TEXT,
    local_currency VARCHAR(50),
    exchange_rate_info TEXT,
    language VARCHAR(100),
    timezone VARCHAR(100),
    voltage VARCHAR(50),
    
    -- Información práctica
    emergency_contacts JSONB, -- {police: '123', ambulance: '456', embassy: '789'}
    local_customs TEXT,
    dress_code TEXT,
    tipping_guide TEXT,
    
    -- Información de seguridad
    safety_info TEXT,
    health_precautions TEXT,
    travel_warnings TEXT[],
    
    -- Extras
    packing_list TEXT[],
    suggested_budget TEXT,
    internet_connectivity TEXT,
    transportation_info TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(package_id)
);

-- Índices
CREATE INDEX idx_additional_info_package ON megatravel_additional_info(package_id);

-- Comentarios
COMMENT ON TABLE megatravel_additional_info IS 'Información adicional y recomendaciones para viajeros';
COMMENT ON COLUMN megatravel_additional_info.emergency_contacts IS 'Contactos de emergencia en formato JSON';
COMMENT ON COLUMN megatravel_additional_info.what_to_bring IS 'Lista de artículos recomendados para llevar';
