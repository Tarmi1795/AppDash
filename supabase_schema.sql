-- Drop existing table if it exists (careful - this will delete all data!)
DROP TABLE IF EXISTS public.direct_entries;

-- Create table with exact column names that match the app
CREATE TABLE public.direct_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT DEFAULT 'default',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  "Customer Name" TEXT,
  "CONTRACT NO." TEXT,
  "WBS" TEXT,
  " Dhareeba No. " TEXT,
  "Billing Currency (short name)" TEXT,
  "Project Country Location" TEXT,
  "Signing Date (per contract)-dd/mm/yyy" TIMESTAMPTZ,
  "Start Date (per contract)-dd/mm/yyy" TIMESTAMPTZ,
  "Est. Completion Date-dd/mm/yyy" TIMESTAMPTZ,
  "Total Contract Revenue Value *1000 (Est.)" NUMERIC,
  "Contract Value QAR" NUMERIC,
  "Remarks" TEXT,
  "DEPARTMENT" TEXT,
  "Comparison remarks (local vs. Dhareeba)" TEXT,
  "Serial No." TEXT
);

-- Enable Row Level Security
ALTER TABLE public.direct_entries ENABLE ROW LEVEL SECURITY;

-- Policy for public access (all operations)
CREATE POLICY "Allow all" ON public.direct_entries FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_direct_entries_tenant_id ON public.direct_entries(tenant_id);
CREATE INDEX idx_direct_entries_created_at ON public.direct_entries(created_at DESC);
CREATE INDEX idx_direct_entries_contract_no ON public.direct_entries("CONTRACT NO.");
