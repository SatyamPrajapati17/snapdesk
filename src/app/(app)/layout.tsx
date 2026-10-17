
"use client";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  if (!isAuthenticated) {
    return <div className="p-10">Not authenticated. Please <Link href="/login" className="underline">login</Link>.</div>;
  }

  const navItems = [
    { label: "Dashboard", href: "/dashboard", roles: ["admin", "manager", "employee"] },
    { label: "Documents", href: "/docs", roles: ["admin", "manager", "employee"] },
    { label: "Chat", href: "/chat", roles: ["admin", "manager", "employee"] },
    { label: "Employees", href: "/employees", roles: ["admin"] },
    { label: "Leave", href: "/leave", roles: ["admin", "manager", "employee"] },
    { label: "Payroll", href: "/payroll", roles: ["admin"] },
    { label: "Audit", href: "/audit", roles: ["admin"] },
  ];

  const filteredNav = navItems.filter(item => item.roles.includes(user?.role || 'employee'));

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      <nav className="hidden md:flex flex-col w-64 border-r-4 border-black p-6 bg-white">
        <h1 className="text-2xl font-black uppercase mb-8">SnapDesk</h1>
        <div className="space-y-4 flex-1">
          {filteredNav.map(item => (
            <Link 
              key={item.href} 
              href={item.href} 
              className="block p-3 border-2 border-black font-bold uppercase hover:bg-primary transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div className="mt-auto border-t-4 border-black pt-4">
          <p className="font-bold text-sm uppercase mb-2">{user?.name} ({user?.role})</p>
          <button 
            onClick={() => { useAuth.getState().logout(); router.push("/login"); }}
            className="w-full p-2 border-2 border-black font-bold uppercase text-xs hover:bg-red-500"
          >
            Logout
          </button>
        </div>
      </nav>

      <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8">
        {children}
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t-4 border-black flex justify-around p-2 z-50">
        {filteredNav.slice(0, 4).map(item => (
          <Link 
            key={item.href} 
            href={item.href} 
            className="flex flex-col items-center p-2 font-bold text-xs uppercase"
          >
            <span className="p-2 border-2 border-black bg-white">{item.label.substring(0, 1)}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
