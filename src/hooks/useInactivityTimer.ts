import { useEffect, useRef } from 'react';
import { toast } from '@/components/ui/use-toast';

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutos em milissegundos
const WARNING_BEFORE_TIMEOUT = 5 * 60 * 1000; // 5 minutos antes de expirar

export const useInactivityTimer = (onInactive: () => void) => {
  const timer = useRef<NodeJS.Timeout | null>(null);
  const warningTimer = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = () => {
    // Limpar os timers existentes
    if (timer.current) {
      clearTimeout(timer.current);
    }
    if (warningTimer.current) {
      clearTimeout(warningTimer.current);
    }

    // Configurar o timer de aviso
    warningTimer.current = setTimeout(() => {
      toast({
        title: "Aviso de inatividade",
        description: "Sua sessão irá expirar em 5 minutos por inatividade. Mova o mouse ou pressione uma tecla para continuar.",
        duration: 10000, // 10 segundos
      });
    }, INACTIVITY_TIMEOUT - WARNING_BEFORE_TIMEOUT);

    // Configurar o timer de inatividade
    timer.current = setTimeout(onInactive, INACTIVITY_TIMEOUT);
  };

  useEffect(() => {
    // Lista de eventos que vão resetar o timer
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
      'keydown',
    ];

    // Inicializa o timer
    resetTimer();

    // Adiciona os event listeners
    const handleActivity = () => {
      resetTimer();
    };

    events.forEach(event => {
      document.addEventListener(event, handleActivity);
    });

    // Cleanup
    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
      if (warningTimer.current) {
        clearTimeout(warningTimer.current);
      }
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [onInactive]);

  return resetTimer;
}; 