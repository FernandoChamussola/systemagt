import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, MouseEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Loader2, Pause, Play, Sparkles, Volume2, VolumeX, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MidYearRetrospective, retrospectiveApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import prespectivaSong from '../../midia/prespectivaSong.mp3';

type SlideTone = 'origin' | 'money' | 'profit' | 'clients' | 'return' | 'warning' | 'final';

interface StorySlide {
  eyebrow: string;
  title: string;
  value?: string;
  body: string;
  footnote?: string;
  tone: SlideTone;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-MZ', {
    style: 'currency',
    currency: 'MZN',
    minimumFractionDigits: 0,
  }).format(value || 0);
}

function formatDate(value?: string | null) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('pt-MZ', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function formatMonth(month?: number) {
  if (month === undefined) return '';
  return new Intl.DateTimeFormat('pt-MZ', { month: 'long' }).format(new Date(2026, month, 1));
}

function buildSlides(data?: MidYearRetrospective): StorySlide[] {
  if (!data || data.totals.debts === 0) {
    const year = data?.year || new Date().getFullYear();
    return [
      {
        eyebrow: 'Meio do ano',
        title: `${year} ainda está pronto para ser escrito.`,
        body: 'Assim que você registar a primeira dívida, esta página vai transformar o seu trabalho em uma história com datas, valores, clientes e lucro.',
        tone: 'origin',
      },
      {
        eyebrow: 'O primeiro passo',
        title: 'A sua retrospectiva começa no primeiro registo.',
        body: 'Cadastre uma dívida, acompanhe pagamentos e volte aqui para ver o sistema contar o percurso do seu negócio.',
        tone: 'clients',
      },
      {
        eyebrow: 'Segundo semestre',
        title: 'Ainda há tempo para criar um ano forte.',
        body: 'O melhor momento para organizar clientes, dívidas e retornos é antes do movimento crescer.',
        tone: 'final',
      },
    ];
  }

  const slides: StorySlide[] = [
    {
      eyebrow: 'Meio do ano',
      title: `${data.year} já tem a sua marca, ${data.user.nome.split(' ')[0]}.`,
      body: `De ${formatDate(data.period.start)} até hoje, o sistema guardou os movimentos que mostram como o seu trabalho avançou.`,
      tone: 'origin',
    },
  ];

  if (data.moments.firstDebt) {
    slides.push({
      eyebrow: 'Tudo começou aqui',
      title: `A sua primeira dívida do ano foi no dia ${formatDate(data.moments.firstDebt.date)}.`,
      value: formatCurrency(data.moments.firstDebt.amount),
      body: `Foi para ${data.moments.firstDebt.debtor}. Um primeiro registo pequeno ou grande, mas foi ali que o ano começou a ganhar movimento.`,
      tone: 'origin',
    });
  }

  slides.push({
    eyebrow: 'Dinheiro em movimento',
    title: 'Até aqui, você já colocou dinheiro para trabalhar.',
    value: formatCurrency(data.totals.totalLent),
    body: 'Esse foi o total emprestado neste ano: decisões tomadas, clientes acompanhados e valores que passaram a ter história.',
    tone: 'money',
  });

  if (data.moments.biggestDebt) {
    slides.push({
      eyebrow: 'Maior movimento',
      title: `A maior dívida registada foi para ${data.moments.biggestDebt.debtor}.`,
      value: formatCurrency(data.moments.biggestDebt.amount),
      body: `No dia ${formatDate(data.moments.biggestDebt.date)}, esse foi o valor que mais pesou no seu ano.`,
      tone: 'money',
    });
  }

  slides.push({
    eyebrow: 'Lucro real',
    title: 'O dinheiro não só saiu. Parte dele já voltou com ganho.',
    value: formatCurrency(data.totals.realizedProfit),
    body: 'Esse é o lucro já realizado: valor recebido acima do capital emprestado.',
    footnote: `Capital recuperado: ${formatCurrency(data.totals.capitalRecovered)}`,
    tone: 'profit',
  });

  slides.push({
    eyebrow: 'Lucro previsto',
    title: 'Ainda existe ganho no caminho.',
    value: formatCurrency(data.totals.remainingProfit),
    body: 'Esse é o lucro previsto que ainda pode entrar pelas dívidas abertas, com base nos valores atuais registados.',
    footnote: `Lucro total projetado no ano: ${formatCurrency(data.totals.expectedProfit)}`,
    tone: 'profit',
  });

  slides.push({
    eyebrow: 'Clientes acompanhados',
    title: `Você acompanhou ${data.totals.debtors} ${data.totals.debtors === 1 ? 'devedor' : 'devedores'} este ano.`,
    body: 'Cada nome registado representa uma cobrança, uma conversa, um compromisso e uma decisão que ficou organizada.',
    tone: 'clients',
  });

  if (data.moments.frequentDebtor) {
    slides.push({
      eyebrow: 'Cliente recorrente',
      title: `${data.moments.frequentDebtor.debtor} apareceu mais de uma vez no seu ano.`,
      value: `${data.moments.frequentDebtor.debts}x`,
      body: 'Alguns clientes acabam marcando presença na rotina. O sistema lembra isso por você.',
      tone: 'clients',
    });
  }

  slides.push({
    eyebrow: 'Retorno',
    title: 'Você também viu dinheiro voltar.',
    value: formatCurrency(data.totals.totalPaid),
    body: `${data.totals.payments} ${data.totals.payments === 1 ? 'pagamento foi registado' : 'pagamentos foram registados'} neste ano.`,
    tone: 'return',
  });

  if (data.moments.biggestPayment) {
    slides.push({
      eyebrow: 'Melhor entrada',
      title: `O maior pagamento recebido veio de ${data.moments.biggestPayment.debtor}.`,
      value: formatCurrency(data.moments.biggestPayment.amount),
      body: `No dia ${formatDate(data.moments.biggestPayment.date)}, esse retorno ficou marcado no sistema.`,
      tone: 'return',
    });
  }

  slides.push({
    eyebrow: 'Dívidas concluídas',
    title: `${data.totals.paidDebts} ${data.totals.paidDebts === 1 ? 'dívida foi fechada' : 'dívidas foram fechadas'} como paga.`,
    body: 'Isso mostra que o trabalho não ficou só em cobrança: também houve conclusão, retorno e organização.',
    tone: 'return',
  });

  if (data.moments.strongestMonth) {
    slides.push({
      eyebrow: 'Mês mais forte',
      title: `${formatMonth(data.moments.strongestMonth.month)} foi o seu mês mais movimentado.`,
      value: formatCurrency(data.moments.strongestMonth.lent + data.moments.strongestMonth.paid),
      body: `${data.moments.strongestMonth.debts} dívidas registadas e ${data.moments.strongestMonth.payments} pagamentos recebidos.`,
      tone: 'money',
    });
  }

  slides.push({
    eyebrow: 'Atenção',
    title:
      data.totals.overdueDebts > 0
        ? `Ainda existem ${data.totals.overdueDebts} dívidas em atraso.`
        : 'Até aqui, os atrasos não dominaram o seu ano.',
    value: data.totals.overdueDebts > 0 ? formatCurrency(data.totals.overdueAmount) : '0',
    body:
      data.totals.overdueDebts > 0
        ? 'Esse é o ponto certo para começar o segundo semestre: recuperar o que ficou parado.'
        : 'Esse é um sinal bom. O segundo semestre pode começar com foco em manter esse controlo.',
    tone: 'warning',
  });

  if (data.moments.nextDueDebt) {
    slides.push({
      eyebrow: 'Próximo compromisso',
      title: `${data.moments.nextDueDebt.debtor} é o próximo ponto no calendário.`,
      value: formatDate(data.moments.nextDueDebt.date),
      body: `Valor restante registado: ${formatCurrency(data.moments.nextDueDebt.amount)}.`,
      tone: 'warning',
    });
  }

  slides.push({
    eyebrow: 'Segundo semestre',
    title: 'Metade do ano passou. A outra metade está nas suas mãos.',
    body: 'Você já tem histórico, valores, clientes e sinais. Agora é transformar organização em resultado.',
    tone: 'final',
  });

  return slides;
}

function AnimatedNumber({ value }: { value: string }) {
  const numericValue = Number(value.replace(/[^\d,-]/g, '').replace(',', '.'));
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const canAnimate = value.includes('MZN') || /^\d+([.,]\d+)?$/.test(value);

    if (!canAnimate || !Number.isFinite(numericValue) || numericValue <= 0 || value.includes('x')) {
      setDisplay(value);
      return;
    }

    let frame = 0;
    const totalFrames = 42;
    const formatter = value.includes('MZN')
      ? (amount: number) => formatCurrency(amount)
      : (amount: number) => Math.round(amount).toLocaleString('pt-MZ');

    const tick = () => {
      frame += 1;
      const progress = 1 - Math.pow(1 - frame / totalFrames, 3);
      setDisplay(formatter(numericValue * progress));
      if (frame < totalFrames) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [numericValue, value]);

  return <span>{display}</span>;
}

export default function Prespectiva() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [started, setStarted] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [muted, setMuted] = useState(false);
  const [paused, setPaused] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['mid-year-retrospective'],
    queryFn: retrospectiveApi.getMidYear,
  });

  const slides = useMemo(() => buildSlides(data), [data]);
  const activeSlide = slides[activeIndex] || slides[0];
  const isLastSlide = activeIndex === slides.length - 1;

  const goTo = (index: number) => {
    setActiveIndex(Math.max(0, Math.min(slides.length - 1, index)));
  };

  const next = () => goTo(activeIndex + 1);
  const previous = () => goTo(activeIndex - 1);

  const startExperience = async () => {
    setStarted(true);
    setPaused(false);
    if (audioRef.current) {
      audioRef.current.volume = 0.28;
      audioRef.current.muted = muted;
      await audioRef.current.play().catch(() => undefined);
    }
  };

  const toggleMute = () => {
    const nextMuted = !muted;
    setMuted(nextMuted);
    if (audioRef.current) audioRef.current.muted = nextMuted;
  };

  const togglePause = () => {
    const nextPaused = !paused;
    setPaused(nextPaused);
    if (!audioRef.current) return;
    if (nextPaused) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => undefined);
    }
  };

  const updateFutureInvite = (showAgain: boolean) => {
    if (user) {
      const year = new Date().getFullYear();
      const storageKey = `systemagt-retrospective-invite:${user.id}:${year}`;

      if (showAgain) {
        localStorage.removeItem(storageKey);
      } else {
        localStorage.setItem(storageKey, 'true');
      }
    }

    navigate('/dashboard');
  };

  const handleStoryClick = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest('button,a')) return;

    const half = window.innerWidth / 2;
    if (event.clientX > half) {
      next();
    } else {
      previous();
    }
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') next();
      if (event.key === 'ArrowLeft') previous();
      if (event.key === 'Escape') navigate('/dashboard');
      if (event.key.toLowerCase() === 'm') toggleMute();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  useEffect(() => {
    if (!started || paused) return;
    const timeout = window.setTimeout(() => {
      if (activeIndex < slides.length - 1) next();
    }, 9000);

    return () => window.clearTimeout(timeout);
  }, [activeIndex, paused, slides.length, started]);

  const stageStyle = {
    '--slide-accent': {
      origin: '#60a5fa',
      money: '#22c55e',
      profit: '#f59e0b',
      clients: '#a78bfa',
      return: '#14b8a6',
      warning: '#f97316',
      final: '#f8fafc',
    }[activeSlide.tone],
  } as CSSProperties;

  if (isLoading) {
    return (
      <div className="retrospective-stage retrospective-stage--origin" style={stageStyle}>
        <div className="retrospective-loader">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span>A preparar a sua retrospectiva...</span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="retrospective-stage retrospective-stage--warning" style={stageStyle}>
        <div className="retrospective-start-panel">
          <p className="retrospective-kicker">Algo falhou</p>
          <h1>Não foi possível carregar a retrospectiva agora.</h1>
          <Button onClick={() => navigate('/dashboard')}>Voltar ao dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`retrospective-stage retrospective-stage--${activeSlide.tone}`}
      style={stageStyle}
      onClick={started ? handleStoryClick : undefined}
    >
      <audio ref={audioRef} src={prespectivaSong} loop preload="auto" />

      <div className="retrospective-aurora" />
      <div className="retrospective-orbit retrospective-orbit--one" />
      <div className="retrospective-orbit retrospective-orbit--two" />
      <div className="retrospective-grid" />
      <div className="retrospective-particles">
        {Array.from({ length: 24 }, (_, index) => (
          <span
            key={index}
            style={
              {
                '--particle-index': index,
                left: `${(index * 37) % 100}%`,
                top: `${(index * 19) % 100}%`,
              } as CSSProperties
            }
          />
        ))}
      </div>

      {!started ? (
        <div className="retrospective-start-panel">
          <p className="retrospective-kicker">Retrospectiva de meio do ano</p>
          <h1>Vamos ver o que você construiu até aqui.</h1>
          <p>Tem uma surpresa preparada para você.</p>
          <Button size="lg" onClick={startExperience} className="retrospective-start-button">
            <Sparkles className="h-5 w-5" />
            Começar
          </Button>
        </div>
      ) : (
        <>
          <div className="retrospective-progress" aria-hidden="true">
            {slides.map((slide, index) => (
              <button
                key={`${slide.eyebrow}-${index}`}
                className={index <= activeIndex ? 'is-active' : ''}
                onClick={() => goTo(index)}
                aria-label={`Ir para slide ${index + 1}`}
              />
            ))}
          </div>

          <div className="retrospective-controls">
            <button onClick={togglePause} aria-label={paused ? 'Retomar música' : 'Pausar música'}>
              {paused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
            </button>
            <button onClick={toggleMute} aria-label={muted ? 'Ativar som' : 'Silenciar'}>
              {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>
            <button onClick={() => navigate('/dashboard')} aria-label="Fechar retrospectiva">
              <X className="h-5 w-5" />
            </button>
          </div>

          <button className="retrospective-nav retrospective-nav--left" onClick={previous} disabled={activeIndex === 0}>
            <ChevronLeft className="h-7 w-7" />
          </button>
          <button
            className="retrospective-nav retrospective-nav--right"
            onClick={next}
            disabled={activeIndex === slides.length - 1}
          >
            <ChevronRight className="h-7 w-7" />
          </button>

          <main key={activeIndex} className="retrospective-slide">
            <p className="retrospective-kicker">{activeSlide.eyebrow}</p>
            {activeSlide.value && (
              <div className="retrospective-value">
                <AnimatedNumber value={activeSlide.value} />
              </div>
            )}
            <h1>{activeSlide.title}</h1>
            <p>{activeSlide.body}</p>
            {activeSlide.footnote && <span className="retrospective-footnote">{activeSlide.footnote}</span>}
            {isLastSlide && (
              <div className="retrospective-choice" onClick={(event) => event.stopPropagation()}>
                <p>Quer ver isto de novo quando entrar da proxima vez?</p>
                <div>
                  <Button onClick={() => updateFutureInvite(true)} className="bg-white text-zinc-950 hover:bg-zinc-200">
                    Sim, mostrar de novo
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => updateFutureInvite(false)}
                    className="border-white/25 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                  >
                    Nao precisa
                  </Button>
                </div>
              </div>
            )}
          </main>

          <div className="retrospective-counter">
            {activeIndex + 1}/{slides.length}
          </div>
        </>
      )}
    </div>
  );
}
