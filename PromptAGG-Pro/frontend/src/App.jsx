import React, { useState, useEffect, useMemo } from 'react';
import { 
  CalendarDays, Lightbulb, BookOpen, 
  Settings2, X, Trash2, Sparkles, Send, Layers, ChevronDown, Check, Briefcase, Plus, Edit3,
  Copy, CheckCircle2 
} from 'lucide-react';
import api, { HUB_IP } from './api';
import Board from './Board';
import Tools from './Tools';
import SettingsModal from './SettingsModal';
import LibraryModal from './LibraryModal';
import TutorialModal from './TutorialModal';
import DataHubModal from './DataHubModal'; 

const ProjectSwitcher = ({ currentId, projects, onSelect, onAdd, onDeleteClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newProject, setNewProject] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = () => {
    if (!newProject.trim()) return;
    onAdd(newProject.trim());
    setNewProject('');
    setIsAdding(false);
  };

  const safeProjects = Array.isArray(projects) ? projects : [];

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-5 py-3 bg-[var(--bg-input)] hover:bg-[var(--bg-card)] border-2 border-[var(--border-main)] rounded-2xl transition-all duration-300 group active:scale-95 shadow-sm"
      >
        <Briefcase className="w-4 h-4 text-[var(--accent)]" />
        <span className="text-xs font-black uppercase tracking-widest text-[var(--text-main)]">
          {currentId}
        </span>
        <ChevronDown className={`w-4 h-4 text-[var(--text-muted)] transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-[110]" onClick={() => setIsOpen(false)}></div>
          <div className="absolute top-full left-0 mt-3 w-80 bg-[var(--bg-card)] border-2 border-[var(--border-main)] rounded-[32px] shadow-2xl z-[120] overflow-hidden animate-in zoom-in-95 slide-in-from-top-2 backdrop-blur-2xl flex flex-col max-h-[450px]">
            
            <div className="p-4 bg-[var(--bg-input)]/50 border-b-2 border-[var(--border-main)] flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">Проекты</span>
              <button 
                onClick={() => setIsAdding(!isAdding)}
                className={`p-2 rounded-xl transition-all ${isAdding ? 'bg-[var(--accent)] text-white shadow-md' : 'bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--accent)] border-2 border-[var(--border-main)]'}`}
              >
                {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              </button>
            </div>

            {isAdding && (
              <div className="p-4 bg-[var(--bg-card)] border-b-2 border-[var(--border-main)] animate-in slide-in-from-top-2">
                <div className="flex items-center gap-2 bg-[var(--bg-input)] p-2 rounded-2xl border-2 border-[var(--border-main)] focus-within:border-[var(--accent)] transition-colors">
                  <input 
                    autoFocus
                    value={newProject}
                    onChange={e => setNewProject(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAdd()}
                    placeholder="Название проекта..."
                    className="flex-1 bg-transparent px-2 py-1 text-sm font-bold outline-none text-[var(--text-main)]"
                  />
                  <button 
                    onClick={handleAdd} 
                    disabled={!newProject.trim()}
                    className="bg-[var(--accent)] text-white p-2 rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
                  >
                    <Check className="w-4 h-4"/>
                  </button>
                </div>
              </div>
            )}

            <div className="p-3 space-y-1 overflow-y-auto ideas-scroll">
              {safeProjects.length > 0 ? safeProjects.map(proj => (
                <div key={proj.id} className="flex items-center gap-2 group/item">
                  <button
                    onClick={() => { onSelect(proj.id); setIsOpen(false); }}
                    className={`flex-1 flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all ${
                      currentId === proj.id 
                        ? 'bg-[var(--accent)] text-white shadow-[0_5px_15px_var(--accent-glow)]' 
                        : 'text-[var(--text-main)] hover:bg-[var(--bg-input)] hover:text-[var(--accent)]'
                    }`}
                  >
                    <span className="text-sm font-black uppercase tracking-widest">{proj.name}</span>
                    {currentId === proj.id && <Check className="w-5 h-5" />}
                  </button>
                  {currentId !== proj.id && (
                     <button 
                       onClick={(e) => { e.stopPropagation(); onDeleteClick(proj.id); setIsOpen(false); }}
                       className="p-3.5 text-[var(--text-muted)] hover:text-white hover:bg-red-500 rounded-2xl opacity-0 group-hover/item:opacity-100 transition-all border-2 border-transparent hover:border-red-600"
                     >
                       <Trash2 className="w-5 h-5" />
                     </button>
                  )}
                </div>
              )) : (
                <div className="p-4 text-center text-xs font-bold text-[var(--text-muted)]">Проектов не найдено</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default function App() {
  const [projectId, setProjectId] = useState('mns');
  const [activeTab, setActiveTab] = useState('board');
  const [projectsList, setProjectsList] = useState([]); 
  const [projectToDelete, setProjectToDelete] = useState(null); 
  
  const [theme, setTheme] = useState('light');
  const [posts, setPosts] = useState([]);
  const [ideas, setIdeas] = useState([]);
  const [library, setLibrary] = useState([]); 
  
  const [isIdeasOpen, setIsIdeasOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false); 
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDataHubOpen, setIsDataHubOpen] = useState(false);
  const [newIdeaText, setNewIdeaText] = useState('');
  
  const [editingIdeaId, setEditingIdeaId] = useState(null);
  const [editIdeaText, setEditIdeaText] = useState("");

  const [runTutorial, setRunTutorial] = useState(false);

  // 🔥 ЛОГИКА ДЛЯ ВВОДА IP-АДРЕСА (СММЩИКАМ)
  const isManagerMode = new URLSearchParams(window.location.search).get('isManager') === 'true';
  const [tempIp, setTempIp] = useState('');
  const [showIpEntry, setShowIpEntry] = useState(!isManagerMode && !HUB_IP);

  const saveIpAndReload = () => {
    if (tempIp.trim()) {
      localStorage.setItem('HUB_IP', tempIp.trim());
      window.location.reload();
    }
  };

  const [copiedIp, setCopiedIp] = useState(false);
  const managerDisplayIp = localStorage.getItem('MANAGER_DISPLAY_IP');

  const handleCopyIp = () => {
    if (managerDisplayIp) {
      navigator.clipboard.writeText(managerDisplayIp);
      setCopiedIp(true);
      setTimeout(() => setCopiedIp(false), 2000);
    }
  };

  const handleCompleteTutorial = () => {
    localStorage.setItem('promptagg_tutorial_done', 'true');
    setRunTutorial(false);
  };

  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); }, [theme]);
  
  const fetchProjects = async () => {
    if (showIpEntry) return; // Не делаем запрос, если IP еще не введен
    try {
      const res = await api.getProjects();
      const list = Array.isArray(res.data) ? res.data : [];
      setProjectsList(list);
      if (list.length > 0 && !list.find(p => p.id === projectId)) {
        setProjectId(list[0].id);
      }
    } catch (e) { 
      console.error("Ошибка проектов:", e); 
      setProjectsList([]); 
    }
  };

  useEffect(() => { fetchProjects(); }, []);
  useEffect(() => { 
    if (!showIpEntry) { fetchData(); fetchLibrary(); }
  }, [projectId, showIpEntry]);

  useEffect(() => {
    const isTutorialDone = localStorage.getItem('promptagg_tutorial_done');
    if (!isTutorialDone && !showIpEntry) setRunTutorial(true);
  }, [showIpEntry]);

  useEffect(() => {
    if (!HUB_IP || showIpEntry) return; // Не подключаем сокеты, пока нет IP

    let socket;
    let timeout;
    let isComponentMounted = true;

    const connect = () => {
      console.log(`📡 Подключение к WebSocket: ws://${HUB_IP}:8000/ws`);
      socket = new WebSocket(`ws://${HUB_IP}:8000/ws`); 
      
      socket.onmessage = (event) => { 
        if (event.data === "update_posts") { 
          fetchData(); 
          fetchLibrary(); 
        } 
      };
      
      socket.onclose = () => { 
        if (isComponentMounted) {
          timeout = setTimeout(connect, 3000); 
        }
      };
    };
    
    connect();

    return () => { 
      isComponentMounted = false;
      if (socket) {
        socket.onclose = null; 
        if (socket.readyState === WebSocket.CONNECTING) socket.onopen = () => socket.close();
        else socket.close(); 
      }
      clearTimeout(timeout); 
    };
  }, [projectId, showIpEntry]);

  const fetchData = async () => {
    try { 
      const postsRes = await api.getPosts(projectId); 
      const ideasRes = await api.getIdeas(projectId); 
      setPosts(Array.isArray(postsRes.data) ? postsRes.data : []); 
      setIdeas(Array.isArray(ideasRes.data) ? ideasRes.data : []); 
    } catch (e) { 
      console.error("Ошибка получения данных:", e);
      setPosts([]); 
      setIdeas([]); 
    }
  };

  const fetchLibrary = async () => {
    try { const res = await api.getLibrary(); setLibrary(res.data || []); } catch (e) { console.error(e); }
  };

  const handleAddProject = async (name) => {
    try {
      const newId = name.toLowerCase().replace(/[^a-zа-яё0-9]/g, '');
      if (!newId) return alert("Имя проекта должно содержать хотя бы одну букву или цифру!");
      await api.createProject({ id: newId, name: name });
      await fetchProjects();
      setProjectId(newId);
    } catch (e) { alert("Ошибка при создании проекта на сервере!"); }
  };

  const confirmDeleteProject = async () => {
    if (!projectToDelete) return;
    try {
      await api.deleteProject(projectToDelete);
      setProjectToDelete(null);
      await fetchProjects();
    } catch (e) { alert("Ошибка!"); }
  };

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
      fetchData();
    } catch (e) { alert("Ошибка JSON!"); }
  };

  const handleAddPrompt = async (data) => { await api.createLibraryPrompt(data); fetchLibrary(); };
  const handleUpdatePrompt = async (id, data) => { await api.updateLibraryPrompt(id, data); fetchLibrary(); };
  const handleDeletePrompt = async (id) => { if(!window.confirm("Удалить?")) return; await api.deleteLibraryPrompt(id); fetchLibrary(); };

  const handleSaveContext = async (newContext) => {
    const existing = library.find(item => item.type === 'context' && item.title === projectId);
    if (existing) await api.deleteLibraryPrompt(existing.id);
    await api.createLibraryPrompt({ type: 'context', title: projectId, text: JSON.stringify(newContext) });
    fetchLibrary();
  };

  const currentProjectContext = useMemo(() => {
    if (!Array.isArray(library)) return { brand: '', style: '', typo: '' }; 
    const ctx = library.find(item => item.type === 'context' && item.title === projectId);
    if (ctx) { try { return JSON.parse(ctx.text); } catch(e) { return null; } }
    return { brand: '', style: '', typo: '' };
  }, [library, projectId]);

  const handleAddIdea = async () => {
    if (!newIdeaText.trim()) return;
    try {
        const res = await api.createIdea({ project_id: projectId, text: newIdeaText });
        setIdeas([...ideas, res.data]); 
        setNewIdeaText('');
    } catch (e) {
        alert("Ошибка: сервер недоступен!");
    }
  };

  const handleDeleteIdea = async (id) => { await api.deleteIdea(id); setIdeas(ideas.filter(i => i.id !== id)); };

  const handleSaveEditIdea = async (id) => {
    if (!editIdeaText.trim()) return;
    try {
      await api.updateIdea(id, { text: editIdeaText });
      setEditingIdeaId(null);
      fetchData();
    } catch (e) { alert("Ошибка сохранения идеи"); }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden font-sans bg-[var(--bg-app)] transition-colors duration-500">
      
      <header className="bg-[var(--bg-card)]/60 backdrop-blur-2xl border-b-2 border-[var(--border-main)] px-10 py-5 grid grid-cols-3 items-center z-[100] shrink-0 transition-colors duration-500">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 cursor-pointer group">
             <div 
               style={{ backgroundImage: 'linear-gradient(to top right, var(--grad-1), var(--grad-2))' }}
               className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl shadow-[var(--accent-glow)] group-hover:rotate-12 transition-all"
             >
                <Sparkles className="text-white w-6 h-6" />
             </div>
             <h1 className="text-3xl font-black tracking-tighter bg-gradient-to-r from-[var(--grad-1)] to-[var(--grad-2)] bg-clip-text text-transparent">
               PromptAGG
             </h1>
          </div>
          <div className="h-10 w-[2px] bg-[var(--border-main)] opacity-50"></div>
          
          <ProjectSwitcher 
            currentId={projectId} 
            projects={projectsList} 
            onSelect={setProjectId} 
            onAdd={handleAddProject}
            onDeleteClick={setProjectToDelete}
          />
        </div>

        <div className="flex justify-center">
          <div className="flex items-center bg-[var(--bg-input)] p-1.5 rounded-[32px] border-2 border-[var(--border-main)] shadow-lg backdrop-blur-md">
             <button 
               onClick={() => setActiveTab('board')} 
               className={`flex items-center gap-4 px-10 py-3.5 rounded-[24px] text-xs md:text-sm font-black uppercase tracking-widest transition-all ${
                 activeTab === 'board' 
                   ? 'bg-[var(--bg-card)] text-[var(--text-main)] shadow-md border border-[var(--border-main)]' 
                   : 'text-[var(--text-muted)] hover:text-[var(--text-main)] border border-transparent'
               }`}
             >
                <CalendarDays className="w-4 h-4" /> <span className="hidden sm:inline">Календарь</span>
             </button>
             <button 
               onClick={() => setActiveTab('tools')} 
               className={`flex items-center gap-4 px-10 py-3.5 rounded-[24px] text-xs md:text-sm font-black uppercase tracking-widest transition-all ${
                 activeTab === 'tools' 
                   ? 'bg-[var(--bg-card)] text-[var(--text-main)] shadow-md border border-[var(--border-main)]' 
                   : 'text-[var(--text-muted)] hover:text-[var(--text-main)] border border-transparent'
               }`}
             >
                <Layers className="w-4 h-4" /> <span className="hidden sm:inline">Нейронки</span>
             </button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4">
          
          {/* 🔥 КНОПКА КОПИРОВАНИЯ IP (Только для руководителя) */}
          {managerDisplayIp && (
            <button 
              onClick={handleCopyIp}
              title="Скопировать IP для отправки СММ-специалистам"
              className="flex items-center gap-2 px-5 py-4 bg-[var(--bg-input)] text-[var(--accent)] font-black text-[10px] uppercase tracking-widest rounded-2xl border-2 border-[var(--border-main)] hover:border-[var(--accent)] hover:shadow-[0_0_15px_var(--accent-glow)] transition-all active:scale-95 mr-2"
            >
              {copiedIp ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              <span>IP: {managerDisplayIp}</span>
            </button>
          )}

          <button 
            onClick={() => setIsLibraryOpen(true)} 
            className="p-4 bg-[var(--bg-input)] text-[var(--text-muted)] rounded-2xl border-2 border-[var(--border-main)] hover:text-[var(--accent)] hover:border-[var(--border-hover)] transition-all active:scale-90 shadow-sm" 
          >
            <BookOpen className="w-6 h-6" />
          </button>

          <button 
            onClick={() => setIsIdeasOpen(!isIdeasOpen)} 
            className="flex items-center gap-4 bg-[var(--bg-input)] text-[var(--text-main)] px-8 py-4 rounded-2xl border-2 border-[var(--border-main)] hover:border-[var(--gold)] hover:text-[var(--gold)] transition-all font-black text-xs md:text-sm uppercase tracking-widest relative active:scale-95 shadow-sm group"
          >
            <Lightbulb className={`w-5 h-5 md:w-6 md:h-6 transition-colors ${ideas.length > 0 ? 'text-[var(--gold)] animate-bulb' : ''}`} /> 
            <span className="hidden xl:inline">Багаж идей</span>
            <div className="w-7 h-7 bg-[var(--gold)] text-white rounded-full flex items-center justify-center text-xs font-black border-2 border-[var(--bg-card)] shadow-lg">
              {ideas.length}
            </div>
          </button>

          <button 
            onClick={() => setIsSettingsOpen(true)} 
            className="w-14 h-14 bg-[var(--bg-input)] text-[var(--text-muted)] hover:text-[var(--accent)] rounded-2xl border-2 border-[var(--border-main)] hover:border-[var(--border-hover)] flex items-center justify-center shadow-sm hover:shadow-[0_10px_20px_var(--accent-glow)] active:scale-90 transition-all"
          >
            <Settings2 className="w-6 h-6" />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden relative bg-[var(--bg-app)]">
        <div className="h-full overflow-y-auto ideas-scroll transition-colors duration-500">
          {activeTab === 'board' ? <Board projectId={projectId} posts={posts} refreshPosts={fetchData} projectContext={currentProjectContext} /> : <Tools library={library} projectId={projectId} />}
        </div>
      </main>

      <div className={`fixed right-0 top-0 h-full w-[500px] bg-[var(--bg-card)] border-l-2 border-[var(--border-main)] transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] z-[300] flex flex-col ${isIdeasOpen ? 'translate-x-0 shadow-[-40px_0_100px_rgba(0,0,0,0.5)]' : 'translate-x-full shadow-none'}`}>
        <div className="p-10 border-b-2 border-[var(--border-main)] flex justify-between items-center relative overflow-hidden shrink-0">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-20" style={{ backgroundColor: 'var(--gold)' }}></div>
          <div className="flex items-center gap-5 relative z-10">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center border-2 shadow-sm" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.2)' }}>
              <Lightbulb style={{ color: 'var(--gold)' }} className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[var(--text-main)] tracking-tighter uppercase leading-none">Idea Vault</h2>
              <p style={{ color: 'var(--gold)' }} className="text-[10px] font-bold uppercase tracking-[0.3em] mt-1 opacity-80">Хранилище мыслей</p>
            </div>
          </div>
          <button onClick={() => setIsIdeasOpen(false)} className="p-4 bg-[var(--bg-input)] hover:bg-red-500 hover:text-white text-[var(--text-muted)] rounded-full transition-all relative z-10 border border-[var(--border-main)]"><X className="w-6 h-6" /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-[var(--bg-app)]/50 ideas-scroll">
          {(Array.isArray(ideas) ? ideas : []).map((idea,idx) => (
            <div key={idea.id} className="relative group p-6 rounded-[32px] bg-[var(--bg-card)] border-2 border-[var(--border-main)] transition-all duration-500 shadow-sm hover:shadow-xl overflow-hidden flex flex-col">
              <span className="absolute -right-2 top-0 text-[100px] font-black text-[var(--text-muted)] opacity-5 italic pointer-events-none">{(idx + 1).toString().padStart(2, '0')}</span>
              
              <div className="relative z-10 flex w-full h-full">
                {editingIdeaId === idea.id ? (
                  <div className="flex-1 flex flex-col gap-3">
                    <textarea 
                      value={editIdeaText} 
                      onChange={e => setEditIdeaText(e.target.value)} 
                      className="w-full bg-[var(--bg-input)] rounded-2xl p-4 text-sm font-medium text-[var(--text-main)] outline-none border-2 focus:border-[var(--gold)] resize-none"
                      rows="4"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => handleSaveEditIdea(idea.id)} className="px-4 py-2 bg-[var(--gold)] text-white rounded-xl font-bold text-xs uppercase tracking-wider">Сохранить</button>
                      <button onClick={() => setEditingIdeaId(null)} className="px-4 py-2 bg-[var(--bg-input)] text-[var(--text-muted)] hover:text-white hover:bg-red-500 rounded-xl font-bold text-xs uppercase tracking-wider">Отмена</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex w-full items-start gap-4">
                    <p className="flex-1 min-w-0 text-base font-medium text-[var(--text-main)] leading-relaxed whitespace-pre-wrap break-words">{idea.text}</p>
                    
                    <div className="flex flex-col gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => { setEditingIdeaId(idea.id); setEditIdeaText(idea.text); }} className="p-3 bg-[var(--bg-input)] text-[var(--text-muted)] rounded-xl hover:bg-[var(--accent)] hover:text-white border border-[var(--border-main)]"><Edit3 className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteIdea(idea.id)} className="p-3 bg-[var(--bg-input)] text-[var(--text-muted)] rounded-xl hover:bg-red-500 hover:text-white border border-[var(--border-main)]"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="p-8 border-t-2 border-[var(--border-main)] bg-[var(--bg-card)] relative z-10">
          <textarea value={newIdeaText} onChange={(e) => setNewIdeaText(e.target.value)} placeholder="Запишите вашу идею..." className="w-full p-8 bg-[var(--bg-input)] rounded-[32px] text-base font-medium outline-none border-2 border-transparent focus:border-[var(--gold)] h-32 resize-none transition-all text-[var(--text-main)] shadow-inner" />
          <button onClick={handleAddIdea} style={{ backgroundColor: 'var(--gold)' }} className="w-full mt-6 py-6 text-white rounded-[24px] font-black text-xs uppercase tracking-[0.3em] transition-all hover:scale-[1.02] active:scale-95 shadow-[0_10px_20px_rgba(245,158,11,0.3)] flex justify-center items-center gap-3">
            Синхронизировать <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      <SettingsModal 
        isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} 
        currentTheme={theme} setTheme={setTheme} projectId={projectId}
        projectContext={currentProjectContext} onSaveContext={handleSaveContext}
        setRunTutorial={setRunTutorial} 
        onOpenDataHub={() => setIsDataHubOpen(true)} 
      />
      
      <LibraryModal 
        isOpen={isLibraryOpen} onClose={() => setIsLibraryOpen(false)} 
        library={library} onAdd={handleAddPrompt} onUpdate={handleUpdatePrompt} 
        onDelete={handleDeletePrompt} projectId={projectId} refreshPosts={fetchData}
      />

      <TutorialModal isOpen={runTutorial} onClose={handleCompleteTutorial} />

      <DataHubModal 
        isOpen={isDataHubOpen} 
        onClose={() => setIsDataHubOpen(false)} 
        onImport={handleAIImportLogic} 
      />

      {/* МОДАЛКА УДАЛЕНИЯ ПРОЕКТА */}
      {projectToDelete && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setProjectToDelete(null)}></div>
          <div className="relative bg-[var(--bg-card)] border-2 border-red-500/30 w-full max-w-md rounded-[32px] p-8 shadow-[0_0_50px_rgba(239,68,68,0.2)] animate-in zoom-in-95 slide-in-from-bottom-4">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 mx-auto relative overflow-hidden">
              <div className="absolute inset-0 bg-red-500/20 animate-ping"></div>
              <Trash2 className="w-10 h-10 text-red-500 relative z-10" />
            </div>
            <h3 className="text-2xl font-black text-center mb-2 tracking-tight">Удаление проекта</h3>
            <p className="text-center text-[var(--text-muted)] font-medium mb-8 leading-relaxed">
              Вы уверены, что хотите удалить <span className="text-red-500 font-black uppercase tracking-wider bg-red-500/10 px-2 py-1 rounded-md">{(projectsList.find(p => p.id === projectToDelete))?.name || projectToDelete}</span>?<br/><br/>
              Это действие безвозвратно удалит проект и все данные.
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setProjectToDelete(null)} 
                className="flex-1 py-4 bg-[var(--bg-input)] text-[var(--text-main)] rounded-2xl font-bold transition-all hover:bg-[var(--border-main)] active:scale-95"
              >
                Отмена
              </button>
              <button 
                onClick={confirmDeleteProject} 
                className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-bold shadow-[0_10px_20px_rgba(239,68,68,0.3)] transition-all hover:bg-red-600 active:scale-95 flex items-center justify-center gap-2"
              >
                <Trash2 className="w-5 h-5" /> Удалить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔥 КРАСИВАЯ МОДАЛКА ВВОДА IP ДЛЯ СММЩИКОВ 🔥 */}
      {showIpEntry && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
          <div className="bg-[var(--bg-card)] border-2 border-[var(--accent)] p-10 rounded-[40px] shadow-[0_0_50px_var(--accent-glow)] max-w-md w-full animate-in zoom-in-95 relative z-10">
            <div className="w-20 h-20 bg-[var(--accent)]/10 rounded-3xl flex items-center justify-center mb-6 mx-auto">
              <Layers className="w-10 h-10 text-[var(--accent)]" />
            </div>
            <h2 className="text-2xl font-black text-center mb-2 uppercase tracking-tight">Подключение</h2>
            <p className="text-center text-[var(--text-muted)] text-sm mb-8 font-medium">
              Введите IP-адрес компьютера руководителя (например, 192.168.0.222)
            </p>
            
            <input 
              autoFocus
              type="text" 
              value={tempIp}
              onChange={(e) => setTempIp(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveIpAndReload()}
              placeholder="192.168.0.XXX"
              className="w-full p-5 bg-[var(--bg-input)] rounded-2xl border-2 border-[var(--border-main)] focus:border-[var(--accent)] outline-none text-center font-black text-xl mb-6 transition-all text-[var(--text-main)]"
            />
            
            <button 
              onClick={saveIpAndReload}
              className="w-full py-5 bg-[var(--accent)] text-white rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-[0_10px_20px_var(--accent-glow)] flex items-center justify-center gap-3"
            >
              <Send className="w-5 h-5"/> Подключиться
            </button>
          </div>
        </div>
      )}

    </div>
  );
}