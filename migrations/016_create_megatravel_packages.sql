-- Migración 016: Tabla para almacenar paquetes de MegaTravel localmente
-- Build: 27 Ene 2026 - v2.234 - Sistema Híbrido MegaTravel
-- Ejecutar manualmente: psql -d database_name -f migrations/016_create_megatravel_packages.sql

-- =====================================================
-- TABLA PRINCIPAL: megatravel_packages
-- =====================================================
CREATE TABLE IF NOT EXISTS megatravel_packages (
    id SERIAL PRIMARY KEY,
    
    -- Identificadores de MegaTravel
    mt_code VARCHAR(20) NOT NULL UNIQUE,          -- Ej: MT-12117
    mt_url VARCHAR(500) NOT NULL,                  -- URL original del paquete
    slug VARCHAR(200),                             -- Para URLs amigables nuestras
    
    -- Información básica
    name VARCHAR(300) NOT NULL,                    -- Nombre del paquete
    description TEXT,                              -- Descripción general
    destination_region VARCHAR(100),               -- Europa, Asia, Medio Oriente, etc.
    
    -- Destinos/Ciudades (array de ciudades visitadas)
    cities TEXT[],                                 -- Array: ["Madrid", "París", "Roma"]
    countries TEXT[],                              -- Array: ["España", "Francia", "Italia"]
    main_country VARCHAR(100),                     -- País principal del tour
    
    -- Duración
    days INTEGER NOT NULL,                         -- Número de días
    nights INTEGER NOT NULL,                       -- Número de noches
    
    -- Precios ORIGINALES de MegaTravel (NETO)
    price_usd DECIMAL(10,2),                       -- Precio base en USD
    price_mxn DECIMAL(10,2),                       -- Precio base en MXN (si aplica)
    taxes_usd DECIMAL(10,2),                       -- Impuestos en USD
    taxes_mxn DECIMAL(10,2),                       -- Impuestos en MXN (si aplica)
    currency VARCHAR(3) DEFAULT 'USD',             -- Moneda principal
    price_per_person_type VARCHAR(50),             -- "Por persona en habitación Doble"
    
    -- Precios por tipo de habitación (JSONB para flexibilidad)
    price_variants JSONB,                          -- {"doble": 1699, "triple": 1599, "cuadruple": 1499, "sencilla": 1999}
    
    -- Información de vuelo
    includes_flight BOOLEAN DEFAULT true,
    flight_airline VARCHAR(100),                   -- Aerolínea si se especifica
    flight_origin VARCHAR(100) DEFAULT 'CDMX',     -- Origen del vuelo
    
    -- Qué incluye / no incluye
    includes TEXT[],                               -- Array de lo que incluye
    not_includes TEXT[],                           -- Array de lo que no incluye
    
    -- Hoteles
    hotels JSONB,                                  -- [{"city": "Madrid", "name": "Hotel...", "stars": 4}]
    hotel_category VARCHAR(50),                    -- Estándar, Plus, Superior, Lujo
    meal_plan VARCHAR(100),                        -- Desayuno incluido, Todo incluido, etc.
    
    -- Itinerario día por día
    itinerary JSONB,                               -- [{"day": 1, "title": "...", "description": "...", "meals": ["D"]}]
    itinerary_summary TEXT,                        -- Resumen corto del itinerario
    
    -- Tours opcionales
    optional_tours JSONB,                          -- [{"name": "...", "description": "...", "price_usd": 50}]
    
    -- Fechas de salida disponibles
    departures JSONB,                              -- [{"date": "2026-04-15", "price_usd": 1699, "status": "available"}]
    season_prices JSONB,                           -- {"verano": {...}, "invierno": {...}}
    
    -- Imágenes
    main_image VARCHAR(500),                       -- Imagen principal
    gallery_images TEXT[],                         -- Galería de imágenes
    map_image VARCHAR(500),                        -- Imagen del mapa del tour
    
    -- Categorías y tags
    category VARCHAR(100),                         -- Europa, Asia, etc.
    subcategory VARCHAR(100),                      -- Turquía, Japón, etc.
    tags TEXT[],                                   -- ["luna de miel", "quinceañeras", "semana santa"]
    is_featured BOOLEAN DEFAULT false,
    is_offer BOOLEAN DEFAULT false,
    offer_end_date DATE,
    
    -- Notas importantes
    important_notes TEXT,
    visa_requirements TEXT,
    tips_amount VARCHAR(100),                      -- Ej: "75 EUR propinas"
    
    -- Metadatos de sincronización
    last_sync_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sync_status VARCHAR(20) DEFAULT 'synced',     -- synced, error, pending
    sync_error TEXT,
    raw_html TEXT,                                 -- HTML original para debugging
    
    -- Nuestros campos
    our_margin_percent DECIMAL(5,2) DEFAULT 15.00, -- Margen a aplicar (%)
    is_active BOOLEAN DEFAULT true,                -- Si lo mostramos en nuestra plataforma
    internal_notes TEXT,                           -- Notas internas nuestras
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ÍNDICES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_mt_packages_code ON megatravel_packages(mt_code);
CREATE INDEX IF NOT EXISTS idx_mt_packages_region ON megatravel_packages(destination_region);
CREATE INDEX IF NOT EXISTS idx_mt_packages_category ON megatravel_packages(category);
CREATE INDEX IF NOT EXISTS idx_mt_packages_active ON megatravel_packages(is_active);
CREATE INDEX IF NOT EXISTS idx_mt_packages_featured ON megatravel_packages(is_featured);
CREATE INDEX IF NOT EXISTS idx_mt_packages_price ON megatravel_packages(price_usd);

-- =====================================================
-- TABLA: megatravel_sync_log (Historial de sincronizaciones)
-- =====================================================
CREATE TABLE IF NOT EXISTS megatravel_sync_log (
    id SERIAL PRIMARY KEY,
    sync_type VARCHAR(50) NOT NULL,               -- full, incremental, single
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    packages_found INTEGER DEFAULT 0,
    packages_synced INTEGER DEFAULT 0,
    packages_failed INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'running',         -- running, completed, failed
    error_message TEXT,
    triggered_by VARCHAR(100),                    -- admin email o "system"
    details JSONB                                 -- Detalles adicionales
);

-- =====================================================
-- TABLA: megatravel_regions (Catálogo de regiones/destinos)
-- =====================================================
CREATE TABLE IF NOT EXISTS megatravel_regions (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    parent_code VARCHAR(50),                      -- Para subcategorías
    mt_url VARCHAR(300),                          -- URL en MegaTravel
    icon VARCHAR(50),                             -- Emoji o icono
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true
);

-- Insertar regiones conocidas
INSERT INTO megatravel_regions (code, name, mt_url, icon, display_order) VALUES
('europa', 'Europa', '/viajes-europa', '🇪🇺', 1),
('turquia', 'Turquía', '/viaje-a-turquia', '🇹🇷', 2),
('asia', 'Asia', '/viajes-asia', '🌏', 3),
('japon', 'Japón', '/viaje-a-japon', '🇯🇵', 4),
('corea', 'Corea', '/viaje-a-corea', '🇰🇷', 5),
('medio-oriente', 'Medio Oriente', '/viajes-medio-oriente', '🕌', 6),
('dubai', 'Dubái', '/viaje-a-dubai', '🇦🇪', 7),
('egipto', 'Egipto', '/viaje-a-egipto', '🇪🇬', 8),
('usa', 'Estados Unidos', '/viajes-estados-unidos', '🇺🇸', 9),
('canada', 'Canadá', '/viajes-canada', '🇨🇦', 10),
('sudamerica', 'Sudamérica', '/viajes-sudamerica', '🌎', 11),
('peru', 'Perú', '/viaje-a-peru', '🇵🇪', 12),
('argentina', 'Argentina', '/viaje-a-argentina', '🇦🇷', 13),
('colombia', 'Colombia', '/viaje-a-colombia', '🇨🇴', 14),
('centroamerica', 'Centroamérica', '/viajes-centroamerica', '🌴', 15),
('caribe', 'Caribe', '/viajes-al-caribe', '🏝️', 16),
('cruceros', 'Cruceros', '/cruceros', '🚢', 17),
('africa', 'África', '/viajes-africa', '🌍', 18),
('mexico', 'México', '/viajes-por-mexico', '🇲🇽', 19),
('balcanes', 'Los Balcanes', '/viajes-a-los-balcanes', '🏔️', 20)
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- CONFIGURACIÓN EN app_settings
-- =====================================================
INSERT INTO app_settings (key, value, description) VALUES
('MEGATRAVEL_MARGIN_PERCENT', '15', 'Porcentaje de margen a aplicar sobre precios MegaTravel'),
('MEGATRAVEL_LAST_SYNC', '', 'Fecha/hora de última sincronización'),
('MEGATRAVEL_SYNC_ENABLED', 'true', 'Si la sincronización está habilitada')
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- VISTA: Paquetes con precios calculados
-- =====================================================
CREATE OR REPLACE VIEW megatravel_packages_with_prices AS
SELECT 
    p.*,
    -- Precio de venta (con margen)
    ROUND(p.price_usd * (1 + p.our_margin_percent / 100), 2) as sale_price_usd,
    ROUND(p.price_mxn * (1 + p.our_margin_percent / 100), 2) as sale_price_mxn,
    -- Precio total (venta + impuestos)
    ROUND(p.price_usd * (1 + p.our_margin_percent / 100) + COALESCE(p.taxes_usd, 0), 2) as total_price_usd,
    -- Ahorro ficticio para marketing (10% sobre precio venta)
    ROUND(p.price_usd * (1 + p.our_margin_percent / 100) * 0.10, 2) as savings_usd
FROM megatravel_packages p
WHERE p.is_active = true;

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '✅ Migración 016 completada: Tablas MegaTravel creadas';
    RAISE NOTICE '   - megatravel_packages (principal)';
    RAISE NOTICE '   - megatravel_sync_log (historial)';
    RAISE NOTICE '   - megatravel_regions (catálogo)';
    RAISE NOTICE '   - Vista megatravel_packages_with_prices';
END $$;
