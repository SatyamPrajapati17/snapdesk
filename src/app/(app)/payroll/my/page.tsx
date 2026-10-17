
"use client";
import { useAuth } from "@/hooks/useAuth";
import { useDataStore } from "@/store/data";

export default function EmployeePayrollPage() {
  const { user } = useAuth();
  const { employees, payslips } = useDataStore();
  const emp = employees.find(e => e.userId === user?.id);
  const mySlips = payslips.filter(s => s.employeeId === emp?.id && s.status === 'published');

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-4xl font-black uppercase mb-8">My Payslips</h1>
      <div className="grid grid-cols-1 gap-4">
        {mySlips.map(s => (
          <div key={s.id} className="p-6 border-4 border-black bg-white shadow-[8px_8px_0px_0px_#0A0A0A]">
            <div className="flex justify-between items-center mb-4 border-b-4 border-black pb-2">
              <h2 className="text-2xl font-black uppercase">{s.month} Payslip</h2>
              <span className="bg-green-100 px-2 py-1 border-2 border-black text-xs font-bold uppercase">Paid</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold uppercase">Net Amount:</span>
              <span className="text-2xl font-black">${s.amount}</span>
            </div>
            <button className="w-full mt-6 p-2 border-2 border-black bg-primary font-bold uppercase text-sm">Download PDF</button>
          </div>
        ))}
        {mySlips.length === 0 && <p>No published payslips found.</p>}
      </div>
    </div>
  );
}
