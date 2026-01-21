-- Documents Table for Google Drive Integration
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('property', 'customer', 'sale')),
  entity_id VARCHAR(255) NOT NULL,
  document_type VARCHAR(50) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_id VARCHAR(255) NOT NULL, -- Google Drive file ID
  mime_type VARCHAR(100),
  web_view_link TEXT,
  web_content_link TEXT,
  thumbnail_link TEXT,
  file_size BIGINT,
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_by_name VARCHAR(255),
  notes TEXT,
  office_id UUID REFERENCES offices(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX idx_documents_entity ON documents(entity_type, entity_id);
CREATE INDEX idx_documents_office ON documents(office_id);
CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by);

-- Enable RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see documents from their office
CREATE POLICY "Users can view documents from their office"
  ON documents FOR SELECT
  USING (
    office_id IN (
      SELECT office_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert documents to their office"
  ON documents FOR INSERT
  WITH CHECK (
    office_id IN (
      SELECT office_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own documents"
  ON documents FOR UPDATE
  USING (uploaded_by = auth.uid());

CREATE POLICY "Users can delete their own documents"
  ON documents FOR DELETE
  USING (uploaded_by = auth.uid());

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_documents_updated_at();
