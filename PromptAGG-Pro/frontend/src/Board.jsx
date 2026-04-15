import React, { useState, useMemo, memo } from 'react';
import { 
  Plus, X, ChevronLeft, ChevronRight, BookOpen, 
  Sparkles, ArrowRight, BrainCircuit, Activity
} from 'lucide-react';
import api from './api';
import PromptModal from './PromptModal';
import PostCard from './PostCard';
import { platformsInfo, getEmptyPlatform } from './constants';

const AIImportModal = ({ isOpen, onClose, onImport }) => {
  const [jsonInput, setJsonInput] = useState('');
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-2xl animate-in fade-in duration-500">
      <div className="glass-effect w-full max-w-3xl rounded-[48px] shadow-[0_40px_100px_var(--accent-glow)] overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-10 border-b border-[var(--border-main)] flex justify-between items-center bg-[var(--bg-app)]/30">
          <div className="flex items-center gap-6">
            <div style={{ backgroundImage: 'linear-gradient(to top right, var(--grad-1), var(--grad-2))' }} className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl">
              <BrainCircuit className="text-white w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-[var(--text-main)] leading-none">Нейро-импорт</h2>
              <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
                <Activity className="w-3 h-3 text-[var(--accent)]" /> Инициализация потока
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-12 h-12 bg-[var(--bg-input)] rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm border border-[var(--border-main)] text-[var(--text-muted)]">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-10 flex-1 flex flex-col gap-6 overflow-hidden">
          <div className="relative flex-1 group">
            <textarea 
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder="Вставьте JSON массив постов здесь..."
              className="w-full h-full bg-[var(--bg-input)] rounded-[32px] p-8 font-mono text-sm text-[var(--accent)] outline-none border-2 border-transparent focus:border-[var(--border-hover)] transition-all resize-none ideas-scroll shadow-inner"
            />
          </div>
          <button onClick={() => { onImport(jsonInput); setJsonInput(''); onClose(); }} style={{ backgroundImage: 'linear-gradient(to right, var(--grad-1), var(--grad-2))' }} className="w-full py-6 text-white rounded-3xl font-black text-xs uppercase tracking-[0.3em] hover:scale-[1.02] active:scale-95 transition-all shadow-[0_20px_40px_var(--accent-glow)] flex items-center justify-center gap-4 group">
            Интегрировать данные <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};

