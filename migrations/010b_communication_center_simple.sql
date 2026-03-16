-- ================================================================
-- MIGRACIÓN: Centro de Comunicación - Ejecutar en Neon SQL Editor
-- Fecha: 15 Mar 2026
-- ================================================================

-- 1. communication_threads
CREATE TABLE IF NOT EXISTS communication_threads (
  id SERIAL PRIMARY KEY,
  thread_type VARCHAR(50) NOT NULL DEFAULT 'general',
  subject VARCHAR(255) NOT NULL,
  reference_type VARCHAR(50),
  reference_id INTEGER,
  client_id INTEGER,
  assigned_agent_id INTEGER,
  status VARCHAR(50) DEFAULT 'active',
  priority VARCHAR(20) DEFAULT 'normal',
  last_message_at TIMESTAMP,
  last_message_by INTEGER,
  message_count INTEGER DEFAULT 0,
  unread_count_client INTEGER DEFAULT 0,
  unread_count_agent INTEGER DEFAULT 0,
  sla_deadline TIMESTAMP,
  first_response_at TIMESTAMP,
  last_response_at TIMESTAMP,
  response_time_minutes INTEGER,
  tags TEXT[],
  category VARCHAR(50),
  is_archived BOOLEAN DEFAULT false,
  archived_at TIMESTAMP,
  tenant_id INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_threads_client ON communication_threads(client_id);
CREATE INDEX IF NOT EXISTS idx_threads_agent ON communication_threads(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_threads_status ON communication_threads(status);
CREATE INDEX IF NOT EXISTS idx_threads_tenant ON communication_threads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_threads_reference ON communication_threads(reference_type, reference_id);

-- 2. messages
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  thread_id INTEGER NOT NULL REFERENCES communication_threads(id) ON DELETE CASCADE,
  sender_id INTEGER,
  sender_type VARCHAR(50) NOT NULL,
  sender_name VARCHAR(255),
  sender_email VARCHAR(255),
  subject VARCHAR(255),
  body TEXT NOT NULL,
  body_html TEXT,
  message_type VARCHAR(50) DEFAULT 'text',
  attachments JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  is_internal BOOLEAN DEFAULT false,
  requires_response BOOLEAN DEFAULT false,
  requires_moderation BOOLEAN DEFAULT false,
  moderated_by INTEGER,
  moderated_at TIMESTAMP,
  moderation_status VARCHAR(50) DEFAULT 'approved',
  status VARCHAR(50) DEFAULT 'sent',
  sent_at TIMESTAMP,
  tenant_id INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  is_deleted BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_tenant ON messages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);

-- 3. message_deliveries
CREATE TABLE IF NOT EXISTS message_deliveries (
  id SERIAL PRIMARY KEY,
  message_id INTEGER NOT NULL,
  channel VARCHAR(50) NOT NULL,
  recipient VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  queued_at TIMESTAMP,
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  read_at TIMESTAMP,
  failed_at TIMESTAMP,
  provider VARCHAR(100),
  provider_message_id VARCHAR(255),
  error_message TEXT,
  error_code VARCHAR(50),
  retry_count INTEGER DEFAULT 0,
  tenant_id INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_deliveries_message ON message_deliveries(message_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON message_deliveries(status);

-- 4. Trigger: actualizar thread al insertar mensaje
CREATE OR REPLACE FUNCTION update_thread_on_new_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE communication_threads
  SET
    last_message_at = NEW.created_at,
    last_message_by = NEW.sender_id,
    message_count = message_count + 1,
    unread_count_client = CASE
      WHEN NEW.sender_type != 'client' THEN unread_count_client + 1
      ELSE unread_count_client
    END,
    unread_count_agent = CASE
      WHEN NEW.sender_type = 'client' THEN unread_count_agent + 1
      ELSE unread_count_agent
    END,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_thread_on_message ON messages;
CREATE TRIGGER trigger_update_thread_on_message
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION update_thread_on_new_message();

-- ================================================================
-- LISTO - Verifica con: SELECT COUNT(*) FROM communication_threads;
-- ================================================================
