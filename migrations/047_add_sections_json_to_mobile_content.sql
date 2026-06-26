-- Migración 047: Agregar columna sections_json a la tabla mobile_app_content para parametrización de secciones PWA
-- -------------------------------------------------------------------------------------------------------

ALTER TABLE mobile_app_content ADD COLUMN IF NOT EXISTS sections_json JSONB DEFAULT '{}'::jsonb;

-- Poblar valor por defecto para el tenant principal
UPDATE mobile_app_content 
SET sections_json = '{
  "promo_banner": {
    "title": "¡Promociones del Mes!",
    "subtitle": "Aprovecha nuestras ofertas exclusivas para miembros",
    "image_url": "/banner-store.jpg"
  },
  "catalogs": {
    "title": "Nuestros Catálogos",
    "subtitle": "Explora vuelos, hoteles y paquetes de viaje",
    "vuelos_img": "/tours/destinations/vuelos.jpg",
    "hoteles_img": "/tours/destinations/hoteles.jpg",
    "paquetes_img": "/tours/destinations/paquetes.jpg"
  }
}'::jsonb
WHERE tenant_id = 1 AND (sections_json IS NULL OR sections_json = '{}'::jsonb);
