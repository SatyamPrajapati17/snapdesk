
"use client";
import { useState } from "react";
import { useDataStore } from "@/store/data";

export default function AdminEmployeePage() {
  const { employees, addEmployee, updateEmployee } = useDataStore();
  const [showAdd, setShowAdd] = useState(false);
  const [newEmp, setNewEmp] = useState({ name: "", email: "" });

  const handleAdd = () => {
    addEmployee({
      id: 'emp_' + Date.now(),
      userId: 'u_' + Date.now(),
      name: newEmp.name,
      email: newEmp.email,
      role: 'employee',
      status: 'pending',
      contractStatus: 'none',
      idVerified: false,
    });
    setShowAdd(false);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-black uppercase">Employee Management</h1>
        <button 
          onClick={() => setShowAdd(true)}
          className="p-4 border-4 border-black bg-primary font-black uppercase"
        >
          + Add Employee
        </button>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 border-4 border-black shadow-[12px_12px_0px_0px_#0A0A0A] max-w-md w-full">
            <h2 className="text-2xl font-black uppercase mb-4">Add New Employee</h2>
            <div className="space-y-4">
              <div>
                <label className="block font-bold uppercase text-sm mb-1">Name</label>
                <input 
                  className="w-full p-2 border-4 border-black outline-none" 
                  value={newEmp.name} 
                  onChange={e => setNewEmp({...newEmp, name: e.target.value})} 
                />
              </div>
              <div>
                <label className="block font-bold uppercase text-sm mb-1">Email</label>
                <input 
                  className="w-full p-2 border-4 border-black outline-none" 
                  value={newEmp.email} 
                  onChange={e => setNewEmp({...newEmp, email: e.target.value})} 
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={() => setShowAdd(false)} className="flex-1 p-2 border-4 border-black bg-white font-bold uppercase">Cancel</button>
                <button onClick={handleAdd} className="flex-1 p-2 border-4 border-black bg-primary font-bold uppercase">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {employees.map(emp => (
          <div key={emp.id} className="p-4 border-4 border-black bg-white shadow-[4px_4px_0px_0px_#0A0A0A] flex justify-between items-center">
            <div>
              <p className="font-black uppercase text-lg">{emp.name}</p>
              <p className="text-sm opacity-70">{emp.email}</p>
              <div className="flex gap-2 mt-2">
                <span className="text-xs px-2 py-1 border-2 border-black bg-gray-100 font-bold uppercase">{emp.status}</span>
                <span className="text-xs px-2 py-1 border-2 border-black bg-gray-100 font-bold uppercase">{emp.contractStatus}</span>
                <span className={`text-xs px-2 py-1 border-2 border-black font-bold uppercase ${emp.idVerified ? 'bg-green-100' : 'bg-red-100'}`}>
                  ID: {emp.idVerified ? 'Verified' : 'Pending'}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => updateEmployee(emp.id, { contractStatus: 'sent' })}
                className="p-2 border-2 border-black bg-white text-xs font-bold uppercase hover:bg-primary"
              >
                Send Contract
              </button>
              <button 
                onClick={() => updateEmployee(emp.id, { idVerified: true, status: 'active' })}
                className="p-2 border-2 border-black bg-white text-xs font-bold uppercase hover:bg-green-400"
              >
                Approve
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
