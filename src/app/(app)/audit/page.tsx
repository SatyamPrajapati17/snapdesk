
"use client";
import { useDataStore } from "@/store/data";

export default function AuditPage() {
  const { auditLogs } = useDataStore();

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-black uppercase mb-8">Audit Log</h1>
      <div className="border-4 border-black bg-white shadow-[8px_8px_0px_0px_#0A0A0A]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b-4 border-black bg-primary">
              <th className="p-4 font-black uppercase">Timestamp</th>
              <th className="p-4 font-black uppercase">User</th>
              <th className="p-4 font-black uppercase">Action</th>
              <th className="p-4 font-black uppercase">Details</th>
            </tr>
          </thead>
          <tbody>
            {auditLogs.map((log, i) => (
              <tr key={i} className="border-b-2 border-black">
                <td className="p-4 text-sm font-medium">{log.timestamp}</td>
                <td className="p-4 font-bold uppercase">{log.user}</td>
                <td className="p-4 font-black uppercase">{log.action}</td>
                <td className="p-4 text-sm">{log.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
