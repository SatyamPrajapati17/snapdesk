
import { Database } from '@/types/supabase'; // I'll assume the user generates this or I'll define it manually based on doc 05

export interface Employee {
  id: string;
  orgId: string;
  profileId: string;
  employeeCode: string;
  departmentId: string | null;
  managerId: string | null;
  jobTitle: string;
  status: 'invited' | 'contract_pending' | 'verification_pending' | 'active' | 'offboarded';
  startDate: string;
  noticePeriodDays: number;
  probationMonths: number;
  phone: string | null;
  bankAccountMasked: string | null;
  onboarding: {
    contractAccepted: boolean;
    identityVerified: boolean;
    profileCompleted: boolean;
  };
  createdAt: string;
}

export interface LeaveRequest {
  id: string;
  orgId: string;
  employeeId: string;
  leaveTypeId: string;
  fromDate: string;
  toDate: string;
  halfDay: boolean;
  days: number;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  decidedBy: string | null;
  decidedAt: string | null;
  decisionNote: string | null;
  createdAt: string;
}

export interface Payslip {
  id: string;
  orgId: string;
  runId: string;
  employeeId: string;
  basicPaise: number;
  hraPaise: number;
  allowances: any[];
  deductions: any[];
  adjustments: any[];
  unpaidLeaveDays: number;
  lopPaise: number;
  grossPaise: number;
  totalDeductionsPaise: number;
  netPaise: number;
  createdAt: string;
}
