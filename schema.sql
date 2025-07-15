-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create engine_inputs table
CREATE TABLE engine_inputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  product_name TEXT,
  -- Using JSONB to store flexible input data
  inputs JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id)
);

-- Create engine_settings table
CREATE TABLE engine_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  -- Using JSONB to store flexible settings data
  settings JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id)
);

-- RLS Policies
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to manage their own projects"
ON projects FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

ALTER TABLE engine_inputs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to manage inputs for their own projects"
ON engine_inputs FOR ALL
USING (auth.uid() = (SELECT user_id FROM projects WHERE projects.id = project_id));

ALTER TABLE engine_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to manage settings for their own projects"
ON engine_settings FOR ALL
USING (auth.uid() = (SELECT user_id FROM projects WHERE projects.id = project_id));
