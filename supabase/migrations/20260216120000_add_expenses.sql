-- Giderler tablosu
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  category TEXT CHECK (category IN ('kira', 'fatura', 'maaş', 'diğer')),
  date DATE NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS aktif et
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Sadece Ofis Broker görebilir/düzenleyebilir
CREATE POLICY "Brokers manage expenses"
ON expenses FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.uid() = id
    AND raw_user_meta_data->>'role' = 'ofis_broker'
  )
);

-- Index
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_expenses_created_by ON expenses(created_by);
