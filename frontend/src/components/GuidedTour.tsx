import { useState, useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, Step, ACTIONS, EVENTS } from 'react-joyride';

interface GuidedTourProps {
  tourId: string;
  steps: Step[];
  onComplete?: () => void;
  onSkip?: () => void;
}

export default function GuidedTour({ tourId, steps, onComplete, onSkip }: GuidedTourProps) {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const storageKey = `tour_completed_${tourId}`;

  useEffect(() => {
    const hasSeenTour = localStorage.getItem(storageKey);
    if (!hasSeenTour) {
      // Delay para garantir que os elementos estão renderizados
      const timer = setTimeout(() => {
        setRun(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [storageKey]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, action, index, type } = data;

    // Avançar steps
    if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      setStepIndex(index + (action === ACTIONS.PREV ? -1 : 1));
    }

    // Tour finalizado ou pulado
    if (status === STATUS.FINISHED) {
      localStorage.setItem(storageKey, 'true');
      setRun(false);
      onComplete?.();
    }

    if (status === STATUS.SKIPPED) {
      localStorage.setItem(storageKey, 'true');
      setRun(false);
      onSkip?.();
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      stepIndex={stepIndex}
      continuous
      showProgress
      showSkipButton
      disableOverlayClose
      spotlightClicks
      callback={handleJoyrideCallback}
      locale={{
        back: 'Anterior',
        close: 'Fechar',
        last: 'Entendi!',
        next: 'Próximo',
        skip: 'Pular',
      }}
      styles={{
        options: {
          arrowColor: 'hsl(var(--card))',
          backgroundColor: 'hsl(var(--card))',
          overlayColor: 'rgba(0, 0, 0, 0.7)',
          primaryColor: 'hsl(var(--primary))',
          textColor: 'hsl(var(--foreground))',
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: 12,
          padding: 20,
        },
        tooltipContainer: {
          textAlign: 'left',
        },
        tooltipTitle: {
          fontSize: 18,
          fontWeight: 600,
          marginBottom: 8,
        },
        tooltipContent: {
          fontSize: 14,
          lineHeight: 1.6,
        },
        buttonNext: {
          backgroundColor: 'hsl(var(--primary))',
          borderRadius: 8,
          color: 'hsl(var(--primary-foreground))',
          padding: '8px 16px',
          fontSize: 14,
          fontWeight: 500,
        },
        buttonBack: {
          color: 'hsl(var(--muted-foreground))',
          marginRight: 8,
          fontSize: 14,
        },
        buttonSkip: {
          color: 'hsl(var(--muted-foreground))',
          fontSize: 13,
        },
        spotlight: {
          borderRadius: 12,
        },
        beacon: {
          display: 'none',
        },
      }}
      floaterProps={{
        disableAnimation: false,
      }}
    />
  );
}

// Hook para resetar um tour (útil para testes)
export function useResetTour(tourId: string) {
  return () => {
    localStorage.removeItem(`tour_completed_${tourId}`);
    window.location.reload();
  };
}

// Re-exportar tipo Step para facilitar uso
export type { Step as TourStep };
