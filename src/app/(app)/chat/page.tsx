
"use client";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useDataStore } from "@/store/data";

export default function ChatPage() {
  const { user } = useAuth();
  const { employees, leaveRequests, payslips } = useDataStore();
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([
    { role: 'ai', content: 'Hello! I am your SnapDesk Assistant. Ask me about your deadlines, payroll, or leave.' }
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input) return;
    const userMsg = { role: 'user' as const, content: input };
    setMessages(prev => [...prev, userMsg]);
    
    // Mock AI response based on keywords
    let response = "I'm not sure about that. Could you be more specific?";
    const query = input.toLowerCase();
    
    if (query.includes('deadline')) {
      response = "You have one upcoming deadline: Sign your contract by 2026-10-25.";
    } else if (query.includes('leave')) {
      const myLeaves = leaveRequests.filter(l => l.employeeId === 'emp1'); // Mock
      response = myLeaves.length > 0 ? `You have ${myLeaves.length} leave request(s).` : "You have no leave requests.";
    } else if (query.includes('payroll')) {
      response = "Your latest payslip for October is published and available in the Payroll section.";
    }
    
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'ai', content: response }]);
    }, 1000);
    setInput("");
  };

  return (
    <div className="max-w-3xl mx-auto h-[80vh] flex flex-col">
      <h1 className="text-4xl font-black uppercase mb-8">Agent Chat</h1>
      <div className="flex-1 border-4 border-black bg-white shadow-[8px_8px_0px_0px_#0A0A0A] overflow-y-auto p-4 mb-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-3 border-2 border-black max-w-[80%] font-bold ${m.role === 'user' ? 'bg-primary' : 'bg-white'}`}>
              {m.content}
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input 
          className="flex-1 p-4 border-4 border-black outline-none font-bold" 
          value={input} 
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Ask me anything..."
        />
        <button onClick={handleSend} className="p-4 border-4 border-black bg-primary font-black uppercase">Send</button>
      </div>
    </div>
  );
}
