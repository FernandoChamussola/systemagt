import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { enviarWhatsApp, gerarMensagemCobranca } from '../controllers/notificationController';

const prisma = new PrismaClient();

// Configurações de retry
const MAX_TENTATIVAS_IMEDIATAS = 3;     // Tentativas imediatas antes de agendar retry
const DELAY_ENTRE_TENTATIVAS = 3000;    // 3 segundos entre tentativas imediatas
const MINUTOS_PARA_RETRY = 10;          // Minutos para tentar novamente após falhas
const MAX_CICLOS_RETRY = 5;             // Máximo de ciclos de retry (total: 3 x 5 = 15 tentativas)

// Flag para evitar execução duplicada
let processandoNotificacoes = false;
let processandoRetry = false;

// Função auxiliar para aguardar
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Função para enviar com retry imediato (3 tentativas)
async function enviarComRetry(
  telefoneUsuario: string,
  telefoneDevedor: string,
  mensagem: string
): Promise<{ sucesso: boolean; erro?: string; tentativasUsadas: number }> {

  let ultimoErro = '';

  for (let tentativa = 1; tentativa <= MAX_TENTATIVAS_IMEDIATAS; tentativa++) {
    console.log(`   🔄 Tentativa ${tentativa}/${MAX_TENTATIVAS_IMEDIATAS}...`);

    const resultado = await enviarWhatsApp(telefoneUsuario, telefoneDevedor, mensagem);

    if (resultado.sucesso) {
      console.log(`   ✅ Sucesso na tentativa ${tentativa}`);
      return { sucesso: true, tentativasUsadas: tentativa };
    }

    ultimoErro = resultado.erro || 'Erro desconhecido';
    console.log(`   ⚠️ Falha na tentativa ${tentativa}: ${ultimoErro}`);

    // Aguardar antes da próxima tentativa (exceto na última)
    if (tentativa < MAX_TENTATIVAS_IMEDIATAS) {
      await delay(DELAY_ENTRE_TENTATIVAS);
    }
  }

  return {
    sucesso: false,
    erro: ultimoErro,
    tentativasUsadas: MAX_TENTATIVAS_IMEDIATAS
  };
}

