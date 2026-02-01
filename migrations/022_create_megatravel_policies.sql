-- Migration: Create megatravel_policies table
-- Description: Almacena políticas, términos y requisitos de cada paquete
-- Date: 31 Ene 2026

CREATE TABLE IF NOT EXISTS megatravel_policies (
    id SERIAL PRIMARY KEY,
    package_id INTEGER NOT NULL REFERENCES megatravel_packages(id) ON DELETE CASCADE,
    
    -- Políticas principales
    cancellation_policy TEXT,
    change_policy TEXT,
    payment_policy TEXT,
    refund_policy TEXT,
    
    -- Términos y condiciones
    terms_conditions TEXT,
    general_conditions TEXT,
    
    -- Requisitos de documentos
    document_requirements TEXT[],
    passport_requirements TEXT,
    visa_requirements TEXT[],
    vaccine_requirements TEXT[],
    
    -- Requisitos adicionales
    insurance_requirements TEXT,
    age_restrictions TEXT,
    health_requirements TEXT,
    special_requirements TEXT,
    
    -- Información de responsabilidad
    liability_info TEXT,
    force_majeure TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(package_id)
);

-- Índices
CREATE INDEX idx_policies_package ON megatravel_policies(package_id);

-- Comentarios
COMMENT ON TABLE megatravel_policies IS 'Políticas, términos y requisitos de paquetes MegaTravel';
COMMENT ON COLUMN megatravel_policies.document_requirements IS 'Lista de documentos necesarios';
COMMENT ON COLUMN megatravel_policies.visa_requirements IS 'Requisitos de visa por país';
