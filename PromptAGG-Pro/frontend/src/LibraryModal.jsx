import React, { useState, memo } from 'react';
import { 
  X, Plus, Edit3, Trash2, Copy, CheckCircle2, 
  BookOpen, Sparkles, Layers, Zap, CalendarPlus, ChevronRight 
} from 'lucide-react';
import api from './api';
import { platformsInfo, getEmptyPlatform } from './constants'; // ДОБАВИЛИ platformsInfo

const LibraryModal = memo(({ isOpen, onClose, library, onAdd, onUpdate, onDelete, projectId, refreshPosts }) => {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', tags: '', text: '' });
  const [copiedId, setCopiedId] = useState(null);
  
  // Стейты для фичи "Добавить в календарь"
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0]);
  const [targetPlatform, setTargetPlatform] = useState('VK'); // НОВЫЙ СТЕЙТ ВЫБОРА СОЦСЕТИ
  const [insertingId, setInsertingId] = useState(null);

  if (!isOpen) return null;

  // --- ЛОГИКА ---
  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const startEdit = (tpl) => { 
    setEditId(tpl.id); 
    setForm({ name: tpl.name || tpl.title || '', tags: tpl.tags || '', text: tpl.text || '' }); 
    setShowForm(true); 
  };

  const submitForm = () => { 
    if (!form.name || !form.text) return alert("Заполните название и текст промпта!"); 
    const payload = { ...form, title: form.name, type: 'playbook' };
    if (editId) onUpdate(editId, payload); 
    else onAdd(payload); 
    resetForm(); 
  };

  const resetForm = () => { setForm({ name: '', tags: '', text: '' }); setEditId(null); setShowForm(false); };
  
  // Создание поста на выбранный день
  const handleInsertToDay = async (playbook) => {
    try {
      const newPlatform = getEmptyPlatform();
      newPlatform.step = 1; 
      newPlatform.promptTab = 'text';
      newPlatform.textPrompt.details = playbook.text;

      await api.createPost({
        project_id: projectId,
        publish_date: targetDate,
        topic: playbook.name || playbook.title || "Новый пост по сценарию",
        // ИСПРАВЛЕНИЕ: Теперь платформа берется из селектора, а не жестко VK
        platforms: { [targetPlatform]: newPlatform } 
      });
      
      refreshPosts(); 
      setInsertingId(null);
      onClose(); 
    } catch (e) {
      console.error(e);
      alert("Ошибка при создании поста!");
    }
  };

  const visibleLibrary = (library || []).filter(tpl => tpl.type !== 'context');

  const systemPlaybooks = [
    {
      id: 'sys-1', name: 'Продажа через боль (PAS)', tags: 'sales, conversion',
      text: 'Действуй как топовый SMM-копирайтер. Напиши продающий пост по формуле PAS (Problem-Agitation-Solution).\n1. Problem: Опиши боль целевой аудитории.\n2. Agitation: Усиль эту боль, покажи последствия.\n3. Solution: Представь продукт как идеальное решение.\nДобавь сильный Call-to-Action в конце.'
    },
    {
      id: 'sys-2', name: 'Прогрев к новинке (Teaser)', tags: 'launch, hype',
      text: 'Напиши интригующий пост-тизер для анонса нового продукта. Не называй продукт напрямую. Используй намеки, опиши эмоции. Задай аудитории вопрос в конце, чтобы собрать комментарии и догадки.'
    },
    {
      id: 'sys-3', name: 'Отработка возражений', tags: 'loyalty, trust',
      text: 'Напиши экспертный пост, который закрывает главное возражение клиентов. Используй спокойный, аргументированный тон. Разложи ценность продукта на составляющие (материалы, долговечность, сервис).'
    }
  ];

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-2xl animate-in fade-in duration-500">
      <div className="bg-[var(--bg-card)] rounded-[48px] max-w-[1400px] w-full shadow-[0_50px_100px_var(--accent-glow)] flex flex-col border border-[var(--border-main)] h-[90vh] relative overflow-hidden">
        
        {/* HEADER */}
        <div className="p-8 md:p-10 border-b border-[var(--border-main)] flex justify-between items-center bg-[var(--bg-card)] z-10 shrink-0">
          <div className="flex items-center gap-6">
            <div style={{ backgroundImage: 'linear-gradient(to top right, var(--grad-1), var(--grad-2))' }} className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl">
              <BookOpen className="text-white w-8 h-8" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-[var(--text-main)] tracking-tighter uppercase leading-none">Playbook Engine</h2>
              <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] mt-2">Матрица бизнес-сценариев</p>
            </div>
          </div>
          <div className="flex items-center gap-5">
            {!showForm && (
              <button 
                onClick={() => setShowForm(true)} 
                className="flex items-center gap-3 px-8 py-4 bg-[var(--bg-input)] text-[var(--text-main)] hover:text-[var(--accent)] hover:border-[var(--accent)] border border-[var(--border-main)] rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" /> Создать свой сценарий
              </button>
            )}
            <button onClick={onClose} className="w-14 h-14 bg-[var(--bg-input)] rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-all text-[var(--text-muted)] border border-[var(--border-main)] group">
              <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-hidden flex">
          
          {/* СЛАЙДЕР ФОРМЫ (CREATE/EDIT) */}
          <div className={`border-r border-[var(--border-main)] bg-[var(--bg-input)]/30 transition-all duration-500 flex flex-col overflow-hidden ${showForm ? 'w-[450px] opacity-100 p-10' : 'w-0 opacity-0 p-0 border-r-0'}`}>
            <h3 className="font-black text-xs uppercase tracking-[0.3em] mb-8 text-[var(--accent)] flex items-center gap-3">
              <Edit3 className="w-4 h-4" /> {editId ? 'Редактирование' : 'Новый сценарий'}
            </h3>
            <div className="space-y-6 flex-1 overflow-y-auto ideas-scroll pr-2">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Название сценария</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full p-6 bg-[var(--bg-card)] rounded-[24px] border-2 border-transparent focus:border-[var(--border-hover)] text-sm font-bold outline-none text-[var(--text-main)] shadow-sm transition-all" placeholder="Например: Продажа новинки..." />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Теги (через запятую)</label>
                <input value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} className="w-full p-6 bg-[var(--bg-card)] rounded-[24px] border-2 border-transparent focus:border-[var(--border-hover)] text-xs font-bold outline-none text-[var(--text-main)] shadow-sm transition-all" placeholder="sales, promo..." />
              </div>
              <div className="space-y-3 flex-1 flex flex-col">
                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Промпт (Инструкция для AI)</label>
                <textarea value={form.text} onChange={e => setForm({...form, text: e.target.value})} className="w-full flex-1 min-h-[200px] p-6 bg-[var(--bg-card)] rounded-[24px] border-2 border-transparent focus:border-[var(--border-hover)] text-xs font-medium outline-none resize-none text-[var(--text-main)] leading-relaxed shadow-sm transition-all" placeholder="Напиши подробное ТЗ для нейросети..." />
              </div>
            </div>
            <div className="pt-8 flex gap-4">
              <button onClick={resetForm} className="flex-1 py-5 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl hover:text-[var(--text-main)] transition-all">Отмена</button>
              <button onClick={submitForm} style={{ backgroundImage: 'linear-gradient(to right, var(--grad-1), var(--grad-2))' }} className="flex-[2] py-5 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-[0_10px_20px_var(--accent-glow)] hover:scale-[1.02] active:scale-95 transition-all">Сохранить</button>
            </div>
          </div>

          {/* ГЛАВНАЯ СЕТКА СЦЕНАРИЕВ */}
          <div className="flex-1 overflow-y-auto p-10 space-y-12 bg-[var(--bg-app)]/30 ideas-scroll">
            
            {/* СЕКЦИЯ: БАЗОВЫЕ СЦЕНАРИИ */}
            <div className="space-y-6">
              <h3 className="text-xs font-black uppercase tracking-[0.4em] text-[var(--text-muted)] flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-[var(--accent)]" /> Эталонные сценарии (System)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {systemPlaybooks.map(tpl => (
                  <div key={tpl.id} className="bg-[var(--bg-card)] p-8 rounded-[36px] border border-[var(--border-main)] hover:border-[var(--border-hover)] transition-all duration-300 flex flex-col shadow-sm hover:shadow-xl relative overflow-hidden group">
                    <div className="flex-1 z-10 relative">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex gap-2 flex-wrap">
                          {tpl.tags.split(',').map(t => <span key={t} className="text-[9px] font-black text-[var(--accent)] uppercase bg-[var(--bg-input)] px-2.5 py-1 rounded-lg">#{t.trim()}</span>)}
                        </div>
                        <button onClick={() => handleCopy(tpl.id, tpl.text)} className="p-3 bg-[var(--bg-input)] rounded-xl text-[var(--text-muted)] hover:text-[var(--accent)] transition-all" title="Скопировать текст">
                          {copiedId === tpl.id ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                      <h4 className="font-black text-xl text-[var(--text-main)] tracking-tight leading-tight mb-4">{tpl.name}</h4>
                      <p className="text-xs text-[var(--text-muted)] line-clamp-4 font-medium leading-relaxed">{tpl.text}</p>
                    </div>
                    
                    {/* КНОПКА: ИСПОЛЬЗОВАТЬ ДЛЯ ДНЯ */}
                    <div className="mt-8 z-10 relative">
                      {insertingId === tpl.id ? (
                        <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2">
                          <div className="flex items-center gap-2">
                            <input 
                              type="date" 
                              value={targetDate} 
                              onChange={(e) => setTargetDate(e.target.value)}
                              className="flex-1 bg-[var(--bg-input)] text-[var(--text-main)] text-xs font-bold p-3 rounded-xl border border-[var(--border-main)] outline-none focus:border-[var(--accent)]"
                            />
                            {/* СЕЛЕКТОР СОЦСЕТИ */}
                            <select 
                              value={targetPlatform} 
                              onChange={(e) => setTargetPlatform(e.target.value)}
                              className="flex-1 bg-[var(--bg-input)] text-[var(--text-main)] text-xs font-bold p-3 rounded-xl border border-[var(--border-main)] outline-none focus:border-[var(--accent)] appearance-none cursor-pointer"
                            >
                              {platformsInfo.map(p => (
                                <option key={p.id} value={p.id}>{p.label}</option>
                              ))}
                            </select>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleInsertToDay(tpl)} className="flex-1 p-3 bg-green-500 text-white rounded-xl font-black shadow-lg hover:bg-green-600 transition-all flex justify-center"><ChevronRight className="w-5 h-5"/></button>
                            <button onClick={() => setInsertingId(null)} className="p-3 bg-[var(--bg-input)] text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 border border-[var(--border-main)] rounded-xl transition-all"><X className="w-5 h-5"/></button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => setInsertingId(tpl.id)} className="w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 bg-[var(--bg-input)] text-[var(--text-main)] hover:bg-[var(--accent)] hover:text-white border border-[var(--border-main)] hover:border-transparent group-hover:border-[var(--accent)]">
                          <CalendarPlus className="w-4 h-4" /> Применить к дате
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* СЕКЦИЯ: КАСТОМНЫЕ СЦЕНАРИИ КОМАНДЫ */}
            <div className="space-y-6 pt-8 border-t border-[var(--border-main)]">
              <h3 className="text-xs font-black uppercase tracking-[0.4em] text-[var(--text-muted)] flex items-center gap-3">
                <Layers className="w-4 h-4 text-[var(--accent)]" /> Сценарии команды ({visibleLibrary.length})
              </h3>
              
              {visibleLibrary.length === 0 ? (
                <div className="w-full py-20 bg-[var(--bg-input)]/50 border-2 border-dashed border-[var(--border-main)] rounded-[40px] flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-[var(--bg-card)] rounded-full flex items-center justify-center mb-4 shadow-sm">
                    <Zap className="w-6 h-6 text-[var(--text-muted)] opacity-50" />
                  </div>
                  <p className="text-sm font-black text-[var(--text-main)] uppercase tracking-widest">Нет кастомных сценариев</p>
                  <p className="text-xs text-[var(--text-muted)] mt-2 font-medium">Создайте свой первый промпт, чтобы он появился здесь.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {visibleLibrary.map(tpl => (
                    <div key={tpl.id} className="bg-[var(--bg-card)] p-8 rounded-[40px] border border-[var(--border-main)] hover:border-[var(--border-hover)] transition-all group shadow-sm flex flex-col gap-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex gap-2 mb-3 flex-wrap">
                             {tpl.tags?.split(',').map(t => <span key={t} className="text-[10px] font-black text-[var(--accent)] uppercase bg-[var(--bg-input)] px-3 py-1.5 rounded-xl">#{t.trim()}</span>)}
                          </div>
                          <h4 className="font-black text-2xl text-[var(--text-main)] tracking-tight">{tpl.name || tpl.title}</h4>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleCopy(tpl.id, tpl.text)} className="w-12 h-12 bg-[var(--bg-input)] rounded-2xl flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--accent)] transition-all border border-[var(--border-main)]" title="Скопировать">
                            {copiedId === tpl.id ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                          </button>
                          <button onClick={() => startEdit(tpl)} className="w-12 h-12 bg-[var(--bg-input)] rounded-2xl flex items-center justify-center text-[var(--text-muted)] hover:text-blue-500 hover:bg-blue-500/10 transition-all"><Edit3 className="w-5 h-5"/></button>
                          <button onClick={() => onDelete(tpl.id)} className="w-12 h-12 bg-[var(--bg-input)] rounded-2xl flex items-center justify-center text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-all"><Trash2 className="w-5 h-5"/></button>
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <pre className="p-6 bg-[var(--bg-input)] rounded-[24px] font-mono text-[11px] text-[var(--text-muted)] group-hover:text-[var(--text-main)] border border-transparent transition-all overflow-x-auto whitespace-pre-wrap leading-relaxed min-h-[100px]">{tpl.text}</pre>
                      </div>

                      {/* КНОПКА: ИСПОЛЬЗОВАТЬ ДЛЯ ДНЯ (Custom) */}
                      <div className="mt-2">
                        {insertingId === tpl.id ? (
                          <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex items-center gap-2">
                              <input 
                                type="date" 
                                value={targetDate} 
                                onChange={(e) => setTargetDate(e.target.value)}
                                className="flex-1 bg-[var(--bg-input)] text-[var(--text-main)] text-xs font-bold p-3 rounded-xl border border-[var(--border-main)] outline-none focus:border-[var(--accent)]"
                              />
                              {/* СЕЛЕКТОР СОЦСЕТИ ДЛЯ КАСТОМНЫХ ПРОМПТОВ */}
                              <select 
                                value={targetPlatform} 
                                onChange={(e) => setTargetPlatform(e.target.value)}
                                className="flex-1 bg-[var(--bg-input)] text-[var(--text-main)] text-xs font-bold p-3 rounded-xl border border-[var(--border-main)] outline-none focus:border-[var(--accent)] appearance-none cursor-pointer"
                              >
                                {platformsInfo.map(p => (
                                  <option key={p.id} value={p.id}>{p.label}</option>
                                ))}
                              </select>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => handleInsertToDay(tpl)} className="flex-1 px-6 py-3 bg-[var(--accent)] text-white rounded-xl font-black shadow-lg hover:scale-[1.02] transition-all uppercase tracking-widest text-[10px]">Создать пост</button>
                              <button onClick={() => setInsertingId(null)} className="p-3 bg-[var(--bg-input)] text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 border border-[var(--border-main)] rounded-xl transition-all"><X className="w-5 h-5"/></button>
                            </div>
                          </div>
                        ) : (
                          <button onClick={() => setInsertingId(tpl.id)} className="w-full py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 bg-[var(--bg-input)] text-[var(--text-main)] hover:bg-[var(--accent)] hover:text-white border border-[var(--border-main)] hover:border-transparent group-hover:border-[var(--accent)]">
                            <CalendarPlus className="w-5 h-5" /> Применить к дате
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
});

export default LibraryModal;