
"use client";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { authService } from "@/lib/auth";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login: mockLogin } = useAuth();
  const router = useRouter();

  const handleLogin = async (role: "admin" | "manager" | "employee") => {
    if (!email) {
      alert("Please enter email");
      return;
    }

    if (process.env.NEXT_PUBLIC_USE_MOCK === 'true') {
      mockLogin(email, role);
      router.push("/dashboard");
    } else {
      try {
        await authService.login(email, password || 'Employee@123'); // Default pass for demo
        router.push("/dashboard");
      } catch (e: any) {
        alert("Login failed: " + e.message);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="max-w-md w-full p-8 border-4 border-black bg-white shadow-[8px_8px_0px_0px_#0A0A0A]">
        <h1 className="text-4xl font-black uppercase mb-2">SnapDesk</h1>
        <p className="text-xl font-bold mb-8 uppercase italic">Snap it. Solve it.</p>
        
        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block font-bold uppercase text-sm mb-1">Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 border-4 border-black outline-none"
                placeholder="email@demo.test"
              />
            </div>
            <div>
              <label className="block font-bold uppercase text-sm mb-1">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border-4 border-black outline-none"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <button 
              onClick={() => handleLogin("admin")}
              className="w-full p-4 border-4 border-black bg-primary font-black uppercase hover:bg-black hover:text-white transition-colors"
            >
              Login as Admin
            </button>
            <button 
              onClick={() => handleLogin("manager")}
              className="w-full p-4 border-4 border-black bg-white font-black uppercase hover:bg-black hover:text-white transition-colors"
            >
              Login as Manager
            </button>
            <button 
              onClick={() => handleLogin("employee")}
              className="w-full p-4 border-4 border-black bg-white font-black uppercase hover:bg-black hover:text-white transition-colors"
            >
              Login as Employee
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
