/*
  # Plagiarism Detection System Schema

  1. New Tables
    - `documents`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `filename` (text)
      - `file_size` (integer)
      - `content` (text)
      - `status` (text) - pending, analyzing, completed, error
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `plagiarism_results`
      - `id` (uuid, primary key)
      - `document_id` (uuid, references documents)
      - `plagiarism_score` (integer) - percentage 0-100
      - `sources_found` (jsonb) - array of sources
      - `analyzed_at` (timestamptz)
      - `details` (jsonb) - detailed analysis results
  
  2. Security
    - Enable RLS on all tables
    - Users can only access their own documents
    - Users can only view results for their own documents

  3. Notes
    - Status field tracks document analysis progress
    - JSONB fields allow flexible storage of analysis data
    - Foreign key constraints ensure data integrity
*/

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  filename text NOT NULL,
  file_size integer NOT NULL,
  content text NOT NULL,
  status text DEFAULT 'pending' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create plagiarism_results table
CREATE TABLE IF NOT EXISTS plagiarism_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
  plagiarism_score integer NOT NULL,
  sources_found jsonb DEFAULT '[]'::jsonb NOT NULL,
  analyzed_at timestamptz DEFAULT now() NOT NULL,
  details jsonb DEFAULT '{}'::jsonb NOT NULL
);

-- Enable RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE plagiarism_results ENABLE ROW LEVEL SECURITY;

-- Documents policies
CREATE POLICY "Users can view own documents"
  ON documents FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents"
  ON documents FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents"
  ON documents FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Plagiarism results policies
CREATE POLICY "Users can view own results"
  ON plagiarism_results FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = plagiarism_results.document_id
      AND documents.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert results"
  ON plagiarism_results FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = plagiarism_results.document_id
      AND documents.user_id = auth.uid()
    )
  );

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_plagiarism_results_document_id ON plagiarism_results(document_id);