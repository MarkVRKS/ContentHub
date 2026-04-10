import React, { useState } from 'react';
import { X, ArrowRight, BrainCircuit, Activity, UploadCloud, Info, ChevronDown } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function DataHubModal({ isOpen, onClose, onImport }) {
  const [jsonInput, setJsonInput] = useState('');
  const [isGuideOpen, setIsGuideOpen] = useState(false); // Состояние для сворачивания гайда
  
  if (!isOpen) return null;

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { raw: false, dateNF: 'yyyy-mm-dd' });

      const groupedData = {};

      data.forEach(row => {
        const date = row['Дата'];
        if (!date) return;

        if (!groupedData[date]) {
          groupedData[date] = {
            publish_date: date,
            topic: row['Общая тема'] || "",
            platforms: {}
          };
        }

        const platform = row['Площадка'];
        if (platform && ['VK', 'TG', 'INST', 'YT', 'MAX'].includes(platform.toUpperCase())) {
          groupedData[date].platforms[platform.toUpperCase()] = {
            step: 1,
            topic: row['Тема поста'] || "",
            rubric: row['Рубрика'] || "",
            format: row['Формат'] || "",
            promptTab: 'text',
            textPrompt: {
              role: row['Роль'] || "SMM-специалист",
              tone: row['Тональность'] || "",
              details: row['ТЗ текста'] || "",
              cta: row['CTA'] || "",
              kpi: row['KPI'] || "",
              useMns: true
            },
            visualPrompt: {
              format: row['Формат визуала'] || "1:1",
              essence: row['ТЗ визуала'] || "",
              useColors: !!row['Цвета'],
              colors: row['Цвета'] ? row['Цвета'].split(',').map(c => c.trim()) : []
            }
          };
        }
      });

      const finalJson = Object.values(groupedData);
      setJsonInput(JSON.stringify(finalJson, null, 2));
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-2xl animate-in fade-in duration-500">
      <div className="absolute inset-0" onClick={onClose}></div>
      
      {/* ИЗМЕНЕНО: Фон теперь использует CSS-переменные темы */}
      <div className="relative bg-[var(--bg-card)] border border-[var(--border-main)] w-full max-w-4xl rounded-[48px] shadow-[0_40px_100px_var(--accent-glow)] overflow-hidden flex flex-col max-h-[90vh] z-10">
        
        {/* HEADER */}
        <div className="p-10 border-b border-[var(--border-main)] flex justify-between items-center bg-[var(--bg-app)]/30">
          <div className="flex items-center gap-6">
            <div style={{ backgroundImage: 'linear-gradient(to top right, var(--grad-1), var(--grad-2))' }} className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl">
              <BrainCircuit className="text-white w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-[var(--text-main)] leading-none">КОНВЕРТОР XLS ➞ JSON</h2>
              <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
                <Activity className="w-3 h-3 text-[var(--accent)]" /> Импорт контент-плана
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-12 h-12 bg-[var(--bg-input)] rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-all text-[var(--text-muted)] border border-[var(--border-main)]">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-8 md:p-10 flex-1 flex flex-col gap-6 overflow-hidden">
          
          {/* ЗОНА EXCEL */}
          <div className="relative overflow-hidden group rounded-[32px] border-2 border-dashed border-[var(--border-main)] hover:border-[var(--accent)] transition-all bg-[var(--bg-input)] p-8 flex flex-col items-center justify-center text-center gap-4 cursor-pointer shrink-0">
            <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
            <div className="w-16 h-16 bg-[var(--bg-card)] rounded-full flex items-center justify-center text-[var(--accent)] group-hover:scale-110 transition-transform shadow-sm">
              <UploadCloud className="w-8 h-8" />
            </div>
            <div>
              <p className="text-[var(--text-main)] font-black text-lg uppercase tracking-widest">Загрузить Excel (.xlsx)</p>
              <p className="text-[var(--text-muted)] text-xs uppercase tracking-[0.2em] mt-2">Или перетащи файл сюда</p>
            </div>
          </div>

          {/* ИНФО-БЛОК (СВОРАЧИВАЕМЫЙ И УНИВЕРСАЛЬНЫЙ) */}
          <div className="border border-[var(--accent)]/30 bg-[var(--accent)]/5 rounded-[24px] overflow-hidden shrink-0 transition-all duration-300">
            <button 
              onClick={() => setIsGuideOpen(!isGuideOpen)} 
              className="w-full flex items-center justify-between p-5 hover:bg-[var(--accent)]/10 transition-colors"
            >
              <div className="flex items-center gap-3 text-[var(--accent)]">
                <Info className="w-5 h-5" />
                <span className="text-xs font-black uppercase tracking-widest">Как настроить Excel-таблицу</span>
              </div>
              <ChevronDown className={`w-5 h-5 text-[var(--accent)] transition-transform duration-300 ${isGuideOpen ? 'rotate-180' : ''}`} />
            </button>

            {isGuideOpen && (
              <div className="p-5 pt-0 text-[var(--text-main)] text-sm animate-in slide-in-from-top-2 duration-300">
                <p className="text-[var(--text-muted)] mb-4 font-medium leading-relaxed">
                  Ваша таблица должна иметь строгую структуру. Первая строка (заголовок) должна в точности повторять названия колонок ниже. Каждая следующая строка — это один пост для конкретной соцсети.
                </p>
                
                {/* Пример таблицы */}
                <div className="overflow-x-auto border border-[var(--border-main)] rounded-xl bg-[var(--bg-input)]">
                  <table className="w-full text-left text-[11px] whitespace-nowrap">
                    <thead className="bg-[var(--bg-card)] border-b border-[var(--border-main)] text-[var(--text-muted)] uppercase font-black tracking-wider">
                      <tr>
                        <th className="p-3">Дата</th>
                        <th className="p-3 border-l border-[var(--border-main)]">Общая тема</th>
                        <th className="p-3 border-l border-[var(--border-main)]">Площадка</th>
                        <th className="p-3 border-l border-[var(--border-main)]">Тема поста</th>
                        <th className="p-3 border-l border-[var(--border-main)]">Рубрика</th>
                        <th className="p-3 border-l border-[var(--border-main)]">ТЗ текста</th>
                        <th className="p-3 border-l border-[var(--border-main)]">... (и т.д.)</th>
                      </tr>
                    </thead>
                    <tbody className="font-medium">
                      <tr className="border-b border-[var(--border-main)]/50 hover:bg-[var(--bg-card)] transition-colors">
                        <td className="p-3 text-[var(--accent)]">2026-04-01</td>
                        <td className="p-3 border-l border-[var(--border-main)]/50">Весенняя коллекция</td>
                        <td className="p-3 border-l border-[var(--border-main)]/50 text-[#0077FF] font-bold">VK</td>
                        <td className="p-3 border-l border-[var(--border-main)]/50">Запуск скидок</td>
                        <td className="p-3 border-l border-[var(--border-main)]/50">Продающий</td>
                        <td className="p-3 border-l border-[var(--border-main)]/50 truncate max-w-[150px]">Напиши текст про...</td>
                        <td className="p-3 border-l border-[var(--border-main)]/50">...</td>
                      </tr>
                      <tr className="hover:bg-[var(--bg-card)] transition-colors">
                        <td className="p-3 text-[var(--accent)]">2026-04-01</td>
                        <td className="p-3 border-l border-[var(--border-main)]/50 text-[var(--text-muted)]">(можно пусто)</td>
                        <td className="p-3 border-l border-[var(--border-main)]/50 text-[#229ED9] font-bold">TG</td>
                        <td className="p-3 border-l border-[var(--border-main)]/50">Анонс для своих</td>
                        <td className="p-3 border-l border-[var(--border-main)]/50">Экспертный</td>
                        <td className="p-3 border-l border-[var(--border-main)]/50 truncate max-w-[150px]">Коротко расскажи...</td>
                        <td className="p-3 border-l border-[var(--border-main)]/50">...</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-bold">
                  <span className="text-[var(--text-muted)] uppercase tracking-widest mr-2">Обязательные колонки:</span>
                  {['Дата', 'Общая тема', 'Площадка', 'Тема поста', 'Рубрика', 'Формат', 'Роль', 'Тональность', 'ТЗ текста', 'CTA', 'KPI', 'Формат визуала', 'ТЗ визуала', 'Цвета'].map(col => (
                    <span key={col} className="bg-[var(--bg-card)] border border-[var(--border-main)] px-2 py-1 rounded-md text-[var(--text-main)]">
                      {col}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 opacity-50 shrink-0">
            <div className="flex-1 h-px bg-[var(--border-main)]"></div>
            <span className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">ИЛИ ВСТАВЬ JSON</span>
            <div className="flex-1 h-px bg-[var(--border-main)]"></div>
          </div>

          {/* ЗОНА JSON */}
          <div className="relative flex-1 min-h-[120px] flex flex-col">
             <textarea 
               value={jsonInput} 
               onChange={(e) => setJsonInput(e.target.value)} 
               placeholder="Массив JSON появится здесь..." 
               className="w-full h-full bg-[var(--bg-input)] rounded-[32px] p-6 font-mono text-sm text-[var(--text-main)] outline-none border-2 border-[var(--border-main)] focus:border-[var(--accent)] transition-all resize-none ideas-scroll shadow-inner placeholder-[var(--text-muted)]" 
             />
          </div>
          
          <button 
            onClick={() => { onImport(jsonInput); setJsonInput(''); onClose(); }} 
            style={{ backgroundImage: 'linear-gradient(to right, var(--grad-1), var(--grad-2))' }} 
            className="w-full py-6 text-white rounded-[32px] font-black text-sm uppercase tracking-[0.3em] hover:scale-[1.02] active:scale-95 transition-all shadow-[0_15px_30px_var(--accent-glow)] flex items-center justify-center gap-3 shrink-0 group"
          >
            Синхронизировать базу <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}