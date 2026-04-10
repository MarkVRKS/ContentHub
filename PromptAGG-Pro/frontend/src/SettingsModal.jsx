import React, { useState, useEffect } from 'react';
import { 
  X, Sun, Moon, Palette, Check, Settings2, 
  Github, ExternalLink, Sparkles, Power, 
  Save, Fingerprint, CloudLightning, ShieldCheck, Database
} from 'lucide-react';
import api from './api';

export default function SettingsModal({ 
  isOpen, onClose, currentTheme, setTheme, projectId, 
  projectContext, onSaveContext, setRunTutorial, onOpenDataHub
}) {
  const [contextForm, setContextForm] = useState({ brand: '', style: '', typo: '' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && projectContext) {
      setContextForm(projectContext);
    }
  }, [isOpen, projectContext]);

  const themes = [
    { id: 'light', label: 'Pure Light', icon: Sun, color: 'bg-white', activeClass: 'border-purple-500 ring-4 ring-purple-500/10' },
    { id: 'dark', label: 'Obsidian Night', icon: Moon, color: 'bg-slate-900', activeClass: 'border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.2)]' },
    { id: 'titanium', label: 'Titanium Glass', icon: ShieldCheck, color: 'bg-zinc-950', activeClass: 'border-cyan-400 shadow-[0_0_25px_rgba(34,211,238,0.2)] text-cyan-400' },
    { id: 'aurora', label: 'Aurora Studio', icon: CloudLightning, color: 'bg-indigo-950', activeClass: 'border-pink-500 shadow-[0_0_30px_rgba(255,0,200,0.3)] text-pink-400' },
  ];

  const handleSave = async () => {
    setIsSaving(true);
    await onSaveContext(contextForm);
    setTimeout(() => setIsSaving(false), 800);
  };

  const handleShutdown = async () => {
    if (window.confirm("Завершить работу системы?")) {
      try { await api.shutdownServer(); window.close(); } catch (e) { alert("Система офлайн."); }
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* LUXURY OVERLAY */}
      <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[500] animate-in fade-in duration-500" onClick={onClose} />

      <div className="fixed right-0 top-0 h-full w-full max-w-[500px] glass-effect z-[510] shadow-[-40px_0_100px_rgba(0,0,0,0.5)] flex flex-col animate-in slide-in-from-right duration-500 ease-out">
        
        {/* HEADER */}
        <div className="p-10 border-b border-[var(--border-main)] flex justify-between items-center bg-white/5">
          <div>
            <h2 className="text-3xl font-black text-[var(--text-main)] tracking-tighter flex items-center gap-4 uppercase">
              <Settings2 className="w-8 h-8 text-purple-500 animate-accent" /> Настройки
            </h2>
            <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] mt-2 opacity-60">ID: {projectId}</p>
          </div>
          <button onClick={onClose} className="w-14 h-14 bg-[var(--bg-input)] rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-all duration-300">
            <X className="w-8 h-8" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto ideas-scroll p-10 space-y-12">
          
          {/* SECTION: BRAND DATA */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Fingerprint className="w-5 h-5 text-purple-500" />
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Бренд-контекст</h3>
              </div>
              
              {/* НОВАЯ КНОПКА DATA HUB */}
              <button 
                onClick={() => { onClose(); onOpenDataHub(); }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500 text-blue-500 hover:text-white rounded-xl transition-all text-[10px] font-black uppercase tracking-widest border border-blue-500/20"
              >
                <Database className="w-3 h-3" /> AGG FORMAT
              </button>
            </div>
            
            <div className="space-y-5 bg-[var(--bg-input)] p-8 rounded-[40px] border border-[var(--border-main)] shadow-inner">
              <div className="space-y-3">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Суть проекта</span>
                <textarea 
                  value={contextForm.brand} 
                  onChange={e => setContextForm({...contextForm, brand: e.target.value})}
                  className="w-full bg-[var(--bg-card)] rounded-[24px] p-6 text-sm font-medium outline-none border-2 border-transparent focus:border-purple-500 transition-all resize-none h-32 shadow-sm"
                  placeholder="О чем ваш бренд?.."
                />
              </div>
              <div className="space-y-3">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Визуальный стиль</span>
                <textarea 
                  value={contextForm.style} 
                  onChange={e => setContextForm({...contextForm, style: e.target.value})}
                  className="w-full bg-[var(--bg-card)] rounded-[24px] p-6 text-sm font-medium outline-none border-2 border-transparent focus:border-purple-500 transition-all resize-none h-32 shadow-sm"
                  placeholder="Опишите фото-стиль, цвета..."
                />
              </div>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className={`w-full py-6 rounded-[24px] font-black text-xs uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 shadow-xl ${
                  isSaving ? 'bg-green-500 text-white scale-95' : 'bg-slate-900 dark:bg-purple-600 text-white hover:scale-[1.02] active:scale-95 shadow-purple-500/20'
                }`}
              >
                {isSaving ? <Check className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                {isSaving ? 'Синхронизировано' : 'Обновить данные'}
              </button>
            </div>
          </div>

          {/* SECTION: THEMES */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Palette className="w-5 h-5 text-cyan-500" />
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Атмосфера</h3>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`flex items-center justify-between p-6 rounded-[32px] border-2 transition-all duration-300 ${
                    currentTheme === t.id 
                      ? t.activeClass 
                      : 'border-transparent bg-[var(--bg-input)] opacity-60 hover:opacity-100 hover:border-[var(--border-main)]'
                  }`}
                >
                  <div className="flex items-center gap-5">
                    <div className={`w-14 h-14 rounded-2xl ${t.color} flex items-center justify-center shadow-lg border border-white/10`}>
                      <t.icon className="w-7 h-7" />
                    </div>
                    <span className="font-black text-base tracking-tight">{t.label}</span>
                  </div>
                  {currentTheme === t.id && <div className="w-3 h-3 bg-current rounded-full animate-ping" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* FOOTER: SYSTEM & LINKS */}
        <div className="p-10 border-t border-[var(--border-main)] space-y-6 bg-white/5">
          <button 
            onClick={() => { onClose(); setRunTutorial(true); }}
            className="w-full py-5 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-[24px] transition-all font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 group"
          >
            <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
            Пройти обучение
          </button>

          <div className="grid grid-cols-2 gap-4">
            <a 
              href="https://github.com/MarkVRKS/PromptAGG" 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center justify-center gap-3 p-5 bg-slate-900 text-white rounded-[24px] hover:bg-black transition-all active:scale-95 shadow-xl"
            >
              <Github className="w-5 h-5" />
              <span className="text-[10px] font-black uppercase tracking-widest">GitHub</span>
            </a>
            <button 
              onClick={handleShutdown}
              className="flex items-center justify-center gap-3 p-5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-[24px] transition-all font-black text-[10px] uppercase tracking-widest"
            >
              <Power className="w-5 h-5" />
              <span>Offline</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}