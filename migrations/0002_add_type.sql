-- Add document type to distinguish markdown ('md') from HTML ('html') documents.
-- Existing rows default to 'md' to preserve current behavior.
ALTER TABLE documents ADD COLUMN type TEXT NOT NULL DEFAULT 'md';
