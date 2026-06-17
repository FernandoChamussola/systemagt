import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { surveyApi, SurveyModal } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const storageKeyPrefix = 'systemagt-modal-answered';

export default function FeedbackSurveyModal() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [modal, setModal] = useState<SurveyModal | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.role === 'ADMIN') {
      setLoading(false);
      return;
    }

    const currentUser = user;
    let mounted = true;

    async function loadPendingModal() {
      try {
        const data = await surveyApi.getPending();

        if (!mounted) return;

        if (data.modal && Array.isArray(data.modal.opcoes) && data.modal.opcoes.length > 0) {
          const localKey = `${storageKeyPrefix}:${currentUser.id}:${data.modal.id}`;
          setModal(localStorage.getItem(localKey) === 'true' ? null : data.modal);
        }
      } catch (error) {
        console.error('Erro ao verificar modal:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadPendingModal();

    return () => {
      mounted = false;
    };
  }, [user]);

  async function handleAnswer(resposta: string) {
    if (!user || !modal) return;

    const localKey = `${storageKeyPrefix}:${user.id}:${modal.id}`;

    try {
      setSubmitting(resposta);
      await surveyApi.submit(modal.id, resposta);
      localStorage.setItem(localKey, 'true');
      setModal(null);
      toast({
        title: 'Obrigado',
        description: 'A tua resposta foi registrada.',
      });
    } catch (error) {
      console.error('Erro ao enviar resposta do modal:', error);
      toast({
        title: 'Erro',
        description: 'Nao foi possivel registrar a tua resposta. Tenta novamente.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(null);
    }
  }

  if (loading || !modal) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-3 py-3 sm:items-center sm:px-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="survey-title"
        className="w-full max-w-md rounded-lg border border-zinc-800 bg-zinc-950 p-5 text-white shadow-2xl sm:p-6"
      >
        <h2
          id="survey-title"
          className="text-center text-lg font-semibold leading-snug text-white sm:text-xl"
        >
          {modal.pergunta}
        </h2>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {(modal.opcoes || []).map((opcao) => (
            <Button
              key={opcao}
              type="button"
              variant="outline"
              className="min-h-12 w-full whitespace-normal rounded-lg border-zinc-700 bg-zinc-900 px-4 py-3 text-center text-sm font-medium text-white hover:bg-zinc-800 hover:text-white sm:text-base"
              onClick={() => handleAnswer(opcao)}
              disabled={Boolean(submitting)}
            >
              {submitting === opcao ? (
                <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" />
              ) : null}
              <span>{opcao}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
