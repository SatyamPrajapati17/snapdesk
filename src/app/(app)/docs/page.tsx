
"use client";
import { useState } from "react";
import { getAIProvider } from "@/lib/ai";
import { ExtractionResult } from "@/lib/ai/types";

export default function DocsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExtractionResult | null>(null);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const ai = getAIProvider();
      const res = await ai.extractDocument(file);
      setResult(res);
    } catch (e) {
      alert("Extraction failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-black uppercase mb-8">Document Assistant</h1>
      
      <div className="p-8 border-4 border-black bg-white shadow-[8px_8px_0px_0px_#0A0A0A] mb-8">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <input 
            type="file" 
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="flex-1 p-2 border-4 border-black outline-none"
          />
          <button 
            onClick={handleUpload}
            disabled={!file || loading}
            className="p-4 border-4 border-black bg-primary font-black uppercase disabled:bg-gray-300"
          >
            {loading ? "Extracting..." : "Snap Action"}
          </button>
        </div>
      </div>

      {result && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-6 border-4 border-black bg-white shadow-[8px_8px_0px_0px_#0A0A0A]">
            <h2 className="text-2xl font-black uppercase mb-4 border-b-4 border-black pb-2">Extracted Fields</h2>
            <div className="space-y-4">
              {result.fields.map((f, i) => (
                <div key={i} className="flex justify-between border-b-2 border-black pb-1">
                  <span className="font-bold uppercase text-sm">{f.label}</span>
                  <span className="font-medium">{f.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 border-4 border-black bg-white shadow-[8px_8px_0px_0px_#0A0A0A]">
            <h2 className="text-2xl font-black uppercase mb-4 border-b-4 border-black pb-2">Risk Flags</h2>
            <div className="space-y-4">
              {result.risks.map((r, i) => (
                <div key={i} className={`p-3 border-2 border-black ${r.level === 'high' ? 'bg-red-100' : 'bg-yellow-100'}`}>
                  <p className="font-bold uppercase text-xs mb-1">Risk: {r.level}</p>
                  <p className="font-bold mb-2">{r.message}</p>
                  <p className="text-xs italic opacity-70">"{r.snippet}"</p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 border-4 border-black bg-white shadow-[8px_8px_0px_0px_#0A0A0A] md:col-span-2">
            <h2 className="text-2xl font-black uppercase mb-4 border-b-4 border-black pb-2">Deadlines & Reminders</h2>
            <div className="flex flex-wrap gap-4">
              {result.deadlines.map((d, i) => (
                <div key={i} className="p-3 border-2 border-black bg-primary font-bold uppercase flex justify-between items-center">
                  <span>{d.date}: {d.description}</span>
                  <button className="ml-4 p-1 border-2 border-black bg-white text-xs hover:bg-black hover:text-white">Remind Me</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