// Função para processar notificações automáticas
async function processarNotificacoesAutomaticas() {
  if (processandoNotificacoes) {
    console.log('⚠️ [CRON] Já existe um processamento em andamento, pulando...');
    return;
  }

  processandoNotificacoes = true;
  console.log('🔔 [CRON] Iniciando processamento de notificações automáticas...');

  try {
    const hoje = new Date();

    // Buscar dívidas com notificação automática habilitada
    const dividasParaNotificar = await prisma.debt.findMany({
      where: {
        ativo: true,
        notificacaoAuto: true,
        status: { not: 'PAGO' },
        periodicidadeNotificacao: { not: null },
      },
      include: {
        devedor: true,
        usuario: true,
        pagamentos: {
          where: { ativo: true },
        },
      },
    });

    console.log(`📊 [CRON] Encontradas ${dividasParaNotificar.length} dívidas com notificação automática`);

    let enviadas = 0;
    let puladas = 0;
    let agendadasRetry = 0;

    for (const debt of dividasParaNotificar) {
      // Determinar periodicidade baseada no status
      let periodicidade: number;
      if (debt.status === 'ATRASADO') {
        periodicidade = 2;
      } else {
        periodicidade = debt.periodicidadeNotificacao!;
      }

      let deveEnviar = false;

      if (!debt.ultimaNotificacao) {
        deveEnviar = true;
      } else {
        const ultimaNotificacao = new Date(debt.ultimaNotificacao);
        const diferencaDias = Math.floor((hoje.getTime() - ultimaNotificacao.getTime()) / (1000 * 60 * 60 * 24));
        if (diferencaDias >= periodicidade) {
          deveEnviar = true;
        }
      }

      if (!deveEnviar) {
        puladas++;
        continue;
      }

      // Verificar se o usuário tem telefone configurado
      if (!debt.usuario?.telefone) {
        console.log(`⚠️ [CRON] Usuário de "${debt.devedor.nome}" não tem WhatsApp configurado, pulando...`);
        puladas++;
        continue;
      }

      // Calcular valores
      const valorComJuros = debt.valorInicial + (debt.valorInicial * debt.taxaJuros / 100);
      const totalPago = debt.pagamentos.reduce((sum, p) => sum + p.valor, 0);
      const valorRestante = valorComJuros - totalPago;

      // Calcular dias de atraso ou dias para vencer
      const diasAtraso = debt.dataVencimento < hoje
        ? Math.ceil((hoje.getTime() - debt.dataVencimento.getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      const diasParaVencer = debt.dataVencimento > hoje
        ? Math.ceil((debt.dataVencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      // Gerar mensagem
      let mensagem: string;

      if (debt.status === 'ATRASADO') {
        mensagem = gerarMensagemCobranca({
          nomeDevedor: debt.devedor.nome,
          valorRestante,
          dataVencimento: debt.dataVencimento,
          diasAtraso,
        });
      } else {
        const valorFormatado = new Intl.NumberFormat('pt-MZ', {
          style: 'currency',
          currency: 'MZN',
          minimumFractionDigits: 0,
        }).format(valorRestante);

        const dataFormatada = debt.dataVencimento.toLocaleDateString('pt-MZ', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        });

        mensagem = `Olá ${debt.devedor.nome},\n\n` +
          `Este é um lembrete sobre sua dívida que vence em breve.\n\n` +
          `📅 Data de vencimento: ${dataFormatada}\n` +
          `⏰ Faltam ${diasParaVencer} ${diasParaVencer === 1 ? 'dia' : 'dias'}\n` +
          `💰 Valor a pagar: ${valorFormatado}\n\n` +
          `Por favor, providencie o pagamento até a data de vencimento para evitar juros adicionais.\n\n` +
          `Obrigado!\n\n` +
          `#DEBTTRACKER`;
      }

      // Criar registro de notificação
      const notification = await prisma.notification.create({
        data: {
          usuarioId: debt.usuarioId,
          devedorId: debt.devedorId,
          dividaId: debt.id,
          telefone: debt.devedor.telefone,
          telefoneUsuario: debt.usuario.telefone,
          mensagem,
          status: 'PENDENTE',
          tentativas: 0,
        },
      });

      console.log(`📤 [CRON] Enviando notificação para ${debt.devedor.nome}...`);

      // Enviar WhatsApp com retry
      const resultado = await enviarComRetry(
        debt.usuario.telefone!,
        debt.devedor.telefone,
        mensagem
      );

      if (resultado.sucesso) {
        // Sucesso - atualizar notificação e dívida
        await prisma.notification.update({
          where: { id: notification.id },
          data: {
            status: 'ENVIADO',
            tentativas: resultado.tentativasUsadas,
            enviadoEm: new Date(),
          },
        });

        await prisma.debt.update({
          where: { id: debt.id },
          data: { ultimaNotificacao: new Date() },
        });

        enviadas++;
      } else {
        // Falhou após 3 tentativas - agendar para retry
        const proximaTentativa = new Date(Date.now() + MINUTOS_PARA_RETRY * 60 * 1000);

        await prisma.notification.update({
          where: { id: notification.id },
          data: {
            status: 'AGUARDANDO_RETRY',
            tentativas: resultado.tentativasUsadas,
            erroMensagem: resultado.erro,
            proximaTentativa,
          },
        });

        console.log(`⏰ [CRON] Agendado retry para ${debt.devedor.nome} em ${MINUTOS_PARA_RETRY} minutos`);
        agendadasRetry++;
      }

      // Aguardar 5 segundos entre envios
      await delay(5000);
    }

    console.log(`✅ [CRON] Processamento concluído:`);
    console.log(`   - Enviadas com sucesso: ${enviadas}`);
    console.log(`   - Puladas (não chegou a periodicidade): ${puladas}`);
    console.log(`   - Agendadas para retry: ${agendadasRetry}`);

    // Enviar resumo aos usuários
    await enviarResumoParaUsuarios(dividasParaNotificar, enviadas, agendadasRetry);

  } catch (error) {
    console.error('❌ [CRON] Erro ao processar notificações automáticas:', error);
  } finally {
    processandoNotificacoes = false;
  }
}

// Função para processar notificações que aguardam retry
async function processarNotificacoesRetry() {
  if (processandoRetry) {
    console.log('⚠️ [RETRY] Já existe um processamento de retry em andamento, pulando...');
    return;
  }

  processandoRetry = true;

  try {
    const agora = new Date();

    // Buscar notificações que precisam de retry
    const notificacoesParaRetry = await prisma.notification.findMany({
      where: {
        status: 'AGUARDANDO_RETRY',
        proximaTentativa: {
          lte: agora,
        },
      },
      include: {
        devedor: true,
        divida: true,
        usuario: true,
      },
    });

    if (notificacoesParaRetry.length === 0) {
      processandoRetry = false;
      return;
    }

    console.log(`🔄 [RETRY] Processando ${notificacoesParaRetry.length} notificações em retry...`);

    let sucesso = 0;
    let falhasDefinitivas = 0;
    let reagendadas = 0;

    for (const notif of notificacoesParaRetry) {
      // Calcular ciclo atual (cada ciclo = 3 tentativas)
      const cicloAtual = Math.floor(notif.tentativas / MAX_TENTATIVAS_IMEDIATAS) + 1;

      if (cicloAtual > MAX_CICLOS_RETRY) {
        // Excedeu o limite de ciclos - marcar como falha definitiva
        await prisma.notification.update({
          where: { id: notif.id },
          data: {
            status: 'FALHOU',
            erroMensagem: `Falha após ${notif.tentativas} tentativas em ${cicloAtual - 1} ciclos`,
            proximaTentativa: null,
          },
        });
        console.log(`❌ [RETRY] ${notif.devedor?.nome || 'Devedor'}: Falha definitiva após ${notif.tentativas} tentativas`);
        falhasDefinitivas++;
        continue;
      }

      console.log(`📤 [RETRY] Tentando reenviar para ${notif.devedor?.nome || 'Devedor'} (ciclo ${cicloAtual}/${MAX_CICLOS_RETRY})...`);

      // Usar telefone do usuário armazenado ou buscar
      const telefoneUsuario = notif.telefoneUsuario || notif.usuario?.telefone;

      if (!telefoneUsuario) {
        await prisma.notification.update({
          where: { id: notif.id },
          data: {
            status: 'FALHOU',
            erroMensagem: 'Telefone do usuário não encontrado',
            proximaTentativa: null,
          },
        });
        falhasDefinitivas++;
        continue;
      }

      // Tentar enviar com retry
      const resultado = await enviarComRetry(
        telefoneUsuario,
        notif.telefone,
        notif.mensagem
      );

      const novasTentativas = notif.tentativas + resultado.tentativasUsadas;

      if (resultado.sucesso) {
        // Sucesso!
        await prisma.notification.update({
          where: { id: notif.id },
          data: {
            status: 'ENVIADO',
            tentativas: novasTentativas,
            enviadoEm: new Date(),
            proximaTentativa: null,
          },
        });

        // Atualizar última notificação da dívida
        if (notif.dividaId) {
          await prisma.debt.update({
            where: { id: notif.dividaId },
            data: { ultimaNotificacao: new Date() },
          });
        }

        console.log(`✅ [RETRY] ${notif.devedor?.nome || 'Devedor'}: Enviado com sucesso após ${novasTentativas} tentativas`);
        sucesso++;
      } else {
        // Ainda falhando - reagendar para mais tarde
        const proximaTentativa = new Date(Date.now() + MINUTOS_PARA_RETRY * 60 * 1000);

        await prisma.notification.update({
          where: { id: notif.id },
          data: {
            tentativas: novasTentativas,
            erroMensagem: resultado.erro,
            proximaTentativa,
          },
        });

        console.log(`⏰ [RETRY] ${notif.devedor?.nome || 'Devedor'}: Reagendado para mais ${MINUTOS_PARA_RETRY} minutos`);
        reagendadas++;
      }

      // Aguardar entre notificações
      await delay(3000);
    }

    console.log(`🔄 [RETRY] Processamento de retry concluído:`);
    console.log(`   - Enviadas com sucesso: ${sucesso}`);
    console.log(`   - Reagendadas: ${reagendadas}`);
    console.log(`   - Falhas definitivas: ${falhasDefinitivas}`);

  } catch (error) {
    console.error('❌ [RETRY] Erro ao processar retry:', error);
  } finally {
    processandoRetry = false;
  }
}

// Função para enviar resumo para os usuários
async function enviarResumoParaUsuarios(
  dividas: any[],
  enviadas: number,
  agendadasRetry: number
) {
  try {
    if (enviadas === 0 && agendadasRetry === 0) {
      return;
    }

    // Agrupar dívidas por usuário
    const dividasPorUsuario = dividas.reduce((acc: any, debt: any) => {
      if (!acc[debt.usuarioId]) {
        acc[debt.usuarioId] = [];
      }
      acc[debt.usuarioId].push(debt);
      return acc;
    }, {});

    for (const [usuarioId, dividasDoUsuario] of Object.entries(dividasPorUsuario) as [string, any[]][]) {
      const usuario = await prisma.user.findUnique({
        where: { id: usuarioId },
      });

      if (!usuario || !usuario.telefone) {
        continue;
      }

      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      const notificacoesHoje = await prisma.notification.findMany({
        where: {
          usuarioId,
          criadoEm: { gte: hoje },
        },
        include: {
          devedor: true,
          divida: true,
        },
      });

      const enviadasUsuario = notificacoesHoje.filter(n => n.status === 'ENVIADO').length;
      const aguardandoRetry = notificacoesHoje.filter(n => n.status === 'AGUARDANDO_RETRY').length;
      const falhasUsuario = notificacoesHoje.filter(n => n.status === 'FALHOU').length;

      if (enviadasUsuario === 0 && aguardandoRetry === 0 && falhasUsuario === 0) {
        continue;
      }

      const horaAtual = new Date().toLocaleTimeString('pt-MZ', {
        hour: '2-digit',
        minute: '2-digit',
      });

      let mensagem = `Olá Boss ${usuario.nome}! 👋\n\n`;
      mensagem += `📊 *Resumo de Notificações - ${horaAtual}*\n\n`;

      if (enviadasUsuario > 0) {
        mensagem += `✅ *${enviadasUsuario}* ${enviadasUsuario === 1 ? 'devedor notificado' : 'devedores notificados'} com sucesso\n`;
      }

      if (aguardandoRetry > 0) {
        mensagem += `🔄 *${aguardandoRetry}* ${aguardandoRetry === 1 ? 'notificação aguardando' : 'notificações aguardando'} reenvio\n`;
      }

      if (falhasUsuario > 0) {
        mensagem += `❌ *${falhasUsuario}* ${falhasUsuario === 1 ? 'falha' : 'falhas'} ao enviar\n`;
      }

      mensagem += `\n💼 Continue acompanhando suas cobranças pelo sistema!\n\n`;
      mensagem += `#DEBTTRACKER`;

      console.log(`📤 [CRON] Enviando resumo para usuário ${usuario.nome}`);

      // Enviar resumo com retry também
      await enviarComRetry(usuario.telefone, usuario.telefone, mensagem);

      await delay(3000);
    }
  } catch (error) {
    console.error('❌ [CRON] Erro ao enviar resumo para usuários:', error);
  }
}

// Iniciar cron jobs
export function iniciarCronNotificacoes() {
  // Cron principal: Todos os dias às 9h
  cron.schedule('0 9 * * *', () => {
    processarNotificacoesAutomaticas();
  }, {
    timezone: 'Africa/Maputo'
  });

  console.log('⏰ Cron job de notificações agendado para rodar todos os dias às 9h (Africa/Maputo)');

  // Cron de retry: A cada 10 minutos
  cron.schedule('*/10 * * * *', () => {
    processarNotificacoesRetry();
  }, {
    timezone: 'Africa/Maputo'
  });

  console.log('🔄 Cron job de retry agendado para rodar a cada 10 minutos');
}

// Exportar funções para teste manual
export { processarNotificacoesAutomaticas, processarNotificacoesRetry };
