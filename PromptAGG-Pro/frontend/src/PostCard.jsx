import React, { useState, memo, useRef, useEffect } from 'react';
import { Trash2, Link, CheckCircle2, Sparkles, Target, Zap, LayoutList, Copy, ExternalLink, ArrowRight, Layers, UserCircle, MessageSquareQuote } from 'lucide-react';
import api from './api';
import { platformsInfo, getEmptyPlatform } from './constants';

const PostCard = memo(function PostCard({ post, refreshPosts, onOpenPrompt, projectContext, initialPlatform }) {
  const [localPost, setLocalPost] = useState(post);
  
  const existingPlatforms = Object.keys(post?.platforms || {});
  const [activePlatform, setActivePlatform] = useState(
    initialPlatform || (existingPlatforms.length > 0 ? existingPlatforms[0] : null)
  );
  
  const textareaRef = useRef(null);
  const steps = ["Бриф", "Промпт", "СММ", "Дизайн", "Готово"];

  useEffect(() => {
    setLocalPost(post);
  }, [post]);

  useEffect(() => {
    if (initialPlatform) {
      setActivePlatform(initialPlatform);
      if (!localPost.platforms || !localPost.platforms[initialPlatform]) {
        const updatedPlatforms = { ...(localPost.platforms || {}), [initialPlatform]: getEmptyPlatform() };
        const updatedPost = { ...localPost, platforms: updatedPlatforms };
        setLocalPost(updatedPost);
        api.updatePost(localPost.id, updatedPost).catch(e => console.error("Ошибка автосоздания платформы:", e));
      }
    }
  }, [initialPlatform, localPost.id]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [localPost.platforms?.[activePlatform]?.topic, localPost.topic, activePlatform]);

  const saveToDB = async (updatedPost) => {
    try { await api.updatePost(updatedPost.id, updatedPost); }
    catch (e) { console.error("Ошибка сохранения в БД:", e); }
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
    const updatedPost = {
      ...localPost,
      platforms: { ...localPost.platforms, [activePlatform]: { ...currentPlatform, [field]: value } }
    };
    setLocalPost(updatedPost);
    saveToDB(updatedPost);
  };

  const updatePromptData = (promptType, field, value) => {
    const currentPlatform = localPost.platforms?.[activePlatform] || getEmptyPlatform();
    const currentPrompt = currentPlatform[promptType] || getEmptyPlatform()[promptType];
    const updatedPost = {
      ...localPost,
      platforms: {
        ...localPost.platforms,
        [activePlatform]: { ...currentPlatform, [promptType]: { ...currentPrompt, [field]: value } }
      }
    };
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

  // 🔥 ЖЕСТКАЯ ГЕНЕРАЦИЯ ПРОМПТА
  const generatePrompt = () => {
    const data = localPost?.platforms?.[activePlatform] || getEmptyPlatform();
    const brandText = projectContext?.brand || "[Контекст бренда не заполнен]";
    const typoText = projectContext?.typo || "[Тон текста не задан]";
    const styleText = projectContext?.style || "[Визуальный стиль не задан]";

    const currentTopic = data.topic || localPost.topic || 'Без темы';
    
    // 1. Агрессивный перехват названий соцсетей
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
      
      // 2. Убрали автозаполнение "Ты креативный SMM-специалист". Что ввел - то и будет.
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
    onOpenPrompt(resultStr);
  };

  if (!activePlatform) {
    return (
      <div className="p-8 md:p-10 rounded-[48px] shadow-[0_20px_60px_rgba(0,0,0,0.15)] bg-[var(--bg-card)] flex flex-col gap-8 border-2 border-[var(--border-main)] transition-all animate-in fade-in zoom-in-95 duration-500 backdrop-blur-md items-center justify-center text-center min-h-[400px]">
        <div className="w-24 h-24 bg-[var(--bg-input)] rounded-[32px] flex items-center justify-center mb-2 shadow-inner border border-[var(--border-main)]">
          <Target className="w-12 h-12 text-[var(--accent)]" />
        </div>
        <div>
          <h3 className="font-black text-3xl md:text-4xl text-[var(--text-main)] uppercase tracking-tight mb-4">Куда публикуем?</h3>
          <p className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-widest">Выберите первую площадку для создания контента</p>
        </div>
        
        <div className="flex flex-wrap justify-center gap-4 mt-4 w-full">
          {platformsInfo.map(plat => (
            <button
              key={plat.id}
              onClick={() => changeTab(plat.id)}
              className="px-6 py-8 rounded-[32px] bg-[var(--bg-input)] border-2 border-transparent hover:border-[var(--accent)] hover:shadow-[0_15px_30px_var(--accent-glow)] transition-all duration-300 group flex flex-col items-center gap-4 w-36 active:scale-95"
            >
              <div className="text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors duration-300">
                <Layers className="w-8 h-8 group-hover:scale-110 transition-transform" />
              </div>
              <span className="font-black text-sm uppercase tracking-widest text-[var(--text-main)]">{plat.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-auto w-full flex justify-end border-t-2 border-[var(--border-main)] pt-8">
          <button onClick={async () => { if (window.confirm("Удалить пустую карточку?")) { await api.deletePost(localPost.id); refreshPosts(); } }} className="text-xs font-black text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-all p-4 flex items-center gap-3 rounded-2xl">
            <Trash2 className="w-5 h-5" /> Удалить карточку
          </button>
        </div>
      </div>
    );
  }

  const pData = localPost?.platforms?.[activePlatform] || getEmptyPlatform();
  const isPromptReady = pData.promptTab === 'text'
    ? pData.textPrompt?.details?.trim().length > 0
    : pData.visualPrompt?.essence?.trim().length > 0;

  return (
    <div className="p-8 md:p-10 rounded-[48px] shadow-[0_20px_60px_rgba(0,0,0,0.15)] bg-[var(--bg-card)] flex flex-col gap-10 border-2 border-[var(--border-main)] transition-all animate-in fade-in zoom-in-95 duration-500 backdrop-blur-md">
      
      <div className="flex gap-3 bg-[var(--bg-input)] p-2 rounded-3xl overflow-x-auto hide-scroll shrink-0 border border-[var(--border-main)]">
        {platformsInfo.map(plat => {
          const hasContent = localPost?.platforms?.[plat.id]?.step >= 0; 
          const isActive = plat.id === activePlatform;
          return (
            <button
              key={plat.id}
              onClick={() => changeTab(plat.id)}
              className={`text-sm md:text-base font-black uppercase px-8 py-4 rounded-2xl transition-all shrink-0 tracking-wider ${
                isActive 
                  ? plat.activeClass 
                  : (hasContent ? 'bg-[var(--bg-card)] text-[var(--text-main)] border border-[var(--border-main)] shadow-sm' : 'text-[var(--text-muted)] hover:bg-[var(--bg-card)] opacity-50 hover:opacity-100')
              }`}
            >
              {plat.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-xs font-black text-[var(--accent)] uppercase tracking-[0.2em] flex items-center gap-2 ml-1">
          <LayoutList className="w-4 h-4" /> Тема для {activePlatform}
        </label>
        <textarea
          ref={textareaRef}
          value={pData.topic || localPost.topic || ""}
          onChange={(e) => updatePlatformData('topic', e.target.value)}
          onBlur={() => saveToDB(localPost)}
          placeholder="О чем будем писать?.."
          className="w-full font-black text-4xl md:text-5xl outline-none bg-transparent border-b-4 border-[var(--border-main)] focus:border-[var(--border-hover)] pb-4 text-[var(--text-main)] transition-all resize-none overflow-hidden leading-[1.1] placeholder-[var(--text-muted)] opacity-90 focus:opacity-100"
          rows={1}
        />
      </div>

      <div className="relative flex justify-between items-start w-full px-2">
        <div className="absolute top-4 left-0 w-full h-[2px] bg-[var(--border-main)] z-0 rounded-full"></div>
        
        {steps.map((s, idx) => {
          const isCompleted = idx < pData.step;
          const isActive = idx === pData.step;
          
          return (
            <div key={s} onClick={() => setStep(idx)} className="relative z-10 flex flex-col items-center gap-4 cursor-pointer group flex-1">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 border-4 ${
                  isCompleted ? 'bg-emerald-500 border-emerald-500/30 shadow-lg shadow-emerald-500/20' : 
                  isActive ? 'bg-[var(--accent)] border-[var(--bg-card)] shadow-xl shadow-[var(--accent-glow)] scale-110' : 
                  'bg-[var(--bg-input)] border-[var(--bg-card)] group-hover:border-[var(--border-hover)]'
                }`}
              >
                {isCompleted && <CheckCircle2 className="w-4 h-4 text-white" />}
                {isActive && <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>}
              </div>
              
              <div className="flex flex-col items-center">
                <span className={`text-xs font-black uppercase tracking-[0.15em] transition-colors duration-300 ${
                  isActive ? 'text-[var(--accent)]' : isCompleted ? 'text-emerald-500' : 'text-[var(--text-muted)] group-hover:text-[var(--text-main)]'
                }`}>
                  {s}
                </span>
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
              <datalist id="content-types">
                <option value="Продающий" /><option value="Вовлекающий" /><option value="Экспертный" /><option value="Кейс" /><option value="Лайфстайл" />
              </datalist>
            </div>
            <div className="w-full">
              <label className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest pl-1 mb-3 block">Формат выдачи</label>
              <input list="content-formats" value={pData.format || ""} onChange={(e) => updatePlatformData('format', e.target.value)} placeholder="Пост, карусель, рилс..." className="w-full p-6 bg-[var(--bg-card)] rounded-[24px] border-2 border-[var(--border-main)] focus:border-[var(--border-hover)] text-base font-bold outline-none text-[var(--text-main)] shadow-sm transition-all" />
              <datalist id="content-formats">
                <option value="Текст + Статика" /><option value="Карусель" /><option value="Reels/Shorts" /><option value="Статья" />
              </datalist>
            </div>
            <button 
              onClick={() => setStep(1)} 
              style={{ backgroundImage: 'linear-gradient(to right, var(--grad-1), var(--grad-2))' }}
              className="w-full py-6 mt-4 text-white rounded-3xl font-black text-sm uppercase tracking-[0.3em] hover:scale-[1.02] active:scale-95 transition-all shadow-[0_15px_30px_var(--accent-glow)] flex items-center justify-center gap-3 group"
            >
              Далее к промпту <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
            </button>
          </div>
        )}

        {pData.step === 1 && (
          <div className="space-y-6 fade-in flex flex-col">
            <div className="flex bg-[var(--bg-card)] p-2 rounded-2xl shrink-0 border border-[var(--border-main)]">
              <button 
                onClick={() => updatePlatformData('promptTab', 'text')} 
                className={`flex-1 py-4 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${pData.promptTab === 'text' ? 'bg-[var(--accent)] text-white shadow-[0_10px_20px_var(--accent-glow)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
              >
                Текстовый Промпт
              </button>
              <button 
                onClick={() => updatePlatformData('promptTab', 'visual')} 
                className={`flex-1 py-4 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${pData.promptTab !== 'text' ? 'bg-[var(--accent)] text-white shadow-[0_10px_20px_var(--accent-glow)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
              >
                Визуальный Промпт
              </button>
            </div>
            
            <div className="bg-[var(--bg-card)] p-8 rounded-[32px] border border-[var(--border-main)] space-y-6 text-left flex-1 shadow-sm">
              {pData.promptTab === 'text' ? (
                <div className="flex flex-col gap-6">
                  
                  {/* 🔥 ИСПРАВЛЕННЫЕ ПОЛЯ: ДОБАВЛЕНЫ КЛАССЫ break-words whitespace-pre-wrap ДЛЯ ПЕРЕНОСА */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[var(--bg-input)] p-4 rounded-[20px] border-2 border-transparent focus-within:border-[var(--accent)] transition-all shadow-sm">
                      <label className="text-[10px] font-black text-[var(--text-muted)] uppercase mb-2 flex items-center gap-2 pl-2 tracking-widest">
                        <UserCircle className="w-3 h-3"/> Роль нейросети
                      </label>
                      <textarea
                        rows="3"
                        value={pData?.textPrompt?.role || ""}
                        onChange={(e) => updatePromptData('textPrompt', 'role', e.target.value)}
                        placeholder="Напр: Дерзкий SMM-щик"
                        className="w-full bg-transparent outline-none font-bold text-sm text-[var(--text-main)] px-2 placeholder-[var(--text-muted)] resize-none whitespace-pre-wrap break-words"
                      />
                    </div>
                    <div className="bg-[var(--bg-input)] p-4 rounded-[20px] border-2 border-transparent focus-within:border-[var(--accent)] transition-all shadow-sm">
                      <label className="text-[10px] font-black text-[var(--text-muted)] uppercase mb-2 flex items-center gap-2 pl-2 tracking-widest">
                        <MessageSquareQuote className="w-3 h-3"/> Tone of Voice
                      </label>
                      <textarea
                        rows="3"
                        value={pData?.textPrompt?.toneOfVoice || ""}
                        onChange={(e) => updatePromptData('textPrompt', 'toneOfVoice', e.target.value)}
                        placeholder="Официальный, с юмором..."
                        className="w-full bg-transparent outline-none font-bold text-sm text-[var(--text-main)] px-2 placeholder-[var(--text-muted)] resize-none whitespace-pre-wrap break-words"
                      />
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
            <button 
              onClick={generatePrompt} 
              style={{ backgroundImage: isPromptReady ? 'none' : 'linear-gradient(to right, var(--grad-1), var(--grad-2))' }}
              className={`w-full py-6 rounded-3xl font-black text-sm md:text-base uppercase tracking-[0.2em] shadow-[0_15px_30px_var(--accent-glow)] flex justify-center items-center gap-4 transition-all hover:scale-[1.01] active:scale-95 ${
                isPromptReady ? "bg-emerald-500 text-white shadow-emerald-500/20" : "text-white"
              }`}
            >
              {isPromptReady ? <><CheckCircle2 className="w-6 h-6"/> Посмотреть ТЗ</> : <><Sparkles className="w-6 h-6"/> Сгенерировать ТЗ</>}
            </button>
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

            <button 
              onClick={() => setStep(3)} 
              style={{ backgroundImage: 'linear-gradient(to right, var(--grad-1), var(--grad-2))' }}
              className="w-full py-6 text-white rounded-3xl font-black text-sm uppercase tracking-[0.3em] shadow-[0_15px_30px_var(--accent-glow)] hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-3 group"
            >
              Перейти к дизайну <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform"/>
            </button>
          </div>
        )}

        {pData.step === 3 && (
          <div className="space-y-6 fade-in h-full flex flex-col text-left">
            <div className="bg-blue-500/10 p-10 rounded-[40px] border border-blue-500/20 flex-1 flex flex-col gap-6">
              <label className="text-xs font-black uppercase text-blue-500 tracking-widest flex items-center gap-2"><Link className="w-5 h-5"/>Ссылка на медиафайлы</label>
              <textarea value={pData.mediaLink || ""} onChange={(e) => updatePlatformData('mediaLink', e.target.value)} className="w-full text-lg font-bold bg-[var(--bg-card)] p-8 rounded-[32px] border-2 border-transparent focus:border-blue-500 outline-none text-blue-500 placeholder-blue-300/50 h-56 resize-none shadow-sm transition-all" placeholder="Вставь ссылку на Google Drive / Figma / Canva..." />
            </div>
            <button 
              onClick={() => setStep(4)} 
              style={{ backgroundImage: 'linear-gradient(to right, var(--grad-1), var(--grad-2))' }}
              className="w-full py-6 text-white rounded-3xl font-black text-sm uppercase tracking-[0.3em] shadow-[0_15px_30px_var(--accent-glow)] hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-3 group"
            >
              Завершить пост <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform"/>
            </button>
          </div>
        )}

        {pData.step === 4 && (
          <div className="space-y-8 fade-in text-left mt-4 animate-in slide-in-from-bottom-4 duration-500">
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-10 rounded-[40px] flex items-center gap-8 shadow-sm">
              <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
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

      {/* УДАЛЕНИЕ */}
      <div className="flex justify-end border-t-2 border-[var(--border-main)] pt-8">
        <button onClick={async () => { if (window.confirm("Удалить карточку?")) { await api.deletePost(localPost.id); refreshPosts(); } }} className="text-xs font-black text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-all p-4 flex items-center gap-3 rounded-2xl">
          <Trash2 className="w-5 h-5" /> Удалить карточку
        </button>
      </div>
    </div>
  );
});

export default PostCard;