// выпадающий список
import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function CustomSelect({ label, value, options, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="relative w-full text-left">
      <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 pl-1">{label}</div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-[var(--bg-input)] border-2 border-[var(--border-main)] p-5 rounded-2xl hover:border-purple-400 transition-all group"
      >
        <span className="text-base font-black text-[var(--text-main)]">{value || "Выберите..."}</span>
        <ChevronDown className={`w-6 h-6 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--bg-card)] border-2 border-[var(--border-main)] shadow-2xl rounded-[24px] z-50 py-3 animate-in fade-in slide-in-from-top-2 overflow-hidden">
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => { onChange(opt); setIsOpen(false); }}
                className={`w-full text-left px-6 py-4 text-sm font-black transition-colors hover:bg-purple-50 dark:hover:bg-purple-900/30 ${value === opt ? 'text-purple-600 bg-purple-50/50' : 'text-[var(--text-main)]'}`}
              >
                {opt}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}