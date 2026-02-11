-- ═══════════════════════════════════════════════════════════════
-- FASE 2: Dashboard de Agencias, Referidos y Comisiones
-- Build: 11 Feb 2026 - v2.305
-- ═══════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────
-- 1. Extender tenant_users para agentes
-- ───────────────────────────────────────────

ALTER TABLE tenant_users
  ADD COLUMN IF NOT EXISTS referral_code VARCHAR(50) UNIQUE,
  ADD COLUMN IF NOT EXISTS agent_phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS agent_commission_split NUMERIC(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS agent_status VARCHAR(20) DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Índice para búsqueda rápida por referral_code
CREATE INDEX IF NOT EXISTS idx_tenant_users_referral_code ON tenant_users(referral_code) WHERE referral_code IS NOT NULL;

-- ───────────────────────────────────────────
-- 2. Extender agency_commissions
-- ───────────────────────────────────────────

ALTER TABLE agency_commissions
  ADD COLUMN IF NOT EXISTS agent_id INTEGER REFERENCES tenant_users(id),
  ADD COLUMN IF NOT EXISTS agent_commission_amount NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS agency_commission_amount NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS booking_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_agency_commissions_agent ON agency_commissions(agent_id);
CREATE INDEX IF NOT EXISTS idx_agency_commissions_status ON agency_commissions(status);

-- ───────────────────────────────────────────
-- 3. Tabla de clics de referido
-- ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS referral_clicks (
  id SERIAL PRIMARY KEY,
  agent_id INTEGER NOT NULL REFERENCES tenant_users(id) ON DELETE CASCADE,
  referral_code VARCHAR(50) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  referer_url TEXT,
  landing_page VARCHAR(500),
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),
  session_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_referral_clicks_agent ON referral_clicks(agent_id);
CREATE INDEX IF NOT EXISTS idx_referral_clicks_code ON referral_clicks(referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_clicks_date ON referral_clicks(created_at);

-- ───────────────────────────────────────────
-- 4. Tabla de conversiones de referido
-- ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS referral_conversions (
  id SERIAL PRIMARY KEY,
  click_id INTEGER REFERENCES referral_clicks(id),
  agent_id INTEGER NOT NULL REFERENCES tenant_users(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  conversion_type VARCHAR(30) NOT NULL, -- 'registration', 'booking', 'payment'
  booking_id INTEGER REFERENCES bookings(id),
  revenue_amount NUMERIC(12,2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'MXN',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_referral_conversions_agent ON referral_conversions(agent_id);

-- ───────────────────────────────────────────
-- 5. Tabla de dispersiones / pagos a agentes
-- ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS commission_disbursements (
  id SERIAL PRIMARY KEY,
  agent_id INTEGER NOT NULL REFERENCES tenant_users(id),
  agency_id INTEGER NOT NULL REFERENCES tenants(id),
  amount NUMERIC(12,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'MXN',
  payment_method VARCHAR(50), -- 'transfer', 'cash', 'check'
  payment_reference VARCHAR(100),
  bank_name VARCHAR(100),
  bank_account VARCHAR(50),
  period_start DATE,
  period_end DATE,
  commissions_included INTEGER[], -- IDs de agency_commissions incluidos
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processed', 'paid', 'failed'
  processed_by INTEGER REFERENCES users(id),
  processed_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_disbursements_agent ON commission_disbursements(agent_id);
CREATE INDEX IF NOT EXISTS idx_disbursements_agency ON commission_disbursements(agency_id);

-- ───────────────────────────────────────────
-- 6. Extender agency_clients con más info
-- ───────────────────────────────────────────

ALTER TABLE agency_clients
  ADD COLUMN IF NOT EXISTS client_name VARCHAR(200),
  ADD COLUMN IF NOT EXISTS client_email VARCHAR(200),
  ADD COLUMN IF NOT EXISTS client_phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'referral', -- 'referral', 'manual', 'import'
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS total_bookings INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_revenue NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_booking_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- ───────────────────────────────────────────
-- 7. Roles estándar para la jerarquía
-- ───────────────────────────────────────────
-- Los roles en tenant_users.role serán:
-- 'AGENCY_ADMIN'  → Admin de la agencia (ve todo de su agencia)
-- 'AGENT'         → Agente de ventas (ve solo sus clientes/comisiones)
-- 'CLIENT'        → Cliente referido (solo ve sus reservas)
-- (No se crea tabla, se usa el campo role existente)

-- ───────────────────────────────────────────
-- 8. Vista materializada para stats de agente
-- ───────────────────────────────────────────

CREATE OR REPLACE VIEW agent_dashboard_stats AS
SELECT
  tu.id AS agent_id,
  tu.user_id,
  tu.tenant_id AS agency_id,
  tu.referral_code,
  u.name AS agent_name,
  u.email AS agent_email,
  t.company_name AS agency_name,
  -- Clics
  COALESCE(clicks.total_clicks, 0) AS total_clicks,
  COALESCE(clicks.clicks_today, 0) AS clicks_today,
  COALESCE(clicks.clicks_this_week, 0) AS clicks_this_week,
  COALESCE(clicks.clicks_this_month, 0) AS clicks_this_month,
  -- Conversiones
  COALESCE(conv.total_conversions, 0) AS total_conversions,
  COALESCE(conv.registrations, 0) AS total_registrations,
  COALESCE(conv.bookings_count, 0) AS total_bookings,
  -- Comisiones
  COALESCE(comm.pending_amount, 0) AS commission_pending,
  COALESCE(comm.available_amount, 0) AS commission_available,
  COALESCE(comm.paid_amount, 0) AS commission_paid,
  COALESCE(comm.total_amount, 0) AS commission_total,
  -- Clientes
  COALESCE(clients.total_clients, 0) AS total_clients
FROM tenant_users tu
JOIN users u ON tu.user_id = u.id
JOIN tenants t ON tu.tenant_id = t.id
LEFT JOIN LATERAL (
  SELECT
    COUNT(*) AS total_clicks,
    COUNT(*) FILTER (WHERE rc.created_at >= CURRENT_DATE) AS clicks_today,
    COUNT(*) FILTER (WHERE rc.created_at >= DATE_TRUNC('week', CURRENT_DATE)) AS clicks_this_week,
    COUNT(*) FILTER (WHERE rc.created_at >= DATE_TRUNC('month', CURRENT_DATE)) AS clicks_this_month
  FROM referral_clicks rc WHERE rc.agent_id = tu.id
) clicks ON true
LEFT JOIN LATERAL (
  SELECT
    COUNT(*) AS total_conversions,
    COUNT(*) FILTER (WHERE rcv.conversion_type = 'registration') AS registrations,
    COUNT(*) FILTER (WHERE rcv.conversion_type = 'booking') AS bookings_count
  FROM referral_conversions rcv WHERE rcv.agent_id = tu.id
) conv ON true
LEFT JOIN LATERAL (
  SELECT
    SUM(CASE WHEN ac.status = 'pending' THEN ac.agent_commission_amount ELSE 0 END) AS pending_amount,
    SUM(CASE WHEN ac.status = 'available' THEN ac.agent_commission_amount ELSE 0 END) AS available_amount,
    SUM(CASE WHEN ac.status = 'paid' THEN ac.agent_commission_amount ELSE 0 END) AS paid_amount,
    SUM(ac.agent_commission_amount) AS total_amount
  FROM agency_commissions ac WHERE ac.agent_id = tu.id AND ac.is_active = true
) comm ON true
LEFT JOIN LATERAL (
  SELECT COUNT(*) AS total_clients
  FROM agency_clients acl WHERE acl.agent_id = tu.user_id
) clients ON true
WHERE tu.role IN ('AGENT', 'AGENCY_ADMIN')
  AND tu.is_active = true;
