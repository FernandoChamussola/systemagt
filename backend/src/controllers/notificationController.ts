import { Response } from 'express';
import { PrismaClient, NotificationStatus } from '@prisma/client';
import axios from 'axios';
import { AuthRequest } from '../types';

const prisma = new PrismaClient();

// URL do serviço interno de WhatsApp (container na mesma rede Docker)
const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || 'http://whatsapp:3002/send';

// Função para formatar telefone: garante que tenha o prefixo 258
function formatarTelefone(telefone: string): string {
  // Remove espaços, traços e parênteses
  let telefoneFormatado = telefone.replace(/[\s\-\(\)]/g, '');
  

  // Remove o + se houver
  telefoneFormatado = telefoneFormatado.replace('+', '');

  // Se não começar com 258, adiciona
  if (!telefoneFormatado.startsWith('258')) {
    // Remove o 0 inicial se houver (ex: 0855075735 -> 855075735)
    if (telefoneFormatado.startsWith('0')) {
      telefoneFormatado = telefoneFormatado.substring(1);
    }
    telefoneFormatado = '258' + telefoneFormatado;
  }

  return telefoneFormatado;
}

// Função para gerar mensagem de cobrança
function gerarMensagemCobranca(params: {
  nomeDevedor: string;
  valorRestante: number;
  dataVencimento: Date;
  diasAtraso?: number;
}): string {
  const { nomeDevedor, valorRestante, dataVencimento, diasAtraso } = params;

  const dataFormatada = dataVencimento.toLocaleDateString('pt-MZ', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const valorFormatado = new Intl.NumberFormat('pt-MZ', {
    style: 'currency',
    currency: 'MZN',
    minimumFractionDigits: 0,
  }).format(valorRestante);

  if (diasAtraso && diasAtraso > 0) {
    return `Olá ${nomeDevedor},\n\n` +
      `Este é um lembrete sobre sua dívida que venceu em ${dataFormatada}.\n\n` +
      `⚠️ Dívida em atraso há ${diasAtraso} ${diasAtraso === 1 ? 'dia' : 'dias'}\n` +
      `💰 Valor pendente: ${valorFormatado}\n\n` +
      `Por favor, entre em contato para regularizar sua situação.\n\n` +
      `Obrigado!\n\n` +
      `#DEBTTRACKER`;
  } else {
    return `Olá ${nomeDevedor},\n\n` +
      `Este é um lembrete sobre sua dívida que vence em ${dataFormatada}.\n\n` +
      `💰 Valor pendente: ${valorFormatado}\n\n` +
      `Por favor, providencie o pagamento até a data de vencimento.\n\n` +
      `Obrigado!\n\n` +
      `#DEBTTRACKER`;
  }
}

// Função para enviar notificação via WhatsApp (serviço interno)
async function enviarWhatsApp(origemMsg: string, destino: string, mensagem: string): Promise<{ sucesso: boolean; erro?: string }> {
  const telefoneFormatado = formatarTelefone(destino);
  const origem = formatarTelefone(origemMsg);

  console.log(`📱 Enviando WhatsApp para: ${telefoneFormatado} via origem: ${origem}`);
  console.log(`📝 Mensagem: ${mensagem.substring(0, 50)}...`);

  try {
    const response = await axios.post(
      WHATSAPP_API_URL,
      {
        origem: origem,
        destino: telefoneFormatado,
        mensagem: mensagem,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 segundos
      }
    );

    if (response.status === 200 && response.data.success) {
      console.log(`✅ Mensagem enviada com sucesso para ${telefoneFormatado}`);
      return { sucesso: true };
    } else {
      console.error(`❌ Erro ao enviar mensagem: ${response.data?.error || 'Erro desconhecido'}`);
      return { sucesso: false, erro: response.data?.error || 'Erro ao enviar mensagem' };
    }
  } catch (error: any) {
    if (error.response) {
      // Erro retornado pela API
      console.error(`❌ Erro da API WhatsApp:`, error.response.data);
      return { sucesso: false, erro: error.response.data?.error || error.message };
    } else if (error.code === 'ECONNREFUSED') {
      console.error(`❌ Serviço WhatsApp não disponível`);
      return { sucesso: false, erro: 'Serviço WhatsApp não disponível. Verifique se o container está rodando.' };
    } else {
      console.error(`❌ Erro ao enviar WhatsApp:`, error.message);
      return { sucesso: false, erro: error.message };
    }
  }
}

// Listar notificações
export async function listNotifications(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;
    const { devedorId, dividaId, status } = req.query;

    const where: any = { usuarioId: userId };

    if (devedorId) where.devedorId = devedorId as string;
    if (dividaId) where.dividaId = dividaId as string;
    if (status) where.status = status as NotificationStatus;

    const notifications = await prisma.notification.findMany({
      where,
      include: {
        devedor: true,
        divida: {
          include: {
            devedor: true,
          },
        },
      },
      orderBy: {
        criadoEm: 'desc',
      },
    });

    res.json({ notifications });
  } catch (error) {
    console.error('Erro ao listar notificações:', error);
    res.status(500).json({ error: 'Erro ao listar notificações' });
  }
}

