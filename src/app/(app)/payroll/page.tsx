
"use client";
import { useDataStore } from "@/store/data";

export default function PayrollAdminPage() {
  const { employees, payslips, addPayslip, updatePayslip } = useDataStore();

  const runPayroll = () => {
    employees.forEach(emp => {
      addPayslip({
        id: 'slip_' + emp.id + '_' + new Date().getMonth(),
        employeeId: emp.id,
        month: new Date().toLocaleString('default', { month: 'long' }),
        amount: 5000, // Mock amount
        status: 'draft',
      });
    });
    alert("Payroll generated as draft");
  };

  const publishPayroll = () => {
    payslips.forEach(s => {
      if (s.status === 'draft') updatePayslip(s.id, { status: 'published' });
    });
    alert("Payroll published!");
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-black uppercase">Payroll Management</h1>
        <div className="flex gap-4">
          <button onClick={runPayroll} className="p-4 border-4 border-black bg-white font-black uppercase hover:bg-primary">Run Payroll</button>
          <button onClick={publishPayroll} className="p-4 border-4 border-black bg-primary font-black uppercase hover:bg-black hover:text-white">Publish All</button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {payslips.map(s => (
          <div key={s.id} className="p-4 border-4 border-black bg-white shadow-[4px_4px_0px_0px_#0A0A0A] flex justify-between items-center">
            <div>
              <p className="font-black uppercase">{s.employeeId} - {s.month}</p>
              <p className="text-lg font-bold">${s.amount}</p>
            </div>
            <span className={`px-2 py-1 border-2 border-black font-bold uppercase text-xs ${s.status === 'published' ? 'bg-green-100' : 'bg-yellow-100'}`}>
              {s.status}
            </span>
          </div>
        ))}
        {payslips.length === 0 && <p>No payroll data.</p>}
      </div>
    </div>
  );
}