const Board = memo(function Board({ projectId, posts, refreshPosts, projectContext, refreshLibrary }) {
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [modal, setModal] = useState({ open: false, text: "" });
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  const todayNum = new Date().getDate();

  const { days, monthName, year, shift } = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const mName = new Intl.DateTimeFormat('ru-RU', { month: 'long' }).format(viewDate);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const shift = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    const daysArray = Array.from({ length: daysInMonth }, (_, i) => {
      const d = i + 1;
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dateObj = new Date(year, month, d);
      return {
        num: d, dateStr,
        weekdayShort: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'][dateObj.getDay()],
        weekdayFull: ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'][dateObj.getDay()]
      };
    });
    return { days: daysArray, monthName: mName, year, shift };
  }, [viewDate]);

  const changeMonth = (offset) => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1));

  const handleAIImportLogic = async (jsonString) => {
    if (!jsonString) return;
    try {
      const cleanJsonString = jsonString.replace(/```json/gi, '').replace(/```/g, '').trim();
      const data = JSON.parse(cleanJsonString);
      const postsArray = Array.isArray(data) ? data : (data.posts || data.data);
      const promises = postsArray.map(post =>
        api.createPost({
          project_id: projectId, publish_date: post.publish_date,
          topic: post.topic || "Без названия",
          platforms: post.platforms || {} 
        })
      );
      await Promise.all(promises);
      refreshPosts();
    } catch (e) { alert("Ошибка JSON!"); }
  };

  const handleBadgeClick = async (e, day, platformId, dayPosts) => {
    e.stopPropagation(); 
    const existingPost = dayPosts[0];
    if (existingPost) {
      setSelectedDay({ ...day, targetPlatform: platformId });
    } else {
      await api.createPost({
        project_id: projectId, publish_date: day.dateStr, topic: "",
        platforms: { [platformId]: getEmptyPlatform() }
      }).then(() => { refreshPosts(); setSelectedDay({ ...day, targetPlatform: platformId }); });
    }
  };

  return (
    <div className="w-full h-full flex flex-col min-w-0">
      <PromptModal isOpen={modal.open} onClose={() => setModal({ open: false, text: "" })} promptText={modal.text} />
      <AIImportModal isOpen={isAIModalOpen} onClose={() => setIsAIModalOpen(false)} onImport={handleAIImportLogic} />

      <div className="grid grid-cols-1 lg:grid-cols-3 items-center px-6 md:px-12 py-8 bg-[var(--bg-card)]/50 backdrop-blur-xl border-b-2 border-[var(--border-main)] sticky top-0 z-[40] gap-6 transition-colors duration-500">
        <div className="flex items-center gap-6">
          <div style={{ backgroundImage: 'linear-gradient(to top right, var(--grad-1), var(--grad-2))' }} className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl">
            <BookOpen className="text-white w-7 h-7" />
          </div>
          <div className="text-left">
            <h2 key={monthName} className="text-4xl font-black text-[var(--text-main)] uppercase tracking-tighter leading-none animate-in slide-in-from-top-4">{monthName}</h2>
            <p className="text-sm font-black text-[var(--text-muted)] uppercase tracking-[0.4em] mt-2">{year}</p>
          </div>
        </div>

        <div className="flex justify-center">
          <div className="flex items-center bg-[var(--bg-card)] p-2 rounded-full border-2 border-[var(--border-main)] shadow-xl backdrop-blur-md">
            <button onClick={() => setViewDate(new Date())} className="flex items-center gap-4 pl-2 pr-6 py-2 hover:bg-[var(--bg-input)] rounded-full transition-all group">
              <div style={{ backgroundColor: 'var(--accent)' }} className="w-12 h-12 text-white rounded-full flex items-center justify-center font-black text-base shadow-md group-hover:scale-110 transition-transform">
                {todayNum}
              </div>
              <span className="text-sm font-black uppercase tracking-widest text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors">Сегодня</span>
            </button>
            <div className="w-px h-10 bg-[var(--border-main)] mx-2"></div>
            <div className="flex items-center gap-2">
              <button onClick={() => changeMonth(-1)} className="p-3 text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"><ChevronLeft className="w-6 h-6" /></button>
              <div className="min-w-[120px] text-center"><span className="text-base font-black uppercase tracking-[0.3em] text-[var(--text-main)]">{monthName}</span></div>
              <button onClick={() => changeMonth(1)} className="p-3 text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"><ChevronRight className="w-6 h-6" /></button>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button onClick={() => setIsAIModalOpen(true)} style={{ backgroundImage: 'linear-gradient(to right, var(--grad-1), var(--grad-2))' }} className="flex items-center gap-4 px-8 py-5 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_15px_30px_var(--accent-glow)] group">
            <Sparkles className="w-5 h-5" /> <span>AI Импорт</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6 p-8 md:p-12 flex-1 overflow-y-auto ideas-scroll">
        {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(d => (
          <div key={d} className="hidden lg:block text-center text-[11px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] mb-4">{d}</div>
        ))}
        {Array.from({ length: shift }).map((_, i) => (
          <div key={`empty-${i}`} className="hidden lg:block opacity-10 bg-[var(--bg-input)] border-2 border-dashed border-[var(--border-main)] rounded-[40px] min-h-[180px]" />
        ))}
        {days.map(day => {
          const isToday = day.dateStr === new Date().toISOString().split('T')[0];
          const dayPosts = posts.filter(p => p.publish_date === day.dateStr);
          const activePlats = new Set();
          dayPosts.forEach(p => p?.platforms && Object.keys(p.platforms).forEach(id => p.platforms[id]?.step >= 1 && activePlats.add(id)));
          
          return (
            <div key={day.dateStr} onClick={() => setSelectedDay(day)} style={{ borderColor: isToday ? 'var(--accent)' : 'var(--border-main)', boxShadow: isToday ? '0 0 40px var(--accent-glow)' : 'none' }} className={`w-full bg-[var(--bg-card)] border-2 rounded-[48px] flex flex-col items-center p-8 cursor-pointer hover:border-[var(--border-hover)] hover:-translate-y-2 transition-all duration-300 relative group ${isToday ? 'ring-4 ring-[var(--accent-glow)]' : ''}`}>
              <span style={{ color: isToday ? 'var(--accent)' : 'var(--text-muted)' }} className="text-[10px] font-black uppercase mb-3 tracking-widest">{day.weekdayShort}</span>
              <span style={{ color: isToday ? 'var(--accent)' : 'var(--text-main)' }} className="text-6xl font-black tracking-tighter mb-8">{day.num}</span>
              <div className="flex flex-wrap justify-center gap-2 mt-auto w-full">
                {platformsInfo.map(plat => (
                  <button key={plat.id} onClick={(e) => handleBadgeClick(e, day, plat.id, dayPosts)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${activePlats.has(plat.id) ? plat.activeClass : "bg-[var(--bg-input)] text-[var(--text-muted)] border border-[var(--border-main)] opacity-40 hover:opacity-100 hover:border-[var(--border-hover)]"}`}>
                    {plat.label}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {selectedDay && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xl" onClick={() => setSelectedDay(null)}></div>
          
          {/* 🔥 ВОТ ОНО! РАСШИРЯЕМ МОДАЛКУ С max-w-4xl ДО max-w-[1400px] 🔥 */}
          <div className="relative w-full max-w-[1400px] glass-effect rounded-[56px] shadow-[0_50px_100px_rgba(0,0,0,0.4)] flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-500">
            
            <div className="flex justify-between items-center px-12 pt-14 pb-10 border-b border-[var(--border-main)] shrink-0">
              <div className="flex items-center gap-8">
                 <span className="text-8xl font-black text-[var(--text-main)] tracking-tighter leading-none">{selectedDay.num}</span>
                 <div className="flex flex-col justify-center">
                    <h3 className="text-3xl font-black uppercase text-[var(--text-main)] leading-none tracking-tight">{monthName}</h3>
                    <p style={{ color: 'var(--accent)' }} className="text-xs font-black uppercase tracking-[0.4em] mt-3">{selectedDay.weekdayFull}</p>
                 </div>
              </div>
              <button onClick={() => setSelectedDay(null)} className="w-16 h-16 bg-[var(--bg-input)]/50 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-lg border border-[var(--border-main)] group">
                <X className="w-8 h-8 group-hover:rotate-90 transition-transform" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-10 space-y-12 bg-transparent ideas-scroll">
              {posts.filter(p => p.publish_date === selectedDay.dateStr).map(p => (
                <PostCard
                  key={`${p.id}-${selectedDay.targetPlatform || 'default'}`}
                  post={p}
                  initialPlatform={selectedDay.targetPlatform}
                  refreshPosts={refreshPosts}
                  refreshLibrary={refreshLibrary}
                  projectId={projectId}
                  allPosts={posts}                
                  onOpenPrompt={(t) => setModal({ open: true, text: t })}
                  projectContext={projectContext}
                />
              ))}
              
              <button
                onClick={() => api.createPost({ 
                  project_id: projectId, 
                  publish_date: selectedDay.dateStr, 
                  topic: "", 
                  platforms: selectedDay.targetPlatform ? { [selectedDay.targetPlatform]: getEmptyPlatform() } : {} 
                }).then(refreshPosts)}
                className="w-full py-16 border-4 border-dashed border-[var(--border-main)] rounded-[48px] text-[var(--text-muted)] font-black text-xl uppercase tracking-widest hover:border-[var(--border-hover)] hover:text-[var(--accent)] transition-all flex flex-col items-center gap-4 group bg-[var(--bg-input)]/10"
              >
                <Plus className="w-12 h-12 group-hover:scale-125 transition-transform" />
                <span>Добавить пост</span>
              </button>

            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default Board;