// Enviar notificação manual para uma dívida
export async function sendManualNotification(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;
    const { debtId } = req.params;
    const { mensagemPersonalizada } = req.body;

    // Buscar dívida com devedor e pagamentos
    const debt = await prisma.debt.findFirst({
      where: {
        id: debtId,
        usuarioId: userId,
        ativo: true,
      },
      include: {
        devedor: true,
        pagamentos: {
          where: { ativo: true },
        },
      },
    });

    if (!debt) {
      return res.status(404).json({ error: 'Dívida não encontrada' });
    }

    // Calcular valor restante
    const valorComJuros = debt.valorInicial + (debt.valorInicial * debt.taxaJuros / 100);
    const totalPago = debt.pagamentos.reduce((sum, p) => sum + p.valor, 0);
    const valorRestante = valorComJuros - totalPago;

    // Calcular dias de atraso
    const hoje = new Date();
    const diasAtraso = debt.dataVencimento < hoje
      ? Math.ceil((hoje.getTime() - debt.dataVencimento.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    // Gerar mensagem
    let mensagem: string;
    if (mensagemPersonalizada) {
      // Se for mensagem personalizada, adicionar #DEBTTRACKER no final se ainda não tiver
      mensagem = mensagemPersonalizada.trim();
      if (!mensagem.includes('#DEBTTRACKER')) {
        mensagem += '\n\n#DEBTTRACKER';
      }
    } else {
      // Usar mensagem padrão (que já inclui #DEBTTRACKER)
      mensagem = gerarMensagemCobranca({
        nomeDevedor: debt.devedor.nome,
        valorRestante,
        dataVencimento: debt.dataVencimento,
        diasAtraso: diasAtraso > 0 ? diasAtraso : undefined,
      });
    }

    // Criar registro de notificação
    const notification = await prisma.notification.create({
      data: {
        usuarioId: userId,
        devedorId: debt.devedorId,
        dividaId: debt.id,
        telefone: debt.devedor.telefone,
        mensagem,
        status: 'PENDENTE',
      },
    });

    // Enviar WhatsApp
    const resultado = await enviarWhatsApp(req.user.telefone, debt.devedor.telefone, mensagem);

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
        data: {
          ultimaNotificacao: new Date(),
        },
      });
    }

    res.json({
      message: resultado.sucesso ? 'Notificação enviada com sucesso!' : 'Falha ao enviar notificação',
      notification: {
        ...notification,
        status: resultado.sucesso ? 'ENVIADO' : 'FALHOU',
        erroMensagem: resultado.erro,
      },
      sucesso: resultado.sucesso,
    });
  } catch (error) {
    console.error('Erro ao enviar notificação manual:', error);
    res.status(500).json({ error: 'Erro ao enviar notificação' });
  }
}

// Deletar notificação (soft delete)
export async function deleteNotification(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const notification = await prisma.notification.findFirst({
      where: {
        id,
        usuarioId: userId,
      },
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notificação não encontrada' });
    }

    await prisma.notification.delete({
      where: { id },
    });

    res.json({ message: 'Notificação removida com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar notificação:', error);
    res.status(500).json({ error: 'Erro ao deletar notificação' });
  }
}

export { formatarTelefone, gerarMensagemCobranca, enviarWhatsApp };
