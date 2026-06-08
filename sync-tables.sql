-- ============================================================
-- CARRIER NEXUS — GOOGLE DRIVE SYNC TABLES
-- Run this in Supabase SQL Editor ONCE to enable the
-- "Update Nexus" button Google Drive sync feature.
-- ============================================================
-- Go to: https://app.supabase.com → Your Project → SQL Editor
-- Paste this entire file and click Run
-- ============================================================

-- Stores imported document metadata from Google Drive
-- PDFs stay in Google Drive; only text/metadata is saved here
CREATE TABLE IF NOT EXISTS nexus_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    drive_file_id text UNIQUE NOT NULL,
      file_name text NOT NULL,
        mime_type text,
          drive_modified_time timestamptz,
            doc_type text DEFAULT 'other',
              text_content text,
                imported_at timestamptz DEFAULT now(),
                  created_at timestamptz DEFAULT now()
                  );

                  -- Tracks when the last Google Drive sync occurred
                  CREATE TABLE IF NOT EXISTS nexus_sync_log (
                    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                      synced_at timestamptz NOT NULL DEFAULT now()
                      );

                      -- Enable Row Level Security
                      ALTER TABLE nexus_documents ENABLE ROW LEVEL SECURITY;
                      ALTER TABLE nexus_sync_log ENABLE ROW LEVEL SECURITY;

                      -- Policies for nexus_documents
                      CREATE POLICY IF NOT EXISTS "Allow all for nexus_documents"
                        ON nexus_documents FOR ALL
                          USING (true)
                            WITH CHECK (true);

                            -- Policies for nexus_sync_log
                            CREATE POLICY IF NOT EXISTS "Allow all for nexus_sync_log"
                              ON nexus_sync_log FOR ALL
                                USING (true)
                                  WITH CHECK (true);
