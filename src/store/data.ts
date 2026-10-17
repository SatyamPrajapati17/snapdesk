
import { create } from 'zustand';
import { User } from '@/types';

export interface EmployeeData {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: 'employee' | 'manager';
  status: 'pending' | 'onboarding' | 'active';
  contractStatus: 'none' | 'sent' | 'accepted';
  idVerified: boolean;
  leaveBalance: number;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  managerId: string;
}

export interface Payslip {
  id: string;
  employeeId: string;
  month: string;
  amount: number;
  status: 'draft' | 'published';
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
}

interface DataStore {
  employees: EmployeeData[];
  leaveRequests: LeaveRequest[];
  payslips: Payslip[];
  auditLogs: AuditLog[];
  addEmployee: (emp: EmployeeData) => void;
  updateEmployee: (id: string, updates: Partial<EmployeeData>) => void;
  addLeaveRequest: (req: LeaveRequest) => void;
  updateLeaveRequest: (id: string, updates: Partial<LeaveRequest>) => void;
  addPayslip: (slip: Payslip) => void;
  updatePayslip: (id: string, updates: Partial<Payslip>) => void;
  addAuditLog: (log: AuditLog) => void;
}

export const useDataStore = create<DataStore>((set) => ({
  employees: [
    { id: 'emp1', userId: 'u1', name: 'John Doe', email: 'emp1@demo.test', role: 'employee', status: 'active', contractStatus: 'accepted', idVerified: true, leaveBalance: 20 },
    { id: 'emp2', userId: 'u2', name: 'Jane Smith', email: 'emp2@demo.test', role: 'employee', status: 'onboarding', contractStatus: 'sent', idVerified: false, leaveBalance: 20 },
  ],
  leaveRequests: [],
  payslips: [],
  auditLogs: [
    { id: '1', timestamp: new Date().toISOString(), user: 'admin', action: 'SYSTEM_INIT', details: 'System initialized' },
  ],
  addEmployee: (emp) => set((state) => ({ employees: [...state.employees, emp] })),
  updateEmployee: (id, updates) => set((state) => ({
    employees: state.employees.map(e => e.id === id ? { ...e, ...updates } : e)
  })),
  addLeaveRequest: (req) => set((state) => ({ leaveRequests: [...state.leaveRequests, req] })),
  updateLeaveRequest: (id, updates) => set((state) => ({
    leaveRequests: state.leaveRequests.map(r => r.id === id ? { ...r, ...updates } : r)
  })),
  addPayslip: (slip) => set((state) => ({ payslips: [...state.payslips, slip] })),
  updatePayslip: (id, updates) => set((state) => ({
    payslips: state.payslips.map(s => s.id === id ? { ...s, ...updates } : s)
  })),
  addAuditLog: (log) => set((state) => ({ auditLogs: [log, ...state.auditLogs] })),
}));
