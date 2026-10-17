
export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: { id: string; name: string; created_at: string };
        Insert: { id?: string; name: string; created_at?: string };
        Update: { id?: string; name?: string; created_at?: string };
      };
      departments: {
        Row: { id: string; org_id: string; name: string };
        Insert: { id?: string; org_id: string; name: string };
        Update: { id?: string; org_id?: string; name?: string };
      };
      profiles: {
        Row: { id: string; org_id: string; full_name: string; email: string; role: 'admin' | 'manager' | 'employee'; avatar_url: string | null; created_at: string };
        Insert: { id: string; org_id: string; full_name: string; email: string; role: 'admin' | 'manager' | 'employee'; avatar_url?: string; created_at?: string };
        Update: { id?: string; org_id?: string; full_name?: string; email?: string; role?: 'admin' | 'manager' | 'employee'; avatar_url?: string; created_at?: string };
      };
      employees: {
        Row: { id: string; org_id: string; profile_id: string; employee_code: string; department_id: string | null; manager_id: string | null; job_title: string; status: string; start_date: string; notice_period_days: number; probation_months: number; phone: string | null; bank_account_masked: string | null; onboarding: any; created_at: string };
        Insert: { id?: string; org_id: string; profile_id: string; employee_code: string; department_id?: string; manager_id?: string; job_title: string; status: string; start_date: string; notice_period_days?: number; probation_months?: number; phone?: string; bank_account_masked?: string; onboarding?: any; created_at?: string };
        Update: { id?: string; org_id?: string; profile_id?: string; employee_code?: string; department_id?: string; manager_id?: string; job_title?: string; status?: string; start_date?: string; notice_period_days?: number; probation_months?: number; phone?: string; bank_account_masked?: string; onboarding?: any; created_at?: string };
      };
      leave_requests: {
        Row: { id: string; org_id: string; employee_id: string; leave_type_id: string; from_date: string; to_date: string; half_day: boolean; days: number; reason: string | null; status: string; decided_by: string | null; decided_at: string | null; decision_note: string | null; created_at: string };
        Insert: { id?: string; org_id: string; employee_id: string; leave_type_id: string; from_date: string; to_date: string; half_day: boolean; days: number; reason?: string; status?: string; decided_by?: string; decided_at?: string; decision_note?: string; created_at?: string };
        Update: { id?: string; org_id?: string; employee_id?: string; leave_type_id?: string; from_date?: string; to_date?: string; half_day?: boolean; days?: number; reason?: string; status?: string; decided_by?: string; decided_at?: string; decision_note?: string; created_at?: string };
      };
      payslips: {
        Row: { id: string; org_id: string; run_id: string; employee_id: string; basic_paise: number; hra_paise: number; allowances: any; deductions: any; adjustments: any; unpaid_leave_days: number; lop_paise: number; gross_paise: number; total_deductions_paise: number; net_paise: number; created_at: string };
        Insert: { id?: string; org_id: string; run_id: string; employee_id: string; basic_paise: number; hra_paise: number; allowances?: any; deductions?: any; adjustments?: any; unpaid_leave_days?: number; lop_paise?: number; gross_paise: number; total_deductions_paise: number; net_paise: number; created_at?: string };
        Update: { id?: string; org_id?: string; run_id?: string; employee_id?: string; basic_paise?: number; hra_paise?: number; allowances?: any; deductions?: any; adjustments?: any; unpaid_leave_days?: number; lop_paise?: number; gross_paise?: number; total_deductions_paise?: number; net_paise?: number; created_at?: string };
      };
    };
  };
}
