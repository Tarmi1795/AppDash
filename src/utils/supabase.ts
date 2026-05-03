import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zqqmxzunmxmnngeyosiv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxcW14enVubXhtbm5nZXlvc2l2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwMjc4NjksImV4cCI6MjA2MTYwMzg2OX0.LOM0Wl1_H-bZ3CZmNaJqVE1cLPt7tTHK3TJeW9f8x9M';

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

  const { error } = await supabase
    .from('direct_entries')
    .insert([{
      ...entry,
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