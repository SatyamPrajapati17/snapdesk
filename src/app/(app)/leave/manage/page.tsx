
"use client";
import { useDataStore } from "@/store/data";

export default function ManagerLeavePage() {
  const { leaveRequests, updateLeaveRequest, updateEmployee } = useDataStore();

  const handleDecision = (id: string, status: 'approved' | 'rejected', empId: string) => {
    updateLeaveRequest(id, { status });
    if (status === 'approved') {
      updateEmployee(empId, { leaveBalance: 15 }); // Mock subtraction
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-black uppercase mb-8">Leave Approvals</h1>
      <div className="grid grid-cols-1 gap-4">
        {leaveRequests.filter(r => r.status === 'pending').map(req => (
          <div key={req.id} className="p-4 border-4 border-black bg-white shadow-[4px_4px_0px_0px_#0A0A0A] flex justify-between items-center">
            <div>
              <p className="font-black uppercase">{req.employeeId} - {req.reason}</p>
              <p className="text-sm">{req.startDate} to {req.endDate}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleDecision(req.id, 'approved', req.employeeId)} className="p-2 border-2 border-black bg-green-400 font-bold uppercase text-xs">Approve</button>
              <button onClick={() => handleDecision(req.id, 'rejected', req.employeeId)} className="p-2 border-2 border-black bg-red-400 font-bold uppercase text-xs">Reject</button>
            </div>
          </div>
        ))}
        {leaveRequests.filter(r => r.status === 'pending').length === 0 && <p>No pending requests.</p>}
      </div>
    </div>
  );
}
