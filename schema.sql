-- KeepReady: Initial PostgreSQL Schema for Supabase

-- 1. Profiles & Subscription Status
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    is_premium BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Household Members & Caloric Profiles
CREATE TABLE IF NOT EXISTS household_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    age_group TEXT CHECK (age_group IN ('infant', 'child', 'adult', 'senior')),
    daily_kcal_target INTEGER DEFAULT 2100,
    daily_water_liters NUMERIC(4, 2) DEFAULT 3.0,
    is_deleted BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Storage Locations (Nested)
CREATE TABLE IF NOT EXISTS storage_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    parent_location_id UUID REFERENCES storage_locations(id),
    name TEXT NOT NULL,
    location_type TEXT DEFAULT 'room',
    is_deleted BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Food Items Catalog
CREATE TABLE IF NOT EXISTS food_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    barcode TEXT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    storage_method TEXT,
    calories_per_unit INTEGER,
    protein_grams_per_unit NUMERIC(6, 2),
    is_deleted BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Inventory Batches (FIFO & Expiration)
CREATE TABLE IF NOT EXISTS inventory_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    food_item_id UUID REFERENCES food_items(id) ON DELETE CASCADE,
    location_id UUID REFERENCES storage_locations(id) ON DELETE SET NULL,
    quantity NUMERIC(8, 2) NOT NULL DEFAULT 1.0,
    unit TEXT NOT NULL,
    lot_number TEXT,
    packaged_date DATE,
    expiration_date DATE NOT NULL,
    is_opened BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
