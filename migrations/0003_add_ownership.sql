-- Per-document ownership proof. Stores only the SHA-256 hash of the token so a
-- D1 leak can't be used to delete other people's documents; the plaintext lives
-- in the uploader's browser (localStorage) and is returned exactly once, in the
-- upload response.
--
-- NULL = unowned. Rows created before this migration stay NULL and are
-- therefore not deletable, which matches the "no retroactive change to existing
-- documents" decision in docs/ROADMAP.md §2.
--
-- Note: editing (PUT) deliberately does NOT check this column — edits are open
-- to anyone holding the link. Only DELETE (and later, expiry settings) do.
ALTER TABLE documents ADD COLUMN owner_token_hash TEXT;

CREATE INDEX IF NOT EXISTS idx_documents_owner_token_hash
  ON documents(owner_token_hash);
