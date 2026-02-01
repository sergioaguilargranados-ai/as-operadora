-- Migration: Create megatravel_departures table
-- Description: Almacena las fechas de salida y disponibilidad de cada paquete
-- Date: 31 Ene 2026

CREATE TABLE IF NOT EXISTS megatravel_departures (
    id SERIAL PRIMARY KEY,
    package_id INTEGER NOT NULL REFERENCES megatravel_packages(id) ON DELETE CASCADE,
    departure_date DATE NOT NULL,
    return_date DATE,
    price_usd DECIMAL(10,2),
    price_variation DECIMAL(10,2) DEFAULT 0, -- Diferencia vs precio base
    availability VARCHAR(50) DEFAULT 'available', -- 'available', 'limited', 'sold_out'
    status VARCHAR(50) DEFAULT 'confirmed', -- 'confirmed', 'pending', 'cancelled'
    min_passengers INTEGER DEFAULT 1,
    max_passengers INTEGER,
    current_passengers INTEGER DEFAULT 0,
    notes TEXT,
    booking_deadline DATE, -- Fecha límite para reservar
    payment_deadline DATE, -- Fecha límite para pagar
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(package_id, departure_date)
);

-- Índices para mejorar performance
CREATE INDEX idx_departures_package ON megatravel_departures(package_id);
CREATE INDEX idx_departures_date ON megatravel_departures(departure_date);
CREATE INDEX idx_departures_availability ON megatravel_departures(availability);
CREATE INDEX idx_departures_status ON megatravel_departures(status);

-- Comentarios
COMMENT ON TABLE megatravel_departures IS 'Fechas de salida y disponibilidad de paquetes MegaTravel';
COMMENT ON COLUMN megatravel_departures.availability IS 'available=Disponible, limited=Cupos limitados, sold_out=Agotado';
COMMENT ON COLUMN megatravel_departures.status IS 'confirmed=Confirmada, pending=Por confirmar, cancelled=Cancelada';
