import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zqqmxzunmxmnngeyosiv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxcW14enVubXhtbm5nZXlvc2l2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyNzk1MjcsImV4cCI6MjA4ODg1NTUyN30.oQlS-cR5FAowWO1K11JPnGMQ1ptRwy4KCBr2n2VmR3k';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface TenantConfig {
  schema: string;
  tenantId: string;
  companyName: string;
}

const tenantConfigs: Record<string, TenantConfig> = {
  'default': {
    schema: 'public',
    tenantId: 'default',
    companyName: 'Applus Velosi'
  }
};

export function getTenantConfig(tenantId: string = 'default'): TenantConfig {
  return tenantConfigs[tenantId] || tenantConfigs['default'];
}

export async function fetchDirectEntries(tenantId: string = 'default'): Promise<any[]> {
  const config = getTenantConfig(tenantId);
  const { data, error } = await supabase
    .from('direct_entries')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching entries:', error);
    return [];
  }

  return data || [];
}

export async function saveDirectEntry(entry: Partial<any>, tenantId: string = 'default'): Promise<boolean> {
  const config = getTenantConfig(tenantId);

  const numericFields = ['Total Contract Revenue Value *1000 (Est.)', 'Contract Value QAR'];
  const processedEntry = { ...entry };
  for (const field of numericFields) {
    if (processedEntry[field] === '' || processedEntry[field] === null) {
      processedEntry[field] = null;
    }
  }

  const { error } = await supabase
    .from('direct_entries')
    .insert([{
      ...processedEntry,
      tenant_id: tenantId,
      created_at: new Date().toISOString()
    }]);

  if (error) {
    console.error('Error saving entry:', error);
    return false;
  }

  return true;
}

export async function deleteDirectEntry(id: string, tenantId: string = 'default'): Promise<boolean> {
  const { error } = await supabase
    .from('direct_entries')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting entry:', error);
    return false;
  }

  return true;
}

export async function updateDirectEntry(id: string, entry: Partial<any>, tenantId: string = 'default'): Promise<boolean> {
  const numericFields = ['Total Contract Revenue Value *1000 (Est.)', 'Contract Value QAR'];
  const dateFields = [
    'Signing Date (per contract)-dd/mm/yyy',
    'Start Date (per contract)-dd/mm/yyy',
    'Est. Completion Date-dd/mm/yyy'
  ];

  const processedEntry: Record<string, any> = {};
  for (const [key, value] of Object.entries(entry)) {
    if (numericFields.includes(key)) {
      processedEntry[key] = (value === '' || value === null || value === undefined) ? null : value;
    } else if (dateFields.includes(key)) {
      processedEntry[key] = (value === '' || value === null || value === undefined) ? null : value;
    } else {
      processedEntry[key] = value;
    }
  }

  const { error } = await supabase
    .from('direct_entries')
    .update(processedEntry)
    .eq('id', id);

  if (error) {
    console.error('Error updating entry:', error);
    return false;
  }

  return true;
}

const VALID_COLUMNS = [
  'Customer Name',
  'CONTRACT NO.',
  'WBS',
  ' Dhareeba No. ',
  'Billing Currency (short name)',
  'Project Country Location',
  'Signing Date (per contract)-dd/mm/yyy',
  'Start Date (per contract)-dd/mm/yyy',
  'Est. Completion Date-dd/mm/yyy',
  'Total Contract Revenue Value *1000 (Est.)',
  'Contract Value QAR',
  'Remarks',
  'DEPARTMENT',
  'Comparison remarks (local vs. Dhareeba)'
];

const COLUMN_MAP: Record<string, string> = {
  'DEPARTMENT(sample data)': 'DEPARTMENT',
  'No.': 'Serial No.'
};

export async function bulkSaveEntries(entries: Partial<any>[], tenantId: string = 'default'): Promise<{ success: boolean; saved: number; duplicates: number }> {
  const dateFields = [
  'Signing Date (per contract)-dd/mm/yyy',
  'Start Date (per contract)-dd/mm/yyy',
  'Est. Completion Date-dd/mm/yyy'
];

const numericFields = ['Total Contract Revenue Value *1000 (Est.)', 'Contract Value QAR'];

const parseDate = (value: any): string | null => {
  if (value === '' || value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString();
  const str = String(value).trim();
  if (!str) return null;

  // Handle dd/mm/yyyy format
  const ddmmyyyy = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyy) {
    const [, day, month, year] = ddmmyyyy;
    return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00.000Z`).toISOString();
  }

  // Handle mm/dd/yyyy format
  const mmddyyyy = str.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (mmddyyyy) {
    const [, month, day, year] = mmddyyyy;
    return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00.000Z`).toISOString();
  }

  // Try parsing as ISO
  const date = new Date(str);
  if (!isNaN(date.getTime())) return date.toISOString();

  return null;
};

const existingEntries = await fetchDirectEntries(tenantId);
const existingContractNos = new Set(existingEntries.map(e => e['CONTRACT NO.']));

const newEntries: Partial<any>[] = [];
let duplicateCount = 0;

for (const entry of entries) {
  const contractNo = entry['CONTRACT NO.'];
  if (contractNo && existingContractNos.has(contractNo)) {
    duplicateCount++;
    continue;
  }
  const processedEntry: Record<string, any> = {};
  for (const key of VALID_COLUMNS) {
    if (key in entry) {
      const dbKey = COLUMN_MAP[key] || key;
      const value = entry[key];
      if (numericFields.includes(key)) {
        processedEntry[dbKey] = (value === '' || value === null || value === undefined) ? null : value;
      } else if (dateFields.includes(key)) {
        processedEntry[dbKey] = parseDate(value);
      } else {
        processedEntry[dbKey] = value;
      }
    }
  }
  newEntries.push({
    ...processedEntry,
    tenant_id: tenantId,
    created_at: new Date().toISOString()
  });
}

  if (newEntries.length === 0) {
    return { success: true, saved: 0, duplicates: duplicateCount };
  }

  console.log('Inserting entries:', JSON.stringify(newEntries.slice(0, 2), null, 2));
  const { error } = await supabase
    .from('direct_entries')
    .insert(newEntries);

  if (error) {
    console.error('Error bulk saving entries:', error.code, error.message, error.details, error.hint);
    alert(`Save failed: ${error.message}`);
    return { success: false, saved: 0, duplicates: duplicateCount };
  }

  return { success: true, saved: newEntries.length, duplicates: duplicateCount };
}

export async function fetchAllEntries(tenantId: string = 'default'): Promise<any[]> {
  const { data, error } = await supabase
    .from('direct_entries')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching entries:', error);
    return [];
  }

  return data || [];
}