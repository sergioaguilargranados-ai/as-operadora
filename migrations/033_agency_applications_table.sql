-- Migración: Tabla de solicitudes de agencias (Onboarding)
-- v2.313 - 11 Feb 2026 - OBS-010: Onboarding para nuevas agencias

CREATE TABLE IF NOT EXISTS agency_applications (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255),
    tax_id VARCHAR(50),
    contact_name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) NOT NULL UNIQUE,
    contact_phone VARCHAR(50) NOT NULL,
    website VARCHAR(500),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'México',
    description TEXT,
    expected_monthly_bookings VARCHAR(50),
    ip_address VARCHAR(50),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected')),
    reviewed_by INTEGER REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_notes TEXT,
    tenant_id INTEGER REFERENCES tenants(id),  -- Se llena al aprobar y crear el tenant
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_agency_applications_status ON agency_applications(status);
CREATE INDEX IF NOT EXISTS idx_agency_applications_email ON agency_applications(contact_email);
CREATE INDEX IF NOT EXISTS idx_agency_applications_created ON agency_applications(created_at DESC);

-- Comentarios
COMMENT ON TABLE agency_applications IS 'Solicitudes de registro de nuevas agencias para el programa White-Label';
COMMENT ON COLUMN agency_applications.status IS 'Estado: pending, reviewing, approved, rejected';
COMMENT ON COLUMN agency_applications.tenant_id IS 'Referencia al tenant creado cuando se aprueba la solicitud';
