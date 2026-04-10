import React, { useState, useEffect } from 'react';
import { Sparkles, CalendarDays, BookOpen, Lightbulb, ArrowRight, CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react';

export default function TutorialModal({ isOpen, onClose }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setCurrentStep(0);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const steps = [
    {
      id: 'welcome',
      title: "Добро пожаловать в PromptAGG",
      description: "Это не просто планировщик. Это ваш личный конвейер контента. Мы объединили нейросети, бизнес-сценарии и календарь в единый бесшовный интерфейс.",
      icon: Sparkles,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20"
    },
    {
      id: 'board',
      title: "Умный Календарь",
      description: "Ваш центр управления. Создавайте посты, отслеживайте статусы (от брифа до публикации) и визуально контролируйте выход контента на всех площадках.",
      icon: CalendarDays,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20"
    },
    {
      id: 'playbooks',
      title: "Playbook Engine",
      description: "Забудьте про пустые листы. В Базе Знаний хранятся готовые эталонные промпты и сценарии. Один клик «Применить к дате» — и пост уже в календаре.",
      icon: BookOpen,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20"
    },
    {
      id: 'vault',
      title: "Idea Vault (Багаж Идей)",
      description: "Пришла гениальная мысль, но нет времени писать пост? Забросьте её в Багаж Идей справа. Она никуда не пропадет и дождется своего часа.",
      icon: Lightbulb,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20"
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onClose(); // На последнем шаге закрываем
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1);
  };

  const StepIcon = steps[currentStep].icon;

  return (
    <div className={`fixed inset-0 z-[1000] flex items-center justify-center p-6 transition-all duration-500 ${isVisible ? 'bg-slate-950/80 backdrop-blur-xl opacity-100' : 'bg-transparent opacity-0 pointer-events-none'}`}>
      <div className={`bg-[var(--bg-card)] rounded-[48px] max-w-2xl w-full shadow-[0_50px_100px_var(--accent-glow)] flex flex-col border-2 border-[var(--border-main)] relative overflow-hidden transition-all duration-500 transform ${isVisible ? 'translate-y-0 scale-100' : 'translate-y-10 scale-95'}`}>
        
        {/* PROGRESS BAR */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-[var(--bg-input)] flex">
          {steps.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-full transition-all duration-500 ${idx <= currentStep ? 'bg-[var(--accent)]' : 'bg-transparent'}`}
              style={{ width: `${100 / steps.length}%` }}
            />
          ))}
        </div>

        <div className="p-12 md:p-16 flex flex-col items-center text-center mt-4">
          {/* Анимированная смена иконок */}
          <div className={`w-32 h-32 rounded-full flex items-center justify-center border-2 mb-10 transition-all duration-500 shadow-2xl ${steps[currentStep].bg} ${steps[currentStep].border} animate-in zoom-in slide-in-from-bottom-4`}>
            <StepIcon className={`w-16 h-16 ${steps[currentStep].color}`} />
          </div>

          <div className="space-y-6 min-h-[160px] animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
            <h2 className="text-3xl md:text-4xl font-black text-[var(--text-main)] tracking-tighter uppercase leading-none">
              {steps[currentStep].title}
            </h2>
            <p className="text-base md:text-lg text-[var(--text-muted)] font-medium leading-relaxed max-w-lg mx-auto">
              {steps[currentStep].description}
            </p>
          </div>
        </div>

        {/* КОНТРОЛЫ */}
        <div className="p-8 border-t border-[var(--border-main)] bg-[var(--bg-app)]/30 flex items-center justify-between">
          <div className="flex gap-2">
             {steps.map((_, idx) => (
               <div key={idx} className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${idx === currentStep ? 'bg-[var(--accent)] w-8' : 'bg-[var(--border-main)]'}`} />
             ))}
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={onClose} 
              className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all"
            >
              Пропустить
            </button>
            
            <div className="flex gap-2">
              {currentStep > 0 && (
                <button 
                  onClick={handlePrev}
                  className="w-14 h-14 rounded-2xl bg-[var(--bg-input)] text-[var(--text-main)] hover:bg-[var(--border-main)] flex items-center justify-center transition-all border border-[var(--border-main)]"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}
              <button 
                onClick={handleNext}
                style={{ backgroundImage: 'linear-gradient(to right, var(--grad-1), var(--grad-2))' }}
                className="px-8 py-4 rounded-2xl text-white font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-[0_10px_20px_var(--accent-glow)]"
              >
                {currentStep === steps.length - 1 ? (
                  <>НАЧАТЬ РАБОТУ <CheckCircle2 className="w-5 h-5" /></>
                ) : (
                  <>ДАЛЕЕ <ChevronRight className="w-5 h-5" /></>
                )}
              </button>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}