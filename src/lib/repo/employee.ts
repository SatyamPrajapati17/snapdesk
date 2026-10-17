
import { supabase } from '@/lib/supabase/client';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { Employee } from './types';

export const employeeRepo = {
  async getById(id: string) {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },
  
  async getByProfileId(profileId: string) {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('profile_id', profileId)
      .single();
    if (error) throw error;
    return data;
  },

  async list(orgId: string) {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('org_id', orgId);
    if (error) throw error;
    return data;
  },

  async create(data: any) {
    const { data: result, error } = await supabaseAdmin
      .from('employees')
      .insert(data)
      .select()
      .single();
    if (error) throw error;
    return result;
  },

  async update(id: string, updates: any) {
    const { data, error } = await supabaseAdmin
      .from('employees')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};
