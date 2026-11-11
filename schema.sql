-- KeepReady: Comprehensive PostgreSQL Relational Schema for Supabase
-- Includes Row-Level Security (RLS), Kits, Smart Containers, Threat Plans, and Radio Presets

-- 1. Profiles & Subscription Status
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    is_premium BOOLEAN DEFAULT FALSE,
    preferred_unit TEXT DEFAULT 'metric' CHECK (preferred_unit IN ('metric', 'imperial')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Household Members & Nutritional Multipliers
CREATE TABLE IF NOT EXISTS household_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    age_group TEXT CHECK (age_group IN ('infant', 'toddler', 'child', 'teen', 'adult', 'senior')),
    daily_kcal_target INTEGER DEFAULT 2100,
    daily_water_liters NUMERIC(4, 2) DEFAULT 3.0,
    is_deleted BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Domestic Pets
CREATE TABLE IF NOT EXISTS household_pets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    pet_type TEXT CHECK (pet_type IN ('dog', 'cat', 'other')),
    daily_food_grams INTEGER DEFAULT 300,
    daily_water_liters NUMERIC(4, 2) DEFAULT 1.0,
    is_deleted BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Storage Locations & Nested Hierarchy
CREATE TABLE IF NOT EXISTS storage_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    parent_location_id UUID REFERENCES storage_locations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    location_type TEXT DEFAULT 'room' CHECK (location_type IN ('property', 'room', 'shelf', 'zone')),
    is_deleted BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Physical Storage Containers (Smart Bin QR Tags)
CREATE TABLE IF NOT EXISTS containers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    location_id UUID REFERENCES storage_locations(id) ON DELETE SET NULL,
    qr_code_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL, -- e.g. "Bucket #04", "Tote Alpha"
    container_type TEXT DEFAULT 'bucket_5gal' CHECK (container_type IN ('bucket_5gal', 'bucket_2gal', 'tote', 'mylar_bag', 'mason_jar', 'box')),
    is_hermetically_sealed BOOLEAN DEFAULT TRUE,
    unsealed_date DATE,
    notes TEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Comprehensive Item Catalog (Food, Water, Medical, Power, Tools)
CREATE TABLE IF NOT EXISTS supply_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    barcode TEXT, -- UPC / EAN
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('grain', 'legume', 'fat_oil', 'protein_meat', 'dairy', 'fruit_vegetable', 'sweetener', 'spice_salt', 'water', 'medical_tccc', 'power_battery', 'tool_gear')),
    storage_method TEXT DEFAULT 'original_pack' CHECK (storage_method IN ('original_pack', 'mylar_o2', 'canned_commercial', 'mason_jar', 'freezer')),
    calories_per_unit INTEGER DEFAULT 0,
    protein_grams_per_unit NUMERIC(6, 2) DEFAULT 0,
    cooking_water_ml_per_unit INTEGER DEFAULT 0,
    simmer_time_minutes INTEGER DEFAULT 0,
    is_zero_cook_ready BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Inventory Batches & Expirations (FIFO Tracking)
CREATE TABLE IF NOT EXISTS inventory_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID REFERENCES supply_items(id) ON DELETE CASCADE,
    container_id UUID REFERENCES containers(id) ON DELETE SET NULL,
    quantity NUMERIC(8, 2) NOT NULL DEFAULT 1.0,
    unit TEXT NOT NULL, -- 'kg', 'lbs', 'liters', 'cans', 'pieces'
    cost_per_unit NUMERIC(8, 2) DEFAULT 0.00,
    lot_number TEXT,
    packaged_date DATE,
    expiration_date DATE NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. The 7 Purpose-Built Preparedness Kits
CREATE TABLE IF NOT EXISTS kits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    kit_type TEXT NOT NULL CHECK (kit_type IN ('home_reserve', 'bug_out_bag', 'family_bob', 'vehicle_kit', 'winter_vehicle_kit', 'get_home_bag', 'wilderness_camping')),
    name TEXT NOT NULL,
    target_weight_kg NUMERIC(5, 2),
    assigned_member_id UUID REFERENCES household_members(id) ON DELETE SET NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Kit Checklist Manifest
CREATE TABLE IF NOT EXISTS kit_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kit_id UUID REFERENCES kits(id) ON DELETE CASCADE,
    item_id UUID REFERENCES supply_items(id) ON DELETE SET NULL,
    custom_item_name TEXT,
    required_quantity NUMERIC(6, 2) NOT NULL DEFAULT 1.0,
    is_packed BOOLEAN DEFAULT FALSE,
    is_essential BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. The 10 Threat Scenarios Progress
CREATE TABLE IF NOT EXISTS threat_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    scenario_type TEXT NOT NULL CHECK (scenario_type IN ('power_outage', 'severe_storm', 'earthquake', 'winter_freeze', 'flooding', 'wildfire', 'civil_conflict', 'nuclear_fallout', 'wilderness_stranding', 'pandemic')),
    before_phase_completed BOOLEAN DEFAULT FALSE,
    during_phase_completed BOOLEAN DEFAULT FALSE,
    after_phase_completed BOOLEAN DEFAULT FALSE,
    notes TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Radio Presets & Emergency Frequencies (PACE & WebSDR)
CREATE TABLE IF NOT EXISTS radio_presets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    frequency_mhz NUMERIC(8, 4) NOT NULL,
    mode TEXT DEFAULT 'USB' CHECK (mode IN ('AM', 'FM', 'NFM', 'WFM', 'USB', 'LSB', 'CW')),
    label TEXT NOT NULL,
    category TEXT CHECK (category IN ('emergency_net', 'time_solar', 'military_hfgcs', 'marine_sar', 'news_stream', 'family_simplex')),
    is_custom BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- Ensures each user can only read, insert, update, and delete their own data
-- ========================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE containers ENABLE ROW LEVEL SECURITY;
ALTER TABLE supply_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE kit_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE threat_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE radio_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access own profile" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users access own members" ON household_members FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own pets" ON household_pets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own locations" ON storage_locations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own containers" ON containers FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own items" ON supply_items FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own batches" ON inventory_batches FOR ALL USING (
    EXISTS (SELECT 1 FROM supply_items WHERE supply_items.id = inventory_batches.item_id AND supply_items.user_id = auth.uid())
);
CREATE POLICY "Users access own kits" ON kits FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own kit_items" ON kit_items FOR ALL USING (
    EXISTS (SELECT 1 FROM kits WHERE kits.id = kit_items.kit_id AND kits.user_id = auth.uid())
);
CREATE POLICY "Users access own threat_plans" ON threat_plans FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own radio_presets" ON radio_presets FOR ALL USING (auth.uid() = user_id);
