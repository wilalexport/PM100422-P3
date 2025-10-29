-- ============================================
-- SUPABASE DATABASE SCHEMA
-- LogisticsRoute Application
-- ============================================
-- INSTRUCCIONES DE INSTALACIÓN:
-- 1. Abre tu proyecto en Supabase Dashboard (https://supabase.com/dashboard)
-- 2. Ve a "SQL Editor" en el menú lateral izquierdo
-- 3. Click en "New Query"
-- 4. Copia y pega TODO este script
-- 5. Click en "Run" o presiona Ctrl+Enter
-- 6. Verifica que no haya errores en la consola
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    company_name VARCHAR(255),
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Deliveries table
CREATE TABLE IF NOT EXISTS public.deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    start_latitude DECIMAL(10, 8) NOT NULL,
    start_longitude DECIMAL(11, 8) NOT NULL,
    start_address TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    total_distance DECIMAL(10, 2),
    estimated_duration INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Delivery Destinations table
CREATE TABLE IF NOT EXISTS public.delivery_destinations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    delivery_id UUID NOT NULL REFERENCES public.deliveries(id) ON DELETE CASCADE,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    address TEXT NOT NULL,
    order_number INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    notes TEXT,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Fuel Saving History table
CREATE TABLE IF NOT EXISTS public.fuel_saving_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    delivery_id UUID NOT NULL REFERENCES public.deliveries(id) ON DELETE CASCADE,
    original_distance DECIMAL(10, 2) NOT NULL,
    optimized_distance DECIMAL(10, 2) NOT NULL,
    fuel_saved DECIMAL(10, 2) NOT NULL,
    cost_saved DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_deliveries_user_id ON public.deliveries(user_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON public.deliveries(status);
CREATE INDEX IF NOT EXISTS idx_deliveries_created_at ON public.deliveries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_delivery_destinations_delivery_id ON public.delivery_destinations(delivery_id);
CREATE INDEX IF NOT EXISTS idx_delivery_destinations_order ON public.delivery_destinations(delivery_id, order_number);
CREATE INDEX IF NOT EXISTS idx_fuel_saving_history_user_id ON public.fuel_saving_history(user_id);
CREATE INDEX IF NOT EXISTS idx_fuel_saving_history_created_at ON public.fuel_saving_history(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_saving_history ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON public.users FOR INSERT
    WITH CHECK (true);

-- Deliveries policies
CREATE POLICY "Users can view own deliveries"
    ON public.deliveries FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own deliveries"
    ON public.deliveries FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own deliveries"
    ON public.deliveries FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own deliveries"
    ON public.deliveries FOR DELETE
    USING (auth.uid() = user_id);

-- Delivery Destinations policies
CREATE POLICY "Users can view own delivery destinations"
    ON public.delivery_destinations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.deliveries
            WHERE deliveries.id = delivery_destinations.delivery_id
            AND deliveries.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create delivery destinations"
    ON public.delivery_destinations FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.deliveries
            WHERE deliveries.id = delivery_destinations.delivery_id
            AND deliveries.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own delivery destinations"
    ON public.delivery_destinations FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.deliveries
            WHERE deliveries.id = delivery_destinations.delivery_id
            AND deliveries.user_id = auth.uid()
        )
    );

-- Fuel Saving History policies
CREATE POLICY "Users can view own fuel savings"
    ON public.fuel_saving_history FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create fuel savings records"
    ON public.fuel_saving_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deliveries_updated_at
    BEFORE UPDATE ON public.deliveries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VERIFICACIÓN
-- ============================================
-- Ejecuta estas consultas para verificar la instalación:

-- Ver todas las tablas creadas
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;

-- Ver que RLS esté habilitado
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- Ver políticas creadas
-- SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';

-- ============================================
-- INSTALACIÓN COMPLETADA
-- ============================================
