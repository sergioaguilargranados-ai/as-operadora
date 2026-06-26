-- 1. Asegurar la columna tour_id en itineraries
ALTER TABLE itineraries ADD COLUMN IF NOT EXISTS tour_id VARCHAR(50);

-- 2. Insertar Usuario (Cliente) de prueba si no existe
INSERT INTO users (email, name, role, password_hash) 
VALUES ('test_cliente@ejemplo.com', 'Cliente de Prueba', 'CUSTOMER', 'dummy_hash') 
ON CONFLICT (email) DO NOTHING;

-- 3. Insertar Reserva simulada (Borrando previa si existe por colisión)
DELETE FROM bookings WHERE booking_reference = 'RES-TEST-001';

INSERT INTO bookings (user_id, booking_reference, booking_type, booking_status, original_price, subtotal, total_price, currency, payment_status, lead_traveler_name, lead_traveler_email, destination, special_requests)
SELECT 
    id as user_id, 
    'RES-TEST-001', 
    'package', 
    'confirmed', 
    25000,
    25000,
    25000, 
    'MXN', 
    'paid',  
    'Cliente de Prueba', 
    'test_cliente@ejemplo.com', 
    'Europa', 
    '{"tour_id": "TEST-TOUR-01", "contact_name": "Cliente de Prueba"}'::jsonb
FROM users WHERE email = 'test_cliente@ejemplo.com' LIMIT 1;

-- 4. Borrar itinerario viejo para no duplicar
DELETE FROM itineraries WHERE tour_id = 'TEST-TOUR-01';

-- 5. Insertar Itinerario Enriquecido ligado a TEST-TOUR-01
INSERT INTO itineraries (user_id, title, destination, description, start_date, end_date, tour_id, status, days)
SELECT 
    id as user_id,
    'Gran Tour Europeo',
    'Europa',
    'Un viaje inolvidable por las mejores ciudades del viejo continente.',
    '2026-10-01',
    '2026-10-15',
    'TEST-TOUR-01',
    'active',
    '[
      {
        "day": 1,
        "date": "1 de Octubre, 2026",
        "title": "Llegada a París",
        "description": "Bienvenida a la ciudad de la luz. Traslado al hotel y día libre para recorrer y disfrutar de un increíble croissant.",
        "hero_image": "https://images.unsplash.com/photo-1502602898657-3e907a5ea071?auto=format&fit=crop&w=800&q=80",
        "foods": [
          { "name": "Croissant Auténtico", "desc": "Panadería parisina.", "img": "https://images.unsplash.com/photo-1555507036-ab1e4006aaeb?auto=format&fit=crop&w=200&q=80" },
          { "name": "Sopa de Cebolla", "desc": "Tradicional con queso gratinado.", "img": "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=200&q=80" }
        ],
        "places": [
          { "name": "Torre Eiffel", "desc": "Símbolo indiscutible de París.", "img": "https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?auto=format&fit=crop&w=200&q=80" },
          { "name": "Museo del Louvre", "desc": "Arte e historia inigualable.", "img": "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=200&q=80" }
        ],
        "souvenirs": [
          { "name": "Miniatura de Torre Eiffel", "desc": "El clásico recuerdo.", "img": "https://images.unsplash.com/photo-1549144365-d3ec46162137?auto=format&fit=crop&w=200&q=80" }
        ],
        "phrases": [
          { "es": "Hola", "local": "Bonjour" },
          { "es": "Gracias", "local": "Merci" },
          { "es": "Por favor", "local": "S''il vous plaît" }
        ]
      }
    ]'::jsonb
FROM users WHERE email = 'test_cliente@ejemplo.com' LIMIT 1;
