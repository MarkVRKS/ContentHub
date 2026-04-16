import React, { useState, memo, useRef, useEffect } from 'react';
import { Trash2, Link, CheckCircle2, Sparkles, Target, Zap, LayoutList, Copy, ExternalLink, ArrowRight, Layers, UserCircle, MessageSquareQuote, ChevronDown, Plus, Check, BookOpen, Save, X } from 'lucide-react';
import api from './api';
import { platformsInfo, getEmptyPlatform } from './constants';

const TemplateManager = ({ title, icon: Icon, typeKey, value, onChange, placeholder, projectId, baseOptions = [], recentOptions = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (isOpen) fetchTemplates();
  }, [isOpen]);

  const fetchTemplates = async () => {
    try {
      const res = await api.getLibrary();
      setTemplates((res.data || []).filter(i => i.type === typeKey && i.project_id === projectId));
    } catch(e) { console.error("Ошибка загрузки шаблонов:", e); }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      await api.createLibraryPrompt({ 
        type: typeKey, 
        title: newTitle.trim(), 
        text: (value || "").trim() || newTitle.trim(),
        project_id: projectId
      });
      setNewTitle('');
      setIsAdding(false);
      fetchTemplates();
    } catch(e) { console.error("Ошибка добавления:", e); }
  };

  const handleDelete = async (e, id) => {
    e.preventDefault();
    try {
      await api.deleteLibraryPrompt(id);
      fetchTemplates();
    } catch(e) { console.error("Ошибка удаления:", e); }
  };

  return (
    <div className="relative w-full">
       <div className="flex items-center justify-between mb-3 px-3">
         <label className="text-[10px] font-black text-[var(--text-muted)] uppercase flex items-center gap-2 tracking-widest">
            <Icon className="w-3 h-3"/> {title}
         </label>
         <button onClick={() => setIsOpen(!isOpen)} className="text-[10px] font-black text-[var(--accent)] uppercase tracking-widest hover:underline flex items-center gap-1 transition-all hover:scale-105 active:scale-95 bg-[var(--accent)]/10 px-3 py-1.5 rounded-lg border border-[var(--accent)]/20">
            Шаблоны <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
         </button>
       </div>

       {isOpen && (
         <div className="absolute top-10 left-0 w-[calc(100%+32px)] -ml-4 bg-[var(--bg-card)] border-2 border-[var(--border-main)] rounded-2xl shadow-2xl z-[900] flex flex-col">
            <div className="p-3 border-b border-[var(--border-main)] bg-[var(--bg-input)] flex justify-between items-center">
               <span className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Быстрый выбор</span>
               <div className="flex gap-2">
                 <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white"><Trash2 className="w-3 h-3" /></button>
               </div>
            </div>
            
            <div className="max-h-64 overflow-y-auto ideas-scroll p-2 bg-[var(--bg-card)]">
               {baseOptions.length > 0 && <div className="text-[8px] text-[var(--text-muted)] font-black uppercase px-2 pt-2 pb-1 opacity-50 tracking-widest">Базовые</div>}
               {baseOptions.map(opt => (
                 <button key={opt} onClick={() => { onChange(opt); setIsOpen(false); }} className="w-full text-left text-xs font-bold p-2.5 hover:bg-[var(--bg-input)] rounded-xl text-[var(--text-main)] transition-all truncate border border-transparent hover:border-[var(--border-main)]">
                   {opt}
                 </button>
               ))}

               {recentOptions.length > 0 && <div className="text-[8px] text-[var(--text-muted)] font-black uppercase px-2 pt-4 pb-1 opacity-50 tracking-widest">Последние заполненные</div>}
               {recentOptions.map(opt => (
                 <button key={opt} onClick={() => { onChange(opt); setIsOpen(false); }} className="w-full text-left text-xs font-bold p-2.5 hover:bg-[var(--bg-input)] rounded-xl text-[var(--text-main)] transition-all truncate border border-transparent hover:border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/5 mt-1">
                   {opt}
                 </button>
               ))}

               <div className="flex justify-between items-center px-2 pt-4 pb-1 border-t border-[var(--border-main)] mt-3">
                 <span className="text-[8px] text-[var(--text-muted)] font-black uppercase opacity-50 tracking-widest">Сохраненные шаблоны</span>
                 <Plus onClick={(e) => { e.stopPropagation(); setIsAdding(true); }} className="w-3 h-3 text-[var(--text-muted)] hover:text-[var(--accent)] cursor-pointer" />
               </div>
               
               {isAdding && (
                 <div className="flex gap-2 p-1 animate-in slide-in-from-top-2">
                   <input autoFocus value={newTitle} onChange={e=>setNewTitle(e.target.value)} placeholder="Название..." className="w-full bg-[var(--bg-input)] text-xs p-2 rounded-lg outline-none font-bold text-[var(--text-main)] focus:border-[var(--accent)] border border-transparent" />
                   <button onClick={handleAdd} className="bg-[var(--accent)] text-white p-2 rounded-lg"><Check className="w-3 h-3"/></button>
                 </div>
               )}

               {templates.map(t => (
                 <div key={t.id} className="flex items-center justify-between group/item p-1">
                    <button onClick={() => { onChange(t.text); setIsOpen(false); }} className="flex-1 text-left text-xs font-bold p-2 hover:bg-[var(--bg-input)] rounded-xl text-[var(--text-main)] hover:text-[var(--accent)] truncate border border-transparent hover:border-[var(--border-main)]">
                      {t.title}
                    </button>
                    <button onClick={(e) => handleDelete(e, t.id)} className="p-2 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 rounded-xl opacity-0 group-hover/item:opacity-100 border border-transparent hover:border-red-500/20"><Trash2 className="w-3 h-3"/></button>
                 </div>
               ))}
               {templates.length === 0 && !isAdding && <div className="text-center py-4 text-[9px] text-[var(--text-muted)] uppercase font-black opacity-30 tracking-widest">Пусто</div>}
            </div>
         </div>
       )}

       <textarea
          rows="3"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent outline-none font-bold text-sm text-[var(--text-main)] px-3 placeholder-[var(--text-muted)] resize-none whitespace-pre-wrap break-words ideas-scroll"
       />
    </div>
  );
};

