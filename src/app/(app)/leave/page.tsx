
"use client";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useDataStore } from "@/store/data";

export default function EmployeeLeavePage() {
  const { user } = useAuth();
  const { employees, addLeaveRequest } = useDataStore();
  const emp = employees.find(e => e.userId === user?.id);
  
  const [form, setForm] = useState({ startDate: "", endDate: "", reason: "" });

  const handleSubmit = () => {
    if (!emp) return;
    addLeaveRequest({
      id: 'leave_' + Date.now(),
      employeeId: emp.id,
      startDate: form.startDate,
      endDate: form.endDate,
      reason: form.reason,
      status: 'pending',
      managerId: 'mgr1', // Mock manager
    });
    setForm({ startDate: "", endDate: "", reason: "" });
    alert("Leave application submitted!");
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-4xl font-black uppercase mb-8">Apply for Leave</h1>
      
      <div className="p-6 border-4 border-black bg-white shadow-[8px_8px_0px_0px_#0A0A0A] mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold uppercase">My Balance: {emp?.leaveBalance} days</h2>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold uppercase text-sm mb-1">Start Date</label>
              <input type="date" className="w-full p-2 border-4 border-black outline-none" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} />
            </div>
            <div>
              <label className="block font-bold uppercase text-sm mb-1">End Date</label>
              <input type="date" className="w-full p-2 border-4 border-black outline-none" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} />
            </div>
          </div>
          <div>
            <label className="block font-bold uppercase text-sm mb-1">Reason</label>
            <textarea className="w-full p-2 border-4 border-black outline-none" value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} />
          </div>
          <button onClick={handleSubmit} className="w-full p-4 border-4 border-black bg-primary font-black uppercase">Submit Request</button>
        </div>
      </div>
    </div>
  );
}
