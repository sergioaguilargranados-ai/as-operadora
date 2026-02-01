-- Migration: Create megatravel_itinerary table
-- Description: Almacena el itinerario día por día de cada paquete de MegaTravel
-- Date: 31 Ene 2026

CREATE TABLE IF NOT EXISTS megatravel_itinerary (
    id SERIAL PRIMARY KEY,
    package_id INTEGER NOT NULL REFERENCES megatravel_packages(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL,
    title VARCHAR(500),
    description TEXT,
    meals VARCHAR(50), -- 'D,A,C' (Desayuno, Almuerzo, Cena)
    hotel VARCHAR(500),
    city VARCHAR(200),
    activities TEXT[], -- Array de actividades del día
    highlights TEXT[], -- Puntos destacados del día
    optional_activities TEXT[], -- Actividades opcionales
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(package_id, day_number)
);

-- Índices para mejorar performance
CREATE INDEX idx_itinerary_package ON megatravel_itinerary(package_id);
CREATE INDEX idx_itinerary_day ON megatravel_itinerary(day_number);

-- Comentarios
COMMENT ON TABLE megatravel_itinerary IS 'Itinerario día por día de paquetes MegaTravel';
COMMENT ON COLUMN megatravel_itinerary.meals IS 'Comidas incluidas: D=Desayuno, A=Almuerzo, C=Cena';
COMMENT ON COLUMN megatravel_itinerary.activities IS 'Lista de actividades del día';
