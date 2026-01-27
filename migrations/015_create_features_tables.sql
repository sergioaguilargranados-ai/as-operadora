-- Migration 015: Create Features Tables for Granular Administration
-- Date: 27 de Enero de 2026
-- Purpose: Sistema de administración granular de funciones

-- =====================================================
-- TABLA: features
-- Catálogo de todas las funciones controlables
-- =====================================================
CREATE TABLE IF NOT EXISTS features (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  is_global_enabled BOOLEAN DEFAULT false,
  web_enabled BOOLEAN DEFAULT true,
  mobile_enabled BOOLEAN DEFAULT true,
  icon VARCHAR(50),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_features_code ON features(code);
CREATE INDEX IF NOT EXISTS idx_features_category ON features(category);
CREATE INDEX IF NOT EXISTS idx_features_enabled ON features(is_global_enabled);

-- =====================================================
-- TABLA: feature_role_access
-- Permisos por rol
-- =====================================================
CREATE TABLE IF NOT EXISTS feature_role_access (
  id SERIAL PRIMARY KEY,
  feature_id INTEGER REFERENCES features(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL,
  web_enabled BOOLEAN DEFAULT true,
  mobile_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(feature_id, role)
);

CREATE INDEX IF NOT EXISTS idx_feature_role_access_role ON feature_role_access(role);

-- =====================================================
-- TABLA: app_settings
-- Configuración global de la aplicación
-- =====================================================
CREATE TABLE IF NOT EXISTS app_settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- TRIGGER: updated_at automático
-- =====================================================
CREATE OR REPLACE FUNCTION update_features_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS features_updated_at ON features;
CREATE TRIGGER features_updated_at
  BEFORE UPDATE ON features
  FOR EACH ROW
  EXECUTE FUNCTION update_features_updated_at();

DROP TRIGGER IF EXISTS app_settings_updated_at ON app_settings;
CREATE TRIGGER app_settings_updated_at
  BEFORE UPDATE ON app_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_features_updated_at();

-- =====================================================
-- DATOS INICIALES: Categoría BUSQUEDA
-- =====================================================
INSERT INTO features (code, name, description, category, is_global_enabled, icon, sort_order) VALUES
  ('SEARCH_HOTELS', 'Hoteles', 'Búsqueda de hoteles', 'busqueda', false, 'Hotel', 1),
  ('SEARCH_ASHOME', 'AS Home', 'Búsqueda de alojamientos tipo Airbnb', 'busqueda', false, 'Home', 2),
  ('SEARCH_FLIGHTS', 'Vuelos', 'Búsqueda de vuelos', 'busqueda', false, 'Plane', 3),
  ('SEARCH_TRANSFERS', 'Traslados', 'Búsqueda de transfers', 'busqueda', false, 'Bus', 4),
  ('SEARCH_CARS', 'Autos', 'Renta de autos', 'busqueda', false, 'Car', 5),
  ('SEARCH_ACTIVITIES', 'Actividades', 'Búsqueda de actividades', 'busqueda', false, 'Activity', 6),
  ('SEARCH_INSURANCE', 'Seguros', 'Seguros de viaje', 'busqueda', false, 'Shield', 7),
  ('SEARCH_ESIM', 'E-Sim', 'Tarjetas eSIM', 'busqueda', false, 'Smartphone', 8),
  ('SEARCH_PACKAGES', 'Paquetes', 'Paquetes vacacionales', 'busqueda', false, 'Package', 9),
  ('SEARCH_CRUISES', 'Cruceros', 'Búsqueda de cruceros', 'busqueda', false, 'Compass', 10),
  ('SEARCH_GROUPS', 'Viajes Grupales', 'MegaTravel - Viajes programados', 'busqueda', true, 'Users', 11),
  ('SEARCH_DISNEY', 'Disney', 'Paquetes Disney', 'busqueda', false, 'Sparkles', 12),
  ('SEARCH_UNIVERSAL', 'Universal', 'Paquetes Universal', 'busqueda', false, 'Star', 13),
  ('SEARCH_XCARET', 'Xcaret', 'Parques Xcaret', 'busqueda', false, 'Activity', 14),
  ('SEARCH_CONEKTA', 'Conekta', 'Servicios Conekta', 'busqueda', false, 'Users', 15),
  ('SEARCH_RESTAURANTS', 'Restaurantes', 'Reserva de restaurantes', 'busqueda', false, 'Utensils', 16)
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- DATOS INICIALES: Categoría USUARIO
-- =====================================================
INSERT INTO features (code, name, description, category, is_global_enabled, icon, sort_order) VALUES
  ('USER_PROFILE', 'Mi Perfil', 'Perfil del usuario', 'usuario', true, 'User', 1),
  ('USER_BOOKINGS', 'Mis Reservas', 'Lista de reservas del usuario', 'usuario', true, 'Package', 2),
  ('USER_COMMUNICATION', 'Centro de Comunicación', 'Mensajes y comunicaciones', 'usuario', true, 'MessageCircle', 3),
  ('USER_NOTIFICATIONS', 'Notificaciones', 'Centro de notificaciones', 'usuario', true, 'Bell', 4),
  ('USER_FAVORITES', 'Favoritos', 'Favoritos del usuario', 'usuario', false, 'Heart', 5)
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- DATOS INICIALES: Categoría ADMIN
-- =====================================================
INSERT INTO features (code, name, description, category, is_global_enabled, icon, sort_order) VALUES
  ('ADMIN_CONTENT', 'Gestión de Contenido', 'Administrar contenido del sitio', 'admin', true, 'Home', 1),
  ('ADMIN_FEATURES', 'Administración de Funciones', 'Control granular de features', 'admin', true, 'Settings', 2),
  ('DASHBOARD_CORPORATE', 'Dashboard Corporativo', 'Panel de control corporativo', 'admin', true, 'Compass', 3),
  ('DASHBOARD_FINANCIAL', 'Dashboard Financiero', 'Panel de control financiero', 'admin', true, 'Compass', 4),
  ('DASHBOARD_PAYMENTS', 'Facturación y Pagos', 'Gestión de pagos', 'admin', true, 'CreditCard', 5),
  ('DASHBOARD_APPROVALS', 'Aprobaciones', 'Sistema de aprobaciones', 'admin', true, 'Check', 6),
  ('DASHBOARD_QUOTES', 'Cotizaciones', 'Gestión de cotizaciones', 'admin', true, 'FileText', 7),
  ('DASHBOARD_ITINERARIES', 'Itinerarios', 'Gestión de itinerarios', 'admin', true, 'Calendar', 8)
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- DATOS INICIALES: Categoría CORPORATIVO
-- =====================================================
INSERT INTO features (code, name, description, category, is_global_enabled, icon, sort_order) VALUES
  ('CORP_EMPLOYEES', 'Empleados', 'Gestión de empleados', 'corporativo', true, 'Users', 1),
  ('CORP_COST_CENTERS', 'Centros de Costo', 'Gestión de centros de costo', 'corporativo', true, 'Building', 2),
  ('CORP_POLICIES', 'Políticas de Viaje', 'Políticas corporativas', 'corporativo', true, 'FileText', 3),
  ('CORP_REPORTS', 'Reportes', 'Reportes corporativos', 'corporativo', true, 'BarChart', 4)
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- DATOS INICIALES: Categoría PAGOS
-- =====================================================
INSERT INTO features (code, name, description, category, is_global_enabled, icon, sort_order) VALUES
  ('PAYMENT_STRIPE', 'Pagos Stripe', 'Pagos con tarjeta vía Stripe', 'pagos', true, 'CreditCard', 1),
  ('PAYMENT_PAYPAL', 'Pagos PayPal', 'Pagos con PayPal', 'pagos', true, 'CreditCard', 2),
  ('PAYMENT_MERCADOPAGO', 'Pagos MercadoPago', 'Pagos con MercadoPago', 'pagos', true, 'CreditCard', 3)
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- DATOS INICIALES: Categoría SISTEMA
-- =====================================================
INSERT INTO features (code, name, description, category, is_global_enabled, icon, sort_order) VALUES
  ('SYSTEM_CHATBOT', 'Chatbot IA', 'Asistente virtual con IA', 'sistema', false, 'MessageSquare', 1),
  ('SYSTEM_LOGIN_REQUIRED', 'Login Obligatorio', 'Requiere autenticación al entrar', 'sistema', true, 'Lock', 2)
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- CONFIGURACIÓN INICIAL: App Settings
-- =====================================================
INSERT INTO app_settings (key, value, description) VALUES
  ('LOGIN_REQUIRED_WEB', 'true', 'Requiere login al entrar a la aplicación web'),
  ('LOGIN_REQUIRED_MOBILE', 'true', 'Requiere login al entrar a la aplicación móvil'),
  ('APP_VERSION', '2.233', 'Versión actual de la aplicación'),
  ('MAINTENANCE_MODE', 'false', 'Modo de mantenimiento activo')
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- PERMISOS POR ROL: Configuración inicial
-- =====================================================

-- SUPER_ADMIN tiene acceso a todo
INSERT INTO feature_role_access (feature_id, role, web_enabled, mobile_enabled)
SELECT id, 'SUPER_ADMIN', true, true FROM features
ON CONFLICT (feature_id, role) DO NOTHING;

-- ADMIN tiene acceso a todo excepto algunas funciones de sistema
INSERT INTO feature_role_access (feature_id, role, web_enabled, mobile_enabled)
SELECT id, 'ADMIN', true, true FROM features
ON CONFLICT (feature_id, role) DO NOTHING;

-- MANAGER tiene acceso limitado
INSERT INTO feature_role_access (feature_id, role, web_enabled, mobile_enabled)
SELECT id, 'MANAGER', true, true FROM features 
WHERE category IN ('busqueda', 'usuario', 'corporativo')
ON CONFLICT (feature_id, role) DO NOTHING;

-- EMPLOYEE tiene acceso básico
INSERT INTO feature_role_access (feature_id, role, web_enabled, mobile_enabled)
SELECT id, 'EMPLOYEE', true, true FROM features 
WHERE category IN ('busqueda', 'usuario')
ON CONFLICT (feature_id, role) DO NOTHING;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================
DO $$
DECLARE
  feature_count INTEGER;
  setting_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO feature_count FROM features;
  SELECT COUNT(*) INTO setting_count FROM app_settings;
  
  RAISE NOTICE '✅ Migración 015 completada';
  RAISE NOTICE '   Features creados: %', feature_count;
  RAISE NOTICE '   Settings creados: %', setting_count;
END $$;
