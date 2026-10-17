
"use client";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-4xl font-black uppercase mb-8">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 border-4 border-black bg-primary shadow-[4px_4px_0px_0px_#0A0A0A]">
          <h2 className="text-xl font-bold uppercase mb-2">Welcome</h2>
          <p className="text-lg font-medium">Hello, {user?.name}!</p>
        </div>
        <div className="p-6 border-4 border-black bg-white shadow-[4px_4px_0px_0px_#0A0A0A]">
          <h2 className="text-xl font-bold uppercase mb-2">Your Role</h2>
          <p className="text-lg font-medium uppercase">{user?.role}</p>
        </div>
        <div className="p-6 border-4 border-black bg-white shadow-[4px_4px_0px_0px_#0A0A0A]">
          <h2 className="text-xl font-bold uppercase mb-2">Status</h2>
          <p className="text-lg font-medium">Active</p>
        </div>
      </div>
    </div>
  );
}