const PostCard = memo(function PostCard({ post, refreshPosts, refreshLibrary, onOpenPrompt, projectContext, initialPlatform, projectId, allPosts }) {
  const [localPost, setLocalPost] = useState(post);
  
  const existingPlatforms = Object.keys(post?.platforms || {});
  const [activePlatform, setActivePlatform] = useState(initialPlatform || (existingPlatforms.length > 0 ? existingPlatforms[0] : null));
  
  const textareaRef = useRef(null);
  const steps = ["Бриф", "Промпт", "СММ", "Дизайн", "Готово"];

  // 🔥 СОСТОЯНИЕ ДЛЯ КРАСИВОЙ МОДАЛКИ СОХРАНЕНИЯ 🔥
  const [savePlaybookModal, setSavePlaybookModal] = useState({ open: false, title: '', tags: '' });

  useEffect(() => { setLocalPost(post); }, [post]);

  useEffect(() => {
    if (initialPlatform) {
      setActivePlatform(initialPlatform);
      if (!localPost.platforms || !localPost.platforms[initialPlatform]) {
        const updatedPlatforms = { ...(localPost.platforms || {}), [initialPlatform]: getEmptyPlatform() };
        const updatedPost = { ...localPost, platforms: updatedPlatforms };
        setLocalPost(updatedPost);
        api.updatePost(localPost.id, updatedPost).catch(e => console.error("Ошибка:", e));
      }
    }
  }, [initialPlatform, localPost.id]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [localPost.platforms?.[activePlatform]?.topic, localPost.topic, activePlatform]);

  //  ТАЙМЕР ДЛЯ ЗАЩИТЫ ОТ DDoS
  const saveTimeoutRef = useRef(null);

  const saveToDB = (updatedPost) => {
    // Если юзер продолжает быстро печатать - сбрасываем старый таймер
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    
    // Ждем 600 миллисекунд тишины перед отправкой на сервер
    saveTimeoutRef.current = setTimeout(async () => {
      try { 
        await api.updatePost(updatedPost.id, updatedPost); 
      } catch (e) { 
        console.error("Ошибка сохранения в БД:", e); 
      }
    }, 600);
  };

  const changeTab = (platId) => {
    setActivePlatform(platId);
    if (!localPost.platforms?.[platId]) {
      const updatedPost = { ...localPost, platforms: { ...(localPost.platforms || {}), [platId]: getEmptyPlatform() } };
      setLocalPost(updatedPost);
      saveToDB(updatedPost);
    }
  };

  const updatePlatformData = (field, value) => {
    const currentPlatform = localPost.platforms?.[activePlatform] || getEmptyPlatform();
    const updatedPost = { ...localPost, platforms: { ...localPost.platforms, [activePlatform]: { ...currentPlatform, [field]: value } } };
    setLocalPost(updatedPost);
    saveToDB(updatedPost);
  };

  const updatePromptData = (promptType, field, value) => {
    const currentPlatform = localPost.platforms?.[activePlatform] || getEmptyPlatform();
    const currentPrompt = currentPlatform[promptType] || getEmptyPlatform()[promptType];
    const updatedPost = { ...localPost, platforms: { ...localPost.platforms, [activePlatform]: { ...currentPlatform, [promptType]: { ...currentPrompt, [field]: value } } } };
    setLocalPost(updatedPost);
    saveToDB(updatedPost);
  };

  const toggleColor = (color) => {
    const currentPlatform = localPost.platforms?.[activePlatform] || getEmptyPlatform();
    const vp = currentPlatform.visualPrompt || getEmptyPlatform().visualPrompt;
    const currentColors = vp.colors || [];
    const newColors = currentColors.includes(color) ? currentColors.filter(c => c !== color) : [...currentColors, color];
    updatePlatformData('visualPrompt', { ...vp, colors: newColors });
  };

  const setStep = (num) => updatePlatformData('step', num);

  const buildPromptString = () => {
    const data = localPost?.platforms?.[activePlatform] || getEmptyPlatform();
    const brandText = projectContext?.brand || "[Контекст бренда не заполнен]";
    const typoText = projectContext?.typo || "[Тон текста не задан]";
    const styleText = projectContext?.style || "[Визуальный стиль не задан]";

    const currentTopic = data.topic || localPost.topic || 'Без темы';
    
    let platformLabel = platformsInfo.find(p => p.id === activePlatform)?.label || String(activePlatform);
    const checkName = platformLabel.toUpperCase();
    const checkId = String(activePlatform).toUpperCase();

    if (checkName === 'MX' || checkId === 'MX') platformLabel = 'Мессенджер MAX';
    else if (checkName === 'TG' || checkId === 'TG') platformLabel = 'Telegram';
    else if (checkName === 'VK' || checkId === 'VK') platformLabel = 'ВКонтакте';
    else if (checkName === 'INST' || checkId === 'INST') platformLabel = 'Instagram';
    else if (checkName === 'YT' || checkId === 'YT') platformLabel = 'YouTube';

    const briefSection = `--- ИСХОДНЫЙ БРИФ ---\n[Тип контента]: ${data.rubric || 'Не выбран'}\n[Формат]: ${data.format || 'Не выбран'}\n[Бренд]: ${brandText}\n\n`;
    let resultStr = briefSection;

    if (data.promptTab === 'text') {
      const tp = data.textPrompt || {};
      const roleText = tp.role?.trim() ? tp.role : 'Не указана';
      const toneText = tp.toneOfVoice?.trim() ? tp.toneOfVoice : (typoText !== '[Тон текста не задан]' ? typoText : 'Не указан');

      resultStr += `--- ТЕХНИЧЕСКОЕ ЗАДАНИЕ НА ТЕКСТ ---\n` +
                   `[Роль]: ${roleText}\n` +
                   `[Соцсеть / Платформа]: ${platformLabel}\n` +
                   `[Тема]: ${currentTopic}\n` +
                   `[ТЗ и Суть]: ${tp.details || ''}\n` +
                   `[Call to Action (CTA)]: ${tp.cta || ''}\n` +
                   `[KPI (Ожидаемый результат)]: ${tp.kpi || ''}\n\n` +
                   `--- ТОН И СТИЛИСТИКА ТЕКСТА (Tone of Voice) ---\n${toneText}`;
    } else {
      const vp = data.visualPrompt || {};
      const colors = vp.colors?.length > 0 ? `\n[Цветовая палитра]: ${vp.colors.join(', ')}` : '';
      resultStr += `--- ТЕХНИЧЕСКОЕ ЗАДАНИЕ НА ВИЗУАЛ ---\n` +
                   `[AI Prompt]: ${vp.essence || ''}\n\n` +
                   `--- ВИЗУАЛЬНЫЙ КОНТЕКСТ И СТИЛЬ ---\n${styleText}${colors}`;
    }
    return resultStr;
  };

  const generatePrompt = () => onOpenPrompt(buildPromptString());

  // 🔥 ФУНКЦИЯ СОХРАНЕНИЯ ЧЕРЕЗ МОДАЛКУ 🔥
  const executeSaveToPlaybook = async () => {
    if (!savePlaybookModal.title.trim()) return alert("Введите название!");
    
    // ПРОВЕРКА: Если projectId потерялся, ставим 'mns' по умолчанию
    const currentProj = projectId || 'mns';
    
    const payload = {
      type: 'playbook',
      title: savePlaybookModal.title.trim(),
      text: buildPromptString(),
      project_id: currentProj,
      tags: savePlaybookModal.tags || activePlatform
    };

    console.log("💾 ОТПРАВКА В БАЗУ:", payload);

    try {
      const res = await api.createLibraryPrompt(payload);
      console.log("✅ ОТВЕТ СЕРВЕРА:", res);
      
      alert("Промпт успешно сохранен!");
      if (refreshLibrary) refreshLibrary();
      setSavePlaybookModal({ open: false, title: '', tags: '' });
    } catch (e) {
      console.error("❌ ОШИБКА СОХРАНЕНИЯ:", e.response?.data || e.message);
      alert("Ошибка! Сервер отклонил сохранение. Проверь консоль (F12)");
    }
  };

  const allPlatformsData = (allPosts || []).flatMap(p => Object.values(p.platforms || {}));
  const recentRoles = Array.from(new Set(allPlatformsData.map(p => p.textPrompt?.role).filter(r => r && r.trim().length > 0))).reverse().slice(0, 3);
  const recentToVs = Array.from(new Set(allPlatformsData.map(p => p.textPrompt?.toneOfVoice).filter(r => r && r.trim().length > 0))).reverse().slice(0, 3);

  if (!activePlatform) {
    return (
      <div className="p-8 md:p-10 rounded-[48px] shadow-[0_20px_60px_rgba(0,0,0,0.15)] bg-[var(--bg-card)] flex flex-col gap-8 border-2 border-[var(--border-main)] transition-all animate-in fade-in zoom-in-95 duration-500 backdrop-blur-md items-center justify-center text-center min-h-[400px]">
        <div className="w-24 h-24 bg-[var(--bg-input)] rounded-[32px] flex items-center justify-center mb-2 shadow-inner border border-[var(--border-main)]"><Target className="w-12 h-12 text-[var(--accent)]" /></div>
        <div><h3 className="font-black text-3xl md:text-4xl text-[var(--text-main)] uppercase tracking-tight mb-4">Куда публикуем?</h3></div>
        <div className="flex flex-wrap justify-center gap-4 mt-4 w-full">
          {platformsInfo.map(plat => (
            <button key={plat.id} onClick={() => changeTab(plat.id)} className="px-6 py-8 rounded-[32px] bg-[var(--bg-input)] border-2 border-transparent hover:border-[var(--accent)] hover:shadow-[0_15px_30px_var(--accent-glow)] transition-all duration-300 group flex flex-col items-center gap-4 w-36 active:scale-95">
              <div className="text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors duration-300"><Layers className="w-8 h-8 group-hover:scale-110 transition-transform" /></div>
              <span className="font-black text-sm uppercase tracking-widest text-[var(--text-main)]">{plat.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const pData = localPost?.platforms?.[activePlatform] || getEmptyPlatform();
  const isPromptReady = pData.promptTab === 'text' ? pData.textPrompt?.details?.trim().length > 0 : pData.visualPrompt?.essence?.trim().length > 0;

  return (
    <div className="p-8 md:p-10 rounded-[48px] shadow-[0_20px_60px_rgba(0,0,0,0.15)] bg-[var(--bg-card)] flex flex-col gap-10 border-2 border-[var(--border-main)] transition-all animate-in fade-in zoom-in-95 duration-500 backdrop-blur-md relative overflow-hidden">
      
      {/* 🔥 КРАСИВАЯ ШИРОКАЯ ПАНЕЛЬ СОХРАНЕНИЯ (БЕЗ ЗАТЕМНЕНИЯ) 🔥 */}
      {savePlaybookModal.open && (
        <div className="absolute inset-x-8 bottom-8 z-[1000] bg-[var(--bg-card)] p-8 md:p-10 rounded-[40px] border-2 border-[var(--accent)] shadow-[0_40px_100px_var(--accent-glow)] animate-in slide-in-from-bottom-8 duration-300">
           <div className="flex justify-between items-start mb-8">
              <div className="flex items-center gap-5">
                 <div className="w-16 h-16 bg-[var(--accent)]/10 rounded-2xl flex items-center justify-center text-[var(--accent)] border border-[var(--accent)]/20"><Save className="w-8 h-8" /></div>
                 <div>
                   <h3 className="text-2xl font-black uppercase text-[var(--text-main)] tracking-tight">Сохранить промпт</h3>
                   <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">В базу шаблонов</p>
                 </div>
              </div>
              <button onClick={() => setSavePlaybookModal({open: false, title: '', tags: ''})} className="bg-[var(--bg-input)] p-4 rounded-full text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border-main)] hover:border-[var(--text-muted)] transition-all"><X className="w-6 h-6"/></button>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 text-left">
             <div>
               <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-3 block ml-1">Название сценария</label>
               <input autoFocus value={savePlaybookModal.title} onChange={e=>setSavePlaybookModal({...savePlaybookModal, title: e.target.value})} className="w-full bg-[var(--bg-input)] p-5 rounded-2xl border-2 border-[var(--border-main)] focus:border-[var(--accent)] outline-none font-bold text-lg text-[var(--text-main)] transition-all shadow-inner" placeholder="Напр: Запуск новой коллекции..." />
             </div>
             <div>
               <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-3 block ml-1">Теги (через запятую)</label>
               <input value={savePlaybookModal.tags} onChange={e=>setSavePlaybookModal({...savePlaybookModal, tags: e.target.value})} className="w-full bg-[var(--bg-input)] p-5 rounded-2xl border-2 border-[var(--border-main)] focus:border-[var(--accent)] outline-none font-bold text-[var(--text-main)] transition-all shadow-inner" placeholder="promo, vk, sales..." />
             </div>
           </div>

           <div className="flex gap-4">
              <button onClick={() => setSavePlaybookModal({open: false, title: '', tags: ''})} className="flex-1 py-5 bg-[var(--bg-input)] rounded-2xl font-black text-xs uppercase tracking-widest text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-all border-2 border-[var(--border-main)] hover:border-red-500/30">Отмена</button>
              <button onClick={executeSaveToPlaybook} className="flex-[2] py-5 bg-[var(--accent)] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-[0_15px_30px_var(--accent-glow)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3">
                <CheckCircle2 className="w-5 h-5" /> Сохранить в базу
              </button>
           </div>
        </div>
      )}

      <div className="flex gap-3 bg-[var(--bg-input)] p-2 rounded-3xl overflow-x-auto hide-scroll shrink-0 border border-[var(--border-main)]">
        {platformsInfo.map(plat => {
          const hasContent = localPost?.platforms?.[plat.id]?.step >= 0; 
          const isActive = plat.id === activePlatform;
          return (
            <button key={plat.id} onClick={() => changeTab(plat.id)} className={`text-sm md:text-base font-black uppercase px-8 py-4 rounded-2xl transition-all shrink-0 tracking-wider ${isActive ? plat.activeClass : (hasContent ? 'bg-[var(--bg-card)] text-[var(--text-main)] border border-[var(--border-main)] shadow-sm' : 'text-[var(--text-muted)] hover:bg-[var(--bg-card)] opacity-50 hover:opacity-100')}`}>
              {plat.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-xs font-black text-[var(--accent)] uppercase tracking-[0.2em] flex items-center gap-2 ml-1"><LayoutList className="w-4 h-4" /> Тема для {activePlatform}</label>
        <textarea ref={textareaRef} value={pData.topic || localPost.topic || ""} onChange={(e) => updatePlatformData('topic', e.target.value)} onBlur={() => saveToDB(localPost)} placeholder="О чем будем писать?.." className="w-full font-black text-4xl md:text-5xl outline-none bg-transparent border-b-4 border-[var(--border-main)] focus:border-[var(--border-hover)] pb-4 text-[var(--text-main)] transition-all resize-none overflow-hidden leading-[1.1] placeholder-[var(--text-muted)] opacity-90 focus:opacity-100" rows={1}/>
      </div>

      <div className="relative flex justify-between items-start w-full px-2">
        <div className="absolute top-4 left-0 w-full h-[2px] bg-[var(--border-main)] z-0 rounded-full"></div>
        {steps.map((s, idx) => {
          const isCompleted = idx < pData.step;
          const isActive = idx === pData.step;
          return (
            <div key={s} onClick={() => setStep(idx)} className="relative z-10 flex flex-col items-center gap-4 cursor-pointer group flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 border-4 ${isCompleted ? 'bg-emerald-500 border-emerald-500/30 shadow-lg shadow-emerald-500/20' : isActive ? 'bg-[var(--accent)] border-[var(--bg-card)] shadow-xl shadow-[var(--accent-glow)] scale-110' : 'bg-[var(--bg-input)] border-[var(--bg-card)] group-hover:border-[var(--border-hover)]'}`}>
                {isCompleted && <CheckCircle2 className="w-4 h-4 text-white" />}
                {isActive && <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>}
              </div>
              <div className="flex flex-col items-center">
                <span className={`text-xs font-black uppercase tracking-[0.15em] transition-colors duration-300 ${isActive ? 'text-[var(--accent)]' : isCompleted ? 'text-emerald-500' : 'text-[var(--text-muted)] group-hover:text-[var(--text-main)]'}`}>{s}</span>
                {isActive && <div className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full mt-2 animate-bounce"></div>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="min-h-[350px] py-4 bg-[var(--bg-input)]/50 rounded-[32px] p-6 md:p-8 border border-[var(--border-main)] shadow-inner">
        {pData.step === 0 && (
          <div className="space-y-8 fade-in flex flex-col items-start text-left">
            <div className="w-full">
              <label className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest pl-1 mb-3 block">Рубрика контента</label>
              <input list="content-types" value={pData.rubric || ""} onChange={(e) => updatePlatformData('rubric', e.target.value)} placeholder="Продающий, экспертный..." className="w-full p-6 bg-[var(--bg-card)] rounded-[24px] border-2 border-[var(--border-main)] focus:border-[var(--border-hover)] text-base font-bold outline-none text-[var(--text-main)] shadow-sm transition-all" />
              <datalist id="content-types"><option value="Продающий" /><option value="Вовлекающий" /><option value="Экспертный" /><option value="Кейс" /><option value="Лайфстайл" /></datalist>
            </div>
            <div className="w-full">
              <label className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest pl-1 mb-3 block">Формат выдачи</label>
              <input list="content-formats" value={pData.format || ""} onChange={(e) => updatePlatformData('format', e.target.value)} placeholder="Пост, карусель, рилс..." className="w-full p-6 bg-[var(--bg-card)] rounded-[24px] border-2 border-[var(--border-main)] focus:border-[var(--border-hover)] text-base font-bold outline-none text-[var(--text-main)] shadow-sm transition-all" />
              <datalist id="content-formats"><option value="Текст + Статика" /><option value="Карусель" /><option value="Reels/Shorts" /><option value="Статья" /></datalist>
            </div>
            <button onClick={() => setStep(1)} style={{ backgroundImage: 'linear-gradient(to right, var(--grad-1), var(--grad-2))' }} className="w-full py-6 mt-4 text-white rounded-3xl font-black text-sm uppercase tracking-[0.3em] hover:scale-[1.02] active:scale-95 transition-all shadow-[0_15px_30px_var(--accent-glow)] flex items-center justify-center gap-3 group">Далее к промпту <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" /></button>
          </div>
        )}

        {pData.step === 1 && (
          <div className="space-y-6 fade-in flex flex-col">
            <div className="flex bg-[var(--bg-card)] p-2 rounded-2xl shrink-0 border border-[var(--border-main)]">
              <button onClick={() => updatePlatformData('promptTab', 'text')} className={`flex-1 py-4 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${pData.promptTab === 'text' ? 'bg-[var(--accent)] text-white shadow-[0_10px_20px_var(--accent-glow)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}>Текстовый Промпт</button>
              <button onClick={() => updatePlatformData('promptTab', 'visual')} className={`flex-1 py-4 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${pData.promptTab !== 'text' ? 'bg-[var(--accent)] text-white shadow-[0_10px_20px_var(--accent-glow)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}>Визуальный Промпт</button>
            </div>
            
            <div className="bg-[var(--bg-card)] p-8 rounded-[32px] border border-[var(--border-main)] space-y-6 text-left flex-1 shadow-sm">
              {pData.promptTab === 'text' ? (
                <div className="flex flex-col gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[var(--bg-input)] pt-4 pb-2 px-2 rounded-[24px] border-2 border-transparent focus-within:border-[var(--accent)] transition-all shadow-sm">
                      <TemplateManager title="Роль нейросети" icon={UserCircle} typeKey="role_template" value={pData?.textPrompt?.role || ""} onChange={(val) => updatePromptData('textPrompt', 'role', val)} placeholder="Напр: Ты дерзкий SMM-щик..." projectId={projectId} baseOptions={["Креативный SMM-специалист", "Заботливый эксперт"]} recentOptions={recentRoles}/>
                    </div>
                    <div className="bg-[var(--bg-input)] pt-4 pb-2 px-2 rounded-[24px] border-2 border-transparent focus-within:border-[var(--accent)] transition-all shadow-sm">
                      <TemplateManager title="Tone of Voice" icon={MessageSquareQuote} typeKey="tone_template" value={pData?.textPrompt?.toneOfVoice || ""} onChange={(val) => updatePromptData('textPrompt', 'toneOfVoice', val)} placeholder="Официальный, с юмором..." projectId={projectId} baseOptions={["Информативный и полезный", "Дерзкий, с юмором"]} recentOptions={recentToVs}/>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-black text-[var(--text-muted)] uppercase flex items-center gap-2 mb-3"><LayoutList className="w-4 h-4"/> ТЗ и суть</label>
                    <textarea value={pData?.textPrompt?.details || ""} onChange={(e) => updatePromptData('textPrompt', 'details', e.target.value)} className="w-full text-base font-medium bg-[var(--bg-input)] p-6 rounded-[24px] border-2 border-transparent focus:border-[var(--border-hover)] text-[var(--text-main)] placeholder-[var(--text-muted)] h-40 resize-none outline-none transition-all" placeholder="Опиши основные тезисы..." />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-amber-500/10 p-6 rounded-[24px] border border-amber-500/20">
                      <label className="text-xs font-black text-amber-500 uppercase mb-3 flex items-center gap-2"><Zap className="w-4 h-4"/> Call to Action</label>
                      <textarea value={pData?.textPrompt?.cta || ""} onChange={(e) => updatePromptData('textPrompt', 'cta', e.target.value)} className="w-full text-sm font-bold bg-[var(--bg-card)] text-[var(--text-main)] placeholder-[var(--text-muted)] p-4 rounded-xl border border-transparent focus:border-amber-500 h-24 resize-none outline-none transition-all shadow-sm" placeholder="Что должен сделать юзер?" />
                    </div>
                    <div className="bg-emerald-500/10 p-6 rounded-[24px] border border-emerald-500/20">
                      <label className="text-xs font-black text-emerald-500 uppercase mb-3 flex items-center gap-2"><Target className="w-4 h-4"/> Цель / KPI</label>
                      <textarea value={pData?.textPrompt?.kpi || ""} onChange={(e) => updatePromptData('textPrompt', 'kpi', e.target.value)} className="w-full text-sm font-bold bg-[var(--bg-card)] text-[var(--text-main)] placeholder-[var(--text-muted)] p-4 rounded-xl border border-transparent focus:border-emerald-500 h-24 resize-none outline-none transition-all shadow-sm" placeholder="Охваты, продажи, лиды?" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <label className="text-xs font-black text-[var(--text-muted)] uppercase flex items-center gap-2"><Sparkles className="w-4 h-4"/> Описание визуала</label>
                  <textarea value={pData?.visualPrompt?.essence || ""} onChange={(e) => updatePromptData('visualPrompt', 'essence', e.target.value)} className="w-full text-base font-medium bg-[var(--bg-input)] p-6 rounded-[24px] border-2 border-transparent focus:border-[var(--border-hover)] text-[var(--text-main)] placeholder-[var(--text-muted)] h-48 resize-none outline-none transition-all" placeholder="Что должно быть на картинке?" />
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {['Amethyst', 'Tiffany', 'Peach', 'Slate'].map(c => (
                      <label key={c} className="flex items-center gap-3 text-xs font-black text-[var(--text-main)] cursor-pointer p-4 bg-[var(--bg-input)] hover:bg-[var(--bg-card)] hover:border-[var(--border-hover)] rounded-2xl border border-[var(--border-main)] transition-all shadow-sm">
                        <input type="checkbox" checked={pData?.visualPrompt?.colors?.includes(c)} onChange={() => toggleColor(c)} className="w-4 h-4 accent-[var(--accent)]" /> {c}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 relative z-10">
              <button onClick={generatePrompt} style={{ backgroundImage: isPromptReady ? 'none' : 'linear-gradient(to right, var(--grad-1), var(--grad-2))' }} className={`w-full py-6 rounded-3xl font-black text-sm md:text-base uppercase tracking-[0.2em] shadow-[0_15px_30px_var(--accent-glow)] flex justify-center items-center gap-4 transition-all hover:scale-[1.01] active:scale-95 ${isPromptReady ? "bg-emerald-500 text-white shadow-emerald-500/20" : "text-white"}`}>
                {isPromptReady ? <><CheckCircle2 className="w-6 h-6"/> Посмотреть ТЗ</> : <><Sparkles className="w-6 h-6"/> Сгенерировать ТЗ</>}
              </button>
              
              {isPromptReady && (
                <button onClick={() => setSavePlaybookModal({ open: true, title: localPost.topic || '', tags: activePlatform })} className="w-full py-4 mt-2 rounded-2xl font-black text-[10px] uppercase tracking-widest text-[var(--accent)] bg-[var(--accent)]/10 hover:bg-[var(--accent)] hover:text-white border border-[var(--accent)]/30 hover:border-transparent transition-all flex items-center justify-center gap-3 active:scale-95">
                  <BookOpen className="w-4 h-4" /> Сохранить в базу
                </button>
              )}
            </div>

          </div>
        )}

        {pData.step === 2 && (
          <div className="space-y-6 fade-in flex flex-col text-left">
            <div className="bg-emerald-500/10 p-8 rounded-[40px] border border-emerald-500/20 flex-1 flex flex-col min-h-[250px]">
              <label className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-4 block ml-1">Итоговый текст публикации</label>
              <textarea value={pData.finalText || ""} onChange={(e) => updatePlatformData('finalText', e.target.value)} className="w-full text-base font-bold bg-[var(--bg-card)] p-8 rounded-[32px] border-2 border-transparent focus:border-emerald-500 outline-none text-[var(--text-main)] placeholder-[var(--text-muted)] flex-1 resize-none shadow-sm transition-all" placeholder="Скопируй сюда готовый текст от нейронки..." />
            </div>
            <div className="bg-[var(--bg-card)] p-8 rounded-[32px] border border-[var(--border-main)] shadow-sm">
              <label className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest mb-4 block ml-1">Референсы (Опционально)</label>
              <input type="text" value={pData.refs || ""} onChange={(e) => updatePlatformData('refs', e.target.value)} placeholder="Ссылка на примеры, статьи, фото..." className="w-full text-base font-bold bg-[var(--bg-input)] p-6 rounded-2xl border-2 border-transparent focus:border-[var(--border-hover)] outline-none text-[var(--text-main)] placeholder-[var(--text-muted)] transition-all" />
            </div>
            <button onClick={() => setStep(3)} style={{ backgroundImage: 'linear-gradient(to right, var(--grad-1), var(--grad-2))' }} className="w-full py-6 text-white rounded-3xl font-black text-sm uppercase tracking-[0.3em] shadow-[0_15px_30px_var(--accent-glow)] hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-3 group">Перейти к дизайну <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform"/></button>
          </div>
        )}

        {pData.step === 3 && (
          <div className="space-y-6 fade-in h-full flex flex-col text-left">
            <div className="bg-blue-500/10 p-10 rounded-[40px] border border-blue-500/20 flex-1 flex flex-col gap-6">
              <label className="text-xs font-black uppercase text-blue-500 tracking-widest flex items-center gap-2"><Link className="w-5 h-5"/>Ссылка на медиафайлы</label>
              <textarea value={pData.mediaLink || ""} onChange={(e) => updatePlatformData('mediaLink', e.target.value)} className="w-full text-lg font-bold bg-[var(--bg-card)] p-8 rounded-[32px] border-2 border-transparent focus:border-blue-500 outline-none text-blue-500 placeholder-blue-300/50 h-56 resize-none shadow-sm transition-all" placeholder="Вставь ссылку на Google Drive / Figma / Canva..." />
            </div>
            <button onClick={() => setStep(4)} style={{ backgroundImage: 'linear-gradient(to right, var(--grad-1), var(--grad-2))' }} className="w-full py-6 text-white rounded-3xl font-black text-sm uppercase tracking-[0.3em] shadow-[0_15px_30px_var(--accent-glow)] hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-3 group">Завершить пост <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform"/></button>
          </div>
        )}

        {pData.step === 4 && (
          <div className="space-y-8 fade-in text-left mt-4 animate-in slide-in-from-bottom-4 duration-500">
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-10 rounded-[40px] flex items-center gap-8 shadow-sm">
              <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.4)]"><CheckCircle2 className="w-10 h-10 text-white" /></div>
              <div>
                <h4 className="font-black text-3xl uppercase text-emerald-500 tracking-tight leading-none">Пост готов!</h4>
                <p className="text-xs font-bold text-emerald-600/60 uppercase tracking-[0.2em] mt-3">Контент упакован и ждет публикации</p>
              </div>
            </div>
            {pData.finalText && (
              <div className="bg-[var(--bg-input)] p-8 rounded-[32px] border border-[var(--border-main)] relative group shadow-inner">
                <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-4 block">Текст поста</label>
                <div className="text-[var(--text-main)] text-sm font-bold whitespace-pre-wrap leading-relaxed">{pData.finalText}</div>
                <button onClick={() => navigator.clipboard.writeText(pData.finalText)} className="absolute top-6 right-6 p-4 bg-[var(--bg-card)] rounded-xl text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-all hover:text-emerald-500 hover:border-emerald-500/50 shadow-sm border border-[var(--border-main)]"><Copy className="w-5 h-5"/></button>
              </div>
            )}
            <button onClick={() => setStep(2)} className="w-full py-6 bg-[var(--bg-card)] border-2 border-[var(--border-main)] text-[var(--text-muted)] rounded-3xl font-black text-xs uppercase tracking-[0.3em] hover:text-[var(--text-main)] hover:border-[var(--border-hover)] transition-all">Вернуться к правкам</button>
          </div>
        )}
      </div>

      <div className="flex justify-end border-t-2 border-[var(--border-main)] pt-8">
        <button onClick={async () => { if (window.confirm("Удалить карточку?")) { await api.deletePost(localPost.id); refreshPosts(); } }} className="text-xs font-black text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-all p-4 flex items-center gap-3 rounded-2xl"><Trash2 className="w-5 h-5" /> Удалить карточку</button>
      </div>
    </div>
  );
});

export default PostCard;