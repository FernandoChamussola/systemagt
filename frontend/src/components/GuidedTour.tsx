import { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface TourStep {
  target?: string; // CSS selector do elemento alvo (opcional)
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

interface GuidedTourProps {
  tourId: string; // ID único para salvar no localStorage
  steps: TourStep[];
  onComplete?: () => void;
  onSkip?: () => void;
}

export default function GuidedTour({ tourId, steps, onComplete, onSkip }: GuidedTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const storageKey = `tour_completed_${tourId}`;

  useEffect(() => {
    // Verificar se o tour já foi visto
    const hasSeenTour = localStorage.getItem(storageKey);
    if (!hasSeenTour) {
      // Pequeno delay para garantir que a página carregou
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!isVisible) return;

    const step = steps[currentStep];
    if (step.target) {
      const element = document.querySelector(step.target);
      if (element) {
        const rect = element.getBoundingClientRect();
        setTargetRect(rect);
        // Scroll para o elemento se necessário
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        setTargetRect(null);
      }
    } else {
      setTargetRect(null);
    }
  }, [currentStep, isVisible, steps]);

  function handleNext() {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  }

  function handlePrev() {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }

  function completeTour() {
    localStorage.setItem(storageKey, 'true');
    setIsVisible(false);
    onComplete?.();
  }

  function skipTour() {
    localStorage.setItem(storageKey, 'true');
    setIsVisible(false);
    onSkip?.();
  }

  if (!isVisible || steps.length === 0) return null;

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  // Calcular posição do tooltip
  function getTooltipStyle(): React.CSSProperties {
    if (!targetRect || step.position === 'center') {
      // Centralizado na tela
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const padding = 16;
    const tooltipWidth = 320;

    switch (step.position) {
      case 'top':
        return {
          position: 'fixed',
          bottom: window.innerHeight - targetRect.top + padding,
          left: Math.max(padding, Math.min(targetRect.left + targetRect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - padding)),
        };
      case 'bottom':
        return {
          position: 'fixed',
          top: targetRect.bottom + padding,
          left: Math.max(padding, Math.min(targetRect.left + targetRect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - padding)),
        };
      case 'left':
        return {
          position: 'fixed',
          top: targetRect.top + targetRect.height / 2,
          right: window.innerWidth - targetRect.left + padding,
          transform: 'translateY(-50%)',
        };
      case 'right':
        return {
          position: 'fixed',
          top: targetRect.top + targetRect.height / 2,
          left: targetRect.right + padding,
          transform: 'translateY(-50%)',
        };
      default:
        return {
          position: 'fixed',
          top: targetRect.bottom + padding,
          left: Math.max(padding, Math.min(targetRect.left, window.innerWidth - tooltipWidth - padding)),
        };
    }
  }

  return (
    <>
      {/* Overlay escuro */}
      <div
        className="fixed inset-0 bg-black/60 z-[9998]"
        onClick={skipTour}
      />

      {/* Highlight do elemento alvo */}
      {targetRect && (
        <div
          className="fixed z-[9999] rounded-lg ring-4 ring-primary ring-offset-2 ring-offset-transparent pointer-events-none"
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)',
          }}
        />
      )}

      {/* Tooltip */}
      <div
        className="fixed z-[10000] w-80 bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        style={getTooltipStyle()}
      >
        {/* Header */}
        <div className="bg-primary/10 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-primary">
              Dica {currentStep + 1} de {steps.length}
            </span>
          </div>
          <button
            onClick={skipTour}
            className="p-1 hover:bg-primary/10 rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-foreground mb-2">{step.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{step.content}</p>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-muted/30 flex items-center justify-between">
          <div className="flex gap-1">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentStep ? 'bg-primary' : 'bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {!isFirstStep && (
              <Button variant="ghost" size="sm" onClick={handlePrev}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Anterior
              </Button>
            )}
            <Button size="sm" onClick={handleNext}>
              {isLastStep ? (
                'Entendi!'
              ) : (
                <>
                  Próximo
                  <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

// Hook para resetar um tour (útil para testes)
export function useResetTour(tourId: string) {
  return () => {
    localStorage.removeItem(`tour_completed_${tourId}`);
    window.location.reload();
  };
}
