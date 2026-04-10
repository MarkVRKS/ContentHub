import React, { useState } from 'react';
import { 
  X, Palette, Type, Image as ImageIcon, 
  Sparkles, Fingerprint, Copy, CheckCircle2 
} from 'lucide-react';

export default function StyleMapModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('brand');
  const [copiedHex, setCopiedHex] = useState(null);

  if (!isOpen) return null;

  const handleCopy = (hex) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 2000);
  };

  const tabs = [
    { id: 'brand', icon: Fingerprint, label: 'ДНК Бренда' },
    { id: 'colors', icon: Palette, label: 'Палитра цветов' },
    { id: 'typo', icon: Type, label: 'Типографика' },
    { id: 'photo', icon: ImageIcon, label: 'Фото стиль' },
    { id: 'ai', icon: Sparkles, label: 'AI Промпты' },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-500">
      {/* Затемнение с мощным блюром */}
      <div 
        className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-xl transition-opacity"
        onClick={onClose}
      />

      {/* Главный контейнер (Стиль Apple Glass / Bento) */}
      <div className="relative w-full max-w-7xl h-[85vh] bg-white/70 dark:bg-slate-900/80 backdrop-blur-2xl border border-white/40 dark:border-slate-700/50 rounded-[48px] shadow-[0_0_80px_rgba(0,0,0,0.2)] flex flex-col md:flex-row overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
        
        {/* Кнопка закрытия */}
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 z-50 p-4 bg-white/50 dark:bg-slate-800/50 hover:bg-red-500 hover:text-white dark:hover:bg-red-500 text-slate-500 rounded-full backdrop-blur-md transition-all duration-300 hover:rotate-90 hover:scale-110 shadow-lg"
        >
          <X className="w-6 h-6" />
        </button>

        {/* SIDEBAR */}
        <div className="w-full md:w-80 bg-white/40 dark:bg-black/20 border-r border-white/30 dark:border-slate-700/30 p-8 flex flex-col shrink-0">
          <div className="mb-12">
            <h2 className="text-3xl font-black bg-gradient-to-br from-slate-900 to-slate-500 dark:from-white dark:to-slate-400 bg-clip-text text-transparent uppercase tracking-tighter">
              MNS<br/>Style Map
            </h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em] mt-2">Brandbook 2026</p>
          </div>

          <div className="flex flex-col gap-3 flex-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all duration-300 ${
                  activeTab === tab.id 
                    ? 'bg-purple-600 text-white shadow-[0_10px_30px_rgba(147,51,234,0.3)] scale-105' 
                    : 'text-slate-500 hover:bg-white/50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'animate-pulse' : ''}`} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 overflow-y-auto p-8 md:p-12 hide-scroll scroll-smooth">
          
          {/* TAB: БРЕНД */}
          {activeTab === 'brand' && (
            <div className="space-y-8 animate-in slide-in-from-right-8 fade-in duration-500">
              <div className="p-10 rounded-[40px] bg-gradient-to-br from-purple-600 to-indigo-600 text-white relative overflow-hidden shadow-2xl">
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                <h3 className="text-4xl font-black uppercase tracking-tighter mb-4 relative z-10">MNS-Обувь</h3>
                <p className="text-xl font-medium text-white/80 max-w-2xl leading-relaxed relative z-10">
                  Мы создаем не просто обувь. Мы создаем уверенность в каждом шаге. Сочетание премиальных материалов, идеальной колодки и современного минимализма.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-8 rounded-[32px] bg-white/50 dark:bg-slate-800/50 border border-white/40 dark:border-slate-700/50 backdrop-blur-sm">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Tone of Voice</h4>
                  <ul className="space-y-4">
                    {['Экспертный, но не скучный', 'Заботливый (как подруга)', 'Стильный и дерзкий', 'Премиальный, но доступный'].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-lg font-bold text-slate-800 dark:text-white">
                        <CheckCircle2 className="text-purple-500 w-6 h-6" /> {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-8 rounded-[32px] bg-white/50 dark:bg-slate-800/50 border border-white/40 dark:border-slate-700/50 backdrop-blur-sm">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Ключевые слова</h4>
                  <div className="flex flex-wrap gap-3">
                    {['Комфорт', 'Кожа', 'Стиль', 'Уверенность', 'Тренды 2026', 'Качество'].map(tag => (
                      <span key={tag} className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-sm font-black uppercase tracking-wider">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: ЦВЕТА */}
          {activeTab === 'colors' && (
            <div className="animate-in slide-in-from-right-8 fade-in duration-500">
              <h3 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-8">Палитра</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { name: 'Deep Slate', hex: '#0F172A', text: 'text-white' },
                  { name: 'MNS Purple', hex: '#9333EA', text: 'text-white' },
                  { name: 'Pure White', hex: '#FFFFFF', text: 'text-slate-900', border: true },
                  { name: 'Accent Gold', hex: '#F59E0B', text: 'text-white' },
                  { name: 'Soft Gray', hex: '#F1F5F9', text: 'text-slate-900' },
                  { name: 'Neon Cyan', hex: '#00FFFF', text: 'text-slate-900' },
                ].map((color) => (
                  <div 
                    key={color.hex} 
                    onClick={() => handleCopy(color.hex)}
                    className="group cursor-pointer rounded-[32px] overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300"
                  >
                    <div 
                      className={`h-40 w-full flex items-end justify-between p-6 ${color.border ? 'border-2 border-slate-100 dark:border-slate-700' : ''}`}
                      style={{ backgroundColor: color.hex }}
                    >
                      <Copy className={`w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity ${color.text}`} />
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-6">
                      <p className="font-black text-lg text-slate-900 dark:text-white">{color.name}</p>
                      <p className="font-bold text-sm text-slate-400 uppercase tracking-widest flex items-center justify-between">
                        {color.hex}
                        {copiedHex === color.hex && <span className="text-green-500 text-xs">Copied!</span>}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: ТИПОГРАФИКА */}
          {activeTab === 'typo' && (
            <div className="space-y-8 animate-in slide-in-from-right-8 fade-in duration-500">
              <h3 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-8">Шрифты</h3>
              <div className="p-12 rounded-[40px] bg-slate-900 text-white overflow-hidden relative shadow-2xl">
                <div className="absolute -right-10 -bottom-10 opacity-10 font-black text-[200px] leading-none pointer-events-none">Aa</div>
                <h4 className="text-xs font-black text-purple-400 uppercase tracking-[0.3em] mb-4">Основной шрифт (Заголовки)</h4>
                <p className="text-6xl md:text-8xl font-black tracking-tighter mb-4">FindSansPro</p>
                <p className="text-2xl font-medium text-slate-400">Гротеск с мягкими формами, без острых углов.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-10 rounded-[32px] bg-white/50 dark:bg-slate-800/50 border border-white/40 dark:border-slate-700/50">
                   <p className="font-black text-4xl text-slate-900 dark:text-white mb-2">Black 900</p>
                   <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Используется для главных акцентов</p>
                </div>
                <div className="p-10 rounded-[32px] bg-white/50 dark:bg-slate-800/50 border border-white/40 dark:border-slate-700/50">
                   <p className="font-medium text-4xl text-slate-900 dark:text-white mb-2">Medium 500</p>
                   <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Используется для наборного текста</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB: ФОТО & AI */}
          {(activeTab === 'photo' || activeTab === 'ai') && (
            <div className="space-y-6 animate-in slide-in-from-right-8 fade-in duration-500">
               <h3 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-8">
                 {activeTab === 'photo' ? 'Визуальный стиль' : 'Промпты для нейросетей'}
               </h3>
               
               <div className="p-8 rounded-[32px] bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-500/30">
                 <h4 className="text-xs font-black text-purple-600 dark:text-purple-400 uppercase tracking-[0.2em] mb-4">Глобальный Style-Prompt</h4>
                 <pre className="font-mono text-sm md:text-base text-slate-800 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                   "high-end commercial photography, Pinterest aesthetic, minimalist, clean lines, bright light-gray background, highly detailed, photorealistic. focus on modern stylish shoes, footwear photography, fashion brand catalog style"
                 </pre>
                 <button 
                    onClick={() => handleCopy("high-end commercial photography, Pinterest aesthetic, minimalist, clean lines, bright light-gray background, highly detailed, photorealistic. focus on modern stylish shoes, footwear photography, fashion brand catalog style")}
                    className="mt-6 px-6 py-3 bg-purple-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-purple-700 transition-all shadow-lg flex items-center gap-2"
                 >
                   <Copy className="w-4 h-4" /> Скопировать Prompt
                 </button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                  {[
                    { title: "Свет", desc: "Мягкий, рассеянный, студийный. Никаких резких теней." },
                    { title: "Фон", desc: "Светло-серый, бежевый, пастельный. Минимализм." },
                    { title: "Ракурс", desc: "Макро детали кожи, ровные швы, эстетика подошвы." }
                  ].map(rule => (
                    <div key={rule.title} className="p-8 rounded-[32px] bg-white/50 dark:bg-slate-800/50 border border-white/40 dark:border-slate-700/50">
                      <h5 className="font-black text-xl text-slate-900 dark:text-white mb-2">{rule.title}</h5>
                      <p className="font-medium text-slate-500 leading-relaxed">{rule.desc}</p>
                    </div>
                  ))}
               </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}