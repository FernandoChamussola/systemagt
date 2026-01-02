import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { enviarWhatsApp, gerarMensagemCobranca } from '../controllers/notificationController';

const prisma = new PrismaClient();

// Função para processar notificações automáticas
async function processarNotificacoesAutomaticas() {
  console.log('🔔 [CRON] Iniciando processamento de notificações automáticas...');

  try {
    const hoje = new Date();

    // Buscar dívidas com notificação automática habilitada, incluindo usuário e devedor
    const dividasParaNotificar = await prisma.debt.findMany({
      where: {
        ativo: true,
        notificacaoAuto: true,
        status: { not: 'PAGO' },
        periodicidadeNotificacao: { not: null },
      },
      include: {
        devedor: true,   // para obter telefone e nome do devedor
        usuario: true,   // para obter telefone do usuário que cadastrou a dívida
        pagamentos: {
          where: { ativo: true },
        },
      },
    });

    console.log(`📊 [CRON] Encontradas ${dividasParaNotificar.length} dívidas com notificação automática`);

    let enviadas = 0;
    let puladas = 0;
    let falhas = 0;

    for (const debt of dividasParaNotificar) {
      // Determinar periodicidade baseada no status
      let periodicidade: number;
      if (debt.status === 'ATRASADO') {
        periodicidade = 2; // dívidas atrasadas notificadas a cada 2 dias
      } else {
        periodicidade = debt.periodicidadeNotificacao!;
      }

      let deveEnviar = false;

      if (!debt.ultimaNotificacao) {
        deveEnviar = true; // nunca enviou
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
          mensagem,
          status: 'PENDENTE',
        },
      });

      console.log(`📤 [CRON] Enviando notificação para ${debt.devedor.nome} via usuário ${debt.usuario.telefone}`);

      // Enviar WhatsApp usando telefone do usuário
      const resultado = await enviarWhatsApp(debt.usuario.telefone!, debt.devedor.telefone, mensagem);

      // Atualizar status da notificação
      await prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: resultado.sucesso ? 'ENVIADO' : 'FALHOU',
          erroMensagem: resultado.erro,
          enviadoEm: resultado.sucesso ? new Date() : null,
        },
      });

      // Atualizar última notificação da dívida
      if (resultado.sucesso) {
        await prisma.debt.update({
          where: { id: debt.id },
          data: { ultimaNotificacao: new Date() },
        });
        enviadas++;
      } else {
        falhas++;
      }

      // Aguardar 5 segundos entre envios
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    console.log(`✅ [CRON] Processamento concluído:`);
    console.log(`   - Enviadas com sucesso: ${enviadas}`);
    console.log(`   - Puladas (não chegou a periodicidade): ${puladas}`);
    console.log(`   - Falhas: ${falhas}`);

    // Enviar resumo aos usuários que tiveram notificações
    await enviarResumoParaUsuarios(dividasParaNotificar, enviadas, falhas);

  } catch (error) {
    console.error('❌ [CRON] Erro ao processar notificações automáticas:', error);
  }
}


