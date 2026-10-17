
import { supabase } from '@/lib/supabase/client';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const leaveRepo = {
  async getMyRequests(employeeId: string) {
    const { data, error } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('employee_id', employeeId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getPendingRequests(managerId: string) {
    const { data, error } = await supabase
      .from('leave_requests')
      .select('*, employees(profile_id)')
      .eq('status', 'pending')
      .in('employees.manager_id', [managerId]);
    if (error) throw error;
    return data;
  },

  async create(data: any) {
    const { data: result, error } = await supabase
      .from('leave_requests')
      .insert(data)
      .select()
      .single();
    if (error) throw error;
    return result;
  },

  async updateStatus(id: string, status: string, decidedBy: string, note: string) {
    const { data, error } = await supabaseAdmin
      .from('leave_requests')
      .update({ status, decided_by: decidedBy, decision_note: note, decided_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};
