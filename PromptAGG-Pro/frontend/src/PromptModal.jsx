import React, { useState } from 'react';
import { X, Copy, CheckCircle2 } from 'lucide-react';

export default function PromptModal({ isOpen, onClose, promptText }) {
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(promptText);
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/80 backdrop-blur-2xl p-4 md:p-6 animate-in fade-in duration-500">
      <div className="bg-[var(--bg-card)] w-full max-w-5xl rounded-[48px] md:rounded-[64px] shadow-[0_50px_100px_rgba(0,0,0,0.5)] border border-white/10 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-500">
        
        {/* HEADER */}
        <div className="flex justify-between items-center p-8 md:p-12 border-b border-[var(--border-main)] bg-[var(--bg-card)] shrink-0">
          <h2 className="text-2xl md:text-4xl font-black text-[var(--text-main)] flex items-center gap-5 uppercase tracking-tighter leading-none">
            <div className="relative flex items-center justify-center w-8 h-8 md:w-10 md:h-10">
              <span className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-20"></span>
              <span className="relative w-4 h-4 md:w-5 md:h-5 bg-green-500 rounded-full shadow-[0_0_20px_rgba(34,197,94,0.6)]"></span>
            </div>
            ТЗ Сгенерировано
          </h2>
          <button onClick={onClose} className="w-14 h-14 md:w-16 md:h-16 bg-[var(--bg-input)] rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-all duration-300 group text-slate-400 shadow-sm border border-[var(--border-main)]">
            <X className="w-6 h-6 md:w-8 md:h-8 group-hover:rotate-90 transition-transform" />
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-8 md:p-12 flex-1 overflow-y-auto ideas-scroll bg-[var(--bg-app)]/30">
          <div className="bg-slate-950 p-8 md:p-10 rounded-[32px] md:rounded-[40px] shadow-inner border border-slate-800 relative group">
             <div className="absolute top-6 left-8 flex items-center gap-2.5 opacity-50 group-hover:opacity-100 transition-opacity">
                 <div className="w-3 h-3 rounded-full bg-red-500"></div>
                 <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                 <div className="w-3 h-3 rounded-full bg-green-500"></div>
             </div>
             
             <pre className="whitespace-pre-wrap font-mono text-sm md:text-base text-indigo-300 mt-8 leading-relaxed selection:bg-purple-500/30 selection:text-white">
               {promptText}
             </pre>
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-8 md:p-12 border-t border-[var(--border-main)] bg-[var(--bg-card)] shrink-0">
          <button
            onClick={handleCopy}
            className={`w-full py-6 md:py-8 rounded-[32px] font-black text-base md:text-xl uppercase tracking-[0.3em] transition-all shadow-2xl flex justify-center items-center gap-4 hover:scale-[1.01] active:scale-95 ${
              isCopied 
                ? 'bg-green-500 text-white shadow-green-500/30' 
                : 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/30'
            }`}
          >
            {isCopied ? <CheckCircle2 className="w-6 h-6 md:w-8 md:h-8" /> : <Copy className="w-6 h-6 md:w-8 md:h-8" />}
            {isCopied ? 'СКОПИРОВАНО В БУФЕР' : 'СКОПИРОВАТЬ ТЕКСТ'}
          </button>
        </div>

      </div>
    </div>
  );
}