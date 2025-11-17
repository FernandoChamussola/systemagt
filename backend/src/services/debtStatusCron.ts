import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Função para atualizar status das dívidas vencidas
async function atualizarStatusDividas() {
  console.log('📅 [CRON] Verificando status das dívidas...');

  try {
    const hoje = new Date();

    // 1. Buscar dívidas PENDENTES que já venceram (PENDENTE → ATRASADO)
    const dividasVencidas = await prisma.debt.findMany({
      where: {
        ativo: true,
        status: 'PENDENTE',
        dataVencimento: {
          lt: hoje, // Data de vencimento menor que hoje
        },
      },
    });

    // 2. Buscar dívidas ATRASADAS que foram atualizadas para o futuro (ATRASADO → PENDENTE)
    const dividasParaPendente = await prisma.debt.findMany({
      where: {
        ativo: true,
        status: 'ATRASADO',
        dataVencimento: {
          gte: hoje, // Data de vencimento maior ou igual a hoje
        },
      },
    });

    let totalAtualizadas = 0;

    // Atualizar PENDENTE → ATRASADO
    if (dividasVencidas.length > 0) {
      console.log(`📊 [CRON] Encontradas ${dividasVencidas.length} dívidas vencidas`);

      const resultado = await prisma.debt.updateMany({
        where: {
          id: {
            in: dividasVencidas.map((d) => d.id),
          },
        },
        data: {
          status: 'ATRASADO',
        },
      });

      console.log(`✅ [CRON] ${resultado.count} dívidas marcadas como ATRASADO`);

      // Log detalhado das dívidas atualizadas
      for (const debt of dividasVencidas) {
        const diasAtraso = Math.ceil((hoje.getTime() - debt.dataVencimento.getTime()) / (1000 * 60 * 60 * 24));
        console.log(`   - Dívida ${debt.id.substring(0, 8)}... (${diasAtraso} dias de atraso)`);
      }

      totalAtualizadas += resultado.count;
    }

    // Atualizar ATRASADO → PENDENTE
    if (dividasParaPendente.length > 0) {
      console.log(`🔄 [CRON] Encontradas ${dividasParaPendente.length} dívidas atrasadas com vencimento atualizado`);

      const resultado = await prisma.debt.updateMany({
        where: {
          id: {
            in: dividasParaPendente.map((d) => d.id),
          },
        },
        data: {
          status: 'PENDENTE',
        },
      });

      console.log(`✅ [CRON] ${resultado.count} dívidas marcadas como PENDENTE`);

      // Log detalhado das dívidas atualizadas
      for (const debt of dividasParaPendente) {
        const diasRestantes = Math.ceil((debt.dataVencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
        console.log(`   - Dívida ${debt.id.substring(0, 8)}... (faltam ${diasRestantes} dias)`);
      }

      totalAtualizadas += resultado.count;
    }

    if (totalAtualizadas === 0) {
      console.log('✅ [CRON] Nenhuma dívida precisa de atualização');
    }
  } catch (error) {
    console.error('❌ [CRON] Erro ao atualizar status das dívidas:', error);
  }
}

// Agendar cron job para rodar a cada hora
export function iniciarCronStatusDividas() {
  // Formato: segundo minuto hora dia mês dia-da-semana
  // '0 * * * *' = A cada hora no minuto 0
  cron.schedule('0 * * * *', () => {
    atualizarStatusDividas();
  });

  console.log('⏰ Cron job de atualização de status agendado para rodar a cada hora');

  // Executar uma vez ao iniciar para pegar dívidas que já estão atrasadas
  atualizarStatusDividas();
}

// Exportar função para teste manual
export { atualizarStatusDividas };