// Função para enviar resumo para os usuários
async function enviarResumoParaUsuarios(
  dividas: any[],
  enviadas: number,
  falhas: number
) {
  try {
    // Se não houve nenhuma notificação enviada, não envia resumo
    if (enviadas === 0 && falhas === 0) {
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

    // Enviar resumo para cada usuário
    for (const [usuarioId, dividasDoUsuario] of Object.entries(dividasPorUsuario) as [string, any[]][]) {
      // Buscar dados do usuário
      const usuario = await prisma.user.findUnique({
        where: { id: usuarioId },
      });

      if (!usuario || !usuario.telefone) {
        console.log(`⚠️ [CRON] Usuário ${usuarioId} sem telefone cadastrado, pulando resumo`);
        continue;
      }

      // Calcular estatísticas deste usuário
      const notificacoesDoUsuario = dividasDoUsuario.length;

      // Buscar notificações criadas hoje para este usuário
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      const notificacoesHoje = await prisma.notification.findMany({
        where: {
          usuarioId,
          criadoEm: {
            gte: hoje,
          },
        },
        include: {
          devedor: true,
          divida: true,
        },
      });

      const enviadasUsuario = notificacoesHoje.filter(n => n.status === 'ENVIADO').length;
      const falhasUsuario = notificacoesHoje.filter(n => n.status === 'FALHOU').length;

      // Se não teve notificações processadas para este usuário, pular
      if (enviadasUsuario === 0 && falhasUsuario === 0) {
        continue;
      }

      // Gerar mensagem de resumo
      const horaAtual = new Date().toLocaleTimeString('pt-MZ', {
        hour: '2-digit',
        minute: '2-digit',
      });

      let mensagem = `Olá Boss ${usuario.nome}! 👋\n\n`;
      mensagem += `📊 *Resumo de Notificações - ${horaAtual}*\n\n`;

      if (enviadasUsuario > 0) {
        mensagem += `✅ *${enviadasUsuario}* ${enviadasUsuario === 1 ? 'devedor notificado' : 'devedores notificados'} com sucesso:\n\n`;

        // Listar devedores notificados
        const notificacoesEnviadas = notificacoesHoje.filter(n => n.status === 'ENVIADO');
        for (const notif of notificacoesEnviadas.slice(0, 10)) { // Máximo 10 para não ficar muito grande
          const valorRestante = notif.divida ? await calcularValorRestante(notif.divida.id) : 0;
          const valorFormatado = new Intl.NumberFormat('pt-MZ', {
            style: 'currency',
            currency: 'MZN',
            minimumFractionDigits: 0,
          }).format(valorRestante);

          mensagem += `• ${notif.devedor?.nome || 'Devedor'} - ${valorFormatado}\n`;
        }

        if (notificacoesEnviadas.length > 10) {
          mensagem += `... e mais ${notificacoesEnviadas.length - 10}\n`;
        }
      }

      if (falhasUsuario > 0) {
        mensagem += `\n❌ *${falhasUsuario}* ${falhasUsuario === 1 ? 'falha' : 'falhas'} ao enviar\n`;
      }

      mensagem += `\n💼 Continue acompanhando suas cobranças pelo sistema!\n\n`;
      mensagem += `#DEBTTRACKER`;

      // Enviar WhatsApp para o usuário
      console.log(`📤 [CRON] Enviando resumo para usuário ${usuario.nome} (${usuario.telefone})`);
      await enviarWhatsApp(usuario.telefone,usuario.telefone, mensagem);

      // Aguardar 3 segundos antes do próximo resumo
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  } catch (error) {
    console.error('❌ [CRON] Erro ao enviar resumo para usuários:', error);
  }
}

// Função auxiliar para calcular valor restante
async function calcularValorRestante(dividaId: string): Promise<number> {
  const debt = await prisma.debt.findUnique({
    where: { id: dividaId },
    include: {
      pagamentos: {
        where: { ativo: true },
      },
    },
  });

  if (!debt) return 0;

  const valorComJuros = debt.valorInicial + (debt.valorInicial * debt.taxaJuros / 100);
  const totalPago = debt.pagamentos.reduce((sum, p) => sum + p.valor, 0);
  return valorComJuros - totalPago;
}

// Agendar cron job para rodar todos os dias às 9h
export function iniciarCronNotificacoes() {
  // Formato: segundo minuto hora dia mês dia-da-semana
  // '0 9 * * *' = Todos os dias às 9h
  cron.schedule('0 9 * * *', () => {
    processarNotificacoesAutomaticas();
  });

  console.log('⏰ Cron job de notificações agendado para rodar todos os dias às 9h');

  // Para testes, você pode descomentar a linha abaixo para rodar a cada 5 minutos
  // cron.schedule('*/5 * * * *', processarNotificacoesAutomaticas);
}

// Exportar função para teste manual
export { processarNotificacoesAutomaticas };
