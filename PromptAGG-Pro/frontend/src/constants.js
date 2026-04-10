// ПРЕМИАЛЬНЫЕ НАСТРОЙКИ ПЛОЩАДОК
export const platformsInfo = [
  { 
    id: "VK", 
    label: "VK", 
    activeClass: "bg-[#0077FF] text-white shadow-[0_8px_20px_rgba(0,119,255,0.3)] ring-1 ring-white/20" 
  },
  { 
    id: "TG", 
    label: "TG", 
    activeClass: "bg-[#229ED9] text-white shadow-[0_8px_20px_rgba(34,158,217,0.3)] ring-1 ring-white/20" 
  },
  { 
    id: "INST", 
    label: "IG", 
    activeClass: "bg-gradient-to-tr from-[#FFB347] via-[#FF0080] to-[#7928CA] text-white shadow-[0_8px_20px_rgba(255,0,128,0.3)] ring-1 ring-white/20" 
  },
  { 
    id: "YT", 
    label: "YT", 
    activeClass: "bg-[#FF0000] text-white shadow-[0_8px_20px_rgba(255,0,0,0.3)] ring-1 ring-white/20" 
  },
  { 
    id: "MAX", 
    label: "MX", 
    activeClass: "bg-gradient-to-r from-[#00C6FF] to-[#0072FF] text-white shadow-[0_8px_20px_rgba(0,198,255,0.3)] ring-1 ring-white/20" 
  }
];

// ШАБЛОН ПУСТОГО ПОСТА (Структура данных)
export const getEmptyPlatform = () => ({
  step: 0, 
  rubric: "", 
  format: "", 
  promptTab: "text",
  textPrompt: { 
    role: "Ты креативный SMM-специалист.", 
    tone: "", 
    details: "", 
    cta: "", 
    kpi: "", 
    useMns: true 
  },
  visualPrompt: { 
    format: "Картинка 1:1", 
    essence: "", 
    useColors: false, 
    colors: [], 
    useMns: true, 
    textOverlay: "" 
  },
  finalText: "", 
  refs: "", 
  mediaLink: ""
});