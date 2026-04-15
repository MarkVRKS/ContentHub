import React, { useState } from 'react';
import { 
  Trash2, Copy, CheckCircle2, Sparkles, 
  LayoutGrid, X, CalendarPlus, Search, BookOpen, UserCircle, MessageSquareQuote
} from 'lucide-react';
import api from './api';
import { platformsInfo, getEmptyPlatform } from './constants';

export default function Templates({ library = [], projectId, refreshLibrary, refreshPosts }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0]);
  const [targetPlatform, setTargetPlatform] = useState("VK");
  const [insertingId, setInsertingId] = useState(null);
  
  // 🔥 НОВЫЙ СТЕЙТ ДЛЯ КРАСИВОГО УДАЛЕНИЯ 🔥
  const [templateToDelete, setTemplateToDelete] = useState(null);

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // 🔥 НОВАЯ ФУНКЦИЯ ПОДТВЕРЖДЕНИЯ УДАЛЕНИЯ 🔥
  const confirmDelete = async () => {
    if (!templateToDelete) return;
    try { 
      await api.deleteLibraryPrompt(templateToDelete); 
      refreshLibrary(); 
      setTemplateToDelete(null);
    } catch (e) { 
      alert("Ошибка при удалении. Проверьте соединение с сервером."); 
    }
  };

  const handleInsertToDay = async (tpl) => {
    try {
      const newPlatform = getEmptyPlatform();
      
      if (tpl.type === 'role_template') {
         newPlatform.step = 1;
         newPlatform.textPrompt.role = tpl.text;
      } else if (tpl.type === 'tone_template') {
         newPlatform.step = 1;
         newPlatform.textPrompt.toneOfVoice = tpl.text;
      } else {
         newPlatform.step = 2; 
         newPlatform.finalText = tpl.text;
      }

      await api.createPost({
        project_id: projectId,
        publish_date: targetDate,
        topic: tpl.title || "Пост из шаблона",
        platforms: { [targetPlatform]: newPlatform } 
      });
      refreshPosts(); 
      setInsertingId(null);
      alert("✅ Успешно добавлено в календарь!");
    } catch (e) { alert("Ошибка при создании поста!"); }
  };

  const filtered = (library || []).filter(tpl => {
    if (tpl.type === 'context') return false; 
    
    const matchProject = tpl.project_id === projectId || !tpl.project_id || tpl.project_id === 'mns';
    
    const safeTitle = (tpl.title || "").toLowerCase();
    const safeText = (tpl.text || "").toLowerCase();
    const search = searchTerm.toLowerCase();
    const matchSearch = safeTitle.includes(search) || safeText.includes(search);
    
    return matchProject && matchSearch;
  });

  const getBadge = (type) => {
     if (type === 'role_template') return <span className="text-[10px] font-black text-blue-500 uppercase bg-blue-500/10 px-3 py-1 rounded-lg flex items-center gap-1"><UserCircle className="w-3 h-3"/> Роль</span>;
     if (type === 'tone_template') return <span className="text-[10px] font-black text-emerald-500 uppercase bg-emerald-500/10 px-3 py-1 rounded-lg flex items-center gap-1"><MessageSquareQuote className="w-3 h-3"/> Tone of Voice</span>;
     return <span className="text-[10px] font-black text-[var(--accent)] uppercase bg-[var(--accent)]/10 px-3 py-1 rounded-lg flex items-center gap-1"><BookOpen className="w-3 h-3"/> Сценарий</span>;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500 w-full space-y-10 pb-20 text-left">
      
      {/* 🔥 КРАСИВАЯ МОДАЛКА УДАЛЕНИЯ 🔥 */}
      {templateToDelete && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[var(--bg-card)] border-2 border-red-500/30 w-full max-w-md rounded-[32px] p-8 md:p-10 shadow-[0_0_50px_rgba(239,68,68,0.2)] animate-in zoom-in-95">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 mx-auto relative overflow-hidden">
              <div className="absolute inset-0 bg-red-500/20 animate-ping"></div>
              <Trash2 className="w-10 h-10 text-red-500 relative z-10" />
            </div>
            <h3 className="text-2xl font-black text-[var(--text-main)] text-center mb-2 tracking-tight uppercase">Удалить шаблон?</h3>
            <p className="text-center text-[var(--text-muted)] font-medium mb-8 leading-relaxed text-sm">
              Это действие безвозвратно удалит выбранный шаблон из базы данных.
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setTemplateToDelete(null)} 
                className="flex-1 py-4 bg-[var(--bg-input)] text-[var(--text-main)] rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:bg-[var(--border-main)] active:scale-95"
              >
                Отмена
              </button>
              <button 
                onClick={confirmDelete} 
                className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-[0_10px_20px_rgba(239,68,68,0.3)] transition-all hover:bg-red-600 active:scale-95 flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Удалить
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-[var(--text-main)] tracking-tighter uppercase flex items-center gap-4">
             <LayoutGrid className="w-10 h-10 text-[var(--accent)]" /> База шаблонов
          </h2>
          <p className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-widest mt-2">Все ваши сохраненные промпты и сценарии</p>
        </div>
        <div className="relative w-full lg:w-96 group">
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-[var(--text-muted)] group-focus-within:text-[var(--accent)] transition-colors" />
          </div>
          <input
            type="text" placeholder="Найти шаблон..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-12 pr-4 py-5 bg-[var(--bg-card)] border-2 border-[var(--border-main)] rounded-3xl text-base font-bold text-[var(--text-main)] focus:border-[var(--accent)] outline-none transition-all shadow-sm"
          />
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filtered.map(tpl => (
            <div key={tpl.id} className="bg-[var(--bg-card)] p-8 rounded-[48px] border-2 border-[var(--border-main)] hover:border-[var(--accent)] transition-all shadow-sm flex flex-col gap-6 relative group overflow-hidden">
               <div className="flex justify-between items-start z-10">
                 <div className="space-y-3">
                    <div className="flex gap-2 flex-wrap">
                       {getBadge(tpl.type)}
                       {tpl.tags && tpl.tags.split(',').map(t => t.trim() ? <span key={t} className="text-[10px] font-black text-slate-500 uppercase bg-slate-500/10 px-3 py-1 rounded-lg">#{t.trim()}</span> : null)}
                    </div>
                    <h3 className="text-2xl font-black text-[var(--text-main)] tracking-tight leading-none">{tpl.title || "Без названия"}</h3>
                 </div>
                 <div className="flex gap-2">
                   <button onClick={() => handleCopy(tpl.id, tpl.text)} className="p-4 bg-[var(--bg-input)] rounded-2xl text-[var(--text-muted)] hover:text-[var(--accent)] transition-all border border-[var(--border-main)]">
                     {copiedId === tpl.id ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                   </button>
                   {/* 🔥 ТЕПЕРЬ КНОПКА ОТКРЫВАЕТ НАШУ КРАСИВУЮ МОДАЛКУ 🔥 */}
                   <button onClick={() => setTemplateToDelete(tpl.id)} className="p-4 bg-[var(--bg-input)] rounded-2xl text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-all border border-[var(--border-main)]"><Trash2 className="w-5 h-5" /></button>
                 </div>
               </div>
               <div className="bg-[var(--bg-input)] p-6 rounded-[32px] border border-[var(--border-main)] flex-1">
                  <pre className="text-sm font-medium text-[var(--text-muted)] whitespace-pre-wrap leading-relaxed font-mono line-clamp-[10] shadow-inner">{tpl.text}</pre>
               </div>
               <div>
                  {insertingId === tpl.id ? (
                    <div className="flex flex-col gap-3 animate-in slide-in-from-bottom-2">
                       <div className="flex gap-3">
                          <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} className="flex-1 bg-[var(--bg-input)] p-4 rounded-2xl border-2 border-[var(--border-main)] outline-none font-bold text-sm" />
                          <select value={targetPlatform} onChange={e => setTargetPlatform(e.target.value)} className="flex-1 bg-[var(--bg-input)] p-4 rounded-2xl border-2 border-[var(--border-main)] outline-none font-bold text-sm">
                             {platformsInfo.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                          </select>
                       </div>
                       <div className="flex gap-2">
                          <button onClick={() => handleInsertToDay(tpl)} className="flex-1 py-4 bg-[var(--accent)] text-white rounded-2xl font-black uppercase text-xs shadow-lg">Применить к дате</button>
                          <button onClick={() => setInsertingId(null)} className="p-4 bg-[var(--bg-input)] rounded-2xl border border-[var(--border-main)]"><X className="w-5 h-5" /></button>
                       </div>
                    </div>
                  ) : (
                    <button onClick={() => setInsertingId(tpl.id)} className="w-full py-5 bg-[var(--bg-input)] hover:bg-[var(--accent)] hover:text-white text-[var(--text-main)] rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-3 border border-[var(--border-main)]">
                      <CalendarPlus className="w-5 h-5" /> Использовать в календаре
                    </button>
                  )}
               </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-32 text-center bg-[var(--bg-card)] rounded-[64px] border-4 border-dashed border-[var(--border-main)]">
           <BookOpen className="w-20 h-20 text-[var(--text-muted)] mx-auto mb-6 opacity-20" />
           <h3 className="text-2xl font-black text-[var(--text-main)] uppercase tracking-tighter">База пуста</h3>
           <p className="text-[var(--text-muted)] font-bold mt-2 uppercase tracking-widest text-xs">Здесь появятся ваши сохраненные роли и сценарии</p>
        </div>
      )}
    </div>
  );
}